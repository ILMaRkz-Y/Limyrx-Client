-- ============================================================
-- XMCL → Supabase Migration
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/skpigopjjnposqdjkbld/sql/new)
-- ============================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. PRESENCE (online player tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL DEFAULT 'anonymous',
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON presence(last_seen);
CREATE INDEX IF NOT EXISTS idx_presence_instance_id ON presence(instance_id);

-- ============================================================
-- 2. SERVERS (admin server list)
-- ============================================================
CREATE TABLE IF NOT EXISTS servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER NOT NULL DEFAULT 25565,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. NEWS (news articles)
-- ============================================================
CREATE TABLE IF NOT EXISTS news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tag TEXT NOT NULL DEFAULT 'NEWS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_date ON news(date DESC);

-- ============================================================
-- 4. TAGS (news tag definitions)
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#6366f1',
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. NOTIFICATIONS (active + history in one table)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    active BOOLEAN NOT NULL DEFAULT false,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_active ON notifications(active);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(date DESC);

-- ============================================================
-- 6. SKINS (user-uploaded skin entries)
-- ============================================================
CREATE TABLE IF NOT EXISTS skins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT 'classic' CHECK (model IN ('classic', 'slim')),
    skin_url TEXT NOT NULL,
    cape_url TEXT,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skins_date ON skins(date DESC);

-- ============================================================
-- 7. ADMIN_USERS (admin permission system)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'owner')),
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    added_by TEXT NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_name ON admin_users(name);

-- ============================================================
-- 8. PLAYER_AGGREGATES (aggregated player statistics)
-- ============================================================
CREATE TABLE IF NOT EXISTS player_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    total_playtime INTEGER NOT NULL DEFAULT 0,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    favorite_server UUID REFERENCES servers(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_aggregates_username ON player_aggregates(username);
CREATE INDEX IF NOT EXISTS idx_player_aggregates_updated_at ON player_aggregates(updated_at);

-- ============================================================
-- 9. SERVER_HOURLY (hourly server status snapshots)
-- ============================================================
CREATE TABLE IF NOT EXISTS server_hourly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID NOT NULL REFERENCES servers(id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    online BOOLEAN NOT NULL,
    player_count INTEGER NOT NULL DEFAULT 0,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_server_hourly_server_id ON server_hourly(server_id);
CREATE INDEX IF NOT EXISTS idx_server_hourly_timestamp ON server_hourly(timestamp DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Enable RLS on all tables
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_hourly ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: Since this launcher does NOT use Supabase Auth (it uses
-- Minecraft/Microsoft login), we can't use current_user for RLS.
-- Security is handled client-side via adminPermissions.ts (same as old Firebase).
-- All policies are wide-open for now.
-- If you want proper RLS later, set up Supabase Auth and link to admin_users.
--
-- NOTE: CREATE POLICY does NOT support IF NOT EXISTS in PostgreSQL.
-- We use a DO block to safely create policies only if they don't exist yet.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'all_access' AND tablename = 'presence') THEN
    CREATE POLICY "all_access" ON presence FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'all_access' AND tablename = 'servers') THEN
    CREATE POLICY "all_access" ON servers FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'all_access' AND tablename = 'news') THEN
    CREATE POLICY "all_access" ON news FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'all_access' AND tablename = 'tags') THEN
    CREATE POLICY "all_access" ON tags FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'all_access' AND tablename = 'notifications') THEN
    CREATE POLICY "all_access" ON notifications FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'all_access' AND tablename = 'skins') THEN
    CREATE POLICY "all_access" ON skins FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'all_access' AND tablename = 'admin_users') THEN
    CREATE POLICY "all_access" ON admin_users FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'all_access' AND tablename = 'player_aggregates') THEN
    CREATE POLICY "all_access" ON player_aggregates FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'all_access' AND tablename = 'server_hourly') THEN
    CREATE POLICY "all_access" ON server_hourly FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- CLEANUP: Drop any old policies from the first migration run
-- ============================================================
DROP POLICY IF EXISTS "anon_can_read_servers" ON servers;
DROP POLICY IF EXISTS "anon_can_read_news" ON news;
DROP POLICY IF EXISTS "anon_can_read_tags" ON tags;
DROP POLICY IF EXISTS "anon_can_read_notifications" ON notifications;
DROP POLICY IF EXISTS "anon_can_read_skins" ON skins;
DROP POLICY IF EXISTS "anon_can_read_presence" ON presence;
DROP POLICY IF EXISTS "anon_can_upsert_presence" ON presence;
DROP POLICY IF EXISTS "anon_can_update_own_presence" ON presence;
DROP POLICY IF EXISTS "anon_can_delete_stale_presence" ON presence;
DROP POLICY IF EXISTS "anon_can_insert_skins" ON skins;
DROP POLICY IF EXISTS "anon_can_update_skins" ON skins;
DROP POLICY IF EXISTS "anon_can_delete_skins" ON skins;
DROP POLICY IF EXISTS "admin_can_insert_servers" ON servers;
DROP POLICY IF EXISTS "admin_can_update_servers" ON servers;
DROP POLICY IF EXISTS "admin_can_insert_news" ON news;
DROP POLICY IF EXISTS "admin_can_update_news" ON news;
DROP POLICY IF EXISTS "admin_can_delete_news" ON news;
DROP POLICY IF EXISTS "admin_can_insert_tags" ON tags;
DROP POLICY IF EXISTS "admin_can_update_tags" ON tags;
DROP POLICY IF EXISTS "admin_can_delete_tags" ON tags;
DROP POLICY IF EXISTS "admin_can_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "admin_can_update_notifications" ON notifications;
DROP POLICY IF EXISTS "admin_can_delete_notifications" ON notifications;
DROP POLICY IF EXISTS "owner_can_insert_admin_users" ON admin_users;
DROP POLICY IF EXISTS "owner_can_update_admin_users" ON admin_users;
DROP POLICY IF EXISTS "owner_can_delete_admin_users" ON admin_users;
DROP POLICY IF EXISTS "anon_can_read_admin_users" ON admin_users;

-- ============================================================
-- SEED DATA: bootstrap a default owner (change the username!)
-- ============================================================
INSERT INTO admin_users (name, permission, added_by)
VALUES ('ilmarkz_', 'owner', 'system')
ON CONFLICT (name) DO NOTHING;