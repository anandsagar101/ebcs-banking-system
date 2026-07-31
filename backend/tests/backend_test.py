"""EBCS backend integration tests: MFA, password reset, OCR, WebSocket."""
import os
import time
import io
import json
import base64
import threading
import pytest
import requests
import pyotp
from PIL import Image, ImageDraw, ImageFont

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://mvn-starter-kit.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_USER = "admin"
ADMIN_PASS = "admin123"
RESEND_EMAIL = "anandsagar.infinity366@gmail.com"


# ---------- helpers ----------
def _login(username, password):
    r = requests.post(f"{API}/auth/login", json={"username": username, "password": password}, timeout=30)
    return r


def _admin_token():
    r = _login(ADMIN_USER, ADMIN_PASS)
    assert r.status_code == 200, f"admin login failed {r.status_code} {r.text}"
    data = r.json()
    # if MFA enabled from prior test, disable via api first isn't possible without token.
    assert "accessToken" in data, f"Expected direct accessToken, got {data}"
    return data["accessToken"]


@pytest.fixture(scope="session")
def admin_token():
    return _admin_token()


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- MFA flow ----------
class TestMFA:
    def test_full_mfa_challenge_flow(self, admin_headers):
        # ensure disabled first
        requests.delete(f"{API}/security/mfa", headers=admin_headers)

        # enroll
        r = requests.post(f"{API}/security/mfa/enroll", headers=admin_headers)
        assert r.status_code in (200, 201), f"enroll: {r.status_code} {r.text}"
        secret = r.json().get("secret") or r.json().get("base32Secret") or r.json().get("sharedSecret")
        assert secret, f"no secret in enroll response: {r.json()}"

        totp = pyotp.TOTP(secret)
        code = totp.now()

        # verify enable
        r = requests.post(f"{API}/security/mfa/verify", headers=admin_headers, json={"code": code})
        assert r.status_code == 200, f"verify: {r.status_code} {r.text}"

        # login now should return challenge
        time.sleep(1)
        r = _login(ADMIN_USER, ADMIN_PASS)
        assert r.status_code == 200, f"login post-mfa: {r.status_code} {r.text}"
        body = r.json()
        assert body.get("mfaRequired") is True, f"expected mfaRequired true, got {body}"
        assert "challengeToken" in body
        assert body.get("accessToken") in (None, ""), "accessToken must not be issued at challenge step"
        challenge = body["challengeToken"]

        # challenge token cannot access protected endpoint
        r = requests.get(f"{API}/customers", headers={"Authorization": f"Bearer {challenge}"})
        assert r.status_code in (401, 403), f"challenge token should be rejected on protected endpoint, got {r.status_code}"

        # invalid code
        r = requests.post(f"{API}/auth/mfa/login-verify",
                          json={"challengeToken": challenge, "code": "000000"})
        # totp might collide (highly unlikely). Expect 400 or 401.
        assert r.status_code in (400, 401), f"invalid code: {r.status_code} {r.text}"

        # tampered challenge
        r = requests.post(f"{API}/auth/mfa/login-verify",
                          json={"challengeToken": challenge + "x", "code": totp.now()})
        assert r.status_code in (400, 401), f"tampered challenge: {r.status_code} {r.text}"

        # good verify
        # wait for a fresh TOTP window if code already used
        time.sleep(1)
        good_code = pyotp.TOTP(secret).now()
        r = requests.post(f"{API}/auth/mfa/login-verify",
                          json={"challengeToken": challenge, "code": good_code})
        assert r.status_code == 200, f"good login-verify: {r.status_code} {r.text}"
        access = r.json().get("accessToken")
        assert access, f"expected access token, got {r.json()}"

        # access token works on /api/customers
        r = requests.get(f"{API}/customers", headers={"Authorization": f"Bearer {access}"})
        assert r.status_code == 200, f"customers with new token: {r.status_code} {r.text}"

        # disable MFA using original admin_headers
        r = requests.delete(f"{API}/security/mfa", headers={"Authorization": f"Bearer {access}"})
        assert r.status_code in (200, 204), f"disable mfa: {r.status_code} {r.text}"

        # login is direct
        time.sleep(1)
        r = _login(ADMIN_USER, ADMIN_PASS)
        assert r.status_code == 200
        body = r.json()
        assert body.get("mfaRequired") in (False, None)
        assert body.get("accessToken"), f"expected accessToken after mfa disable, got {body}"


