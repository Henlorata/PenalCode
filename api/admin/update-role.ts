import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// --- INLINE SETUP ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // Az új struktúrának megfelelő paraméterek
    const { userId, system_role, faction_rank, division } = req.body;

    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    // Update objektum összeállítása dinamikusan
    const updates: any = {};
    if (system_role) updates.system_role = system_role;
    if (faction_rank) updates.faction_rank = faction_rank;
    if (division) updates.division = division;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update provided.' });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;

    return res.status(200).json({ success: true });

  } catch (err) {
    const error = err as Error;
    console.error("Update error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}