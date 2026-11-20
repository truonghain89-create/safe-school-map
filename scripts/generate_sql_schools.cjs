const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../src/lib/constants/schools-bien-hoa.ts'), 'utf8');
const match = content.match(/export const BIEN_HOA_SCHOOLS_DATA: School\[\] = (\[[\s\S]*?\]);\s*\/\*\*/);
if (!match) {
  console.error('Cannot match BIEN_HOA_SCHOOLS_DATA');
  process.exit(1);
}

// Strip TS type casts like 'as const'
const jsonStr = match[1]
  .replace(/as const/g, '')
  .replace(/,\s*\]/g, ']')
  .replace(/,\s*\}/g, '}');

const schools = eval(jsonStr);
console.log('Parsed schools count:', schools.length);

let sql = `-- ============================================================================
-- SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN (TP. BIÊN HÒA)
-- MIGRATION DỮ LIỆU ĐA TRƯỜNG: 73 CƠ SỞ GIÁO DỤC ĐÃ KIỂM CHỨNG THỰC ĐỊA
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'education_level_enum') THEN
    CREATE TYPE public.education_level_enum AS ENUM (
      'primary', 'secondary', 'high_school', 'multi_level', 'vocational', 'college', 'university', 'unspecified'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'school_type_enum') THEN
    CREATE TYPE public.school_type_enum AS ENUM ('public', 'private', 'other');
  END IF;
END $$;

ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS campus_name TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS ward TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS verification_source TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS verified_by UUID;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS location_public_approved BOOLEAN DEFAULT false;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS location_approved_by UUID;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS location_approved_at TIMESTAMPTZ;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS confidence_tier TEXT;

INSERT INTO public.schools (
  id, name, address, lat, lng, is_focal_point, status, public_map_approved,
  education_level, school_type, ward, verification_source, is_verified, location_public_approved,
  campus_name, website, confidence_tier, created_at
) VALUES
`;

const values = schools.map(s => {
  const esc = (val) => val === null || val === undefined ? 'NULL' : "'" + String(val).replace(/'/g, "''") + "'";
  return "  (" + [
    esc(s.id),
    esc(s.name),
    esc(s.address),
    s.lat,
    s.lng,
    s.is_focal_point ? 'true' : 'false',
    esc(s.status),
    s.public_map_approved ? 'true' : 'false',
    esc(s.education_level),
    esc(s.school_type),
    esc(s.ward),
    esc(s.verification_source),
    s.is_verified ? 'true' : 'false',
    s.location_public_approved ? 'true' : 'false',
    esc(s.campus_name),
    esc(s.website),
    esc(s.confidence_tier || 'A'),
    esc(s.created_at)
  ].join(', ') + ")";
}).join(',\n');

sql += values + '\n';
sql += `ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  is_focal_point = EXCLUDED.is_focal_point,
  status = EXCLUDED.status,
  public_map_approved = EXCLUDED.public_map_approved,
  education_level = EXCLUDED.education_level,
  school_type = EXCLUDED.school_type,
  ward = EXCLUDED.ward,
  verification_source = EXCLUDED.verification_source,
  is_verified = EXCLUDED.is_verified,
  location_public_approved = EXCLUDED.location_public_approved,
  campus_name = EXCLUDED.campus_name,
  website = EXCLUDED.website,
  confidence_tier = EXCLUDED.confidence_tier;
`;

fs.writeFileSync(path.join(__dirname, '../supabase/MIGRATION_SCHOOLS_BIEN_HOA.sql'), sql, 'utf8');
console.log('Successfully generated supabase/MIGRATION_SCHOOLS_BIEN_HOA.sql');
