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
