import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, isUserAdmin } from '../lib/supabase-admin';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  console.log('--- delete-user API hívás érkezett ---');
  try {
    if (req.method !== 'POST') {
      console.warn('Rossz metódus:', req.method);
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { targetUserId } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      console.warn('Admin check hiba: Nincs token');
      return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }

    console.log('Admin check indítása...');
    const adminCheckResult = await isUserAdmin(token);
    console.log('Admin check eredmény:', adminCheckResult);

    if (typeof adminCheckResult === 'string') {
      console.warn('Admin check hiba:', adminCheckResult);
      return res.status(401).json({ error: `Unauthorized: Admin check failed. Reason: ${adminCheckResult}` });
    }

    if (adminCheckResult === false) {
      console.warn('Admin check hiba: A felhasználó nem admin');
      return res.status(401).json({ error: 'Unauthorized: Csak admin végezheti el ezt a műveletet.' });
    }

    console.log('Admin check sikeres, törlés indítása...');
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (error) {
      console.error('Törlés hiba:', error.message);
      throw error;
    }

    console.log('Törlés sikeres');
    return res.status(200).json({ success: true, deletedUser: data });

  } catch (err) {
    const error = err as Error;
    console.error('delete-user GLOBÁLIS HIBA:', error.message);
    return res.status(500).json({
      error: "A server error occurred inside the delete-user handler",
      message: error.message
    });
  }
}