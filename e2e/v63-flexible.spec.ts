import {test,expect} from './fixtures'
import {personalBackend} from './support/personal-backend'
test('A63 B3 expands a reviewed constellation while preserving exclusions',async({page})=>{
 await personalBackend(page)
 const items=Array.from({length:7},(_,i)=>({help_id:`flex-${i}`,canonical_code:`flex-${i}`,help_type:'practice',detail:{renderer_family:'practice'},title:`Gesto posible ${i+1}`,summary:'Prueba de flexibilidad de interfaz.',content:{steps:['Un gesto propio.']},provider:{name:'Fixture de contrato'},duration_minutes:2,context_reason:'Pertinencia revisada.',context_origin:'fuente'}))
 await page.route('**/rest/v1/rpc/lumen_s1_moment_constellation',r=>r.fulfill({json:{items:items.slice(0,r.request().postDataJSON().p_limit)}}))
 await page.goto('/');await page.getByLabel('¿Qué está vivo hoy?').fill('Quiero cuidar mi descanso.')
 await page.getByRole('button',{name:'Contar',exact:true}).click();await page.getByRole('button',{name:'Ver qué puede ayudar',exact:true}).click()
 await expect(page.locator('.gm-context-card')).toHaveCount(3)
 await page.getByRole('button',{name:'Quitar Gesto posible 1',exact:true}).click()
 await page.getByRole('button',{name:'Ampliar esta selección',exact:true}).click()
 await expect(page.locator('.gm-context-card')).toHaveCount(6)
 await expect(page.getByText('Gesto posible 1',{exact:true})).toHaveCount(0)
 await page.getByText('Gesto posible 5',{exact:true}).click()
 await expect(page.getByRole('heading',{name:'Un gesto propio.'})).toBeVisible()
 await page.screenshot({path:`test-results/v63-expanded-${test.info().project.name}.png`,fullPage:true})
})