# ---------- Password reset ----------
class TestPasswordReset:
    def test_forgot_password_known_email(self):
        r = requests.post(f"{API}/auth/forgot-password", json={"email": RESEND_EMAIL})
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        b = r.json()
        assert b.get("ok") is True
        assert b.get("ttlSeconds") == 300
        assert b.get("maxAttempts") == 5
        assert 0 < b.get("cooldownSeconds", 0) <= 60

    def test_forgot_password_unknown_email_no_enum(self):
        r = requests.post(f"{API}/auth/forgot-password", json={"email": "nobody-xyz-123@example.com"})
        assert r.status_code == 200
        b = r.json()
        assert b.get("ok") is True
        assert b.get("cooldownSeconds", 0) > 0

    def test_forgot_password_cooldown(self):
        r1 = requests.post(f"{API}/auth/forgot-password", json={"email": RESEND_EMAIL})
        assert r1.status_code == 200
        r2 = requests.post(f"{API}/auth/forgot-password", json={"email": RESEND_EMAIL})
        assert r2.status_code == 200
        # second call should still return 200 but cooldown < 60 (remaining) or ok:false
        b2 = r2.json()
        # accept either behaviour - remaining cooldown
        assert "cooldownSeconds" in b2

    def test_verify_otp_invalid_code(self):
        # ensure reset row exists
        requests.post(f"{API}/auth/forgot-password", json={"email": RESEND_EMAIL})
        r = requests.post(f"{API}/auth/verify-otp", json={"email": RESEND_EMAIL, "code": "000000"})
        assert r.status_code in (400, 422), f"{r.status_code} {r.text}"
        msg = (r.json().get("message") or r.text).lower()
        assert "incorrect" in msg or "attempt" in msg, f"unexpected msg: {msg}"

    def test_verify_otp_no_active_code(self):
        r = requests.post(f"{API}/auth/verify-otp",
                          json={"email": "never-requested-9999@example.com", "code": "123456"})
        assert r.status_code in (400, 422)
        msg = (r.json().get("message") or r.text).lower()
        assert "no active" in msg or "reset" in msg

    def test_verify_otp_bad_format(self):
        r = requests.post(f"{API}/auth/verify-otp", json={"email": RESEND_EMAIL, "code": "abc"})
        assert r.status_code in (400, 422)

    def test_reset_password_requires_purpose_token(self, admin_token):
        # normal access token should be rejected as resetToken
        r = requests.post(f"{API}/auth/reset-password",
                          json={"resetToken": admin_token, "newPassword": "newpass123"})
        assert r.status_code in (400, 422), f"{r.status_code} {r.text}"
        msg = (r.json().get("message") or r.text).lower()
        assert "reset" in msg or "expired" in msg or "invalid" in msg


# ---------- OCR ----------
def _make_image_bytes(text="Hello EBCSOCR world 2028"):
    img = Image.new("RGB", (600, 200), "white")
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 32)
    except Exception:
        font = ImageFont.load_default()
    d.text((20, 80), text, fill="black", font=font)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _set_flag(admin_headers, enabled):
    r = requests.put(f"{API}/admin/feature-flags/documents.ocr.enabled",
                     params={"enabled": str(enabled).lower()}, headers=admin_headers)
    assert r.status_code in (200, 204), f"flag set: {r.status_code} {r.text}"


