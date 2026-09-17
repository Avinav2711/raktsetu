import { auth, db } from 'hatchable';
export const access='user';
export const methods=['GET','POST'];
export default async function(req,res){
  const user=req.user||await auth.getUser(req); if(!user)return res.status(401).json({error:'Login required.'});
  const {rows:p}=await db.query('SELECT role,city FROM user_profiles WHERE user_id=$1',[user.id]);
  if(!p[0]||!['hospital','blood_bank'].includes(p[0].role))return res.status(403).json({error:'Only hospital or blood bank operators can manage inventory.'});
  if(req.method==='GET'){
    const {rows}=await db.query('SELECT id,facility,city,blood_group,units,status,updated_at FROM inventory ORDER BY city,facility,blood_group');
    const {rows:t}=await db.query('SELECT it.id,it.inventory_id,it.action,it.units_change,it.previous_units,it.new_units,it.reason,it.created_at,i.facility,i.city,i.blood_group FROM inventory_transactions it JOIN inventory i ON i.id=it.inventory_id ORDER BY it.created_at DESC LIMIT 50');
    return res.json({inventory:rows,transactions:t});
  }
  const b=req.body||{}; const action=b.action; const id=b.inventoryId;
  if(!['add','remove','adjust','status'].includes(action))return res.status(400).json({error:'A valid inventory action is required.'});
  if(action==='add'&&!id){
    const facility=String(b.facility||'').trim(), city=String(b.city||'').trim(), bloodGroup=String(b.bloodGroup||'').trim();
    const units=Number(b.units);
    if(!facility||!city||!bloodGroup||!Number.isInteger(units)||units<1)return res.status(400).json({error:'Facility, city, blood group and positive whole-number units are required.'});
    const existing=await db.query('SELECT id,units FROM inventory WHERE facility=$1 AND city=$2 AND blood_group=$3 LIMIT 1',[facility,city,bloodGroup]);
    if(existing.rows[0]){
      const item=existing.rows[0];
      const next=item.units+units;
      const tx=await db.transaction([{sql:'UPDATE inventory SET units=$1,status=$2,updated_at=now() WHERE id=$3 AND units=$4 RETURNING *',params:[next,next>5?'Available':'Critical',item.id,item.units]},{sql:'INSERT INTO inventory_transactions (inventory_id,action,units_change,previous_units,new_units,reason,actor_user_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',params:[item.id,'add',units,item.units,next,b.reason||'Stock added',user.id]}]);
      if(!tx.results?.[0]?.rows?.[0])return res.status(409).json({error:'Inventory changed. Please refresh and try again.'});
      return res.json({success:true,inventory:tx.results[0].rows[0],message:'Inventory updated successfully.'});
    }
    const inserted=await db.query('INSERT INTO inventory (facility,city,blood_group,units,status) VALUES ($1,$2,$3,$4,$5) RETURNING *',[facility,city,bloodGroup,units,units>5?'Available':'Critical']);
    const created=inserted.rows[0];
    if(!created)return res.status(500).json({error:'Could not create inventory record.'});
    await db.query('INSERT INTO inventory_transactions (inventory_id,action,units_change,previous_units,new_units,reason,actor_user_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',[created.id,'add',units,0,units,b.reason||'Stock added',user.id]);
    return res.status(201).json({success:true,inventory:created,message:'Inventory line created successfully.'});
  }
  if(!id)return res.status(400).json({error:'Inventory ID is required for this action.'});
  const {rows}=await db.query('SELECT id,facility,city,blood_group,units,status FROM inventory WHERE id=$1',[id]); if(!rows[0])return res.status(404).json({error:'Inventory record not found.'});
  const item=rows[0]; let next=item.units, change=0, nextStatus=item.status;
  if(action==='add'||action==='remove'){const n=Number(b.units);if(!Number.isInteger(n)||n<1)return res.status(400).json({error:'Units must be a positive whole number.'});change=action==='add'?n:-n;next=item.units+change;if(next<0)return res.status(409).json({error:'Cannot remove more units than are available.'});nextStatus=next===0?'Out of stock':next<=5?'Critical':'Available';}
  if(action==='adjust'){const n=Number(b.units);if(!Number.isInteger(n)||n<0)return res.status(400).json({error:'New stock level must be a non-negative whole number.'});next=n;change=next-item.units;nextStatus=next===0?'Out of stock':next<=5?'Critical':'Available';}
  if(action==='status'){if(!['Available','Low stock','Critical','Out of stock','Expired'].includes(b.status))return res.status(400).json({error:'Invalid inventory status.'});nextStatus=b.status;}
  const result=await db.transaction([{sql:'UPDATE inventory SET units=$1,status=$2,updated_at=now() WHERE id=$3 AND units=$4 RETURNING *',params:[next,nextStatus,id,item.units]},{sql:'INSERT INTO inventory_transactions (inventory_id,action,units_change,previous_units,new_units,reason,actor_user_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',params:[id,action,change,item.units,next,b.reason||null,user.id]}]);
  if(!result.results?.[0]?.rows?.[0])return res.status(409).json({error:'Inventory changed by another operation. Please refresh and try again.'});
  return res.json({success:true,inventory:result.results[0].rows[0],message:'Inventory updated successfully.'});
}