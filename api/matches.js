import { db } from 'hatchable';
export const access = 'user';
export const methods = ['GET'];

const compatible = {
  'O-':['O-'], 'O+':['O-','O+'],
  'A-':['O-','A-'], 'A+':['O-','O+','A-','A+'],
  'B-':['O-','B-'], 'B+':['O-','O+','B-','B+'],
  'AB-':['O-','A-','B-','AB-'], 'AB+':['O-','O+','A-','A+','B-','B+','AB-','AB+']
};

export default async function(req,res){
  const id=req.query?.requestId;
  if(!id) return res.status(400).json({error:'requestId is required.'});
  const r=await db.query(`SELECT id,blood_group,units,facility,city,urgency,status FROM blood_requests WHERE id=$1`,[id]);
  if(!r.rows[0]) return res.status(404).json({error:'Request not found.'});
  const x=r.rows[0];
  const groups=compatible[x.blood_group]||[x.blood_group];
  const d=await db.query(`SELECT id,name,email,blood_group,city,available FROM profiles WHERE role='donor' AND available=true AND blood_group=ANY($1) ORDER BY CASE WHEN blood_group=$2 THEN 0 ELSE 1 END,CASE WHEN lower(city)=lower($3) THEN 0 ELSE 1 END,name LIMIT 50`,[groups,x.blood_group,x.city]);
  res.json({request:x,compatibleBloodGroups:groups,matches:d.rows});
}