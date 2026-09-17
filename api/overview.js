import { db } from 'hatchable';
export const access = "public";
export const methods = ["GET"];
export default async function(req,res){const a=await db.query("SELECT COUNT(*)::int AS n FROM blood_requests WHERE status='Open'");const p=await db.query("SELECT COUNT(*)::int AS n FROM profiles WHERE role='donor' AND available=true");const i=await db.query("SELECT COALESCE(SUM(units),0)::int AS n FROM inventory");res.json({openRequests:a.rows[0].n,availableDonors:p.rows[0].n,totalUnits:i.rows[0].n});}