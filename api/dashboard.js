import { db } from "hatchable";

export const access = "public";
export const methods = ["GET"];

export default async function (req, res) {
  const { rows: overview } = await db.query(`
    SELECT
      (SELECT count(*)::int FROM profiles WHERE role='donor' AND available=true) AS available_donors,
      (SELECT count(*)::int FROM blood_requests WHERE status IN ('Open','In Progress')) AS active_requests,
      (SELECT COALESCE(sum(units),0)::int FROM inventory WHERE status <> 'Unavailable') AS total_units,
      (SELECT count(*)::int FROM donations WHERE status='Completed') AS completed_donations,
      (SELECT count(*)::int FROM camps WHERE status='Open' AND camp_date >= CURRENT_DATE) AS upcoming_camps
  `);
  const { rows: inventory } = await db.query(`SELECT id, facility, city, blood_group, units, status, updated_at FROM inventory ORDER BY units ASC, blood_group ASC LIMIT 50`);
  const { rows: requests } = await db.query(`SELECT id, requester_name, blood_group, units, facility, city, urgency, status, created_at FROM blood_requests ORDER BY created_at DESC LIMIT 10`);
  const { rows: donations } = await db.query(`SELECT id, donor_name, blood_group, units, facility, city, donation_date, status FROM donations ORDER BY donation_date DESC, created_at DESC LIMIT 8`);
  const { rows: camps } = await db.query(`SELECT id, name, facility, city, camp_date, start_time, end_time, capacity, booked, status FROM camps WHERE camp_date >= CURRENT_DATE ORDER BY camp_date ASC LIMIT 8`);
  res.json({ overview: overview[0], inventory, requests, donations, camps });
}