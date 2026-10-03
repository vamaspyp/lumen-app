import {test,expect,type Page} from './fixtures'
async function personalBackend(page:Page){
 const session={access_token:'regression-only-token',refresh_token:'regression-only-refresh',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'regression-user',aud:'authenticated',role:'authenticated',email:'regression@example.invalid',app_metadata:{},user_metadata:{}}}
 await page.addInitScript(s=>localStorage.setItem('sb-vbuixagaguasejputubp-auth-token',JSON.stringify(s)),session)
 let memory=false;let faro:Record<string,unknown>|null=null;let agreement:Record<string,unknown>={state:'unvalidated',version:0,items:[],history:[]};const calls:string[]=[];const parameters:Array<Record<string,unknown>>=[]
 await page.route('**/auth/v1/**',r=>r.fulfill({json:session}))
 await page.route('**/rest/v1/rpc/**',async r=>{const name=r.request().url().split('/').pop()!;const p=r.request().postDataJSON()||{};calls.push(name);let data:unknown={}
 if(name==='lumen_bootstrap_person')data={person_id:'p',preferences:{memory_allowed:memory}}
 else if(name==='lumen_s2_snapshot')data={memory_allowed:memory,trajectories:faro?[faro]:[],repertoire:[],sanctuary_count:0}
 else if(name==='lumen_s2_set_memory'){memory=p.p_enabled;data={memory_allowed:memory}}
 else if(name==='lumen_living_map_snapshot')data={memory_allowed:memory,direction:[],potential:[],realization:[],conditions:[]}
 else if(name==='lumen_s2_list_sanctuary'||name==='lumen_source_discover')data=[]
 else if(name==='lumen_source_taxonomy')data={areas:[{key:'family_care',label:'Familia y cuidado'}]}
 else if(name==='lumen_s2_movement_snapshot')data={state:'without_memory',items:[],changes:[],withdrawn:false}
 else if(name==='lumen_s2_resume_experience')data={state:'empty'}
 else if(name==='lumen_s1_accompany_moment')data={scene_id:'moment.help',episode_id:'episode-test',moment_id:'moment-test',understanding:'Una lectura provisional de tu presente.',interpretation:{capacity_keys:[]}}
 else if(name==='lumen_s1_moment_constellation')data={items:[]}
 else if(name==='lumen_s2_create_trajectory_from_moment'||name==='lumen_s2_create_trajectory'){faro={trajectory_id:'faro-test',faro_text:p.p_faro_text,status:'active',history:[],path:[]};data=faro}
 else if(name==='lumen_s2_update_trajectory'){if(faro)faro.faro_text=p.p_faro_text;data={updated:true}}
 else if(name==='lumen_faro_agreement_snapshot')data=agreement
 else if(name==='lumen_faro_potential_proposal')data={items:[],message:'Podés nombrar con tus palabras lo que querés nutrir.'}
 else if(name==='lumen_faro_agreement_validate'){parameters.push(p);agreement={state:'validated',version:Number(agreement.version)+1,items:p.p_items,area_keys:p.p_area_keys,history:[]};data=agreement}
 else if(name==='lumen_faro_constellation')data={state:'no_match',items:[],message:'Todavía no tengo una relación de Fuente suficientemente revisada.'}
 await r.fulfill({json:data})})
 return{calls,parameters}
}
test('Prototype backbone retains words, accepts an open potential, asks consent and gates longitudinal composition',async({page})=>{
 const b=await personalBackend(page);await page.goto('/');const words='Estoy agotada y quiero estar más presente con mis hijos.'
 await page.getByLabel('¿Qué está vivo hoy?').fill(words);await page.getByRole('button',{name:'Contar',exact:true}).click();await page.getByRole('button',{name:'Cuidar esto como un Faro'}).click()
 await expect(page.locator('.gm-original blockquote')).toHaveText(words);await expect(page.getByLabel('Orientación de mi Faro')).toHaveValue(words)
 expect(b.calls).not.toContain('lumen_s2_create_trajectory_from_moment')
 await page.getByLabel('Agregar uno con mis palabras').fill('Parar sin culparme');await page.getByRole('button',{name:'Agregar potencial',exact:true}).click();await page.getByLabel('Para este Faro significa').fill('Descansar antes de llegar al límite')
 await page.getByRole('button',{name:'Confirmar lo que quiero nutrir'}).click();await expect(page.getByRole('dialog',{name:'Memoria personal'})).toBeVisible();expect(b.calls).not.toContain('lumen_faro_agreement_validate')
 await page.getByRole('button',{name:'Ahora no',exact:true}).click();await expect(page.getByLabel('Para este Faro significa')).toHaveValue('Descansar antes de llegar al límite')
 await page.getByRole('button',{name:'Confirmar lo que quiero nutrir'}).click();await page.getByRole('button',{name:'Activar memoria y guardar'}).click();await expect(page.getByRole('heading',{name:'Tu Constelación'})).toBeVisible();await expect(page.locator('.gm-continuity-explanation').filter({hasText:'Todavía no tengo una relación de Fuente suficientemente revisada.'})).toBeVisible()
 expect(b.parameters).toHaveLength(1);expect(b.parameters[0].p_items).toMatchObject([{label:'Parar sin culparme',concept_id:null,origin:'person',status:'reformulated'}]);expect(b.calls.filter(n=>n==='lumen_faro_constellation')).toHaveLength(1)
 await page.getByRole('button',{name:'Revisar mi Faro y lo acordado'}).click();await expect(page.getByText('Parar sin culparme',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Revisar este acuerdo'}).click();await page.getByRole('button',{name:'Quitar Parar sin culparme'}).click();await page.getByRole('button',{name:'Seguir sin potenciales'}).click();await expect.poll(()=>b.parameters.length).toBe(2);expect(b.parameters[1].p_items).toMatchObject([{status:'withdrawn'}])
 await page.screenshot({path:`test-results/prototype-agreement-${test.info().project.name}.png`,fullPage:true})
})
test('Free exploration, Faro draft and punctual guidance remain possible without a personal agreement',async({page})=>{
 const b=await personalBackend(page);await page.goto('/');await page.locator('.gm-nav').getByText('Mi Vida',{exact:true}).click();await page.getByRole('button',{name:'Ver mi Faro'}).click();await expect(page.getByText('Primero elegí y conservá tu Faro.',{exact:false})).toBeVisible();expect(b.calls).not.toContain('lumen_faro_constellation');await page.getByRole('button',{name:'Prefiero una guía puntual'}).click();await expect(page.getByLabel('Contá tu momento')).toBeVisible();expect(b.calls).not.toContain('lumen_faro_agreement_validate')
})
