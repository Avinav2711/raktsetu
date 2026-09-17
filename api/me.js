import { auth, db } from 'hatchable';

export const access = 'user';
export const methods = ['GET', 'PATCH'];

export default async function (req, res) {
  const user = req.user || await auth.getUser(req);
  if (!user) return res.status(401).json({ error: 'Login required.' });
  if (req.method === 'GET') {
    const { rows } = await db.query(`SELECT user_id, name, email, role, blood_group, city, available FROM user_profiles WHERE user_id=$1`, [user.id]);
    return res.json(rows[0] || { user_id:user.id, name:user.name || '', email:user.email || '', role:'donor', blood_group:null, city:null, available:true });
  }
  const b=req.body||{};
  const { rows }=await db.query(`INSERT INTO user_profiles (user_id,name,email,role,blood_group,city,available) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (user_id) DO UPDATE SET name=EXCLUDED.name,email=EXCLUDED.email,role=EXCLUDED.role,blood_group=EXCLUDED.blood_group,city=EXCLUDED.city,available=EXCLUDED.available,updated_at=now() RETURNING user_id,name,email,role,blood_group,city,available`, [user.id,b.name||user.name||'',user.email||b.email||'',b.role||'donor',b.bloodGroup||null,b.city||null,typeof b.available==='boolean'?b.available:true]);
  res.json(rows[0]);
}