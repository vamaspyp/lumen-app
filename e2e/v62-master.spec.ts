import {test,expect} from './fixtures'

test('V62 home follows master; transient scenes return to their actual predecessor',async({page})=>{
 await page.route('**/rest/v1/rpc/**',r=>r.fulfill({json:r.request().url().endsWith('lumen_source_discover')?[]:{areas:[]}}))
 await page.goto('/');await expect(page.getByRole('heading',{name:'Inicio'})).toBeVisible()
 await expect(page.getByRole('button',{name:'Contar'})).toContainText('Contar')
 await expect(page.getByLabel('¿Qué está vivo hoy?')).toHaveCSS('background-color','rgb(255, 253, 249)');await expect(page.locator('.gm-top b')).toHaveCSS('color','rgb(22, 38, 75)')
 await page.screenshot({path:`test-results/v62-home-light-${test.info().project.name}.png`,fullPage:true})
 await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('.gm-top b')).toHaveCSS('color','rgb(240, 244, 252)');await page.screenshot({path:`test-results/v62-home-dark-${test.info().project.name}.png`,fullPage:true})
 await page.emulateMedia({colorScheme:'light'});await page.locator('.gm-nav').getByText('Mi Vida',{exact:true}).click();await page.getByRole('button',{name:'Ver mi Faro'}).click();await page.getByRole('button',{name:'Volver',exact:true}).click();await expect(page.getByRole('heading',{name:'Mi Vida',exact:true})).toBeVisible()
})

test('V62 learning is opt-in and private data is explicitly excluded',async({page})=>{
 const preferences={memory_allowed:false,evidence_use_allowed:false,proactive_allowed:false,sharing_allowed:false}
 const session={access_token:'regression-only-token',refresh_token:'regression-only-refresh',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'regression-user',aud:'authenticated',role:'authenticated',email:'regression@example.invalid',app_metadata:{},user_metadata:{}}}
 await page.addInitScript(s=>localStorage.setItem('sb-vbuixagaguasejputubp-auth-token',JSON.stringify(s)),session)
 await page.route('**/auth/v1/**',r=>r.fulfill({json:session}))
 await page.route('**/rest/v1/rpc/**',async r=>{const name=r.request().url().split('/').pop();const p=r.request().postDataJSON();if(name==='lumen_set_consent'&&p.p_scope==='evidence_use')preferences.evidence_use_allowed=p.p_granted;let data:unknown={};if(name==='lumen_bootstrap_person'||name==='lumen_get_consent_state')data={person_id:'p',preferences,grants:{}};if(name==='lumen_s2_snapshot')data={memory_allowed:false,trajectories:[],repertoire:[],sanctuary_count:0};if(name==='lumen_s2_list_sanctuary'||name==='lumen_source_discover')data=[];if(name==='lumen_living_map_snapshot')data={memory_allowed:false,direction:[],potential:[],realization:[],conditions:[]};if(name==='lumen_s2_movement_snapshot')data={state:'without_memory',items:[],changes:[],context:{},withdrawn:false};if(name==='lumen_s2_resume_experience')data={state:'empty'};await r.fulfill({json:data})})
 await page.goto('/aprender');await expect(page.getByRole('switch')).not.toBeChecked();await page.getByRole('switch').click();await expect(page.getByRole('switch')).toBeChecked();await page.getByRole('switch').click();await expect(page.getByRole('switch')).not.toBeChecked();expect(preferences.evidence_use_allowed).toBe(false)
 await page.screenshot({path:`test-results/v62-learning-${test.info().project.name}.png`,fullPage:true})
})

