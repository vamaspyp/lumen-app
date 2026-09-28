import {test,expect} from '@playwright/test'
test.describe('LUMEN golden master',()=>{
 test.beforeEach(async({page})=>{await page.goto('/?vnext=1')})
 test('personal flow reaches identity boundary',async({page})=>{
  await expect(page.getByRole('heading',{name:'Una vida más tuya.'})).toBeVisible()
  await page.getByText('Cuéntame en qué momento estás...').click()
  await expect(page.getByRole('heading',{name:'¿Qué estás viviendo hoy?'})).toBeVisible()
  await page.getByRole('button',{name:'Continuar'}).click()
  await expect(page.getByRole('dialog',{name:'Entrar a LUMEN'})).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
 })
 test('canonical destinations stay reachable',async({page})=>{
  for(const x of ['Inicio','Explorar','Mi Vida','Comunidad','Biblioteca']) await expect(page.getByText(x,{exact:true})).toBeVisible()
  await page.getByText('Explorar',{exact:true}).click();await expect(page.getByRole('heading',{name:'Explorar el Territorio'})).toBeVisible()
  await page.getByText('Mi Vida',{exact:true}).click();await expect(page.getByRole('heading',{name:'Mi Mapa Vivo'})).toBeVisible()
  await page.getByText('Comunidad',{exact:true}).click();await expect(page.getByRole('heading',{name:'Impacto y Aprendizaje'})).toBeVisible()
  await page.getByText('Biblioteca',{exact:true}).click();await expect(page.getByRole('heading',{name:'Tu Constelación'})).toBeVisible()
 })
 test('mobile has no horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  const d=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}))
  expect(d.sw).toBeLessThanOrEqual(d.cw)
 })
})