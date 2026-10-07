import type {Page} from '@playwright/test'
export async function disclose(page:Page,selector:string){const d=page.locator(selector).first();await d.waitFor({state:'attached'});if(!await d.evaluate(e=>(e as HTMLDetailsElement).open))await d.locator(':scope > summary').click()}
export async function adjustReading(page:Page){if(!await page.locator('.gm-reading-adjust').isVisible())await page.getByRole('button',{name:'Ajustar',exact:true}).click()}
export async function chooseFaro(page:Page){await disclose(page,'.gm-cultivate-choice');await page.getByRole('button',{name:'Cuidar esto como un Faro'}).click();await disclose(page,'.gm-faro-edit');await disclose(page,'.gm-original');await disclose(page,'.gm-agreement-adjust')}
export async function editFaro(page:Page){await disclose(page,'.gm-faro-edit');await disclose(page,'.gm-agreement-adjust')}
export async function offerReturn(page:Page){await disclose(page,'.gm-finished > details');await page.getByRole('button',{name:'Contarle a LUMEN cómo me fue'}).click()}
export async function composeOptions(page:Page){await disclose(page,'.gm-compose-options')}
export async function writeSanctuary(page:Page){await disclose(page,'.gm-san-writing')}
