// Local integration transport only. Never exports credentials or touches owner/identities.
import { execFileSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
export function localDomainSession() {
 const sql = input => execFileSync('docker',['exec','-i','supabase_db_dashboard-personal-local','psql','-XAt','-U','postgres','-v','ON_ERROR_STOP=1'],{input,stdio:['pipe','pipe','pipe']}).toString().trim();
 const status=JSON.parse(execFileSync('pnpm',['exec','supabase','status','-o','json'],{stdio:['ignore','pipe','pipe']}).toString());
 if(status.API_URL!=='http://127.0.0.1:54321') throw new Error('Local stack required');
 const owner=sql('select user_id from private.app_owner where enabled;');
 if(!/^[0-9a-f-]{36}$/.test(owner)) throw new Error('Existing enabled local owner required');
 const session=sql(`select id from auth.sessions where user_id='${owner}' order by created_at desc limit 1;`);
 if(!session) throw new Error('Log in as local owner first');
 const now=Math.floor(Date.now()/1000);
 const claims={sub:owner,role:'authenticated',aud:'authenticated',iss:status.API_URL+'/auth/v1',iat:now,exp:now+1800,session_id:session,aal:'aal1'};
 const unsigned=[{alg:'HS256',typ:'JWT'},claims].map(v=>Buffer.from(JSON.stringify(v)).toString('base64url')).join('.');
 const token=unsigned+'.'+createHmac('sha256',status.JWT_SECRET).update(unsigned).digest('base64url');
 const cookie='sb-127-auth-token=base64-'+Buffer.from(JSON.stringify({access_token:token,refresh_token:'local-test-only',expires_at:now+1800,expires_in:1800,token_type:'bearer'})).toString('base64url');
 return {sql,status,owner,token,cookie};
}
