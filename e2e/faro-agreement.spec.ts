import {disclose,adjustReading,chooseFaro,editFaro,composeOptions} from './experience-actions'
import {test,expect} from './fixtures'
import {personalBackend} from './support/personal-backend'
test('Prototype backbone retains words, accepts an open potential, asks consent and gates longitudinal composition',async({page})=>{
 const b=await personalBackend(page);await page.goto('/');const words='Estoy agotada y quiero estar más presente con mis hijos.'
 await page.getByLabel('¿Qué está vivo hoy?').fill(words);await page.getByRole('button',{name:'Continuar',exact:true}).click();await chooseFaro(page)
 await expect(page.locator('.gm-original blockquote')).toHaveText(words);await expect(page.getByLabel('Orientación de mi Faro')).toHaveValue(words)
 expect(b.calls).not.toContain('lumen_s2_create_trajectory_from_moment')
 await page.getByLabel('Agregar uno con mis palabras').fill('Parar sin culparme');await page.getByRole('button',{name:'Agregar potencial',exact:true}).click();await page.getByLabel('Para este Faro significa').fill('Descansar antes de llegar al límite')
 await page.getByRole('button',{name:'Confirmar lo que quiero nutrir'}).click();await expect(page.getByRole('dialog',{name:'Memoria personal'})).toBeVisible();expect(b.calls).not.toContain('lumen_faro_review_confirm')
 await page.getByRole('button',{name:'Ahora no',exact:true}).click();await expect(page.getByLabel('Para este Faro significa')).toHaveValue('Descansar antes de llegar al límite')
 await page.getByRole('button',{name:'Confirmar lo que quiero nutrir'}).click();await page.getByRole('button',{name:'Activar memoria y guardar'}).click();await expect(page.getByRole('heading',{name:'Tu Constelación'})).toBeVisible();await expect(page.locator('.gm-empty').filter({hasText:'Todavía no tengo una relación de Fuente suficientemente revisada.'})).toBeVisible()
 expect(b.parameters).toHaveLength(1);expect(b.parameters[0].p_items).toMatchObject([{label:'Parar sin culparme',concept_id:null,origin:'person',status:'reformulated'}]);expect(b.calls.filter(n=>n==='lumen_faro_constellation')).toHaveLength(1)
 await composeOptions(page);await page.getByRole('button',{name:'Revisar mi Faro y lo acordado'}).click();await expect(page.getByText('Parar sin culparme',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Revisar este acuerdo'}).click();await disclose(page,'.gm-agreement-adjust');await page.getByRole('button',{name:'Quitar Parar sin culparme'}).click();await page.getByRole('button',{name:'Seguir sin potenciales'}).click();await expect.poll(()=>b.parameters.length).toBe(2);expect(b.parameters[1].p_items).toMatchObject([{status:'withdrawn'}])
 await page.screenshot({path:`test-results/prototype-agreement-${test.info().project.name}.png`,fullPage:true})
})
test('Free exploration, Faro draft and punctual guidance remain possible without a personal agreement',async({page})=>{
 const b=await personalBackend(page);await page.goto('/');await page.locator('.gm-nav').getByText('Mi Vida',{exact:true}).click();await page.getByRole('button',{name:'Elegir un Faro'}).click();await editFaro(page);await expect(page.getByRole('heading',{name:'Mi Faro',exact:true})).toBeVisible();expect(b.calls).not.toContain('lumen_faro_constellation');await disclose(page,'.gm-flow-alternatives > details');await page.getByRole('button',{name:'Prefiero una guía puntual'}).click();await expect(page.getByLabel('Contá tu momento')).toBeVisible();expect(b.calls).not.toContain('lumen_faro_review_confirm')
})

test('No-match still reaches comprehension and no constellation is generated before review',async({page})=>{
 const b=await personalBackend(page,{scene:'moment.no_match'})
 await page.goto('/');await page.getByLabel('¿Qué está vivo hoy?').fill('Estoy agotada y quiero cuidar a mi familia.');await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await expect(page.getByRole('heading',{name:'¿Te representa?'})).toBeVisible()
 expect(b.calls).not.toContain('lumen_s1_moment_constellation')
 await disclose(page,'.gm-agreement-adjust');await expect(page.getByRole('checkbox',{name:'Familia y cuidado'})).toBeChecked()
 await adjustReading(page);await page.getByLabel('Lo que entiendo',{exact:true}).fill('Quiero cuidar mi descanso.')
 await page.getByRole('checkbox',{name:'Familia y cuidado'}).uncheck()
 await page.getByRole('button',{name:'Está bien',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Tu Constelación'})).toBeVisible()
 expect(b.calls.indexOf('lumen_s1_review_moment')).toBeLessThan(b.calls.indexOf('lumen_s1_moment_constellation'))
})
test('Unaccepted hypotheses are excluded and regeneration preserves accepted and personal adjustments',async({page})=>{
 const b=await personalBackend(page,{proposals:true});await page.goto('/')
 await page.getByLabel('¿Qué está vivo hoy?').fill('Quiero escuchar mejor a mis hijos.');await page.getByRole('button',{name:'Continuar',exact:true}).click();await chooseFaro(page)
 await expect(page.getByRole('button',{name:'Aceptar Escuchar con presencia'})).toBeVisible()
 await expect(page.getByRole('button',{name:'Seguir sin potenciales',exact:true})).toBeEnabled()
 await disclose(page,'.gm-agreement-adjust');await page.getByRole('button',{name:'Aceptar Escuchar con presencia'}).click()
 await page.getByText('Significado y contexto de Escuchar con presencia',{exact:true}).click()
 await page.getByLabel('Orientación de mi Faro').fill('Aprender a conversar sin apuro')
 await page.getByRole('button',{name:'Proponer o regenerar desde mis palabras'}).click()
 await expect(page.getByLabel('Potencial',{exact:true})).toHaveCount(1)
 await expect.poll(()=>b.allParameters.filter(p=>p.proposal).at(-1)?.proposal).toMatchObject({p_faro_text:'Aprender a conversar sin apuro'})
 await page.getByLabel('Agregar uno con mis palabras').fill('Hacer lugar al juego');await page.getByRole('button',{name:'Agregar potencial',exact:true}).click()
 await page.getByRole('button',{name:'Proponer o regenerar desde mis palabras'}).click();await expect(page.getByLabel('Potencial',{exact:true})).toHaveCount(2)
 await expect(page.getByLabel('Potencial',{exact:true}).nth(1)).toHaveValue('Hacer lugar al juego')
 await disclose(page,'.gm-agreement-adjust');await expect(page.getByRole('checkbox',{name:'Familia y cuidado'})).toBeChecked()
})
test('A hypothesis never becomes accepted by pressing continue without reviewing it',async({page})=>{
 const b=await personalBackend(page,{proposals:true});await page.goto('/')
 await page.getByLabel('¿Qué está vivo hoy?').fill('Quiero escuchar a mis hijos.');await page.getByRole('button',{name:'Continuar',exact:true}).click();await chooseFaro(page)
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
 await page.getByLabel('¿Qué está vivo hoy?').fill('Quiero escuchar a mis hijos.');await page.getByRole('button',{name:'Continuar',exact:true}).click();await chooseFaro(page)
 await disclose(page,'.gm-agreement-adjust');await page.getByRole('button',{name:'Aceptar Escuchar con presencia'}).click()
 await page.getByText('Significado y contexto de Escuchar con presencia',{exact:true}).click()
 await page.getByLabel('Para este Faro significa').fill('Escuchar diez minutos sin el teléfono')
 await page.getByRole('checkbox',{name:'Familia y cuidado'}).uncheck()
 const proposalCount=b.calls.filter(n=>n==='lumen_faro_potential_proposal').length
 await disclose(page,'.gm-flow-alternatives > details');await page.getByRole('button',{name:'Explorar por mi cuenta',exact:true}).click()
 await page.goBack();await editFaro(page)
 await page.getByText('Significado y contexto de Escuchar con presencia',{exact:true}).click()
 await expect(page.getByLabel('Para este Faro significa')).toHaveValue('Escuchar diez minutos sin el teléfono')
 await expect(page.getByRole('checkbox',{name:'Familia y cuidado'})).not.toBeChecked()
 expect(b.calls.filter(n=>n==='lumen_faro_potential_proposal')).toHaveLength(proposalCount)
 expect(b.calls).not.toContain('lumen_faro_review_confirm')
})
