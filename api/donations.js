import { db } from "hatchable";

export const access = "public";
export const methods = ["GET", "POST"];

export default async function (req, res) {
  if (req.method === 'GET') {
    const { rows } = await db.query(`SELECT id, donor_name, donor_email, blood_group, units, facility, city, donation_date, status FROM donations ORDER BY donation_date DESC, created_at DESC LIMIT 50`);
    return res.json(rows);
  }
  const b = req.body || {};
  if (!b.donorName || !b.bloodGroup || !b.facility || !b.city) return res.status(400).json({ error: 'Donor name, blood group, facility and city are required.' });
  const units = Math.max(1, Number(b.units || 1));
  const { rows } = await db.query(`INSERT INTO donations (donor_name, donor_email, blood_group, units, facility, city, donation_date, status) VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7::date,CURRENT_DATE),'Completed') RETURNING *`, [b.donorName, b.donorEmail || null, b.bloodGroup, units, b.facility, b.city, b.donationDate || null]);
  res.status(201).json(rows[0]);
}