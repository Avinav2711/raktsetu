import { db } from 'hatchable';
export const access='user';
export const methods=['GET','POST'];
export default async function(req,res){
  const uid=req.user.id;
  if(req.method==='GET'){
    const {rows}=await db.query(`SELECT id, requester_name, blood_group, units, facility, city, urgency, status, created_at FROM blood_requests WHERE requester_name=$1 ORDER BY created_at DESC LIMIT 30`,[req.user.name||req.user.email]);
    return res.json(rows);
  }
  const b=req.body||{};
  if(!b.bloodGroup||!b.facility||!b.city)return res.status(400).json({error:'Blood group, facility and city are required.'});
  const urgency=b.urgency||'Urgent';
  const units=Math.max(1,Number(b.units||1));
  const {rows}=await db.query(`INSERT INTO blood_requests (requester_name,blood_group,units,facility,city,urgency,status) VALUES ($1,$2,$3,$4,$5,$6,'Open') RETURNING *`,[req.user.name||req.user.email,b.bloodGroup,units,b.facility,b.city,urgency]);
  const request=rows[0];
  await db.query(`INSERT INTO user_notifications (user_id,title,body,type) VALUES ($1,'Blood request created',$2,'request')`,[uid,urgency==='Critical'?'Your Emergency SOS request is now live. Compatible available donors in the area have been alerted.':'Your blood request has been added to the coordination queue.']);
  if(urgency==='Critical'){
    const compatible={'O-':['O-'],'O+':['O-','O+'],'A-':['O-','A-'],'A+':['O-','O+','A-','A+'],'B-':['O-','B-'],'B+':['O-','O+','B-','B+'],'AB-':['O-','A-','B-','AB-'],'AB+':['O-','O+','A-','A+','B-','B+','AB-','AB+']}[b.bloodGroup]||[b.bloodGroup];
    const {rows:donors}=await db.query(`SELECT user_id,name,email,blood_group,city FROM user_profiles WHERE role='donor' AND available=true AND blood_group=ANY($1)`,[compatible]);
    for(const donor of donors){
      await db.query(`INSERT INTO blood_request_alerts (request_id,donor_user_id) VALUES ($1,$2) ON CONFLICT (request_id,donor_user_id) DO NOTHING`,[request.id,donor.user_id]);
      await db.query(`INSERT INTO user_notifications (user_id,title,body,type) SELECT $1,$2,$3,'emergency' WHERE NOT EXISTS (SELECT 1 FROM user_notifications WHERE user_id=$1 AND title=$2 AND body=$3)`,[donor.user_id,'Emergency SOS blood request',`${b.bloodGroup} • ${units} unit(s) needed at ${b.facility}, ${b.city}. Please respond if you can donate.`]);
    }
  }
  res.status(201).json({...request,alertedDonors:urgency==='Critical'?true:false});
}