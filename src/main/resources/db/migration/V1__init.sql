-- ============================================================
-- EBCS Initial Schema (V1)
-- ============================================================

-- Administration
CREATE TABLE app_users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE configurations (
    id BIGSERIAL PRIMARY KEY,
    config_key VARCHAR(120) NOT NULL UNIQUE,
    config_value VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Customer
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    kyc_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Product
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    product_type VARCHAR(30) NOT NULL, -- SAVINGS, CURRENT, FIXED_DEPOSIT, RECURRING_DEPOSIT, LOAN
    interest_rate NUMERIC(6,3) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Account
CREATE TABLE accounts (
    id BIGSERIAL PRIMARY KEY,
    account_number VARCHAR(20) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    balance NUMERIC(19,4) NOT NULL DEFAULT 0,
    daily_limit NUMERIC(19,4) NOT NULL DEFAULT 100000,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_accounts_customer ON accounts(customer_id);

-- Ledger
CREATE TABLE ledger_entries (
    id BIGSERIAL PRIMARY KEY,
    transaction_ref VARCHAR(50) NOT NULL,
    account_id BIGINT NOT NULL REFERENCES accounts(id),
    entry_type VARCHAR(10) NOT NULL, -- DEBIT / CREDIT
    amount NUMERIC(19,4) NOT NULL,
    balance_after NUMERIC(19,4) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ledger_tx_ref ON ledger_entries(transaction_ref);
CREATE INDEX idx_ledger_account ON ledger_entries(account_id);

-- Transaction
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    reference VARCHAR(50) NOT NULL UNIQUE,
    from_account_id BIGINT REFERENCES accounts(id),
    to_account_id BIGINT REFERENCES accounts(id),
    tx_type VARCHAR(20) NOT NULL, -- DEPOSIT, WITHDRAWAL, TRANSFER, IMPS, REVERSAL
    amount NUMERIC(19,4) NOT NULL,
    status VARCHAR(20) NOT NULL, -- PENDING, COMPLETED, FAILED, REVERSED
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Deposits
CREATE TABLE fixed_deposits (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES accounts(id),
    principal NUMERIC(19,4) NOT NULL,
    interest_rate NUMERIC(6,3) NOT NULL,
    term_months INT NOT NULL,
    start_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE recurring_deposits (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES accounts(id),
    installment_amount NUMERIC(19,4) NOT NULL,
    interest_rate NUMERIC(6,3) NOT NULL,
    term_months INT NOT NULL,
    start_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Loans
CREATE TABLE loans (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    principal NUMERIC(19,4) NOT NULL,
    interest_rate NUMERIC(6,3) NOT NULL,
    term_months INT NOT NULL,
    disbursement_account_id BIGINT REFERENCES accounts(id),
    status VARCHAR(20) NOT NULL DEFAULT 'APPLIED', -- APPLIED, APPROVED, DISBURSED, SETTLED, REJECTED
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE loan_emi_schedules (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    installment_no INT NOT NULL,
    due_date DATE NOT NULL,
    principal_component NUMERIC(19,4) NOT NULL,
    interest_component NUMERIC(19,4) NOT NULL,
    total_amount NUMERIC(19,4) NOT NULL,
    paid BOOLEAN NOT NULL DEFAULT FALSE
);

-- Audit
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor VARCHAR(150),
    action VARCHAR(150) NOT NULL,
    resource VARCHAR(150),
    payload VARCHAR(2000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Seed default roles
INSERT INTO roles(name) VALUES ('ROLE_ADMIN'), ('ROLE_USER');

-- Seed default admin user (password: admin123 - bcrypt)
INSERT INTO app_users(username, email, password_hash, enabled)
VALUES ('admin', 'admin@ebcs.local', '$2a$10$7Q0hI0j0kK3lJqK2K1QaXOJp5J0GnQx6mZk1YIqQmU9j1xE5v3zTG', TRUE);

INSERT INTO user_roles(user_id, role_id)
SELECT u.id, r.id FROM app_users u, roles r WHERE u.username='admin' AND r.name='ROLE_ADMIN';
