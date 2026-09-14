import { test, expect } from '@playwright/test';

const PATH='/a63-lumen-experience-field-v16-complete.html';

test.describe('A63 V16 complete relational Field',()=>{
  test.beforeEach(async({page})=>{await page.goto(PATH);});
  test('arrival preserves free expression and autonomous explore',async({page})=>{
    await expect(page.getByRole('heading',{name:'¿Qué está vivo ahora?'})).toBeVisible();
    await expect(page.getByLabel('Expresión libre')).toBeVisible();
    await page.getByRole('button',{name:'Quiero explorar'}).click();
    await expect(page.getByRole('heading',{name:'Podés andar sin pedir permiso.'})).toBeVisible();
  });
  test('Moment understanding remains tentative and correctable',async({page})=>{
    await page.getByRole('button',{name:'Compartir'}).click();
    await expect(page.getByText('Puedo equivocarme')).toBeVisible();
    await page.getByRole('button',{name:'No exactamente'}).click();
    await expect(page.getByText('Sólo una aclaración')).toBeVisible();
  });
  test('Source is heterogeneous and practice withdraws LUMI',async({page})=>{
    await page.getByRole('button',{name:'Explorar'}).first().click();
    await page.getByText('Explorar posibilidades').click();
    await expect(page.getByText('AYUDA CONCRETA')).toBeVisible();
    await page.getByText('Dos minutos de espacio').first().click();
    await expect(page.getByText('LUMI P0/P1')).toBeVisible();
  });
  test('return supports uncertainty and release without forced progress',async({page})=>{
    await page.getByRole('button',{name:'Compartir'}).click();
    await page.getByRole('button',{name:'Sí, sigamos'}).click();
    await page.getByText('Dos minutos de espacio').first().click();
    await page.getByRole('button',{name:'Terminar'}).click();
    await page.getByRole('button',{name:'No sé todavía'}).click();
    await expect(page.getByText('No hace falta cerrar una conclusión ahora.')).toBeVisible();
  });
  test('Territory stays non-productivity and memory sovereign',async({page})=>{
    await page.getByRole('button',{name:'Explorar'}).first().click();
    await page.getByText('Recorrer lo mío').click();
    await expect(page.getByText('No es un dashboard sobre tu vida.')).toBeVisible();
    await page.getByText('Qué puede recordar LUMEN').click();
    await expect(page.getByText('Lo íntimo no se recolecta')).toBeVisible();
  });
  test('Tissue centers another life and exposes exit/report',async({page})=>{
    await page.getByRole('button',{name:'Explorar'}).first().click();
    await page.getByText('Acercarme a otras vidas').click();
    await page.getByText('Encontrarnos alrededor de algo').click();
    await page.getByRole('button',{name:'Entrar'}).click();
    await expect(page.getByText('Otra Vida está en el centro.')).toBeVisible();
    await expect(page.getByRole('button',{name:'Reportar'})).toBeVisible();
  });
  test('NO_MATCH is honest and safety is fail-closed',async({page})=>{
    await page.getByRole('button',{name:'QA · fisiología'}).click();
    await page.getByRole('button',{name:'NO_MATCH'}).click();
    await expect(page.getByText('No tengo algo suficientemente bueno')).toBeVisible();
    await page.getByRole('button',{name:'QA · fisiología'}).click();
    await page.getByRole('button',{name:'Safety'}).click();
    await expect(page.getByText('ayuda humana directa ahora')).toBeVisible();
  });
  test('proactivity exposes reason and immediate off switch',async({page})=>{
    await page.getByRole('button',{name:'QA · fisiología'}).click();
    await page.getByRole('button',{name:'Proactividad'}).click();
    await expect(page.getByText('porque vos lo pediste')).toBeVisible();
    await expect(page.getByRole('button',{name:'No me recuerdes esto'})).toBeVisible();
  });
});
