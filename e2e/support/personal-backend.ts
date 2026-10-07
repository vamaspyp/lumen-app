import type {Page} from '@playwright/test'
export async function personalBackend(page:Page, options:{scene?:string;proposals?:boolean}={}){
 const session={access_token:'regression-only-token',refresh_token:'regression-only-refresh',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'regression-user',aud:'authenticated',role:'authenticated',email:'regression@example.invalid',app_metadata:{},user_metadata:{}}}
 await page.addInitScript(s=>localStorage.setItem('sb-vbuixagaguasejputubp-auth-token',JSON.stringify(s)),session)
 let memory=false;let faro:Record<string,unknown>|null=null;let agreement:Record<string,unknown>={state:'unvalidated',version:0,items:[],history:[]};const calls:string[]=[];const parameters:Array<Record<string,unknown>>=[]
 await page.route('**/auth/v1/**',r=>r.fulfill({json:session}))
 await page.route('**/rest/v1/rpc/**',async r=>{const name=r.request().url().split('/').pop()!;const p=r.request().postDataJSON()||{};calls.push(name);let data:unknown={}
 if(name==='lumen_bootstrap_person')data={person_id:'p',preferences:{memory_allowed:memory}}
 else if(name==='lumen_s2_snapshot')data={memory_allowed:memory,trajectories:faro?[faro]:[],repertoire:[],sanctuary_count:0}
 else if(name==='lumen_s2_set_memory'){memory=p.p_enabled;data={memory_allowed:memory}}
 else if(name==='lumen_living_map_snapshot')data={memory_allowed:memory,direction:[],potential:[],realization:[],conditions:[]}
 else if(name==='lumen_s2_list_sanctuary'||name==='lumen_source_discover'||name==='lumen_s5_snapshot')data=[]
 else if(name==='lumen_get_consent_state')data={preferences:{sharing_allowed:false}}
 else if(name==='lumen_source_taxonomy')data={areas:[{key:'family_care',label:'Familia y cuidado'}]}
 else if(name==='lumen_s2_movement_snapshot')data={state:'without_memory',items:[],changes:[],withdrawn:false}
 else if(name==='lumen_s2_resume_experience')data={state:'empty'}
 else if(name==='lumen_s1_accompany_moment')data={scene_id:options.scene||'moment.help',episode_id:'episode-test',moment_id:'moment-test',understanding:'Una lectura provisional de tu presente.',interpretation:{capacity_keys:[],area_keys:['family_care']}}
 else if(name==='lumen_s1_moment_constellation')data={items:[]}
 else if(name==='lumen_s2_create_trajectory_from_moment'||name==='lumen_s2_create_trajectory'){faro={trajectory_id:'faro-test',faro_text:p.p_faro_text,status:'active',history:[],path:[]};data=faro}
 else if(name==='lumen_s2_update_trajectory'){if(faro)faro.faro_text=p.p_faro_text;data={updated:true}}
 else if(name==='lumen_faro_agreement_snapshot')data=agreement
 else if(name==='lumen_faro_potential_proposal'){parameters.push({proposal:p});data={items:options.proposals?[{identity_id:'suggestion-'+calls.filter(n=>n===name).length,concept_id:null,label:'Escuchar con presencia',definition:'Dar atención al vínculo.',contextual_meaning:'Escuchar antes de responder.',origin:'lumi',status:'accepted'}]:[],message:'Son hipótesis para revisar.'}}
 else if(name==='lumen_faro_review_confirm'){parameters.push(p);faro={trajectory_id:'faro-test',faro_text:p.p_faro_text,status:p.p_status,history:[],path:[]};agreement={state:'validated',faro_text:p.p_faro_text,faro_revision:2,version:Number(agreement.version)+1,items:p.p_items,area_keys:p.p_area_keys,history:[]};data={trajectory_id:'faro-test',agreement}}
 else if(name==='lumen_faro_agreement_validate'){parameters.push(p);agreement={...agreement,state:'validated',version:Number(agreement.version)+1,items:p.p_items,area_keys:p.p_area_keys};data=agreement}
 else if(name==='lumen_faro_constellation')data={state:'no_match',items:[],message:'Todavía no tengo una relación de Fuente suficientemente revisada.'}
 await r.fulfill({json:data})})
 return{calls,get parameters(){return parameters.filter(p=>!p.proposal)},allParameters:parameters}
}
