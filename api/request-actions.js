import { auth, db } from 'hatchable';
export const access='user';
export const methods=['GET','POST'];

const compatible={
  'O-':['O-'],'O+':['O-','O+'],'A-':['O-','A-'],'A+':['O-','O+','A-','A+'],
  'B-':['O-','B-'],'B+':['O-','O+','B-','B+'],'AB-':['O-','A-','B-','AB-'],
  'AB+':['O-','O+','A-','A+','B-','B+','AB-','AB+']
};

export default async function(req,res){
  const user=req.user||await auth.getUser(req);
  if(!user)return res.status(401).json({error:'Login required.'});
  const {rows:up}=await db.query('SELECT user_id,name,email,role,blood_group,city,available FROM user_profiles WHERE user_id=$1',[user.id]);
  const profile=up[0]||{};
  const requestId=req.query?.requestId;

  if(req.method==='GET'){
    if(requestId){
      const {rows:reqs}=await db.query('SELECT id,requester_name,blood_group,units,facility,city,urgency,status,created_at FROM blood_requests WHERE id=$1',[requestId]);
      if(!reqs[0])return res.status(404).json({error:'Request not found.'});
      const r=reqs[0];
      const owner=r.requester_name===profile.name||r.requester_name===profile.email;
      const {rows:responses}=await db.query(`SELECT dr.id,dr.status,dr.created_at,dr.updated_at,up.user_id,up.name,up.email,up.blood_group,up.city FROM donor_responses dr JOIN user_profiles up ON up.user_id=dr.donor_user_id WHERE dr.request_id=$1 ORDER BY dr.created_at DESC`,[requestId]);
      if(!owner&&!responses.some(x=>x.user_id===user.id))return res.status(403).json({error:'You cannot view this request.'});
      const {rows:fulfillments}=await db.query('SELECT id,inventory_id,units,facility,city,fulfilled_at FROM blood_request_fulfillments WHERE request_id=$1',[requestId]);
      return res.json({request:r,responses,fulfillment:fulfillments[0]||null});
    }
    if(profile.role==='donor'&&profile.blood_group){
      const groups=compatible[profile.blood_group]||[profile.blood_group];
      const {rows}=await db.query(`SELECT br.id,br.requester_name,br.blood_group,br.units,br.facility,br.city,br.urgency,br.status,br.created_at,dr.status AS response_status FROM blood_requests br LEFT JOIN donor_responses dr ON dr.request_id=br.id AND dr.donor_user_id=$1 WHERE br.status IN ('Open','Donor Accepted','Donor Contacted') AND br.blood_group=ANY($2) ORDER BY CASE WHEN br.urgency='Critical' THEN 0 WHEN br.urgency='Urgent' THEN 1 ELSE 2 END,CASE WHEN lower(br.city)=lower($3) THEN 0 ELSE 1 END,CASE WHEN br.blood_group=$4 THEN 0 ELSE 1 END,br.created_at DESC LIMIT 30`,[user.id,groups,profile.city||'',profile.blood_group]);
      return res.json({requests:rows,compatibleBloodGroups:groups});
    }
    return res.json({requests:[]});
  }

  const b=req.body||{};
  if(!b.requestId||!b.action)return res.status(400).json({error:'Request ID and action are required.'});
  const {rows:reqs}=await db.query('SELECT id,requester_name,blood_group,units,facility,city,status FROM blood_requests WHERE id=$1',[b.requestId]);
  if(!reqs[0])return res.status(404).json({error:'Request not found.'});
  const r=reqs[0];
  const owner=r.requester_name===profile.name||r.requester_name===profile.email;

  if(['accept','decline'].includes(b.action)){
    if(profile.role!=='donor'||!profile.available)return res.status(403).json({error:'Only an available donor can respond.'});
    const groups=compatible[r.blood_group]||[r.blood_group];
    if(!groups.includes(profile.blood_group))return res.status(403).json({error:'Your blood group is not compatible with this request.'});
    const status=b.action==='accept'?'Accepted':'Declined';
    const {rows}=await db.query(`INSERT INTO donor_responses (request_id,donor_user_id,status) VALUES ($1,$2,$3) ON CONFLICT (request_id,donor_user_id) DO UPDATE SET status=EXCLUDED.status,updated_at=now() RETURNING *`,[b.requestId,user.id,status]);
    if(status==='Accepted'){
      await db.query(`UPDATE blood_requests SET status='Donor Accepted' WHERE id=$1 AND status='Open'`,[b.requestId]);
      const {rows:requesters}=await db.query('SELECT user_id FROM user_profiles WHERE name=$1 OR email=$1 LIMIT 1',[r.requester_name]);
      if(requesters[0])await db.query(`INSERT INTO user_notifications (user_id,title,body,type) VALUES ($1,'Donor accepted your request',$2,'request')`,[requesters[0].user_id,`${profile.name||profile.email} has accepted your ${r.blood_group} blood request.`]);
    }
    return res.json({response:rows[0],message:status==='Accepted'?'Thank you for responding. The requester has been notified.':'Response recorded.'});
  }

  if(['contacted','fulfilled','cancelled'].includes(b.action)){
    if(!owner)return res.status(403).json({error:'Only the requester can update this request.'});
    const next={contacted:'Donor Contacted',fulfilled:'Fulfilled',cancelled:'Cancelled'}[b.action];
    if(b.action==='fulfilled'){
      if(r.status==='Fulfilled')return res.status(409).json({error:'This request is already fulfilled.'});
      if(!['Donor Accepted','Donor Contacted'].includes(r.status))return res.status(400).json({error:'A donor must accept the request before it can be fulfilled.'});
      const {rows:stock}=await db.query('SELECT id,facility,city,units FROM inventory WHERE blood_group=$1 AND units >= $2 AND status=$3 ORDER BY CASE WHEN city=$4 THEN 0 ELSE 1 END,CASE WHEN facility=$5 THEN 0 ELSE 1 END,units ASC LIMIT 1',[r.blood_group,r.units,'Available',r.city,r.facility]);
      if(!stock[0])return res.status(409).json({error:'Not enough inventory is available for this request.'});
      const s=stock[0];
      const tx=await db.transaction([
        {sql:'UPDATE inventory SET units=units-$1,status=CASE WHEN units-$1=0 THEN $2 ELSE $3 END,updated_at=now() WHERE id=$4 AND units >= $1',params:[r.units,'Out of Stock','Available',s.id]},
        {sql:'UPDATE blood_requests SET status=$1 WHERE id=$2 AND status IN ($3,$4)',params:['Fulfilled',b.requestId,'Donor Accepted','Donor Contacted']},
        {sql:'INSERT INTO blood_request_fulfillments (request_id,inventory_id,units,facility,city) VALUES ($1,$2,$3,$4,$5) RETURNING *',params:[b.requestId,s.id,r.units,s.facility,s.city]}
      ]);
      if(!tx.results?.[2]?.rows?.[0])return res.status(409).json({error:'The request could not be fulfilled. Please refresh and try again.'});
      if(b.responseId)await db.query('UPDATE donor_responses SET status=$1,updated_at=now() WHERE id=$2 AND request_id=$3',['Fulfilled',b.responseId,b.requestId]);
      return res.json({success:true,status:'Fulfilled',fulfillment:tx.results[2].rows[0],message:`Request fulfilled using ${r.units} unit(s) from ${s.facility}, ${s.city}.`});
    }
    await db.query('UPDATE blood_requests SET status=$1 WHERE id=$2',[next,b.requestId]);
    if(b.responseId){
      await db.query(`UPDATE donor_responses SET status=$1,updated_at=now() WHERE id=$2 AND request_id=$3`,[next,b.responseId,b.requestId]);
      const {rows:donors}=await db.query(`SELECT donor_user_id FROM donor_responses WHERE id=$1 AND request_id=$2`,[b.responseId,b.requestId]);
      if(donors[0])await db.query(`INSERT INTO user_notifications (user_id,title,body,type) VALUES ($1,$2,$3,'request')`,[donors[0].donor_user_id,'Blood request update',`Your response is now marked ${next}.`]);
    }
    return res.json({success:true,status:next});
  }
  return res.status(400).json({error:'Unsupported action.'});
}