import {test,expect} from './fixtures'
import AxeBuilder from '@axe-core/playwright'
test('Five doors retain WCAG A/AA structure and keyboard navigation',async({page})=>{
 for(const route of ['/','/mi-vida','/explorar','/tejido','/santuario']){
  await page.goto(route);await expect(page.locator('.gm-nav')).toBeVisible()
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
  expect.soft(result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([])
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy()
 }
 await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement!==document.body)).toBeTruthy()
})
