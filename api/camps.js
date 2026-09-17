import { db } from "hatchable";

export const access = "public";
export const methods = ["GET", "POST"];

export default async function (req, res) {
  if (req.method === 'GET') {
    const { rows } = await db.query(`SELECT id, name, facility, city, camp_date, start_time, end_time, capacity, booked, status, GREATEST(capacity-booked,0)::int AS slots_remaining FROM camps WHERE camp_date >= CURRENT_DATE ORDER BY camp_date ASC LIMIT 50`);
    return res.json(rows);
  }
  const b = req.body || {};
  if (!b.donorName || !b.campId || !b.appointmentDate) return res.status(400).json({ error: 'Donor name, camp and appointment date are required.' });
  const { rows: camp } = await db.query(`SELECT id, capacity, booked FROM camps WHERE id=$1`, [b.campId]);
  if (!camp.length) return res.status(404).json({ error: 'Camp not found.' });
  if (camp[0].booked >= camp[0].capacity) return res.status(409).json({ error: 'This camp is full.' });
  const result = await db.transaction([
    { sql: `INSERT INTO appointments (donor_name, donor_email, camp_id, appointment_date, status) VALUES ($1,$2,$3,$4,'Booked') RETURNING *`, params: [b.donorName, b.donorEmail || null, b.campId, b.appointmentDate] },
    { sql: `UPDATE camps SET booked=booked+1 WHERE id=$1 RETURNING id, booked, capacity`, params: [b.campId] }
  ]);
  res.status(201).json({ appointment: result.results[0].rows[0], camp: result.results[1].rows[0] });
}