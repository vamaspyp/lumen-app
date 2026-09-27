import { getGreenfieldSupabase } from '../adapters/supabase/client'
export async function getLifeMap(){
 const {data,error}=await getGreenfieldSupabase().rpc('lumen_living_map_snapshot')
 if(error) throw error
 return data
}
