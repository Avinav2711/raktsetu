import { auth, db } from 'hatchable';
export const access='user';
export const methods=['GET'];
export default async function(req,res){
  const user=req.user||await auth.getUser(req);
  if(!user)return res.status(401).json({error:'Login required.'});
  const {rows:p}=await db.query('SELECT role FROM user_profiles WHERE user_id=$1',[user.id]);
  if(!p[0]||!['requester','hospital','blood_bank'].includes(p[0].role))return res.status(403).json({error:'Donor discovery is available to requesters and operators.'});
  const q=String(req.query?.q||'').trim();
  const blood=String(req.query?.bloodGroup||'').trim();
  const city=String(req.query?.city||'').trim();
  const params=[]; const where=["role='donor'","available=true"];
  if(blood){params.push(blood);where.push(`blood_group=$${params.length}`)}
  if(city){params.push(city);where.push(`lower(city)=lower($${params.length})`)}
  if(q){params.push(`%${q}%`);where.push(`(name ILIKE $${params.length} OR city ILIKE $${params.length})`)}
  const orderParam=params.length+1; params.push(blood||'');
  const {rows}=await db.query(`SELECT id,name,blood_group,city,available FROM profiles WHERE ${where.join(' AND ')} ORDER BY CASE WHEN blood_group=$${orderParam} THEN 0 ELSE 1 END,lower(city),lower(name) LIMIT 100`,params);
  return res.json({donors:rows});
}