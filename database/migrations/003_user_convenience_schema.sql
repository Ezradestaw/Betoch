-- ==============================================================================
-- BETOCH USER CONVENIENCE & PRODUCT EXPERIENCE EXPANSION MIGRATION (003)
-- ==============================================================================

-- 1. Extend favorites with collection support
ALTER TABLE favorites 
ADD COLUMN IF NOT EXISTS collection_name VARCHAR(64) DEFAULT 'My Favorites';

CREATE INDEX IF NOT EXISTS idx_favorites_collection ON favorites(user_id, collection_name);

-- 2. Add saved searches table
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    notify_email BOOLEAN NOT NULL DEFAULT true,
    notify_in_app BOOLEAN NOT NULL DEFAULT true,
    last_alerted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id, created_at DESC);

-- 3. Add previous monthly rent for Price Drop Detection on properties
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS previous_monthly_rent NUMERIC(12, 2);

-- 4. Update property_viewing_requests status check constraint to include COMPLETED and NO_SHOW
ALTER TABLE property_viewing_requests
DROP CONSTRAINT IF EXISTS property_viewing_requests_status_check;

ALTER TABLE property_viewing_requests
ADD CONSTRAINT property_viewing_requests_status_check 
CHECK (status IN ('PENDING', 'REQUESTED', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'));

-- 5. Track viewing response / completion metadata
ALTER TABLE property_viewing_requests
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 6. Add index on notifications for faster unread badge queries
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
