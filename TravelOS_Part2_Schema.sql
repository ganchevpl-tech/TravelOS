-- ════════════════════════════════════════════════════════════════
-- TravelOS — FULL BACKEND ARCHITECTURE
-- Part 2: Multi-tenant Supabase Schema + Engine + Webhooks
-- ════════════════════════════════════════════════════════════════

-- ╔══════════════════════════════════════════╗
-- ║  FILE 1: SUPABASE DDL (001_schema.sql)  ║
-- ╚══════════════════════════════════════════╝

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ────────────────────────────────────────────
-- AGENCIES (multi-tenant root)
-- ────────────────────────────────────────────
CREATE TABLE agencies (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                TEXT NOT NULL,                         -- "Sunshine Travel ЕООД"
    slug                TEXT UNIQUE NOT NULL,                  -- "sunshine-travel"
    logo_url            TEXT,
    brand_color         TEXT DEFAULT '#00e5b8',
    brand_voice         TEXT,                                  -- AI persona prompt fragment

    -- Infobip
    infobip_api_key     TEXT,                                  -- encrypted at rest
    infobip_base_url    TEXT DEFAULT 'https://api.infobip.com',
    viber_sender_id     TEXT,                                  -- e.g. "+359XXXXXXXXX"
    whatsapp_sender_id  TEXT,
    sms_sender_id       TEXT,

    -- Stripe
    stripe_account_id   TEXT,                                  -- Stripe Connect account
    stripe_webhook_secret TEXT,

    -- Bank (for transfers > €1000)
    bank_iban           TEXT,
    bank_name           TEXT,                                  -- "UniCredit Bulbank"
    bank_swift          TEXT,

    -- Meta Ads
    meta_business_id    TEXT,
    meta_ad_account_id  TEXT,
    meta_pixel_id       TEXT,
    meta_access_token   TEXT,

    -- Margins
    default_min_margin_pct  NUMERIC(5,2) DEFAULT 3.00,
    default_target_margin_pct NUMERIC(5,2) DEFAULT 10.00,
    bank_transfer_threshold NUMERIC(10,2) DEFAULT 1000.00,    -- above this → bank routing

    -- Subscription
    plan                TEXT DEFAULT 'starter' CHECK (plan IN ('starter','growth','enterprise')),
    is_active           BOOLEAN DEFAULT TRUE,
    trial_ends_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- LEADS (with full marketing attribution)
-- ────────────────────────────────────────────
CREATE TABLE leads (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id           UUID REFERENCES agencies(id) ON DELETE CASCADE,

    -- Identity
    name                TEXT,
    phone               TEXT,                                  -- canonical E.164
    email               TEXT,
    viber_id            TEXT,
    whatsapp_id         TEXT,

    -- Attribution (Meta / Google Click IDs)
    utm_source          TEXT,                                  -- "facebook", "google", "viber"
    utm_medium          TEXT,                                  -- "cpc", "broadcast", "organic"
    utm_campaign        TEXT,                                  -- "Tunisia_Summer_2025"
    utm_content         TEXT,
    fbclid              TEXT,                                  -- Facebook Click ID
    gclid               TEXT,                                  -- Google Click ID
    ttclid              TEXT,                                  -- TikTok Click ID
    landing_page        TEXT,

    -- Lead source
    source_channel      TEXT CHECK (source_channel IN ('viber','whatsapp','web','facebook_lead','phone','walk_in','email')),
    intake_notes        TEXT,                                  -- agent phone notes
    intake_agent_id     UUID,

    -- AI conversation
    conversation_id     TEXT,
    last_message_at     TIMESTAMPTZ,
    message_count       INT DEFAULT 0,

    -- Lifecycle
    status              TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','converted','lost','unsubscribed')),
    qualification_score INT DEFAULT 0,                         -- 0-100 AI scoring
    estimated_value     NUMERIC(10,2),
    destination         TEXT,
    travel_period       TEXT,
    pax_adults          INT,
    pax_children        INT,
    budget_eur          NUMERIC(10,2),

    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- VENDORS per agency
-- ────────────────────────────────────────────
CREATE TABLE vendors (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id   UUID REFERENCES agencies(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    feed_url    TEXT,
    feed_type   TEXT CHECK (feed_type IN ('xml','json','pdf','manual')),
    last_synced TIMESTAMPTZ,
    is_active   BOOLEAN DEFAULT TRUE
);

-- ────────────────────────────────────────────
-- PRODUCTS & PRICES
-- ────────────────────────────────────────────
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id       UUID REFERENCES agencies(id) ON DELETE CASCADE,
    vendor_id       UUID REFERENCES vendors(id),
    vendor_ref      TEXT,
    name            TEXT NOT NULL,
    destination     TEXT NOT NULL,
    hotel_name      TEXT,
    hotel_stars     INT,
    departure_date  DATE,
    return_date     DATE,
    nights          INT,
    board_type      TEXT,
    vendor_cost     NUMERIC(10,2) NOT NULL,
    currency        TEXT DEFAULT 'EUR',
    is_active       BOOLEAN DEFAULT TRUE,
    last_updated    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE competitor_prices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id       UUID REFERENCES agencies(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id),
    competitor_name TEXT NOT NULL,
    competitor_url  TEXT,
    observed_price  NUMERIC(10,2) NOT NULL,
    currency        TEXT DEFAULT 'EUR',
    scraped_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE published_prices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id       UUID REFERENCES agencies(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id) UNIQUE,
    target_price    NUMERIC(10,2) NOT NULL,
    margin_pct      NUMERIC(5,2) NOT NULL,
    beat_competitor TEXT,
    pricing_rule    TEXT,
    cms_synced      BOOLEAN DEFAULT FALSE,
    cms_synced_at   TIMESTAMPTZ,
    published_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- BOOKINGS
-- ────────────────────────────────────────────
CREATE TABLE bookings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id           UUID REFERENCES agencies(id) ON DELETE CASCADE,
    lead_id             UUID REFERENCES leads(id),
    product_id          UUID REFERENCES products(id),
    booking_ref         TEXT UNIQUE DEFAULT ('BK-' || UPPER(SUBSTRING(uuid_generate_v4()::TEXT,1,8))),

    client_name         TEXT NOT NULL,
    client_phone        TEXT,
    client_email        TEXT,
    client_channel      TEXT,

    pax_adults          INT DEFAULT 1,
    pax_children        INT DEFAULT 0,
    total_price         NUMERIC(10,2) NOT NULL,
    vendor_cost_total   NUMERIC(10,2) NOT NULL,
    currency            TEXT DEFAULT 'EUR',

    status              TEXT DEFAULT 'inquiry' CHECK (status IN
        ('inquiry','offer_sent','confirmed','awaiting_payment','paid','voucher_issued','cancelled','refunded')),
    status_updated_at   TIMESTAMPTZ DEFAULT NOW(),

    -- Payment routing
    payment_method      TEXT CHECK (payment_method IN ('card','bank_transfer','pos','cash',NULL)),
    payment_route       TEXT CHECK (payment_route IN ('stripe','bank',NULL)),
    stripe_session_id   TEXT,
    stripe_payment_intent TEXT,
    bank_transfer_ref   TEXT,
    payment_received_at TIMESTAMPTZ,
    payment_amount      NUMERIC(10,2),

    -- Voucher LOCK
    voucher_path        TEXT,
    voucher_sent_at     TIMESTAMPTZ,

    agent_id            UUID,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- FINANCIAL SHIELD: Voucher cannot be issued without payment
CREATE OR REPLACE FUNCTION enforce_payment_before_voucher()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.voucher_sent_at IS NOT NULL
       AND NEW.status NOT IN ('paid','voucher_issued') THEN
        RAISE EXCEPTION 'FINANCIAL_SHIELD: Booking % status=%. Payment required before voucher.',
            NEW.booking_ref, NEW.status;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER voucher_payment_guard
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION enforce_payment_before_voucher();

-- ────────────────────────────────────────────
-- FINANCIAL LEDGER
-- ────────────────────────────────────────────
CREATE TABLE financial_ledger (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id   UUID REFERENCES agencies(id) ON DELETE CASCADE,
    booking_id  UUID REFERENCES bookings(id),
    entry_type  TEXT CHECK (entry_type IN ('incoming','outgoing','refund','commission')),
    amount      NUMERIC(10,2) NOT NULL,
    currency    TEXT DEFAULT 'EUR',
    due_date    DATE,
    settled_at  TIMESTAMPTZ,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- AI ACTION LOG
-- ────────────────────────────────────────────
CREATE TABLE ai_action_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id       UUID REFERENCES agencies(id),
    action_type     TEXT NOT NULL,
    ai_model        TEXT,                                      -- which model handled it
    lead_id         UUID REFERENCES leads(id),
    booking_id      UUID REFERENCES bookings(id),
    product_id      UUID REFERENCES products(id),
    input_data      JSONB,
    output_data     JSONB,
    tokens_used     INT,
    cost_usd        NUMERIC(8,6),
    status          TEXT CHECK (status IN ('pending','executed','rejected','failed')),
    error_message   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- ROW LEVEL SECURITY — Agency A NEVER sees Agency B's data
-- ────────────────────────────────────────────
ALTER TABLE agencies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads             ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors           ENABLE ROW LEVEL SECURITY;
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_prices  ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ledger  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_action_log     ENABLE ROW LEVEL SECURITY;

-- JWT claims: { "agency_id": "uuid-here" }
CREATE POLICY agency_isolation ON leads
    USING (agency_id::TEXT = current_setting('request.jwt.claims',TRUE)::JSON->>'agency_id');
CREATE POLICY agency_isolation ON bookings
    USING (agency_id::TEXT = current_setting('request.jwt.claims',TRUE)::JSON->>'agency_id');
CREATE POLICY agency_isolation ON products
    USING (agency_id::TEXT = current_setting('request.jwt.claims',TRUE)::JSON->>'agency_id');
CREATE POLICY agency_isolation ON financial_ledger
    USING (agency_id::TEXT = current_setting('request.jwt.claims',TRUE)::JSON->>'agency_id');
CREATE POLICY agency_isolation ON ai_action_log
    USING (agency_id::TEXT = current_setting('request.jwt.claims',TRUE)::JSON->>'agency_id');

-- ────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────
CREATE INDEX idx_leads_agency_status ON leads(agency_id, status);
CREATE INDEX idx_leads_fbclid ON leads(fbclid) WHERE fbclid IS NOT NULL;
CREATE INDEX idx_bookings_agency_status ON bookings(agency_id, status);
CREATE INDEX idx_bookings_stripe ON bookings(stripe_payment_intent);
CREATE INDEX idx_comp_prices_product ON competitor_prices(product_id, scraped_at DESC);
CREATE INDEX idx_ledger_due ON financial_ledger(agency_id, due_date);
