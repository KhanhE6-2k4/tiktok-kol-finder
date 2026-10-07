CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,

    email TEXT UNIQUE,

    name TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS google_accounts (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    google_user_id TEXT NOT NULL,

    google_email TEXT NOT NULL,

    access_token TEXT,

    refresh_token TEXT,

    token_type TEXT,

    scope TEXT,

    expiry_date BIGINT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id),

    UNIQUE(google_user_id)
);
