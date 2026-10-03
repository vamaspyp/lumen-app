import {test,expect,type Page} from './fixtures'
async function personalBackend(page:Page, options:{scene?:string;proposals?:boolean}={}){
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
test('Prototype backbone retains words, accepts an open potential, asks consent and gates longitudinal composition',async({page})=>{
 const b=await personalBackend(page);await page.goto('/');const words='Estoy agotada y quiero estar más presente con mis hijos.'
 await page.getByLabel('¿Qué está vivo hoy?').fill(words);await page.getByRole('button',{name:'Contar',exact:true}).click();await page.getByRole('button',{name:'Cuidar esto como un Faro'}).click()
 await expect(page.locator('.gm-original blockquote')).toHaveText(words);await expect(page.getByLabel('Orientación de mi Faro')).toHaveValue(words)
 expect(b.calls).not.toContain('lumen_s2_create_trajectory_from_moment')
 await page.getByLabel('Agregar uno con mis palabras').fill('Parar sin culparme');await page.getByRole('button',{name:'Agregar potencial',exact:true}).click();await page.getByLabel('Para este Faro significa').fill('Descansar antes de llegar al límite')
 await page.getByRole('button',{name:'Confirmar lo que quiero nutrir'}).click();await expect(page.getByRole('dialog',{name:'Memoria personal'})).toBeVisible();expect(b.calls).not.toContain('lumen_faro_review_confirm')
 await page.getByRole('button',{name:'Ahora no',exact:true}).click();await expect(page.getByLabel('Para este Faro significa')).toHaveValue('Descansar antes de llegar al límite')
 await page.getByRole('button',{name:'Confirmar lo que quiero nutrir'}).click();await page.getByRole('button',{name:'Activar memoria y guardar'}).click();await expect(page.getByRole('heading',{name:'Tu Constelación'})).toBeVisible();await expect(page.locator('.gm-continuity-explanation').filter({hasText:'Todavía no tengo una relación de Fuente suficientemente revisada.'})).toBeVisible()
 expect(b.parameters).toHaveLength(1);expect(b.parameters[0].p_items).toMatchObject([{label:'Parar sin culparme',concept_id:null,origin:'person',status:'reformulated'}]);expect(b.calls.filter(n=>n==='lumen_faro_constellation')).toHaveLength(1)
 await page.getByRole('button',{name:'Revisar mi Faro y lo acordado'}).click();await expect(page.getByText('Parar sin culparme',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Revisar este acuerdo'}).click();await page.getByRole('button',{name:'Quitar Parar sin culparme'}).click();await page.getByRole('button',{name:'Seguir sin potenciales'}).click();await expect.poll(()=>b.parameters.length).toBe(2);expect(b.parameters[1].p_items).toMatchObject([{status:'withdrawn'}])
 await page.screenshot({path:`test-results/prototype-agreement-${test.info().project.name}.png`,fullPage:true})
})
test('Free exploration, Faro draft and punctual guidance remain possible without a personal agreement',async({page})=>{
 const b=await personalBackend(page);await page.goto('/');await page.locator('.gm-nav').getByText('Mi Vida',{exact:true}).click();await page.getByRole('button',{name:'Ver mi Faro'}).click();await expect(page.getByText('Primero elegí y conservá tu Faro.',{exact:false})).toBeVisible();expect(b.calls).not.toContain('lumen_faro_constellation');await page.getByRole('button',{name:'Prefiero una guía puntual'}).click();await expect(page.getByLabel('Contá tu momento')).toBeVisible();expect(b.calls).not.toContain('lumen_faro_review_confirm')
})

test('No-match still reaches comprehension and no constellation is generated before review',async({page})=>{
 const b=await personalBackend(page,{scene:'moment.no_match'})
 await page.goto('/');await page.getByLabel('¿Qué está vivo hoy?').fill('Estoy agotada y quiero cuidar a mi familia.');await page.getByRole('button',{name:'Contar',exact:true}).click()
 await expect(page.getByRole('heading',{name:'¿Te representa?'})).toBeVisible()
 expect(b.calls).not.toContain('lumen_s1_moment_constellation')
 await expect(page.getByRole('checkbox',{name:'Familia y cuidado'})).toBeChecked()
 await page.getByLabel('Lo que entiendo',{exact:true}).fill('Quiero cuidar mi descanso.')
 await page.getByRole('checkbox',{name:'Familia y cuidado'}).uncheck()
 await page.getByRole('button',{name:'Ver qué puede ayudar',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Tu Constelación'})).toBeVisible()
 expect(b.calls.indexOf('lumen_s1_review_moment')).toBeLessThan(b.calls.indexOf('lumen_s1_moment_constellation'))
})
test('Unaccepted hypotheses are excluded and regeneration preserves accepted and personal adjustments',async({page})=>{
 const b=await personalBackend(page,{proposals:true});await page.goto('/')
 await page.getByLabel('¿Qué está vivo hoy?').fill('Quiero escuchar mejor a mis hijos.');await page.getByRole('button',{name:'Contar',exact:true}).click();await page.getByRole('button',{name:'Cuidar esto como un Faro'}).click()
 await expect(page.getByRole('button',{name:'Aceptar Escuchar con presencia'})).toBeVisible()
 await expect(page.getByRole('button',{name:'Seguir sin potenciales',exact:true})).toBeEnabled()
 await page.getByRole('button',{name:'Aceptar Escuchar con presencia'}).click()
 await page.getByLabel('Orientación de mi Faro').fill('Aprender a conversar sin apuro')
 await page.getByRole('button',{name:'Proponer o regenerar desde mis palabras'}).click()
 await expect(page.getByLabel('Potencial',{exact:true})).toHaveCount(1)
 await expect.poll(()=>b.allParameters.filter(p=>p.proposal).at(-1)?.proposal).toMatchObject({p_faro_text:'Aprender a conversar sin apuro'})
 await page.getByLabel('Agregar uno con mis palabras').fill('Hacer lugar al juego');await page.getByRole('button',{name:'Agregar potencial',exact:true}).click()
 await page.getByRole('button',{name:'Proponer o regenerar desde mis palabras'}).click();await expect(page.getByLabel('Potencial',{exact:true})).toHaveCount(2)
 await expect(page.getByLabel('Potencial',{exact:true}).nth(1)).toHaveValue('Hacer lugar al juego')
 await expect(page.getByRole('checkbox',{name:'Familia y cuidado'})).toBeChecked()
})
test('A hypothesis never becomes accepted by pressing continue without reviewing it',async({page})=>{
 const b=await personalBackend(page,{proposals:true});await page.goto('/')
 await page.getByLabel('¿Qué está vivo hoy?').fill('Quiero escuchar a mis hijos.');await page.getByRole('button',{name:'Contar',exact:true}).click();await page.getByRole('button',{name:'Cuidar esto como un Faro'}).click()
 await page.getByRole('button',{name:'Seguir sin potenciales',exact:true}).click();await page.getByRole('button',{name:'Activar memoria y guardar'}).click()
 await expect(page.getByRole('heading',{name:'Tu Constelación'})).toBeVisible()
 expect(b.parameters[0].p_items).toEqual([])
})
test('The five doors display loaded prototype photographs',async({page})=>{
 await personalBackend(page);await page.goto('/')
 for(const label of ['Mi Vida','Explorar','Tejido','Santuario']){
  await page.locator('.gm-nav').getByText(label,{exact:true}).click()
  const image=page.locator('.gm-organ-image img,.gm-header-image').first()

  await expect(image).toBeVisible()
  await expect.poll(()=>image.evaluate((el:HTMLImageElement)=>({src:el.currentSrc,loaded:el.complete&&el.naturalWidth>0}))).toMatchObject({loaded:true})
 }
})

test('A reviewed draft survives a detour to exploration without being saved or regenerated',async({page})=>{
 const b=await personalBackend(page,{proposals:true});await page.goto('/')
 await page.getByLabel('¿Qué está vivo hoy?').fill('Quiero escuchar a mis hijos.');await page.getByRole('button',{name:'Contar',exact:true}).click();await page.getByRole('button',{name:'Cuidar esto como un Faro'}).click()
 await page.getByRole('button',{name:'Aceptar Escuchar con presencia'}).click()
 await page.getByLabel('Para este Faro significa').fill('Escuchar diez minutos sin el teléfono')
 await page.getByRole('checkbox',{name:'Familia y cuidado'}).uncheck()
 const proposalCount=b.calls.filter(n=>n==='lumen_faro_potential_proposal').length
 await page.getByRole('button',{name:'Explorar por mi cuenta',exact:true}).click()
 await page.goBack()
 await expect(page.getByLabel('Para este Faro significa')).toHaveValue('Escuchar diez minutos sin el teléfono')
 await expect(page.getByRole('checkbox',{name:'Familia y cuidado'})).not.toBeChecked()
 expect(b.calls.filter(n=>n==='lumen_faro_potential_proposal')).toHaveLength(proposalCount)
 expect(b.calls).not.toContain('lumen_faro_review_confirm')
})
