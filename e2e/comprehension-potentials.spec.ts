import {disclose,adjustReading,chooseFaro} from './experience-actions'
import {test,expect} from './fixtures'
import {personalBackend} from './support/personal-backend'
test('Listening returns editable potentials before choosing a Faro and preserves them into its agreement',async({page})=>{
 const b=await personalBackend(page,{proposals:true});await page.goto('/')
 const words='Quiero escuchar a mis hijos y cuidar nuestro vínculo.'
 await page.getByLabel('¿Qué está vivo hoy?').fill(words);await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await expect(page.getByRole('heading',{name:'¿Te representa?'})).toBeVisible()
 await expect(page.getByRole('heading',{name:'Potenciales que podrías nutrir'})).toBeVisible()
 await disclose(page,'.gm-agreement-adjust');await page.getByRole('button',{name:'Aceptar Escuchar con presencia'}).click()
 await page.getByText('Significado y contexto de Escuchar con presencia',{exact:true}).click()
 await page.getByLabel('Para este Momento significa').fill('Escuchar sin el teléfono')
 await adjustReading(page);await page.getByLabel('Dirección posible').fill('Cuidar la conversación en casa')
 expect(b.calls).not.toContain('lumen_faro_review_confirm')
 await chooseFaro(page)
 await expect(page.getByLabel('Orientación de mi Faro')).toHaveValue('Cuidar la conversación en casa')
 await page.getByText('Significado y contexto de Escuchar con presencia',{exact:true}).click()
 await expect(page.getByLabel('Para este Faro significa')).toHaveValue('Escuchar sin el teléfono')
 await page.getByRole('button',{name:'Confirmar lo que quiero nutrir'}).click();await page.getByRole('button',{name:'Activar memoria y guardar'}).click()
 await expect(page.getByRole('heading',{name:'Tu Constelación'})).toBeVisible()
 expect(b.parameters[0].p_items).toMatchObject([{label:'Escuchar con presencia',contextual_meaning:'Escuchar sin el teléfono'}])
 await page.screenshot({path:`test-results/comprehension-potentials-${test.info().project.name}.png`,fullPage:true})
})
test('Punctual review sends only accepted potentials and creates no Faro',async({page})=>{
 const b=await personalBackend(page,{proposals:true});const reviews:Array<Record<string,unknown>>=[]
 await page.route('**/rest/v1/rpc/lumen_s1_review_moment',async r=>{reviews.push(r.request().postDataJSON());await r.fulfill({json:{state:'reviewed'}})})
 await page.goto('/');await page.getByLabel('¿Qué está vivo hoy?').fill('Quiero escuchar mejor.');await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await disclose(page,'.gm-agreement-adjust');await page.getByRole('button',{name:'Aceptar Escuchar con presencia'}).click();await page.getByRole('button',{name:'Está bien',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Tu Constelación'})).toBeVisible()
 expect(reviews[0].p_potential_items).toMatchObject([{label:'Escuchar con presencia'}]);expect(b.calls).not.toContain('lumen_faro_review_confirm')
})
test('Mi Vida title is printed inside its image header',async({page})=>{
 await page.goto('/mi-vida');const hero=page.locator('.gm-map-hero');await expect(hero.getByRole('heading',{name:'Mi Vida',exact:true})).toBeVisible()
 const image=await hero.locator('img').boundingBox(),title=await hero.locator('h1').boundingBox();expect(image).not.toBeNull();expect(title).not.toBeNull()
 expect(title!.y).toBeGreaterThanOrEqual(image!.y);expect(title!.y+title!.height).toBeLessThanOrEqual(image!.y+image!.height)
 await page.screenshot({path:`test-results/mi-vida-title-${test.info().project.name}.png`,fullPage:true})
})
