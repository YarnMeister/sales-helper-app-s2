Patterns ONLY in Supabase (safe to grep/remove):

createClient(
getSupabaseConfig(
SUPABASE_URL
SUPABASE_SERVICE_ROLE
.from(
.select(
.insert(
.update(
.delete(
.eq(
.single()
.order(
.limit(
.rpc(
error.code === 'PGRST116'
{ data, error }
auth: {
autoRefreshToken
persistSession
serviceRoleKey
from '@supabase/supabase-js'
import.*supabase
SUPABASE_ (in env vars)
/supabase/ (directory)
supabase migration
--db-url $SUPABASE_URL
from('kv_cache') (the .from() part is Supabase-specific)

Safe Grep Strategy:
Focus on the Supabase-only patterns above. The shared patterns (JSON.stringify, ::jsonb, function names, table names) are legitimate PostgreSQL and should stay.
The biggest red flags are the query builder methods (.from(), .select(), etc.) and client creation patterns.