class TestOCR:
    def _upload(self, admin_headers, content, filename="test.png", content_type="image/png", doc_type="ID_PROOF"):
        files = {"file": (filename, content, content_type)}
        params = {"ownerType": "CUSTOMER", "ownerId": 3, "docType": doc_type}
        r = requests.post(f"{API}/documents", params=params, files=files, headers=admin_headers)
        assert r.status_code in (200, 201), f"upload: {r.status_code} {r.text}"
        return r.json()

    def test_ocr_flag_on_completes(self, admin_headers):
        _set_flag(admin_headers, True)
        doc = self._upload(admin_headers, _make_image_bytes("Hello EBCSOCR world 2028"), doc_type="OCR_TEST_ON")
        doc_id = doc["id"]
        # poll up to 20s
        ocr_text = None
        status = None
        for _ in range(20):
            time.sleep(1.5)
            r = requests.get(f"{API}/documents/{doc_id}", headers=admin_headers)
            assert r.status_code == 200
            d = r.json()
            status = d.get("ocrStatus")
            ocr_text = d.get("ocrText")
            if status == "COMPLETED":
                break
        assert status == "COMPLETED", f"ocrStatus={status}, text={ocr_text}"
        assert ocr_text and ("EBCS" in ocr_text or "Hello" in ocr_text or "world" in ocr_text.lower()), \
            f"unexpected ocrText: {ocr_text}"

    def test_ocr_flag_off_no_ocr(self, admin_headers):
        _set_flag(admin_headers, False)
        doc = self._upload(admin_headers, _make_image_bytes("Flag off text"), doc_type="OCR_TEST_OFF")
        doc_id = doc["id"]
        time.sleep(4)
        r = requests.get(f"{API}/documents/{doc_id}", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert d.get("ocrStatus") in ("NONE", None), f"expected NONE, got {d.get('ocrStatus')}"
        assert d.get("ocrText") in (None, "")

    def test_ocr_manual_retry_endpoint(self, admin_headers):
        # flag off => DISABLED
        _set_flag(admin_headers, False)
        doc = self._upload(admin_headers, _make_image_bytes("Retry test"), doc_type="OCR_RETRY_DIS")
        r = requests.post(f"{API}/documents/{doc['id']}/ocr", headers=admin_headers)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        assert r.json().get("ocrStatus") == "DISABLED"

        # flag on + image => QUEUED (or already COMPLETED)
        _set_flag(admin_headers, True)
        doc = self._upload(admin_headers, _make_image_bytes("Queued retry EBCSOCR"), doc_type="OCR_RETRY_IMG")
        r = requests.post(f"{API}/documents/{doc['id']}/ocr", headers=admin_headers)
        assert r.status_code == 200
        assert r.json().get("ocrStatus") in ("QUEUED", "COMPLETED")

        # PDF while flag on => SKIPPED
        pdf_bytes = b"%PDF-1.4\n%EOF"
        files = {"file": ("test.pdf", pdf_bytes, "application/pdf")}
        params = {"ownerType": "CUSTOMER", "ownerId": 3, "docType": "OCR_RETRY_PDF"}
        r = requests.post(f"{API}/documents", params=params, files=files, headers=admin_headers)
        assert r.status_code in (200, 201), f"pdf upload: {r.status_code} {r.text}"
        pdf_id = r.json()["id"]
        r = requests.post(f"{API}/documents/{pdf_id}/ocr", headers=admin_headers)
        assert r.status_code == 200
        assert r.json().get("ocrStatus") in ("SKIPPED", "NONE"), f"expected SKIPPED for PDF, got {r.json().get('ocrStatus')}"


# ---------- WebSocket ----------
class TestWebSocket:
    def test_sockjs_info_endpoint(self):
        r = requests.get(f"{API}/ws/info", timeout=15)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        j = r.json()
        assert j.get("websocket") is True, f"{j}"

    def test_stomp_money_moved_broadcast(self, admin_headers):
        import websocket
        received = []
        ws_url = BASE_URL.replace("https://", "wss://").replace("http://", "ws://") + "/api/ws/websocket"
        connected = threading.Event()
        subscribed = threading.Event()

        def on_message(ws, message):
            # frames terminated by \x00
            if message.startswith("CONNECTED"):
                connected.set()
                ws.send("SUBSCRIBE\nid:sub-0\ndestination:/topic/money-moved\n\n\x00")
                subscribed.set()
            elif message.startswith("MESSAGE"):
                received.append(message)

        def on_open(ws):
            ws.send("CONNECT\naccept-version:1.2\nhost:server\n\n\x00")

        ws = websocket.WebSocketApp(ws_url, on_open=on_open, on_message=on_message)
        t = threading.Thread(target=ws.run_forever, daemon=True)
        t.start()

        assert connected.wait(15), "STOMP CONNECTED frame not received"
        assert subscribed.wait(5)
        time.sleep(1)

        # find an existing account
        r = requests.get(f"{API}/accounts", headers=admin_headers)
        assert r.status_code == 200
        accounts = r.json()
        if isinstance(accounts, dict) and "content" in accounts:
            accounts = accounts["content"]
        assert accounts, "no accounts to deposit into"
        acc_id = accounts[0].get("id") or accounts[0].get("accountId")

        r = requests.post(f"{API}/transactions/deposit", headers=admin_headers,
                          json={"accountId": acc_id, "amount": 10.00, "reference": "ws-test"})
        assert r.status_code in (200, 201), f"deposit: {r.status_code} {r.text}"

        deadline = time.time() + 8
        while time.time() < deadline and not received:
            time.sleep(0.2)
        ws.close()
        assert received, "No STOMP MESSAGE arrived on /topic/money-moved within 8s"
        frame = received[0]
        assert "money-moved" in frame or "amount" in frame or "DEPOSIT" in frame.upper()
