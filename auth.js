// ============================================================
// auth.js — Supabase authentication helpers
// ============================================================

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const Auth = (() => {

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async function getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  // Fetch the app_profiles row for the current user
  async function getProfile(userId) {
    const { data, error } = await supabase
      .from('app_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  }

  return { signIn, signOut, getSession, getProfile };
})();
