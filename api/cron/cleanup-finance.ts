import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Setup
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Biztonsági ellenőrzés: Csak POST kérést fogadunk (vagy lehetne API kulcsot kérni)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Dátum kiszámítása (40 napnál régebbi)
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 40);
    const thresholdISO = thresholdDate.toISOString();

    console.log(`Tisztítás indítása: ${thresholdISO} előtti elemek törlése.`);

    // 2. Régi, lezárt kérelmek keresése
    const { data: oldRequests, error: fetchError } = await supabaseAdmin
      .from('budget_requests')
      .select('id, proof_image_path')
      .neq('status', 'pending') // Csak a lezártakat (approved/rejected)
      .lt('created_at', thresholdISO); // Less Than (kisebb mint) dátum

    if (fetchError) throw fetchError;

    if (!oldRequests || oldRequests.length === 0) {
      return res.status(200).json({ message: "Nincs törlendő régi elem.", deletedCount: 0 });
    }

    // 3. Fájlok törlése a Storage-ből
    const filePaths = oldRequests.map(req => req.proof_image_path);

    if (filePaths.length > 0) {
      const { error: storageError } = await supabaseAdmin
        .storage
        .from('finance_proofs')
        .remove(filePaths);

      if (storageError) console.error("Storage törlési hiba:", storageError);
    }

    // 4. Rekordok törlése az Adatbázisból
    const idsToDelete = oldRequests.map(req => req.id);
    const { error: deleteError } = await supabaseAdmin
      .from('budget_requests')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) throw deleteError;

    return res.status(200).json({
      success: true,
      message: `${idsToDelete.length} régi kérelem és a hozzájuk tartozó képek törölve.`,
      deletedCount: idsToDelete.length
    });

  } catch (err) {
    const error = err as Error;
    console.error("Cleanup hiba:", error.message);
    return res.status(500).json({ error: error.message });
  }
}