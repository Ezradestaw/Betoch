-- ==============================================================================
-- BETOCH MARKETPLACE — AI INTELLIGENCE LAYER SCHEMA MIGRATION
-- Target: PostgreSQL 18+
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. AI FEATURE FLAGS (Runtime dynamic toggles without redeploy)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_feature_flags (
    feature_key VARCHAR(64) PRIMARY KEY,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    description TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO ai_feature_flags (feature_key, is_enabled, description) VALUES
    ('AI_PROPERTY_SEARCH', true, 'Natural language search query parsing into structured filters'),
    ('AI_RECOMMENDATIONS', true, 'Personalized hybrid content and behavioral property recommendations'),
    ('AI_DESCRIPTION_GENERATOR', true, 'Accurate owner listing description generator based solely on verified attributes'),
    ('AI_PHOTO_ANALYSIS', true, 'Listing photo quality, darkness, blurriness, and room type checks'),
    ('AI_FRAUD_DETECTION', true, 'Behavioral risk scoring, rapid listing velocity, and anomalous price checks'),
    ('AI_PRICE_ASSISTANT', true, 'Sub-city and property category statistical rental price guidance for owners'),
    ('AI_SUPPORT_ASSISTANT', true, 'RAG knowledge assistant for FAQ, Proclamation 1320/2024, and Telebirr rules'),
    ('AI_PROPERTY_COMPARISON', true, 'Side-by-side multi-property comparison based on exact database attributes')
ON CONFLICT (feature_key) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. AI REQUEST OBSERVABILITY & METRICS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_requests (
    id BIGSERIAL PRIMARY KEY,
    feature VARCHAR(64) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    provider VARCHAR(32) NOT NULL,
    model VARCHAR(64) NOT NULL,
    latency_ms INT NOT NULL,
    tokens_used INT NOT NULL DEFAULT 0,
    estimated_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_requests_feature ON ai_requests(feature);
CREATE INDEX IF NOT EXISTS idx_ai_requests_user ON ai_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_created ON ai_requests(created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. AI USER FEEDBACK LOOP
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    rating VARCHAR(16) NOT NULL CHECK (rating IN ('POSITIVE', 'NEGATIVE')),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_feature ON ai_feedback(feature);

-- ------------------------------------------------------------------------------
-- 4. AI FRAUD & RISK SIGNALS LEDGER
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_risk_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(32) NOT NULL CHECK (entity_type IN ('USER', 'PROPERTY', 'APPLICATION')),
    entity_id UUID NOT NULL,
    risk_score INT NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    risk_level VARCHAR(16) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    signals JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'DETECTED' CHECK (status IN ('DETECTED', 'REVIEWED', 'DISMISSED')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_risk_entity ON ai_risk_signals(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_risk_status ON ai_risk_signals(status);

-- ------------------------------------------------------------------------------
-- 5. AI DUPLICATE LISTINGS FLAGS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_duplicate_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    matched_property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    similarity_score INT NOT NULL CHECK (similarity_score BETWEEN 0 AND 100),
    reasons JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'DISMISSED')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_duplicate_property ON ai_duplicate_flags(property_id);
CREATE INDEX IF NOT EXISTS idx_ai_duplicate_status ON ai_duplicate_flags(status);

-- ------------------------------------------------------------------------------
-- 6. RAG KNOWLEDGE BASE (Documents & Chunks with GIN Full-Text Index)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(64) NOT NULL,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_doc ON knowledge_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_vector ON knowledge_chunks USING gin(search_vector);

-- ------------------------------------------------------------------------------
-- 7. PROPERTY VIEWING SCHEDULE REQUESTS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS property_viewing_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    renter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    proposed_date DATE NOT NULL,
    time_slot VARCHAR(32) NOT NULL CHECK (time_slot IN ('MORNING_9_12', 'AFTERNOON_12_3', 'EVENING_3_6')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_viewing_property ON property_viewing_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_viewing_renter ON property_viewing_requests(renter_id);

-- ------------------------------------------------------------------------------
-- 8. USER SEARCH & BEHAVIOR HISTORY (for recommendations)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    raw_query TEXT,
    structured_filters JSONB NOT NULL,
    results_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON user_search_history(user_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 9. POPULATE INITIAL OFFICIAL KNOWLEDGE BASE
-- ------------------------------------------------------------------------------

DO $$
DECLARE
    doc1_id UUID := uuid_generate_v4();
    doc2_id UUID := uuid_generate_v4();
    doc3_id UUID := uuid_generate_v4();
    doc4_id UUID := uuid_generate_v4();
BEGIN
    -- Proclamation No. 1320/2024 Guide
    INSERT INTO knowledge_documents (id, title, slug, category, summary)
    VALUES (
        doc1_id,
        'Ethiopian Residential Housing Proclamation No. 1320/2024 Compliance Guide',
        'proclamation-1320-2024-guide',
        'LEGAL_REGULATORY',
        'Official rules governing security deposits, rent adjustments, mandatory registration, and tenant eviction safeguards in Ethiopia.'
    ) ON CONFLICT (slug) DO NOTHING;

    INSERT INTO knowledge_chunks (document_id, chunk_index, content)
    VALUES 
    (doc1_id, 1, 'Proclamation No. 1320/2024 regulates residential housing leases across Ethiopia. Under Article 14, landlords are strictly prohibited from demanding more than two (2) months of advance security deposit. Any contractual clause demanding 3, 6, or 12 months advance deposit is legally void and unenforceable in Ethiopian courts.'),
    (doc1_id, 2, 'Mandatory Lease Registration: All residential rental contracts executed in Addis Ababa must be formally submitted and registered with the local Sub-City Housing Administration within 30 calendar days of signing. Betoch facilitates this by generating standard compliant rental contracts with registration reference numbers.'),
    (doc1_id, 3, 'Rent Control and Eviction Protections: Landlords may not arbitrarily increase rent within an active 12-month lease period. Eviction requires a verified breach of contract or minimum 90-day written legal notice served through official municipal channels.')
    ON CONFLICT DO NOTHING;

    -- Fayda Digital ID & Verification
    INSERT INTO knowledge_documents (id, title, slug, category, summary)
    VALUES (
        doc2_id,
        'Fayda Digital ID & Landlord Carta Verification Guide',
        'fayda-id-and-carta-verification',
        'VERIFICATION',
        'How identity verification and landlord title deed documentation work on Betoch to prevent fraud.'
    ) ON CONFLICT (slug) DO NOTHING;

    INSERT INTO knowledge_chunks (document_id, chunk_index, content)
    VALUES 
    (doc2_id, 1, 'Fayda Digital ID Verification: Every user can verify their account using Ethiopia National ID (Fayda). Users submit their Fayda Identification Number (FIN) and front document photo. Betoch securely hashes the FIN with SHA-256 to ensure no duplicate accounts can be created with the same national identity. Verified users receive a green Verified Fayda badge.'),
    (doc2_id, 2, 'Landlord Property Verification (Carta): Property owners must upload their municipal title deed (Carta or Site Plan) before their listing displays the Verified Property shield badge. Betoch administrators cross-check the owner name on the title deed against the verified Fayda ID before granting verified status.')
    ON CONFLICT DO NOTHING;

    -- Telebirr & Commission Policy
    INSERT INTO knowledge_documents (id, title, slug, category, summary)
    VALUES (
        doc3_id,
        'Telebirr Payment Integration & Commission Policy',
        'telebirr-payment-and-commission-policy',
        'PAYMENTS',
        'Details on the 10% platform commission, Telebirr RSA-2048 signing, and payment security.'
    ) ON CONFLICT (slug) DO NOTHING;

    INSERT INTO knowledge_chunks (document_id, chunk_index, content)
    VALUES 
    (doc3_id, 1, 'Platform Commission Rule: Betoch charges a standard 10% tenant-finder commission based on one (1) month of rent when a lease agreement is executed. The commission is payable by the property owner upon successful tenant placement. For example, on a 30,000 ETB monthly lease, the platform commission is 3,000 ETB.'),
    (doc3_id, 2, 'Telebirr Payment Workflow: Payments are secured using Telebirr RSA SHA-256 signature verification. All transactions generate a unique OutTradeNo. Users can pay deposits, rent, and commissions directly using their Telebirr mobile wallet or CBE Birr.')
    ON CONFLICT DO NOTHING;

    -- Safety & Scams Prevention
    INSERT INTO knowledge_documents (id, title, slug, category, summary)
    VALUES (
        doc4_id,
        'Betoch Safety & Scam Prevention Guidelines',
        'safety-and-scam-prevention',
        'SAFETY',
        'Best practices for safe property viewing, reporting suspicious listings, and fraud prevention.'
    ) ON CONFLICT (slug) DO NOTHING;

    INSERT INTO knowledge_chunks (document_id, chunk_index, content)
    VALUES 
    (doc4_id, 1, 'Never send cash or direct bank transfers before physically inspecting a property and meeting the verified owner. Always communicate through the Betoch in-app messaging system so an audit trail is maintained.'),
    (doc4_id, 2, 'Reporting Suspicious Listings: If an owner requests a deposit exceeding 2 months rent, provides an address that does not exist in Addis Ababa, or refuses in-person viewing, use the Report Listing button immediately. The Betoch safety and risk system automatically investigates flagged accounts.')
    ON CONFLICT DO NOTHING;
END $$;
