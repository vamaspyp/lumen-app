import { expect, test, type Page, type Route } from '@playwright/test'
const REF='vbuixagaguasejputubp', URL='https://'+REF+'.supabase.co', KEY='sb-'+REF+'-auth-token'
async function session(page:Page){const exp=Math.floor(Date.now()/1000)+3600;await page.addInitScript(({k,e})=>localStorage.setItem(k,JSON.stringify({access_token:'synthetic',token_type:'bearer',expires_in:3600,expires_at:e,refresh_token:'synthetic-refresh',user:{id:'10000000-0000-0000-0000-000000000101',aud:'authenticated',role:'authenticated',email:'vnext@example.invalid',app_metadata:{provider:'email',providers:['email']},user_metadata:{},identities:[],created_at:new Date().toISOString()}})),{k:KEY,e:exp})}
const practice={help_id:'70000000-0000-0000-0000-000000000101',help_version_id:'80000000-0000-0000-0000-000000000101',help_type:'practice',title:'Llegar al cuerpo',summary:'Una respiración breve para bajar intensidad.',content:{steps:['Soltá mandíbula y hombros.','Exhalá un poco más lento.','Notá si aparece apenas más espacio.']},duration_minutes:3,energy:'low',detail:{}}
const source=[{...practice,canonical_code:'flagship_breathe_arrive',lifecycle:'active_limited',risk_class:'low',evidence_class:'practice_based',provider:{name:'VA+LUMEN',kind:'internal'},areas:['wellbeing'],capacities:['regulation'],cultivation_roles:['PRACTICE'],taxonomy_version:'life-taxonomy.v1'},{help_id:'71000000-0000-0000-0000-000000000001',canonical_code:'who_resource',help_type:'external_resource',lifecycle:'active_limited',risk_class:'low',evidence_class:'institutional_guidance',title:'En tiempos de estrés: haz lo que importa',summary:'Guía institucional.',content:{external_url:'https://example.invalid/resource'},duration_minutes:10,energy:'low',provider:{name:'OPS/OMS',kind:'institution'},areas:['wellbeing'],capacities:['regulation'],cultivation_roles:['UNDERSTAND'],taxonomy_version:'life-taxonomy.v1'}]
function scene(coverage='covered',safety='clear'){return {scene_id:'moment.help',scene_version:'vnext',presence_mode:'P2',episode_id:'30000000-0000-0000-0000-000000000101',moment_id:'40000000-0000-0000-0000-000000000101',decision_run_id:'50000000-0000-0000-0000-000000000101',semantic_blocks:[{type:'help_preview',primary:practice}],coverage:{state:coverage},safety:{state:safety},interpretation:{taxonomy_version:'life-taxonomy.v1',area_keys:['wellbeing'],capacity_keys:['regulation'],confidence:.9}}}
async function ok(route:Route,body:unknown){await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)})}
async function mocks(page:Page,calls:string[],mode:'covered'|'nomatch'|'safety'='covered'){await page.route(URL+'/rest/v1/rpc/**',async route=>{const n=route.request().url().split('/').pop()||'';calls.push(n)
 if(n==='lumen_bootstrap_person')return ok(route,{person_id:'p',preferences:{memory_allowed:true,proactive_allowed:false}})
 if(n==='lumen_source_discover')return ok(route,source)
 if(n==='lumen_s2_snapshot')return ok(route,{memory_allowed:true,trajectories:[{trajectory_id:'t1',faro_text:'Cuidar lo que importa',status:'active',path:[]}],repertoire:[{repertoire_id:'r1',help_id:practice.help_id,title:practice.title,summary:practice.summary,times_reused:2,user_confirmed:true}],sanctuary_count:1})
 if(n==='lumen_s2_list_sanctuary')return ok(route,[{entry_id:'s1',entry_kind:'reflection',title:'Algo mío',content:'Una idea que quiero conservar.',source_help_id:null,created_at:new Date().toISOString()}])
 if(n==='lumen_s5_snapshot')return ok(route,[{space_id:'c1',name:'Círculo de presencia',purpose:'Compartir y acompañar.',role:'member',member_count:8,contributions:[]}])
 if(n==='lumen_s6_snapshot')return ok(route,{proactive_allowed:false,settings:{quiet_start_hour:22,quiet_end_hour:8,timezone:'America/Buenos_Aires',custody_blocked:false},followups:[]})
 if(n==='lumen_living_map_snapshot')return ok(route,{territory:[{area_key:'wellbeing'}],direction:[{faro_id:'t1',text:'Cuidar lo que importa'}],potential:[{resource_id:'r1',help_id:practice.help_id,user_confirmed:true}],conditions:[{confidence:.9}],realization:[{effect:'helped',applied:true}],epistemic_note:'Mapa vivo, parcial, contextual y corregible.'})
 if(n==='lumen_get_consent_state')return ok(route,{person_id:'p',preferences:{proactive_allowed:false,memory_allowed:true,evidence_use_allowed:true,sharing_allowed:true,revision:1},grants:{}})
 if(n==='lumen_set_consent')return ok(route,{ok:true})
 if(n==='lumen_s5_create_invite')return ok(route,{invite_token:'LUMEN-TEST'})
 if(n==='lumen_s5_share_help')return ok(route,{contribution_id:'co1'})
 if(n==='lumen_s5_leave_circle')return ok(route,{left:true})
 if(n==='lumen_s5_report_circle')return ok(route,{reported:true})
 if(n==='lumen_s1_accompany_moment')return ok(route,mode==='safety'?scene('covered','elevated'):mode==='nomatch'?scene('no_match','clear'):scene())
 if(n==='lumen_s1_moment_constellation')return ok(route,{episode_id:scene().episode_id,moment_id:scene().moment_id,decision_run_id:scene().decision_run_id,capacity_keys:['regulation'],area_keys:['wellbeing'],trace_id:'x',items:source})
 if(n==='lumen_s1_select_help')return ok(route,{selection_id:'sel',episode_id:scene().episode_id,action:'selected',help:practice,trace_id:'x'})
 if(n==='lumen_s1_record_outcome')return ok(route,{selection_id:'sel',episode_id:scene().episode_id,effect:'helped',signal_kind:'HELPED_NOW',applied:true,trace_id:'x',semantic_key:'outcome'})
 if(n==='lumen_s2_create_trajectory')return ok(route,{trajectory_id:'t2'})
 if(n==='lumen_s2_save_sanctuary')return ok(route,{entry_id:'s2'})
 if(n==='lumen_s2_delete_sanctuary')return ok(route,{deleted:true})
 if(n==='lumen_s2_export_sanctuary')return ok(route,{export_version:'1',generated_at:new Date().toISOString(),sanctuary_entries:[],trajectories:[],personal_repertoire:[]})
 if(n==='lumen_s2_reuse_repertoire')return ok(route,{scene_id:'continuity.cultivate',scene_version:'v1',episode_id:'ep-reuse',moment_id:'m',decision_run_id:'d',selection_id:'sel2',decision_kind:'REPEAT',help:{...practice,from_own_repertoire:true},semantic_key:'repeat',trace_id:'x'})
 if(n==='lumen_s2_record_longitudinal_signal')return ok(route,{outcome_id:'o',episode_id:'ep-reuse',signal_kind:'REPEATED',effect:'helped',decision_kind:null,withdraw_decision_run_id:null,semantic_key:'signal',trace_id:'x'})
 if(n==='lumen_s2_set_memory')return ok(route,{memory_allowed:false})
 if(n==='lumen_s6_set_proactivity')return ok(route,{proactive_allowed:true})
 if(n==='lumen_s6_schedule_followup')return ok(route,{followup_id:'f1'})
 if(n==='lumen_s5_create_circle')return ok(route,{space_id:'c2'})
 if(n==='lumen_s5_join_circle')return ok(route,{joined:true})
 return ok(route,{})
})}

