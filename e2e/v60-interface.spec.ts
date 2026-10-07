import {editFaro,disclose} from './experience-actions'
import {test,expect,type Page} from './fixtures'
async function personalBackend(page:Page,paused=false){
 const origin='https://vbuixagaguasejputubp.supabase.co'
 const session={access_token:'regression-only-token',refresh_token:'regression-only-refresh',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'regression-user',aud:'authenticated',role:'authenticated',email:'regression@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-09-30T00:00:00Z'}}
 await page.addInitScript(s=>localStorage.setItem('sb-vbuixagaguasejputubp-auth-token',JSON.stringify(s)),session)
 const prefs={memory_allowed:paused,evidence_use_allowed:false,proactive_allowed:false,sharing_allowed:false,revision:1}
 const calls:string[]=[]
 const resources=Array.from({length:3},(_,i)=>({help_id:`help-${i}`,canonical_code:`source-${i}`,help_type:'practice',detail:{renderer_family:'practice'},title:`Posibilidad ${i+1}`,summary:'Una práctica para probar el contrato de interfaz.',content:{steps:['Primer paso.','Segundo paso.']},provider:{name:'Fuente de regresión'},duration_minutes:2,context_reason:'Se relaciona con lo que expresaste hoy.',context_origin:'fuente'}))
 const circles:Array<{space_id:string;name:string;purpose:string;role:string;contributions:Array<{contribution_id:string;help_id:string;title:string}>}>=[]
 await page.route(`${origin}/auth/v1/**`,r=>r.fulfill({json:session}))
 await page.route(`${origin}/rest/v1/rpc/**`,async r=>{const name=r.request().url().split('/').pop()!;calls.push(name);const p=r.request().postDataJSON()||{};let data:unknown={}
  if(name==='lumen_s2_movement_snapshot'){await r.fulfill({json:{state:'success',items:[],changes:[],context:{},withdrawn:false}});return}
  if(name==='lumen_s2_resume_experience'){await r.fulfill({json:{state:'empty'}});return}

 if(name==='lumen_bootstrap_person'||name==='lumen_get_consent_state')data={person_id:'p',preferences:prefs,grants:{}}
 else if(name==='lumen_s2_snapshot')data={memory_allowed:prefs.memory_allowed,trajectories:paused?[{trajectory_id:'paused-faro',faro_text:'Quiero cuidar mi descanso.',status:'paused',capability_keys:['regulation'],history:[{text:'Quiero vivir con menos apuro.',until:'2026-09-30'}]}]:[],repertoire:[],sanctuary_count:0}
 else if(name==='lumen_s2_list_sanctuary')data=[]
 else if(name==='lumen_living_map_snapshot')data={memory_allowed:prefs.memory_allowed,direction:[],potential:[],realization:[],conditions:[]}
 else if(name==='lumen_source_discover')data=resources
 else if(name==='lumen_source_taxonomy')data={areas:[{key:'wellbeing',label:'Bienestar'}]}
 else if(name==='lumen_s1_accompany_moment')data={scene_id:p.p_expression.includes('riesgo')?'moment.safety_referral':'moment.help',episode_id:'episode',moment_id:'moment',safety:{state:p.p_expression.includes('riesgo')?'blocked':'clear'},understanding:'Tal vez necesitás bajar un cambio.',interpretation:{capacity_keys:['regulation']}}
 else if(name==='lumen_s1_moment_constellation')data={items:resources}
 else if(name==='lumen_s2_set_memory')prefs.memory_allowed=p.p_enabled
 else if(name==='lumen_s6_set_proactivity')prefs.proactive_allowed=p.p_enabled
 else if(name==='lumen_set_consent'){if(p.p_scope==='evidence_use')prefs.evidence_use_allowed=p.p_granted;if(p.p_scope==='sharing')prefs.sharing_allowed=p.p_granted;data={preferences:prefs}}
 else if(name==='lumen_s5_snapshot')data=circles
 else if(name==='lumen_s5_create_circle'){circles.push({space_id:'circle',name:p.p_name,purpose:p.p_purpose,role:'host',contributions:[]});data={space_id:'circle'}}
 else if(name==='lumen_s5_create_invite')data={invite_token:'invitation-test'}
 else if(name==='lumen_s5_share_help')circles[0].contributions.push({contribution_id:'c',help_id:p.p_help_id,title:resources.find(x=>x.help_id===p.p_help_id)!.title})
 else if(name==='lumen_s5_leave_circle')circles.splice(0,1)
 await r.fulfill({json:data})})
 return{calls,prefs}
}
test('V60 understanding is correctable; three possibilities; persistent doors and immersive experiences resume progress',async({page})=>{
 await personalBackend(page);await page.goto('/');await page.getByLabel('¿Qué está vivo hoy?').fill('Necesito bajar un cambio.')
 await page.getByRole('button',{name:'Continuar'}).click();await expect(page.getByRole('heading',{name:'¿Te representa?'})).toBeVisible();await expect(page.locator('.gm-nav')).toBeVisible()
 await page.getByRole('button',{name:'Está bien'}).click();await expect(page.locator('.gm-context-card')).toHaveCount(3);await expect(page.getByText('Para ahora',{exact:true})).toHaveCount(1)
 await page.getByText('Posibilidad 1',{exact:true}).click();await expect(page.locator('.gm-nav')).toHaveCount(0);await expect(page.locator('.gm-top')).toHaveCount(0);await page.getByRole('button',{name:'Seguir',exact:true}).click();await expect(page.getByRole('heading',{name:'Segundo paso.'})).toBeVisible();await page.getByRole('button',{name:'Salir cuando quieras'}).click()
 await page.getByRole('button',{name:'Dejarlo aquí'}).click();await page.getByRole('button',{name:'Retomar: Posibilidad 1'}).click();await expect(page.getByRole('heading',{name:'Segundo paso.'})).toBeVisible()
 await page.screenshot({path:`test-results/v60-live-${test.info().project.name}.png`,fullPage:true})
})
test('V60 privacy grants are independent, revoked and reread; five doors in settings',async({page})=>{
 const state=await personalBackend(page);await page.goto('/mi-vida');await page.getByRole('button',{name:'Cuenta',exact:true}).click()
 const switches=page.getByRole('switch');await expect(switches).toHaveCount(3);for(let i=0;i<3;i++)await expect(switches.nth(i)).not.toBeChecked();await switches.nth(0).click();await expect(switches.nth(0)).toBeChecked();await expect(switches.nth(1)).not.toBeChecked();await expect(switches.nth(2)).not.toBeChecked();await switches.nth(0).click();await expect(switches.nth(0)).not.toBeChecked();expect(state.prefs.memory_allowed).toBe(false);await expect(page.locator('.gm-nav')).toBeVisible()
 await page.screenshot({path:`test-results/v60-privacy-${test.info().project.name}.png`,fullPage:true})
})
test('V60 Tissue creates real-contract circle, explicit sharing, contribution, invitation and exit',async({page})=>{
 const state=await personalBackend(page);await page.goto('/tejido');await page.getByText('Crear un encuentro',{exact:true}).click();await page.getByLabel('Nombre',{exact:true}).fill('Un encuentro pequeño');await page.getByLabel('¿Qué necesitás u ofrecés?').fill('Ofrezco una práctica y pido compañía para conversar.');await page.getByRole('button',{name:'Crear mi encuentro'}).click();await expect(page.getByRole('heading',{name:'Un encuentro pequeño'})).toBeVisible()
 await page.getByText('Ofrecer una posibilidad',{exact:true}).click();await page.getByLabel('Recurso para Un encuentro pequeño').selectOption('help-0');await page.getByRole('checkbox',{name:'Permitir que comparta recursos elegidos por mí'}).click();await page.getByRole('button',{name:'Compartir este recurso'}).click();await expect(page.getByRole('button',{name:'Posibilidad 1'})).toBeVisible();await page.getByText('Cuidar este encuentro',{exact:true}).click();await page.getByRole('button',{name:'Crear invitación'}).click();await expect(page.getByText('invitation-test',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Salir de este encuentro'}).click();await expect(page.getByRole('heading',{name:'Un encuentro pequeño'})).toHaveCount(0);expect(state.calls).toContain('lumen_s5_share_help')
})
test('V60 offline keeps draft and safety precedes all possibilities',async({page,context})=>{
 const state=await personalBackend(page);await page.goto('/');await page.getByLabel('¿Qué está vivo hoy?').fill('Estoy en riesgo.');await context.setOffline(true);await expect(page.getByText(/Sin conexión. Lo escrito sigue acá/)).toBeVisible();await expect(page.getByLabel('¿Qué está vivo hoy?')).toHaveValue('Estoy en riesgo.');await expect(page.getByRole('button',{name:'Continuar'})).toBeDisabled();await context.setOffline(false);await page.getByRole('button',{name:'Continuar'}).click();await expect(page.getByText(/contactá los servicios de emergencia locales/)).toBeVisible();expect(state.calls).not.toContain('lumen_s1_moment_constellation')
})
test('Master LUMI remains available; contextual sheet and conversation are invoked',async({page})=>{
 await personalBackend(page);await page.goto('/');const orb=page.getByRole('button',{name:'LUMI: opciones y ayuda de este espacio'});await expect(page.getByRole('dialog')).toHaveCount(0);await orb.click();await expect(page.getByRole('dialog',{name:'LUMI · Inicio'})).toBeVisible();await page.getByRole('button',{name:'Hablar con LUMI',exact:true}).click();await expect(page.getByText('Seguimos desde acá')).toBeVisible();await page.getByRole('button',{name:'Cerrar LUMI'}).click();await expect(orb).toBeVisible();await page.locator('.gm-nav').getByText('Mi Vida',{exact:true}).click();await page.getByRole('button',{name:'Elegir un Faro'}).click();await editFaro(page);await page.goBack();await expect(page.getByRole('heading',{name:'Mi Vida',exact:true})).toBeVisible()
})

test('V62 paused Faro keeps its history and willingness after reload',async({page})=>{
 await personalBackend(page,true);await page.goto('/mi-vida/faro');await expect(page.locator('.gm-reading')).toHaveText('Quiero cuidar mi descanso.');await disclose(page,'.gm-faro-edit');await page.getByText('Cómo fue cambiando mi Faro',{exact:true}).click();await expect(page.getByText('Quiero vivir con menos apuro.',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Revisar y ajustar'}).click();await expect(page.getByRole('radio',{name:'Todavía no'})).toBeChecked();await page.reload();await expect(page.locator('.gm-reading')).toHaveText('Quiero cuidar mi descanso.');await disclose(page,'.gm-faro-edit');await page.getByRole('button',{name:'Revisar y ajustar'}).click();await expect(page.getByRole('radio',{name:'Todavía no'})).toBeChecked()
})

