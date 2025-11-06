import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, isUserAdmin } from '../lib/supabase-admin'; // Kiterjesztés nélkül

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // JAVÍTÁS: Az egész funkciót egy try...catch blokkba tesszük
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { targetUserId } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }

    // --- JAVÍTOTT BIZTONSÁGI ELLENŐRZÉS ---
    const adminCheckResult = await isUserAdmin(token);

    if (typeof adminCheckResult === 'string') {
      // Ha az isUserAdmin stringet (hibaüzenetet) adott vissza
      return res.status(401).json({ error: `Unauthorized: Admin check failed. Reason: ${adminCheckResult}` });
    }

    if (adminCheckResult === false) {
      // Ha false-t adott vissza (nem admin)
      return res.status(401).json({ error: 'Unauthorized: Csak admin végezheti el ezt a műveletet.' });
    }
    // --- ELLENŐRZÉS VÉGE ---

    if (!targetUserId) {
      return res.status(400).json({ error: 'Hiányzó adat (targetUserId).' });
    }

    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (error) {
      throw error; // Ezt elkapja a külső catch blokk
    }

    return res.status(200).json({ success: true, deletedUser: data });

  } catch (err) {
    // JAVÍTÁS: Ez az új, mindent elkapó hibakezelő
    const error = err as Error;
    return res.status(500).json({
      error: "A server error occurred inside the delete-user handler",
      message: error.message
    });
  }
}