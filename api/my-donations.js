import { db } from 'hatchable';
export const access='user';
export const methods=['GET'];
export default async function(req,res){
  const name=req.user.name||req.user.email;
  const {rows}=await db.query(`SELECT id,donor_name,blood_group,units,facility,city,donation_date,status FROM donations WHERE donor_name=$1 OR donor_email=$2 ORDER BY donation_date DESC LIMIT 30`,[name,req.user.email]);
  res.json(rows);
}