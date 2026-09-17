import { db } from 'hatchable';
export const access = "public";
export const methods = ["GET","POST"];
export default async function(req,res){
 if(req.method==='GET'){
  const {rows}=await db.query("SELECT id,requester_name,blood_group,units,facility,city,urgency,status,created_at FROM blood_requests ORDER BY created_at DESC LIMIT 20");
  return res.json({requests:rows});
 }
 const b=req.body||{};
 if(!b.requesterName||!b.bloodGroup||!b.facility||!b.city)return res.status(400).json({error:'Name, blood group, facility and city are required'});
 const {rows}=await db.query("INSERT INTO blood_requests (requester_name,blood_group,units,facility,city,urgency) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,requester_name,blood_group,units,facility,city,urgency,status,created_at",[b.requesterName,b.bloodGroup,Number(b.units)||1,b.facility,b.city,b.urgency||'Urgent']);
 return res.status(201).json({request:rows[0]});
}