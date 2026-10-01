import {test,expect,type Page} from '@playwright/test'

// Browser contract regression. Real database grants and live RPC health are checked separately.
async function simulatedLife(page:Page){
 const origin='https://vbuixagaguasejputubp.supabase.co'
 const session={access_token:'regression-only-token',refresh_token:'regression-only-refresh',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'regression-user',aud:'authenticated',role:'authenticated',email:'regression@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-09-28T00:00:00Z'}}
 await page.addInitScript(s=>localStorage.setItem('sb-vbuixagaguasejputubp-auth-token',JSON.stringify(s)),session)
 let momentCount=0
 let selected='help-own'
 let own=false
 const returns:{outcome_id:string;help_id:string;effect:string;applied:boolean;signal_kind:string}[]=[]
 const entries:{entry_id:string;entry_kind:string;title:string;content:string;source_help_id:string}[]=[]
 const source=(id:string,title:string,type='practice')=>({help_id:id,help_type:type,detail:{renderer_family:type==='practice'?'practice':'human'},title,summary:'Una posibilidad real de prueba',content:{steps:['Una pausa breve.']},duration_minutes:2,capacities:['regulation'],provider:{name:'Fuente de prueba'}})
 const ownSource=source('help-own','Pausa que puedo recuperar')
 const newSource=source('help-new','Otra forma de hacer una pausa')
 const humanSource=source('help-human','Orientación humana para este momento','professional_support')
 const repertoire=()=>own?[{repertoire_id:'rep-own',help_id:'help-own',title:ownSource.title,summary:ownSource.summary,times_reused:0,capability_keys:['regulation'],user_confirmed:true}]:[]
 const calls:string[]=[]
 await page.route(`${origin}/auth/v1/**`,async route=>route.fulfill({json:session}))
 await page.route(`${origin}/rest/v1/rpc/**`,async route=>{
  const name=route.request().url().split('/').pop()!;calls.push(name)
  const p=route.request().postDataJSON()||{}
  let data:unknown={}
  if(name==='lumen_s2_movement_snapshot'){await route.fulfill({json:{state:'success',items:[],changes:[],context:{},withdrawn:false}});return}
  if(name==='lumen_s2_resume_experience'){await route.fulfill({json:{state:'empty'}});return}

  if(name==='lumen_bootstrap_person')data={person_id:'person-test',preferences:{memory_allowed:true}}
  else if(name==='lumen_s2_snapshot')data={memory_allowed:true,trajectories:[{trajectory_id:'faro-1',faro_text:'Cuidar mi calma',status:'active',capability_keys:['regulation'],path:[]}],repertoire:repertoire(),sanctuary_count:entries.length}
  else if(name==='lumen_s2_list_sanctuary')data=entries
  else if(name==='lumen_living_map_snapshot')data={memory_allowed:true,direction:[{faro_id:'faro-1',text:'Cuidar mi calma',status:'active'}],potential:repertoire().map(r=>({resource_id:r.repertoire_id,help_id:r.help_id,user_confirmed:true})),conditions:[],realization:[...returns].reverse(),epistemic_note:'Mapa parcial y corregible.'}
  else if(name==='lumen_s1_accompany_moment'){momentCount++;data={scene_id:'moment.help',episode_id:`episode-${momentCount}`,moment_id:`moment-${momentCount}`,interpretation:{area_keys:['wellbeing'],capacity_keys:['regulation']}}}
  else if(name==='lumen_s1_moment_constellation'){const saved=entries.some(e=>e.source_help_id==='help-own');data={items:(own?[ownSource,newSource,humanSource]:[newSource,ownSource,humanSource]).map(item=>({...item,context_origin:item.help_id==='help-own'&&own?'propio':item.help_id==='help-own'&&saved?'santuario':item.help_id==='help-human'?'tejido':'fuente',context_reason:item.help_id==='help-own'&&own?'Lo reconociste como propio y se relaciona con lo que expresaste hoy.':item.help_id==='help-own'&&saved?'Elegiste conservarlo y puede volver a servirte ahora.':'Una posibilidad relacionada con este Momento.'}))}}
  else if(name==='lumen_source_discover')data=p.p_help_type==='professional_support'?[humanSource]:p.p_help_type?[ ]:[newSource,ownSource,humanSource]
  else if(name==='lumen_s1_select_help'){selected=p.p_help_id;data={selection_id:`selection-${momentCount}`,episode_id:p.p_episode_id,help:{help_id:selected}}}
  else if(name==='lumen_s1_record_outcome'){returns.push({outcome_id:`outcome-${returns.length+1}`,help_id:selected,effect:p.p_effect,applied:true,signal_kind:'HELPED_NOW'});data={effect:p.p_effect}}
  else if(name==='lumen_s2_record_longitudinal_signal'){returns.push({outcome_id:`outcome-${returns.length+1}`,help_id:selected,effect:'helped',applied:true,signal_kind:p.p_signal_kind});data={effect:'helped',signal_kind:p.p_signal_kind}}
  else if(name==='lumen_s2_save_sanctuary'){const entry={entry_id:`entry-${entries.length+1}`,entry_kind:p.p_entry_kind,title:p.p_title,content:p.p_content,source_help_id:p.p_source_help_id};entries.push(entry);data={entry_id:entry.entry_id}}
  else if(name==='lumen_s2_add_repertoire'){if(returns.filter(r=>r.help_id===p.p_help_id&&r.effect==='helped').length<2){await route.fulfill({status:400,json:{message:'Se requieren dos retornos.'}});return}own=true;data={repertoire_id:'rep-own',user_confirmed:true}}
  else if(name==='lumen_s2_release_repertoire'){own=false;data={repertoire_id:'rep-own',released:true}}
  await route.fulfill({json:data})
 })
 return {calls,returns,entries}
}

