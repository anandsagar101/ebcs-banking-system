-- ============================================================
-- EBCS V3 Features
-- Password reset OTP + document OCR job tracking
-- ============================================================

-- Password reset OTPs (email-based, 6-digit, BCrypt hashed)
CREATE TABLE password_reset_otps (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(80) NOT NULL,
    email VARCHAR(200) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    consumed_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pwreset_email ON password_reset_otps(email, created_at DESC);
CREATE INDEX idx_pwreset_username ON password_reset_otps(username, created_at DESC);

-- Document OCR extension (ocr_text column already exists in V2)
ALTER TABLE documents
    ADD COLUMN ocr_status VARCHAR(20) NOT NULL DEFAULT 'NONE',
    ADD COLUMN ocr_completed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN ocr_error VARCHAR(500);

-- Expand ocr_text to hold larger extracts
ALTER TABLE documents ALTER COLUMN ocr_text TYPE TEXT;
