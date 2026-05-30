-- ============================================================
-- PlateKarma — Supabase Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username    TEXT,
  avatar_url  TEXT,
  report_count INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  plate       TEXT NOT NULL,
  state       TEXT,
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  tags        TEXT[] DEFAULT '{}',
  note        TEXT,
  photo_urls  TEXT[] DEFAULT '{}',
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for fast plate lookups
CREATE INDEX reports_plate_idx ON reports (plate);
CREATE INDEX reports_created_at_idx ON reports (created_at DESC);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update report_count on profile
CREATE OR REPLACE FUNCTION update_report_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.user_id IS NOT NULL THEN
    UPDATE profiles SET report_count = report_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' AND OLD.user_id IS NOT NULL THEN
    UPDATE profiles SET report_count = GREATEST(0, report_count - 1) WHERE id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_report_change
  AFTER INSERT OR DELETE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_report_count();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports  ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can update
CREATE POLICY "profiles_public_read"  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_owner_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Reports: anyone can read; only authenticated users can insert; only owner can delete
CREATE POLICY "reports_public_read"   ON reports FOR SELECT USING (true);
CREATE POLICY "reports_auth_insert"   ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports_owner_delete"  ON reports FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Storage bucket for report photos
-- ============================================================
-- Run this in the Supabase Storage section OR via SQL:

INSERT INTO storage.buckets (id, name, public)
VALUES ('report-photos', 'report-photos', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'report-photos');

CREATE POLICY "photos_auth_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'report-photos' AND auth.role() = 'authenticated');

CREATE POLICY "photos_owner_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'report-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
