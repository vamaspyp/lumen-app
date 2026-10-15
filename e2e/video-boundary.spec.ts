import {test,expect} from './fixtures'

// Real public Source; only the third-party player transport is replaced to test failure recovery.
// This is not evidence of audiovisual playback or provider accessibility.
test('video failure has an independent source exit, retry and restored keyboard focus',async({page})=>{
 await page.route('https://www.youtube-nocookie.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html lang="es"><title>Proveedor de prueba</title><body>Reproductor no disponible</body></html>'}))
 await page.goto('/explorar')
 await expect(page.getByRole('button',{name:'Cuenta',exact:true})).toBeEnabled()
 await page.getByText('Filtros de esta búsqueda',{exact:true}).click()
 await page.getByRole('button',{name:'Experiencias',exact:true}).click()
 const title='Si el cerebro fuera una orquesta, la respiración sería el director'
 for(let i=0;i<12&&!await page.getByText(title,{exact:true}).count();i++)await page.getByRole('button',{name:'Ver otras posibilidades',exact:true}).click()
 await page.locator('.gm-context-card').filter({hasText:title}).getByRole('button',{name:'Conocer esta posibilidad',exact:true}).click()
 await page.getByRole('button',{name:'Empezar',exact:true}).click()
 const play=page.getByRole('button',{name:'Reproducir video original',exact:true})
 await expect(play).toBeVisible({timeout:20000})
 await expect(page.locator('iframe')).toHaveCount(0)
 await page.getByRole('link',{name:'Ver en la fuente original',exact:false}).first().click({trial:true})
 await play.focus();await page.keyboard.press('Enter')
 const frame=page.locator('iframe');await expect(frame).toHaveCount(1)
 await expect(frame).toHaveAttribute('referrerpolicy','strict-origin-when-cross-origin')
 await expect(frame).toHaveAttribute('src',/autoplay=0/)
 await expect(frame).toHaveAttribute('src',/origin=http%3A%2F%2Flocalhost%3A5183/)
 const box=await frame.boundingBox();expect(box?.height).toBeGreaterThanOrEqual(200)
 await page.getByRole('button',{name:'El reproductor no funciona',exact:true}).click()
 await expect(page.locator('iframe')).toHaveCount(0)
 const retry=page.getByRole('button',{name:'Reintentar video',exact:true})
 await expect(retry).toBeFocused();await expect(page.getByRole('status')).toContainText('fuente original')
 await expect(page.getByRole('heading',{name:'Terminaste.',exact:true})).toHaveCount(0)
 await retry.click();await expect(frame).toHaveCount(1)
 await page.locator('.experience-back').click()
 await expect(frame).toHaveCount(0)
})
