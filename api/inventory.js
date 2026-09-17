import { db } from 'hatchable';
export const access = "public";
export const methods = ["GET"];
export default async function(req,res){const {rows}=await db.query("SELECT id,facility,city,blood_group,units,status,updated_at FROM inventory ORDER BY units ASC, facility LIMIT 100");res.json({inventory:rows});}