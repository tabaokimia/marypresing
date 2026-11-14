// ============================================================
//  CONFIGURATION DE MARY'S SERVICE PRESSING (à remplir une seule fois)
//  1) Créez un projet gratuit sur https://supabase.com
//  2) Collez ci-dessous l'adresse du projet et la clé « anon public »
//     (Supabase > Project Settings > API)
//  Laisser vide = mode « un seul appareil » (rien n'est partagé en ligne)
// ============================================================
const SUPABASE_URL = "https://owhbfttesoqgplmfwdtv.supabase.co";   // ← collez ici l'adresse de VOTRE NOUVEAU projet Supabase (https://xxxx.supabase.co)
const SUPABASE_KEY = "sb_publishable_2EMfiaTiGoWQPkAurP1YbQ_zzK1Dvxl";   // ← collez ici la clé « publishable » (sb_publishable_...) — JAMAIS la clé « secret »
const ADMIN_EMAIL  = "maryservice242@gmail.com";   // e-mail de l'administrateur (celui de la caisse) : doit être identique dans supabase_setup.sql

// ---- Petit client Supabase (ne pas modifier) ----
const SB=(()=>{const U=String(SUPABASE_URL).replace(/\/+$/,''),K=SUPABASE_KEY,enabled=!!(U&&K);
 const hdr=t=>t?{apikey:K,Authorization:'Bearer '+t}:(String(K).startsWith('sb_')?{apikey:K}:{apikey:K,Authorization:'Bearer '+K});
 const get=s=>{try{return JSON.parse(localStorage.getItem('sb_'+s)||'null')}catch(e){return null}},set=(s,v)=>{try{v?localStorage.setItem('sb_'+s,JSON.stringify(v)):localStorage.removeItem('sb_'+s)}catch(e){}};
 async function http(url,opt){let r;try{r=await fetch(url,opt)}catch(e){throw new Error('Pas de connexion internet')}const txt=await r.text();let j=null;try{j=txt?JSON.parse(txt):null}catch(e){}
  if(!r.ok){const m=(j&&(j.message||j.msg||j.error_description||j.error))||('Erreur '+r.status);const er=new Error(m);er.status=r.status;throw er}return j}
 function save(slot,j){const s={access:j.access_token,refresh:j.refresh_token,exp:Date.now()+(j.expires_in||3600)*1000-30000,email:(j.user&&j.user.email)||'',uid:(j.user&&j.user.id)||''};set(slot,s);return s}
 async function login(slot,email,password){const j=await http(U+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:K,'Content-Type':'application/json'},body:JSON.stringify({email,password})});return save(slot,j)}
 async function token(slot){const s=get(slot);if(!s)return null;if(Date.now()<s.exp)return s.access;
  try{const j=await http(U+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:K,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh})});return save(slot,j).access}catch(e){if(e.status)set(slot,null);return null}}
 async function req(slot,method,path,body,extra){const t=slot?await token(slot):null;if(slot&&!t)throw new Error('Session expirée : reconnectez-vous.');
  const h=Object.assign(hdr(t),body!==undefined?{'Content-Type':'application/json'}:{},extra||{});
  return http(U+'/rest/v1/'+path,{method,headers:h,body:body!==undefined?JSON.stringify(body):undefined})}
 return{enabled,login,logout:s=>set(s,null),session:s=>get(s),token,req,
  rpc:(name,args)=>http(U+'/rest/v1/rpc/'+name,{method:'POST',headers:Object.assign(hdr(null),{'Content-Type':'application/json'}),body:JSON.stringify(args||{})}),
  signup:async(email,password)=>{const j=await http(U+'/auth/v1/signup',{method:'POST',headers:{apikey:K,'Content-Type':'application/json'},body:JSON.stringify({email,password})});const id=j&&((j.user&&j.user.id)||j.id);if(!id)throw new Error('Création du compte impossible');return{id}},
  recover:email=>http(U+'/auth/v1/recover',{method:'POST',headers:{apikey:K,'Content-Type':'application/json'},body:JSON.stringify({email})}),
  setPassword:(accessToken,password)=>http(U+'/auth/v1/user',{method:'PUT',headers:{apikey:K,Authorization:'Bearer '+accessToken,'Content-Type':'application/json'},body:JSON.stringify({password})})}})();