async function reachConstellation(page:Page){
 await page.goto('/')
 await page.getByLabel('¿Qué está vivo hoy?').fill('Me siento saturado y quiero bajar un cambio.')
 await page.getByRole('button',{name:'Continuar mi Momento'}).click()
 await page.getByRole('button',{name:'Ver mis posibilidades'}).click()
 await expect(page.getByRole('heading',{name:'Tu Constelación'})).toBeVisible()
}

test('V58 remembers a voluntary return and puts a relevant own resource before novelty, then releases it',async({page})=>{
 const life=await simulatedLife(page)
 await page.goto('/')
 await reachConstellation(page)
 await expect(page.getByText('Pausa que puedo recuperar',{exact:true})).toBeVisible()
 await expect(page.getByText(/Lo reconociste como propio/)).toHaveCount(0)
 await page.getByText('Pausa que puedo recuperar',{exact:true}).click()
 await page.getByRole('button',{name:'Marcar como realizada'}).click()
 await page.getByRole('button',{name:'Me ayudó',exact:true}).click()
 await page.getByRole('button',{name:'Registrar mi señal'}).click()
 await page.getByText('Conservar algo de esta experiencia',{exact:true}).click()
 await page.getByRole('checkbox',{name:'Conservar este recurso en mi Santuario'}).check()
 await page.getByRole('button',{name:'Conservar en mi Santuario'}).click()
 await page.getByRole('button',{name:'Abrir mi Santuario'}).click()
 await expect(page.getByRole('heading',{name:'Mi Santuario'})).toBeVisible()
 expect(life.returns).toHaveLength(1)
 expect(life.entries).toHaveLength(1)
 await page.locator('.gm-resources').getByRole('button',{name:/Pausa que puedo recuperar/}).click()
 await expect(page.getByRole('heading',{name:'Pausa que puedo recuperar'})).toBeVisible()
 await reachConstellation(page)
 await expect(page.getByText(/Elegiste conservarlo/)).toBeVisible()
 await page.getByText('Pausa que puedo recuperar',{exact:true}).click()
 await page.getByRole('button',{name:'Marcar como realizada'}).click()
 await page.getByRole('button',{name:'Me ayudó',exact:true}).click()
 await page.getByRole('button',{name:'Registrar mi señal'}).click()
 await page.getByText('Reconocerlo como propio',{exact:true}).click()
 await page.getByRole('button',{name:'Reconozco este recurso como propio'}).click()
 await expect(page.getByText('Reconocido como propio.',{exact:false})).toBeVisible()
 expect(life.returns).toHaveLength(2)
 await page.reload()
 await reachConstellation(page)
 const cards=page.locator('.gm-context-card')
 await expect(cards.first()).toContainText('Pausa que puedo recuperar')
 await expect(cards.first()).toContainText('Lo reconociste como propio')
 await page.getByRole('button',{name:'Dejarlo aquí',exact:true}).click()
 await page.locator('.gm-nav').getByText('Santuario').click()
 await page.getByText('Recursos que reconocí útiles').click()
 await page.getByRole('button',{name:'Dejar de reconocer como propio'}).click()
 await expect(page.getByRole('button',{name:'Dejar de reconocer como propio'})).toHaveCount(0)
 await page.reload()
 await reachConstellation(page)
 await expect(page.getByText(/Lo reconociste como propio/)).toHaveCount(0)
 expect(life.calls).toContain('lumen_s2_release_repertoire')
})
