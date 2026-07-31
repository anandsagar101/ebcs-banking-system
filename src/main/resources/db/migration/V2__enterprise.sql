-- ============================================================
-- EBCS Enterprise Upgrade (V2)
-- MFA, Login History, Devices, Notifications, Documents, Feature Flags
-- ============================================================

-- MFA
CREATE TABLE user_mfa (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    secret VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Login history
CREATE TABLE login_history (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(80) NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address VARCHAR(64),
    user_agent VARCHAR(500),
    failure_reason VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_login_history_user ON login_history(username, created_at DESC);

-- Trusted devices
CREATE TABLE user_devices (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(80) NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(200),
    user_agent VARCHAR(500),
    ip_address VARCHAR(64),
    trusted BOOLEAN NOT NULL DEFAULT FALSE,
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (username, device_fingerprint)
);

-- Notifications
CREATE TABLE notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient VARCHAR(200) NOT NULL,
    channel VARCHAR(20) NOT NULL, -- EMAIL, SMS, PUSH, IN_APP
    subject VARCHAR(255),
    body VARCHAR(2000) NOT NULL,
    event_type VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'SENT', -- QUEUED, SENT, FAILED
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_recipient ON notifications(recipient, created_at DESC);

-- Documents (customer KYC docs, statements, etc.)
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    owner_type VARCHAR(30) NOT NULL, -- CUSTOMER, LOAN, ACCOUNT
    owner_id BIGINT NOT NULL,
    doc_type VARCHAR(60) NOT NULL, -- ID_PROOF, ADDRESS_PROOF, PAN, PASSPORT, OTHER
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(120) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    checksum VARCHAR(80),
    version INT NOT NULL DEFAULT 1,
    uploaded_by VARCHAR(80),
    ocr_text VARCHAR(4000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_documents_owner ON documents(owner_type, owner_id);

CREATE TABLE document_versions (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version INT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    size_bytes BIGINT NOT NULL,
    checksum VARCHAR(80),
    uploaded_by VARCHAR(80),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Feature flags
CREATE TABLE feature_flags (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(120) NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    description VARCHAR(500),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO feature_flags(key, enabled, description) VALUES
  ('mfa.required.for.admin', FALSE, 'Force MFA for all admin logins'),
  ('notifications.email.enabled', TRUE, 'Global toggle for email notifications'),
  ('notifications.sms.enabled', TRUE, 'Global toggle for SMS notifications'),
  ('reports.enabled', TRUE, 'Expose the reports API'),
  ('documents.ocr.enabled', FALSE, 'Run OCR on new uploads');
