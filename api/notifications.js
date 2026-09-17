import { db } from 'hatchable';
export const access='user';
export const methods=['GET','PATCH'];
export default async function(req,res){
  if(req.method==='PATCH'){
    await db.query(`UPDATE user_notifications SET read=true WHERE user_id=$1`,[req.user.id]);
    return res.json({ok:true});
  }
  const {rows}=await db.query(`SELECT id,title,body,type,read,created_at FROM user_notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30`,[req.user.id]);
  res.json(rows);
}