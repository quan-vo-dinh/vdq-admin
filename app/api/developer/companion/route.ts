import {accessFailure,privateResponse} from '@/lib/auth/api';
import {ingest} from '@/lib/developer/codex/server';
export async function POST(request:Request){try{return privateResponse(await ingest(request));}catch(error){return accessFailure(error);}}
