import { createClient } from '@supabase/supabase-js';

// Kiemeljük a változókat, hogy egyértelmű legyen
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// 1. Admin kliens (SERVICE_KEY)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      Authorization: `Bearer ${supabaseServiceKey}`
    }
  }
});

// 2. Közös segédfüggvény
// JAVÍTÁS: A visszatérési érték már lehet string (hibaüzenet) is
export const isUserAdmin = async (token: string): Promise<boolean | string> => {
  try {
    // 1. Kinyerjük a felhasználót a tokenből
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError) {
      return `auth.getUser error: ${userError.message}`; // Hiba visszaküldése
    }
    if (!user) {
      return "No user found for token"; // Hiba visszaküldése
    }

    // 2. Lekérjük a profilját és ellenőrizzük a rangját
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // VALÓSZÍNŰLEG ITT A HIBA (pl. RLS blokkolja a select-et)
      return `profiles.select error: ${profileError.message}`; // Hiba visszaküldése
    }

    // Ha minden sikeres, visszatérünk a logikai értékkel
    return profile && profile.role === 'lead_detective';

  } catch (e: any) {
    return `isUserAdmin global catch block: ${e.message}`; // Hiba visszaküldése
  }
};