// =============================================================================
// RANKION - SUPABASE CLIENT CONFIGURATION
// Auto-configured with your active Supabase PostgreSQL Cloud project
// =============================================================================

window.RANKION_CONFIG = window.RANKION_CONFIG || {};

window.RANKION_CONFIG.SUPABASE_URL = "https://gmdowmppcvljuybfbqfu.supabase.co";
window.RANKION_CONFIG.SUPABASE_ANON_KEY = "sb_publishable_QVgCfS7KCCFYMl_F7ON6yQ_FU9OtdWI";

// Also cache in localStorage for instant access
try {
  localStorage.setItem('rankion_supabase_url', window.RANKION_CONFIG.SUPABASE_URL);
  localStorage.setItem('rankion_supabase_anon_key', window.RANKION_CONFIG.SUPABASE_ANON_KEY);
} catch (e) {}
