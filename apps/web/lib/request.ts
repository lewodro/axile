import {applicationUrl} from '../../../packages/db/src/config';
export async function jsonBody(request:Request){
 const max=16384;if(Number(request.headers.get('content-length')??0)>max)throw Error('PAYLOAD_TOO_LARGE');
 if(!request.headers.get('content-type')?.includes('application/json'))throw Error('INVALID_JSON');
 const reader=request.body?.getReader();if(!reader)throw Error('INVALID_JSON');let size=0;const chunks:Uint8Array[]=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max)throw Error('PAYLOAD_TOO_LARGE');chunks.push(value);}}catch(error){await reader.cancel();throw error;}finally{reader.releaseLock();}
 return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}
export function requireSameOrigin(request:Request){
 const origin=request.headers.get('origin');if(origin&&origin!==applicationUrl().origin)throw Error('ORIGIN_NOT_ALLOWED');
 if(request.headers.get('sec-fetch-site')==='cross-site')throw Error('ORIGIN_NOT_ALLOWED');
}
