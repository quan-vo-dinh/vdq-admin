// Dry-run only: list unreferenced immutable paths for explicit operator review.
import {localDomainSession} from './local-domain-session.mjs';
const {sql}=localDomainSession();
console.log(sql("select name from storage.objects o where bucket_id='personal-media' and not exists(select 1 from public.finance_goals g where g.image_path=o.name) order by name"));
