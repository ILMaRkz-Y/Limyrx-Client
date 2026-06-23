-- ============================================================
-- XMCL → Supabase Admin Panel Enhancements
-- Run this in your Supabase SQL Editor after the initial migration
-- ============================================================

-- ============================================================
-- 1. SERVER DETAILS (extended server information)
-- ============================================================
CREATE TABLE IF NOT EXISTS server_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    version VARCHAR(50), -- Minecraft version (e.g., "1.20.1", "1.19.2")
    modpack VARCHAR(100), -- Name of modpack if applicable
    game_mode VARCHAR(20), -- survival, creative, adventure, etc.
    difficulty VARCHAR(10), -- peaceful, easy, normal, hard
    max_players INTEGER DEFAULT 20,
    motd TEXT, -- Message of the day
    favicon_url TEXT, -- Server icon URL
    last_polled TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_server_details_server_id ON server_details(server_id);
CREATE INDEX IF NOT EXISTS idx_server_details_last_polled ON server_details(last_polled DESC);

-- ============================================================
-- 2. USER SESSIONS (track user login and gameplay sessions)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL, -- Minecraft username
    session_id UUID NOT NULL, -- Unique session identifier
    server_id UUID REFERENCES servers(id), -- Which server they joined (if any)
    version VARCHAR(20), -- Minecraft version used
    join_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    leave_time TIMESTAMPTZ,
    duration_seconds INTEGER, -- Calculated from join/leave time
    ip_address INET, -- Player's IP address (for admin/security)
    country_code CHAR(2), -- Optional: from IP lookup
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_username ON user_sessions(username);
CREATE INDEX IF NOT EXISTS idx_user_sessions_join_time ON user_sessions(join_time DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_server_id ON user_sessions(server_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);

-- ============================================================
-- 3. LAUNCHER SETTINGS (key-value store for configuration)
-- ============================================================
CREATE TABLE IF NOT EXISTS launcher_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE, -- Settings key (e.g., "maintenance_mode", "max_news_items")
    value TEXT, -- Settings value (JSON string for complex values)
    description TEXT, -- Human-readable description
    updated_by UUID REFERENCES admin_users(id), -- Which admin made the change
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_launcher_settings_key ON launcher_settings(key);

-- ============================================================
-- 4. MODERATION LOGS (track admin actions)
-- ============================================================
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admin_users(id), -- Which admin performed the action
    target_username TEXT NOT NULL, -- Username that was moderated
    action_type VARCHAR(20) NOT NULL, -- ban, unban, kick, warn, mute, unmute
    reason TEXT, -- Reason for the action
    server_id UUID REFERENCES servers(id), -- Which server (if applicable)
    expires_at TIMESTAMPTZ, -- For temporary bans/mutes
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_admin_id ON moderation_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_target ON moderation_logs(target_username);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON moderation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_server_id ON moderation_logs(server_id);

-- ============================================================
-- 5. FEEDBACK TICKETS (support/feedback system)
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL, -- Submitting user's username
    email TEXT, -- Optional email for follow-up
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general', -- bug, feature, question, general
    priority VARCHAR(10) NOT NULL DEFAULT 'low', -- low, medium, high, urgent
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
    assigned_to UUID REFERENCES admin_users(id), -- Which admin is handling it
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_tickets_status ON feedback_tickets(status);
CREATE INDEX IF NOT EXISTS idx_feedback_tickets_category ON feedback_tickets(category);
CREATE INDEX IF NOT EXISTS idx_feedback_tickets_priority ON feedback_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_tickets_created_at ON feedback_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_tickets_assigned_to ON feedback_tickets(assigned_to);

-- ============================================================
-- 6. ENHANCE EXISTING TABLES (add useful columns)
-- ============================================================

-- Add helpful columns to servers table
ALTER TABLE servers
ADD COLUMN IF NOT EXISTS motd TEXT,
ADD COLUMN IF NOT EXISTS version VARCHAR(50),
ADD COLUMN IF NOT EXISTS favicon_url TEXT,
ADD COLUMN IF NOT EXISTS player_list TEXT; -- JSON array of player names (for quick lookup)

-- Add helpful columns to notifications
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ; -- For temporary notifications

-- Add helpful columns to news
ALTER TABLE news
ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ; -- For time-sensitive news

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS) - Keep policies permissive for now
-- ============================================================
-- Enable RLS on new tables
ALTER TABLE server_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE launcher_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_tickets ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (same approach as initial migration)
-- NOTE: CREATE POLICY does NOT support IF NOT EXISTS — use DO block for idempotency
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'all_access' AND tablename = 'server_details') THEN
    CREATE POLICY "all_access" ON server_details FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'all_access' AND tablename = 'user_sessions') THEN
    CREATE POLICY "all_access" ON user_sessions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'all_access' AND tablename = 'launcher_settings') THEN
    CREATE POLICY "all_access" ON launcher_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'all_access' AND tablename = 'moderation_logs') THEN
    CREATE POLICY "all_access" ON moderation_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'all_access' AND tablename = 'feedback_tickets') THEN
    CREATE POLICY "all_access" ON feedback_tickets FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 8. SEED DATA (optional initial settings)
-- ============================================================

-- Insert some default launcher settings
INSERT INTO launcher_settings (key, value, description, updated_by)
VALUES
    ('maintenance_mode', 'false', 'Enable maintenance mode (disables launcher for non-admins)',
     (SELECT id FROM admin_users LIMIT 1)),
    ('max_news_items', '10', 'Maximum number of news items to display',
     (SELECT id FROM admin_users LIMIT 1)),
    ('enable_peer_to_peer', 'true', 'Enable peer-to-peer multiplayer feature',
     (SELECT id FROM admin_users LIMIT 1)),
    ('auto_update_check', 'true', 'Automatically check for launcher updates',
     (SELECT id FROM admin_users LIMIT 1))
ON CONFLICT (key) DO NOTHING;

-- Insert a sample feedback category if needed (categories are free-form, but we can document)
-- No seed data needed for feedback_tickets as categories are open-ended

-- ============================================================
-- 9. CLEANUP (drop any temporary policies if they existed)
-- ============================================================
-- These would be from any experimental policies, but we're starting fresh
DROP POLICY IF EXISTS "anon_can_read_server_details" ON server_details;
DROP POLICY IF EXISTS "anon_can_insert_user_sessions" ON user_sessions;
DROP POLICY IF EXISTS "anon_can_read_launcher_settings" ON launcher_settings;
DROP POLICY IF EXISTS "admin_can_modify_launcher_settings" ON launcher_settings;
DROP POLICY IF EXISTS "anon_can_read_moderation_logs" ON moderation_logs;
DROP POLICY IF EXISTS "admin_can_insert_moderation_logs" ON moderation_logs;
DROP POLICY IF EXISTS "anon_can_read_feedback_tickets" ON feedback_tickets;
DROP POLICY IF EXISTS "admin_can_modify_feedback_tickets" ON feedback_tickets;