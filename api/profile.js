import { db } from "hatchable";

export const access = "public";
export const methods = ["GET", "PATCH"];

export default async function (req, res) {
  const email = req.query?.email;
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  if (req.method === 'GET') {
    const { rows } = await db.query(`SELECT id, name, email, role, blood_group, city, available, created_at FROM profiles WHERE lower(email)=lower($1) LIMIT 1`, [email]);
    return res.json(rows[0] || null);
  }
  const b = req.body || {};
  const { rows } = await db.query(`UPDATE profiles SET name=COALESCE($1,name), blood_group=COALESCE($2,blood_group), city=COALESCE($3,city), available=COALESCE($4,available) WHERE lower(email)=lower($5) RETURNING id, name, email, role, blood_group, city, available`, [b.name || null, b.bloodGroup || null, b.city || null, typeof b.available === 'boolean' ? b.available : null, email]);
  if (!rows.length) return res.status(404).json({ error: 'Profile not found.' });
  res.json(rows[0]);
}