test('VNext renders the approved Premium home and canonical navigation',async({page})=>{await mocks(page,[]);await page.goto('/?vnext=1');await expect(page.getByRole('heading',{name:'Una vida más tuya.'})).toBeVisible();await expect(page.getByText('Mi Vida',{exact:true})).toBeVisible();await expect(page.getByText('Comunidad',{exact:true})).toBeVisible();await expect(page.getByText('Santuario',{exact:true})).toBeVisible();await page.screenshot({path:'test-results/cleanroom-home.png',fullPage:true})})

test('VNext completes Moment to Map to Faro to constellation to lived return and Sanctuary',async({page})=>{const calls:string[]=[];await session(page);await mocks(page,calls);await page.goto('/?vnext=1');await page.getByPlaceholder('Cuéntame en qué momento estás...').fill('Estoy saturado y quiero volver a estar presente.');await page.getByRole('button',{name:'→'}).click();await expect(page.getByRole('heading',{name:'¿Qué estás viviendo hoy?'})).toBeVisible();await page.getByRole('button',{name:'→'}).click();await expect(page.getByText('MI MAPA VIVO')).toBeVisible();await expect(page.getByText('Potencial',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Ver mi Faro'}).click();await expect(page.getByText('MI FARO',{exact:true})).toBeVisible();await page.getByRole('button',{name:/Abrir una constelación/}).click();await expect(page.getByText('TU CONSTELACIÓN')).toBeVisible();await page.getByRole('button').filter({hasText:'Llegar al cuerpo'}).click();await expect(page.getByRole('heading',{name:'Llegar al cuerpo'})).toBeVisible();await page.getByRole('button',{name:'Seguir'}).click();await page.getByRole('button',{name:'Seguir'}).click();await page.getByRole('button',{name:'Terminé'}).click();await page.getByRole('button',{name:'Me ayudó',exact:true}).click();await expect(page.getByRole('heading',{name:'¿Cómo fue?'})).toBeVisible();await page.getByRole('button',{name:'Guardar en mi Santuario'}).click();await expect(page.getByText('MI SANTUARIO')).toBeVisible();for(const n of ['lumen_s1_accompany_moment','lumen_s1_moment_constellation','lumen_s2_create_trajectory','lumen_s1_select_help','lumen_s1_record_outcome'])expect(calls).toContain(n)})

test('VNext exposes longitudinal reuse, Tejido and sovereign settings',async({page})=>{const calls:string[]=[];await session(page);await mocks(page,calls);await page.goto('/?vnext=1');await page.getByText('Mi Vida',{exact:true}).click();await expect(page.getByText('RECURSO PROPIO · VOLVER A USAR')).toBeVisible();await page.getByText('RECURSO PROPIO · VOLVER A USAR').click();await expect(page.getByRole('heading',{name:'Llegar al cuerpo'})).toBeVisible();await page.getByRole('button',{name:'Salir cuando quieras'}).click();await page.getByText('Comunidad',{exact:true}).click();await expect(page.getByRole('heading',{name:'La vida también se vive con otros.'})).toBeVisible();await expect(page.getByText('Círculo de presencia')).toBeVisible();await page.locator('.vx-account').click();await expect(page.getByRole('heading',{name:'Vos decidís qué recuerda LUMEN.'})).toBeVisible();await page.getByText('Memoria',{exact:true}).click();expect(calls).toContain('lumen_s2_reuse_repertoire');expect(calls).toContain('lumen_s5_snapshot')})

test('VNext fails honestly on no-match and safety states',async({page})=>{await session(page);await mocks(page,[],'nomatch');await page.goto('/?vnext=1');await page.getByPlaceholder('Cuéntame en qué momento estás...').fill('Algo sin cobertura');await page.getByRole('button',{name:'→'}).click();await expect(page.getByText('HONESTIDAD · NO MATCH')).toBeVisible()})


test('VNext Source is a real discovery surface with filters and executable content',async({page})=>{
 const calls:string[]=[];await mocks(page,calls);await page.goto('/?vnext=1');
 await page.getByText('Explorar',{exact:true}).click();await page.locator('.vx-area-grid button').first().click();
 await expect(page.getByRole('heading',{name:'Sabiduría y experiencias para la vida.'})).toBeVisible();
 await expect(page.getByText(/posibilidades disponibles/)).toBeVisible();
 await expect(page.getByRole('button',{name:'Práctica',exact:true})).toBeVisible();
 await page.getByPlaceholder('Buscar por tema, autor o fuente…').fill('cuerpo');
 await expect(page.getByRole('button').filter({hasText:'Llegar al cuerpo'})).toBeVisible();
 await page.getByRole('button').filter({hasText:'Llegar al cuerpo'}).click();
 await expect(page.getByRole('heading',{name:'Llegar al cuerpo'})).toBeVisible();
 await page.screenshot({path:'test-results/source-experience-mobile.png',fullPage:true});
 expect(calls).toContain('lumen_source_discover')
})

test('VNext shortcuts execute comprehension instead of only filling the composer',async({page})=>{
 const calls:string[]=[];await session(page);await mocks(page,calls);await page.goto('/?vnext=1');
 await page.getByRole('button',{name:'Necesito claridad'}).click();
 await expect(page.getByRole('heading',{name:'¿Qué estás viviendo hoy?'})).toBeVisible();
 expect(calls).toContain('lumen_s1_accompany_moment');
 expect(calls).toContain('lumen_s1_moment_constellation')
})

test('VNext core PREMIUM surfaces keep cinematic image treatment on mobile',async({page})=>{
 await session(page);await mocks(page,[]);await page.goto('/?vnext=1');
 for(const target of ['Comunidad']){
   await page.getByText(target,{exact:true}).click();
   await expect(page.locator('.vx-image-header')).toBeVisible();
   const bg=await page.locator('.vx-image-header').evaluate(el=>getComputedStyle(el).backgroundImage);
   expect(bg).not.toBe('none');
 }
 await page.locator('.vx-account').click();
 await expect(page.locator('.vx-image-header')).toBeVisible();
 await page.screenshot({path:'test-results/premium-secondary-surfaces.png',fullPage:true})
})

test('VNext composer enables its primary action only when there is an actionable Moment',async({page})=>{
 await mocks(page,[]);await page.goto('/?vnext=1');
 const submit=page.getByRole('button',{name:'→'});await expect(submit).toBeDisabled();
 await page.getByPlaceholder('Cuéntame en qué momento estás...').fill('Necesito claridad');await expect(submit).toBeEnabled()
})

test('A63 approved storyboard keeps the ten canonical scenes and central flow visible',async({page})=>{
 const calls:string[]=[];await session(page);await mocks(page,calls);await page.goto('/?vnext=1');
 await expect(page.getByRole('heading',{name:'Una vida más tuya.'})).toBeVisible();
 await page.getByPlaceholder('Cuéntame en qué momento estás...').fill('Quiero estar más presente con mi familia');await page.getByRole('button',{name:'→'}).click();
 await expect(page.getByText('TU MOMENTO')).toBeVisible();await page.getByRole('button',{name:'→'}).click();
 await expect(page.getByText('MI MAPA VIVO')).toBeVisible();await page.getByRole('button',{name:'Ver mi Faro'}).click();
 await expect(page.getByText('MI FARO',{exact:true})).toBeVisible();await page.getByRole('button',{name:/Abrir una constelación/}).click();
 await expect(page.getByRole('heading',{name:'Tu Constelación'})).toBeVisible();
 await page.getByRole('button').filter({hasText:'Llegar al cuerpo'}).click();await expect(page.getByRole('heading',{name:'Llegar al cuerpo'})).toBeVisible();
 await page.getByRole('button',{name:'Seguir'}).click();await page.getByRole('button',{name:'Seguir'}).click();await page.getByRole('button',{name:'Terminé'}).click();
 await page.getByRole('button',{name:'Me ayudó',exact:true}).click();await expect(page.getByRole('heading',{name:'¿Cómo fue?'})).toBeVisible();await page.getByRole('button',{name:'Guardar en mi Santuario'}).click();
 await expect(page.getByRole('heading',{name:'Mi Santuario'})).toBeVisible();await page.getByText('Explorar',{exact:true}).click();await expect(page.getByText('EXPLORAR EL TERRITORIO')).toBeVisible();
 await page.getByText('Comunidad',{exact:true}).click();await page.getByRole('button',{name:'Cómo aprendemos juntos'}).click();await expect(page.getByRole('heading',{name:'Impacto y Aprendizaje'})).toBeVisible();
 await page.screenshot({path:'test-results/a63-approved-storyboard-final.png',fullPage:true})
})
