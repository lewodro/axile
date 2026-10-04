import {expect,it,vi} from 'vitest';
import {readVisitor,signVisitor} from '../apps/web/lib/session';
import {jsonBody,requireSameOrigin} from '../apps/web/lib/request';
import {fail} from '../apps/web/lib/api';
it('visitor ownership requires a valid secret signature and expiry',()=>{
 const id='12345678-1234-1234-1234-123456789abc',now=Date.now();
 const cookie=signVisitor(id,now);expect(readVisitor(cookie,now)).toBe(id);
 expect(readVisitor(id)).toBeNull();expect(readVisitor(cookie.replace('12345678','22345678'),now)).toBeNull();
 expect(readVisitor(cookie,now+366*86400000)).toBeNull();
 vi.stubEnv('SESSION_SECRET','b'.repeat(64));expect(readVisitor(cookie,now)).toBeNull();vi.unstubAllEnvs();
});
it('rejects cross-origin mutation and oversized streaming JSON',async()=>{
 expect(()=>requireSameOrigin(new Request('http://localhost:3000/api/demo',{headers:{origin:'https://evil.example'}}))).toThrow('ORIGIN_NOT_ALLOWED');
 const request=new Request('http://localhost/api',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({data:'a'.repeat(17000)})});
 await expect(jsonBody(request)).rejects.toThrow('PAYLOAD_TOO_LARGE');
});
it('unexpected database/provider errors never expose internal messages',async()=>{
 const spy=vi.spyOn(console,'error').mockImplementation(()=>{});
 const result=fail(new Error('postgresql://secret:password@host/db'));expect(result.status).toBe(500);
 expect(JSON.stringify(await result.json())).not.toContain('password');expect(JSON.stringify(spy.mock.calls)).not.toContain('password');spy.mockRestore();
});
