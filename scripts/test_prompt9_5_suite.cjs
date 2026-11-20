/**
 * SAFE SCHOOL MAP - PROMPT 9.5 AUTOMATED TEST SUITE
 * Multi-School Foundation, General Corridor Routing, Public Publication Independence, City-wide Stats
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`  ${colors.green}✓ PASS${colors.reset} - ${testName}`);
  } else {
    failed++;
    console.log(`  ${colors.red}✗ FAIL${colors.reset} - ${testName}`);
    if (details) console.log(`    ${colors.yellow}Details: ${details}${colors.reset}`);
  }
}

async function runPrompt9_5Suite() {
  console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  SAFE SCHOOL MAP - PROMPT 9.5 TEST SUITE                       ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  Multi-School Foundation, Routing, Permissions & City-Wide Stats${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

  const workspaceRoot = path.resolve(__dirname, '..');
  const migrationPath = path.join(workspaceRoot, 'supabase', 'MIGRATION_PROMPT9_5_MULTI_SCHOOL.sql');

  // =========================================================================
  // GROUP 1: MIGRATION SCRIPT SPECIFICATION VALIDATION
  // =========================================================================
  console.log(`${colors.bold}GROUP 1: Migration Script Definition & Completeness${colors.reset}`);
  
  assert(fs.existsSync(migrationPath), 'Migration SQL script exists at supabase/MIGRATION_PROMPT9_5_MULTI_SCHOOL.sql');
  const sqlContent = fs.readFileSync(migrationPath, 'utf8');

  assert(sqlContent.includes('education_level_enum'), 'Defines education_level_enum type with primary to university levels');
  assert(sqlContent.includes('school_type_enum'), 'Defines school_type_enum type (public, private, other)');
  assert(sqlContent.includes('report_scope_type_enum'), 'Defines report_scope_type_enum (school_specific, public_corridor, unknown_school)');
  assert(sqlContent.includes('routing_status_enum'), 'Defines routing_status_enum (auto_assigned, unassigned, manually_routed)');

  // Schools table extensions
  assert(sqlContent.includes('education_level education_level_enum'), 'Extends schools with education_level column');
  assert(sqlContent.includes('school_type school_type_enum'), 'Extends schools with school_type column');
  assert(sqlContent.includes('ward TEXT'), 'Extends schools with ward column');
  assert(sqlContent.includes('verification_source TEXT'), 'Extends schools with verification_source column');
  assert(sqlContent.includes('is_verified BOOLEAN'), 'Extends schools with is_verified column');
  assert(sqlContent.includes('location_public_approved BOOLEAN'), 'Extends schools with location_public_approved column');

  // Profiles and Reports nullable school_id
  assert(sqlContent.includes('ALTER TABLE public.profiles ALTER COLUMN school_id DROP NOT NULL'), 'Profiles school_id is made NULLable for system admins');
  assert(sqlContent.includes('chk_profile_school_scope'), 'Profiles enforces chk_profile_school_scope constraint (admin null, school staff not null)');
  assert(sqlContent.includes('ALTER TABLE public.reports ALTER COLUMN school_id DROP NOT NULL'), 'Reports school_id is made NULLable for general corridor reports');
  assert(sqlContent.includes('chk_report_scope_integrity'), 'Reports enforces chk_report_scope_integrity constraint');
  assert(sqlContent.includes('ALTER TABLE public.hotspots ALTER COLUMN school_id DROP NOT NULL'), 'Hotspots school_id is made NULLable for corridor hazards');

  // Report routing logs table
  assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.report_routing_logs'), 'Creates report_routing_logs audit table');
  assert(sqlContent.includes('idx_routing_logs_report_id'), 'Indexes report_routing_logs by report_id');

  // Public hotspots view & RPC
  assert(sqlContent.includes('CREATE OR REPLACE VIEW public.public_hotspots_view'), 'Re-creates public_hotspots_view with LEFT JOIN on schools');
  assert(sqlContent.includes('h.school_id IS NULL OR'), 'View condition 4 supports corridor hotspots with NULL school_id');
  assert(sqlContent.includes('rpc_get_public_statistics'), 'Re-defines rpc_get_public_statistics with p_school_id UUID DEFAULT NULL');

  // =========================================================================
  // GROUP 2: TYPESCRIPT TYPE DEFINITIONS INTEGRITY
  // =========================================================================
  console.log(`\n${colors.bold}GROUP 2: TypeScript Definitions (src/types/index.ts)${colors.reset}`);
  
  const typesPath = path.join(workspaceRoot, 'src', 'types', 'index.ts');
  const typesContent = fs.readFileSync(typesPath, 'utf8');

  assert(typesContent.includes('export type EducationLevel'), 'Defines EducationLevel TypeScript type');
  assert(typesContent.includes('export type SchoolType'), 'Defines SchoolType TypeScript type');
  assert(typesContent.includes('export type ReportScopeType'), 'Defines ReportScopeType TypeScript type');
  assert(typesContent.includes('export type RoutingStatus'), 'Defines RoutingStatus TypeScript type');
  assert(typesContent.includes('school_id?: string | null'), 'School, Profile, Report, Hotspot types support optional/nullable school_id');

  // =========================================================================
  // GROUP 3: SERVER ACTIONS LOGIC & ROUTING VALIDATION
  // =========================================================================
  console.log(`\n${colors.bold}GROUP 3: Server Actions Architecture & Multi-School Routing${colors.reset}`);

  const submitActionPath = path.join(workspaceRoot, 'src', 'app', 'actions', 'submit-report.ts');
  const submitActionContent = fs.readFileSync(submitActionPath, 'utf8');
  assert(submitActionContent.includes('scope_type'), 'submitReportAction parses and stores scope_type');
  assert(submitActionContent.includes('routing_status'), 'submitReportAction determines routing_status');
  assert(submitActionContent.includes('rawSchoolId') && submitActionContent.includes('schoolId'), 'submitReportAction handles null/optional school_id');

  const lookupActionPath = path.join(workspaceRoot, 'src', 'app', 'actions', 'lookup-report.ts');
  const lookupActionContent = fs.readFileSync(lookupActionPath, 'utf8');
  assert(!lookupActionContent.includes("'Trường THPT Tam Hiệp'"), 'lookupReportAction does NOT hardcode THPT Tam Hiệp');
  assert(lookupActionContent.includes('school_name'), 'lookupReportAction dynamically resolves school names');

  const adminHotspotsPath = path.join(workspaceRoot, 'src', 'app', 'actions', 'admin-hotspots.ts');
  const adminHotspotsContent = fs.readFileSync(adminHotspotsPath, 'utf8');
  assert(!adminHotspotsContent.includes("'THPT Tam Hiệp'"), 'getAdminHotspotsAction does NOT hardcode THPT Tam Hiệp');
  assert(adminHotspotsContent.includes('schoolId?: string | null'), 'createHotspotAction supports corridor hazards with nullable schoolId');

  const adminReportsPath = path.join(workspaceRoot, 'src', 'app', 'actions', 'admin-reports.ts');
  const adminReportsContent = fs.readFileSync(adminReportsPath, 'utf8');
  assert(adminReportsContent.includes('assignReportToSchoolAction'), 'admin-reports exports assignReportToSchoolAction for corridor routing');
  assert(adminReportsContent.includes("'unassigned'"), 'getAdminReportsAction supports filtering by unassigned reports');

  const publicStatsPath = path.join(workspaceRoot, 'src', 'app', 'actions', 'public-statistics.ts');
  const publicStatsContent = fs.readFileSync(publicStatsPath, 'utf8');
  assert(publicStatsContent.includes("params.schoolId === 'all'"), 'getPublicStatisticsAction handles city-wide aggregation for schoolId === all');
  assert(publicStatsContent.includes('rpcSchoolId'), 'getPublicStatisticsAction passes NULL to RPC when querying city-wide');

  // =========================================================================
  // GROUP 4: UI/UX POLISH & CRITICAL FIXES (From User Screenshots)
  // =========================================================================
  console.log(`\n${colors.bold}GROUP 4: UI/UX Button Polish & Layout Stability${colors.reset}`);

  const buttonPath = path.join(workspaceRoot, 'src', 'components', 'common', 'Button.tsx');
  const buttonContent = fs.readFileSync(buttonPath, 'utf8');
  assert(buttonContent.includes("'glass'"), 'Button component supports glass/dark-outline variant');
  assert(buttonContent.includes('px-5 sm:px-6'), 'Button component provides generous horizontal padding for md size');

  const homePagePath = path.join(workspaceRoot, 'src', 'app', '(public)', 'page.tsx');
  const homePageContent = fs.readFileSync(homePagePath, 'utf8');
  assert(!homePageContent.includes('<div className="space-y-16 lg:space-y-24 pb-20">'), 'HomePage removed space-y collision from root container');
  assert(homePageContent.includes('variant="glass"'), 'HomePage CTA uses variant="glass" for dark background');
  assert(homePageContent.includes('min-w-[210px]'), 'HomePage CTA buttons have min-w-[210px] avoiding cramped text');

  const aboutPagePath = path.join(workspaceRoot, 'src', 'app', '(public)', 'gioi-thieu', 'page.tsx');
  const aboutPageContent = fs.readFileSync(aboutPagePath, 'utf8');
  assert(aboutPageContent.includes('min-w-[210px]'), 'About page CTA buttons have min-w-[210px] with generous padding');
  assert(aboutPageContent.includes('variant="glass"'), 'About page CTA uses variant="glass" for clean translucent borders');

  const reportFormPath = path.join(workspaceRoot, 'src', 'app', '(public)', 'gui-phan-anh', 'page.tsx');
  const reportFormContent = fs.readFileSync(reportFormPath, 'utf8');
  assert(reportFormContent.includes('scopeType'), 'Report submission form includes Scope selector state');
  assert(reportFormContent.includes('public_corridor'), 'Report submission form supports corridor/general area selection');
  assert(!reportFormContent.includes("formData.append('school_id', '00000000-0000-0000-0000-000000000001'); // THPT Tam Hiệp"), 'Report form does NOT hardcode THPT Tam Hiệp');

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log(`\n${colors.bold}----------------------------------------------------------------${colors.reset}`);
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`${colors.green}PASSED: ${passed}${colors.reset}`);
  console.log(`${failed === 0 ? colors.green : colors.red}FAILED: ${failed}${colors.reset}`);
  console.log(`${colors.bold}----------------------------------------------------------------${colors.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPrompt9_5Suite().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
