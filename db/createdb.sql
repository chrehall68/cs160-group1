CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('customer','staff','admin')),
    email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now(),
    last_login TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dob DATE,
    phone VARCHAR(32),
    email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS addresses (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(128) NOT NULL,
    state VARCHAR(64),
    postal_code VARCHAR(32),
    country VARCHAR(64) DEFAULT 'US'
);

CREATE TABLE IF NOT EXISTS atm (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200),
    address_id BIGINT REFERENCES addresses(id) ON DELETE SET NULL,
    status VARCHAR(32) DEFAULT 'active',
    installed_at DATE
);

CREATE TABLE IF NOT EXISTS accounts (
    id BIGSERIAL PRIMARY KEY,
    account_number VARCHAR(64) UNIQUE NOT NULL,
    routing_number VARCHAR(64),
    customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE,
    account_type VARCHAR(32) NOT NULL CHECK (account_type IN ('checking','savings','loan','credit')),
    balance NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    currency CHAR(3) DEFAULT 'USD',
    status VARCHAR(32) DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    amount NUMERIC(18,2) NOT NULL CHECK (amount >= 0),
    currency CHAR(3) DEFAULT 'USD',
    transaction_type VARCHAR(32) NOT NULL CHECK (transaction_type IN ('deposit','withdraw','transfer','fee','adjustment')),
    status VARCHAR(32) DEFAULT 'pending',
    initiated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    account_id BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
    atm_id BIGINT REFERENCES atm(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    description TEXT,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS deposit (
    transaction_id BIGINT PRIMARY KEY REFERENCES transactions(id) ON DELETE CASCADE,
    source VARCHAR(64) CHECK (source IN ('cash','check','external')),
    check_deposit_id BIGINT REFERENCES check_deposit(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS withdraw (
    transaction_id BIGINT PRIMARY KEY REFERENCES transactions(id) ON DELETE CASCADE,
    method VARCHAR(64) CHECK (method IN ('atm', 'online'))
);

CREATE TABLE IF NOT EXISTS transfer (
    transaction_id BIGINT PRIMARY KEY REFERENCES transactions(id) ON DELETE CASCADE,
    from_account_id BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
    to_account_id BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
    transfer_fee NUMERIC(18,2) DEFAULT 0.00,
    external_reference VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS check_deposit (
    id BIGSERIAL PRIMARY KEY,
    check_number VARCHAR(64),
    issuing_bank VARCHAR(255),
    payee_name VARCHAR(255),
    amount NUMERIC(18,2),
    image_uri TEXT,
    deposited_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_entry (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT REFERENCES transactions(id) ON DELETE SET NULL,
    account_id BIGINT REFERENCES accounts(id) ON DELETE CASCADE,
    entry_type VARCHAR(6) NOT NULL CHECK (entry_type IN ('debit','credit')),
    amount NUMERIC(18,2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ DEFAULT now(),
    description TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(128) NOT NULL,
    object_type VARCHAR(64),
    object_id BIGINT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounts_customer_id ON accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_initiated_by ON transactions(initiated_by);
CREATE INDEX IF NOT EXISTS idx_ledger_entry_account_id ON ledger_entry(account_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
