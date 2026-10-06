import AxeBuilder from '@axe-core/playwright'
import {test,expect} from './fixtures'
import {personalBackend} from './support/personal-backend'
import {disclose} from './experience-actions'

test('Inicio listens freely and keeps secondary choices outside its primary gesture',async({page})=>{
 await personalBackend(page);await page.goto('/')
 await expect(page.locator('.gm-home h1')).toHaveText('¿Qué está pasando ahora?')
 await expect(page.locator('.gm-home textarea')).toHaveCount(1)
 await expect(page.locator('.gm-home').getByRole('button')).toHaveCount(1)
 await expect(page.locator('.gm-home').getByRole('button',{name:'Continuar',exact:true})).toBeDisabled()
 await expect(page.locator('.gm-home').getByRole('checkbox')).toHaveCount(0)
})

test('Finishing offers return before feedback and keeping remains an independent choice',async({page})=>{
 const b=await personalBackend(page);await page.route('**/rest/v1/rpc/lumen_s1_moment_constellation',r=>r.fulfill({json:{items:[{help_id:'regression-practice',help_type:'practice',detail:{renderer_family:'practice'},title:'Práctica de contrato',summary:'Sólo un testigo de regresión.',content:{steps:['Un gesto.']},provider:{name:'Fixture de contrato'},duration_minutes:2}]}}));await page.goto('/')
 await page.getByLabel('¿Qué está vivo hoy?').fill('Quiero cuidar mi descanso.')
 await page.getByRole('button',{name:'Continuar',exact:true}).click()
 const area=await page.locator('.gm-reading-areas').boundingBox(),potentials=await page.getByRole('heading',{name:'Potenciales que podrías nutrir',exact:true}).boundingBox()
 expect(area&&potentials&&area.y+area.height<=potentials.y).toBeTruthy()
 await page.getByRole('button',{name:'Está bien',exact:true}).click()
 await page.locator('.gm-context-card').first().getByRole('button').first().click()
 await page.getByRole('button',{name:'Marcar como realizada'}).click()
 await expect(page.getByRole('heading',{name:'Terminaste.'})).toBeVisible()
 await expect(page.getByRole('button',{name:'Volver a mi Constelación',exact:true})).toBeVisible()
 expect(b.calls).not.toContain('lumen_s1_record_outcome')
 await disclose(page,'.gm-finished > details')
 await expect(page.getByRole('button',{name:'Contarle a LUMEN cómo me fue'})).toBeVisible()
 await disclose(page,'.gm-finished .gm-return-save');await expect(page.getByRole('button',{name:'Conservar en mi Santuario'})).toBeVisible()
 await page.getByRole('button',{name:'Volver a mi Constelación',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Tu Constelación'})).toBeVisible()
 expect(b.calls).not.toContain('lumen_s1_record_outcome')
})

// Selected labels keep contrast during an immediate mode change, without waiting for animation.
test('Explore selection maintains contrast while changing entries',async({page})=>{
 await personalBackend(page);await page.goto('/explorar')
 for(const mode of ['Por potencial','Por área','Por momento','Libre']){
  await page.getByRole('button',{name:mode,exact:true}).click()
  const ax=await new AxeBuilder({page}).include('.gm-explore-modes').withRules(['color-contrast']).analyze()
  expect(ax.violations).toEqual([])
 }
})

// A saved resource and a lived record coexist; opening lived history must not evaluate state before initialization.
test('Santuario opens all five sections with both saved and lived records',async({page})=>{
 await personalBackend(page)
 await page.route('**/rest/v1/rpc/lumen_s2_list_sanctuary',r=>r.fulfill({json:[{entry_id:'saved-test',entry_kind:'treasure',title:'Recurso conservado de contrato',content:'Conservado por elección.',source_help_id:'lived-test'}]}))
 await page.route('**/rest/v1/rpc/lumen_living_map_snapshot',r=>r.fulfill({json:{memory_allowed:true,direction:[],potential:[],conditions:[],realization:[{outcome_id:'outcome-test',help_id:'lived-test',effect:'helped',applied:true}]}}))
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto('/santuario');await expect(page.getByRole('button',{name:'Cuenta',exact:true})).toBeEnabled()
 for(const section of ['Piezas guardadas','Experiencias vividas','Reflexiones','Constelaciones conservadas','Lo propio']){
  await page.getByRole('button',{name:section,exact:true}).click()
  await expect(page.getByRole('heading',{name:section,exact:true})).toBeVisible()
  if(section==='Experiencias vividas')await expect(page.locator('.gm-lived-entries .gm-life-row')).toHaveCount(1)
  await page.getByRole('button',{name:'Volver a mi Santuario',exact:true}).click()
 }
 expect(errors).toEqual([])
})

test('Santuario recovers a completed experience without feedback, keeping or appropriation',async({page})=>{
 await personalBackend(page)
 await page.route('**/rest/v1/rpc/lumen_living_map_snapshot',r=>r.fulfill({json:{memory_allowed:true,direction:[],potential:[],conditions:[],realization:[],lived_experiences:[{episode_id:'completed-without-return',help_id:'completed-test',finished:true,effect:null,lived_at:'2026-10-06T12:00:00Z'}]}}))
 await page.goto('/santuario');await expect(page.getByRole('button',{name:'Cuenta',exact:true})).toBeEnabled()
 await page.getByRole('button',{name:'Experiencias vividas',exact:true}).click()
 await expect(page.locator('.gm-lived-entries .gm-life-row')).toHaveCount(1)
 await expect(page.getByText('Sin retorno registrado',{exact:true})).toBeVisible()
 await expect(page.getByText('Te ayudó',{exact:true})).toHaveCount(0)
 await page.reload();await expect(page.getByRole('button',{name:'Cuenta',exact:true})).toBeEnabled()
 await page.getByRole('button',{name:'Experiencias vividas',exact:true}).click()
 await expect(page.locator('.gm-lived-entries .gm-life-row')).toHaveCount(1)
})
