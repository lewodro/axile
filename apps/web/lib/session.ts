import {createHmac,timingSafeEqual} from 'node:crypto';
const lifetime=365*24*60*60;
function secret(){const value=process.env.SESSION_SECRET;if(value&&value.length>=32)return value;if(process.env.NODE_ENV==='production')throw Error('SESSION_NOT_CONFIGURED');return 'axile-local-development-cookie-secret';}
function mac(value:string){return createHmac('sha256',secret()).update(`axile-visitor-v1:${value}`).digest('base64url');}
export function signVisitor(id:string,now=Date.now()){const value=`${id}.${Math.floor(now/1000)+lifetime}`;return `${value}.${mac(value)}`;}
export function readVisitor(value:string|undefined,now=Date.now()):string|null{
 if(!value||value.length>160)return null;const [id,expiry,signature,...rest]=value.split('.');
 if(rest.length||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)||!/^\d{10}$/.test(expiry)||!signature)return null;
 if(Number(expiry)<=now/1000||Number(expiry)>now/1000+lifetime+60)return null;
 const expected=Buffer.from(mac(`${id}.${expiry}`)),actual=Buffer.from(signature);
 return actual.length===expected.length&&timingSafeEqual(actual,expected)?id:null;
}
