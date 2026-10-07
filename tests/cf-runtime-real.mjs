// Real Auth test session + actual PostgREST/RPC + browser. No personal transport mocks.
// Does not certify OTP delivery or HUMAN PASS. Fixture is synthetic, externally supplied and removed by operator after QA.
import {spawn} from 'node:child_process'
import {readFile,mkdir,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createClient} from '@supabase/supabase-js'
import {chromium} from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
const config=JSON.parse(await readFile(process.env.CF_TEST_FIXTURE,'utf8'))
const env=Object.fromEntries((await readFile('.env.production','utf8')).split(/\r?\n/).filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')),x.slice(x.indexOf('=')+1)]))
const db=createClient(env.VITE_LUMEN_SUPABASE_URL,env.VITE_LUMEN_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}})
const {data:auth,error:authError}=await db.auth.signInWithPassword({email:config.email,password:config.password});if(authError)throw authError
const rpc=async(name,params={})=>{const {data,error}=await db.rpc(name,params);if(error)throw new Error(name+': '+error.message);return data}
assert.equal(auth.user.user_metadata.synthetic_a63_cf_test,true,'only a synthetic QA account is permitted')
await rpc('lumen_bootstrap_person',{p_trace_id:crypto.randomUUID()});await rpc('lumen_privacy_forget_personal_memory',{p_confirm:true})
const sources=await rpc('lumen_source_discover',{p_area_key:null,p_capacity_key:null,p_help_type:null,p_locale:'es-AR',p_limit:100})
const practice=sources.find(s=>s.detail?.renderer_family==='practice'&&Array.isArray(s.content?.steps)&&s.content.steps.length>0)
assert(practice,'representative real practice unavailable')
const out=process.env.CF_TEST_OUTPUT||'cf-runtime-evidence';await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY,bypass:'localhost,127.0.0.1'}:undefined})
const server=process.env.CF_TEST_URL?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--port','5183','--strictPort'],{stdio:'ignore'})
if(server){for(let i=0;i<30;i++){try{if((await fetch('http://localhost:5183/')).ok)break}catch{}await new Promise(r=>setTimeout(r,300))}}
const results=[]
const disclose=async(page,selector)=>{const d=page.locator(selector).first();await d.waitFor({state:'attached'});if(!await d.evaluate(e=>e.open))await d.locator(':scope > summary').click()}
try{
 const context=await browser.newContext({viewport:process.env.CF_MOBILE?{width:390,height:844}:{width:1440,height:900},ignoreHTTPSErrors:true});const page=await context.newPage()
 await page.route(/https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)\//,r=>r.abort())
 await page.addInitScript(session=>localStorage.setItem('sb-vbuixagaguasejputubp-auth-token',JSON.stringify(session)),auth.session)
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log(JSON.stringify({page_error:e.message}))})
 const accessibility=[]
 const capture=async(name)=>{if(await page.getByRole('button',{name:'Cuenta',exact:true}).count())await expect(page.getByRole('button',{name:'Cuenta',exact:true})).toBeEnabled();for(const label of ['Leyendo tus palabras…','Leyendo tus preferencias…','Abriendo Fuente…'])await expect(page.getByText(label,{exact:true})).toHaveCount(0);const ax=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();accessibility.push({scene:name,violations:ax.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))});await page.locator('.gm-content').evaluate(el=>{el.scrollTop=0});await page.screenshot({path:out+'/'+name+'.png',fullPage:true});results.push(name)}
 const {expect:baseExpect}=await import('@playwright/test');const expect=baseExpect.configure({timeout:30000})
 page.on('requestfailed',r=>console.log(JSON.stringify({request_failed:new URL(r.url()).pathname,error:r.failure()?.errorText})))
 page.on('response',r=>{if(r.url().includes('/rpc/'))console.log(JSON.stringify({rpc:new URL(r.url()).pathname.split('/').pop(),status:r.status()}))})
 await page.goto(process.env.CF_TEST_URL||'http://localhost:5183/');await expect(page.getByRole('button',{name:'Cuenta',exact:true})).toBeEnabled()
 await capture('01-inicio-real')
 const original='Mi trabajo va bien. Quiero aprender a pintar y compartirlo con mi familia.'
 await page.getByLabel('¿Qué está vivo hoy?').fill(original);await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await expect(page.getByRole('heading',{name:'¿Te representa?'})).toBeVisible()
 await expect(page.getByRole('heading',{name:'Potenciales que podrías nutrir'})).toBeVisible()
 await expect(page.locator('.gm-reading-areas')).toBeVisible();await capture('02-comprension-nivel1-real');await page.getByRole('button',{name:'Ajustar',exact:true}).click();await disclose(page,'.gm-agreement-adjust');await page.getByLabel('Agregar uno con mis palabras').fill('Dar lugar a mi creatividad');await page.getByRole('button',{name:'Agregar potencial',exact:true}).click()
 const earlyPotential=page.locator('.gm-potential').last()
 await earlyPotential.getByLabel('Qué significa este potencial').fill('Crear sin apuro, con curiosidad')
 await earlyPotential.getByLabel('Para este Momento significa').fill('Pintar un momento posible y compartirlo')
 await capture('02-comprension-real')
 await disclose(page,'.gm-cultivate-choice');await page.getByRole('button',{name:'Cuidar esto como un Faro'}).click();await disclose(page,'.gm-faro-edit');await disclose(page,'.gm-agreement-adjust')
 await page.getByLabel('Orientación de mi Faro').fill('Aprender a crear y compartir con calma')
 const potential=page.locator('.gm-potential').last()
 await expect(potential.getByLabel('Potencial',{exact:true})).toHaveValue('Dar lugar a mi creatividad')
 await expect(potential.getByLabel('Qué significa este potencial')).toHaveValue('Crear sin apuro, con curiosidad')
 await expect(potential.getByLabel('Para este Faro significa')).toHaveValue('Pintar un momento posible y compartirlo')
 await capture('03-faro-area-potenciales-real')
 await page.getByRole('button',{name:'Confirmar lo que quiero nutrir'}).click()
 await expect(page.getByRole('dialog',{name:'Memoria personal'}).or(page.getByRole('heading',{name:'Tu Constelación'}))).toBeVisible()
 if(await page.getByRole('dialog',{name:'Memoria personal'}).isVisible())await page.getByRole('button',{name:'Activar memoria y guardar'}).click()
 await expect(page.getByRole('heading',{name:'Tu Constelación'})).toBeVisible()
 await expect(page.getByText('todavía no tengo una relación de Fuente suficientemente revisada.',{exact:false}).first()).toBeVisible()
 await capture('04-no-match-nivel1-real');await disclose(page,'.gm-compose-options');await page.getByRole('button',{name:'Conservar esta composición en Santuario'}).click()
 await expect(page.getByText('Composición conservada · versión 1')).toBeVisible()
 let entries=await rpc('lumen_s2_list_sanctuary');const conserved=entries.find(e=>e.composition);assert(conserved)
 assert.equal(conserved.composition.versions[0].agreement.original_expression,original)
 assert.equal(conserved.composition.versions[0].agreement.items[0].label,'Dar lugar a mi creatividad')
 assert.equal(conserved.composition.versions[0].agreement.items[0].contextual_meaning,'Pintar un momento posible y compartirlo')
 await capture('04-no-match-conservacion-real')
 await page.getByRole('button',{name:'Enriquecer desde Explorar'}).click()
 await page.getByLabel('Buscar una posibilidad').fill(practice.title)
 const card=page.locator('.gm-context-card').filter({hasText:practice.title}).first()
 await card.getByRole('button',{name:'Elegir para mi Constelación'}).click()
 await disclose(page,'.gm-compose-options');await page.getByRole('button',{name:'Conservar una nueva versión'}).click()
 await expect(page.getByText('Composición conservada · versión 2')).toBeVisible();await capture('05-enriquecida-real')
 entries=await rpc('lumen_s2_list_sanctuary');const version2=entries.find(e=>e.entry_id===conserved.entry_id);assert.equal(version2.composition.versions.length,2);assert.equal(version2.composition.versions[1].items[0].help_id,practice.help_id)
 await page.locator('.gm-context-card').filter({hasText:practice.title}).getByRole('button').first().click()
 await expect(page.locator('.experience')).toBeVisible();await capture('06-vivir-practica-real')
 for(let i=0;i<20&&page.url().includes('/vivir');i++){
  const next=page.getByRole('button',{name:'Seguir',exact:true});if(await next.isVisible())await next.click();else{const done=page.getByRole('button',{name:/Marcar como realizada|Terminar|Volver a LUMEN|Volver después|Finalizar/}).first();if(await done.isVisible())await done.click();else{await page.getByRole('button',{name:'Salir cuando quieras'}).click();break}}
 }
 await expect(page.getByRole('heading',{name:'Terminaste.'})).toBeVisible();await capture('07-terminada-sin-feedback-real');await expect(page.getByRole('button',{name:'Me ayudó',exact:true})).toHaveCount(0);await disclose(page,'.gm-finished > details');await disclose(page,'.gm-finished .gm-return-save');await page.getByRole('checkbox',{name:'Conservar este recurso en mi Santuario'}).check();await page.getByRole('button',{name:'Conservar en mi Santuario'}).click();await expect(page.getByText('Conservado en tu Santuario y verificado.',{exact:false})).toBeVisible();assert.equal((await rpc('lumen_living_map_snapshot')).realization.length,0,'saving must not imply feedback');await capture('07-guardar-sin-feedback-real');await page.getByRole('button',{name:'Santuario',exact:true}).click();await page.getByRole('button',{name:'Experiencias vividas',exact:true}).click();await expect(page.getByText('Sin retorno registrado',{exact:true})).toBeVisible();await expect(page.locator('.gm-lived-entries .gm-life-row')).toHaveCount(1);await capture('07-vivida-sin-feedback-real');assert.equal((await rpc('lumen_living_map_snapshot')).realization.length,0);await page.goBack();await expect(page.getByRole('heading',{name:'Terminaste.'})).toBeVisible();await disclose(page,'.gm-finished > details');await page.getByRole('button',{name:'Contarle a LUMEN cómo me fue'}).click()
 await page.getByRole('button',{name:'Me ayudó',exact:true}).click();await page.getByRole('button',{name:'Listo',exact:true}).click();await expect(page.getByText('Tu señal quedó registrada.')).toBeVisible()
 await capture('07-retorno-real')
 await page.getByText('¿Quiero volver a practicarlo?',{exact:true}).click()
 await page.getByLabel('Quiero conservar este ritmo y permitir esta invitación en Inicio').check()
 await page.getByRole('button',{name:'Acordar mi práctica',exact:true}).click();await expect(page.getByText('Quedó acordado.',{exact:false})).toBeVisible();await capture('08-ritmo-consentido-real')
 const practices=await rpc('lumen_recurring_practice_snapshot');assert(practices.some(p=>p.help_id===practice.help_id))
 await page.getByRole('button',{name:'Abrir mi Santuario',exact:true}).click()
 await page.getByRole('button',{name:'Constelaciones conservadas',exact:true}).click();await page.getByText('Aprender a crear y compartir con calma',{exact:true}).first().click();await capture('09-santuario-composicion-viva-real');await page.getByRole('button',{name:'Recuperar mi composición'}).click()
 await disclose(page,'.gm-compose-options');await expect(page.getByText('Composición conservada · versión 2')).toBeVisible();await capture('09-recuperacion-real')
 await page.getByText('Versiones que conservé',{exact:true}).click();await page.getByRole('button',{name:'Recuperar versión 1',exact:true}).click()
 await expect(page.getByText('Composición conservada · versión 3')).toBeVisible();await expect(page.locator('.gm-context-card')).toHaveCount(0)
 await capture('10-restauracion-sin-perdida-real')
 for(const label of ['Mi Vida','Explorar','Tejido','Santuario']){await page.goto((process.env.CF_TEST_URL||'http://localhost:5183/').replace(/\?.*$/,'')+({'Mi Vida':'mi-vida','Explorar':'explorar','Tejido':'tejido','Santuario':'santuario'}[label]));await expect(page.getByRole('button',{name:'Cuenta',exact:true})).toBeEnabled();await expect(page.locator('.gm-nav')).toBeVisible();if(label==='Mi Vida'){await expect(page.locator('.gm-area-grid button').first()).toBeVisible();const ib=await page.locator('.gm-map-hero img').boundingBox(),hb=await page.locator('.gm-map-hero h1').boundingBox();assert(ib&&hb&&hb.y>=ib.y&&hb.y+hb.height<=ib.y+ib.height,'Mi Vida title must be over the image')};await capture('puerta-'+label.replace(' ','-'));await page.locator('.gm-content').evaluate(el=>{el.scrollTop=el.scrollHeight});await page.screenshot({path:out+'/puerta-'+label.replace(' ','-')+'-inferior.png'});results.push('puerta-'+label.replace(' ','-')+'-inferior')}
 const base=(process.env.CF_TEST_URL||'http://localhost:5183/').replace(/\?.*$/,'')
 await page.goto(base+'mi-vida');await expect(page.getByRole('button',{name:'Cuenta',exact:true})).toBeEnabled();await expect(page.locator('.gm-area-grid button').first()).toBeVisible();await page.locator('.gm-area-grid button').first().click();await capture('area-mi-vida-real')
 await page.goto(base+'explorar');for(const mode of ['Por potencial','Por área','Por momento','Libre']){await page.getByRole('button',{name:mode,exact:true}).click();await capture('explorar-'+mode.replaceAll(' ','-')+'-real')}
 for(const kind of ['Piezas guardadas','Experiencias vividas','Reflexiones','Constelaciones conservadas','Lo propio']){await page.goto(base+'santuario');await expect(page.getByRole('button',{name:'Cuenta',exact:true})).toBeEnabled();await expect(page.getByRole('button',{name:kind,exact:true})).toBeVisible();await page.getByRole('button',{name:kind,exact:true}).click();await capture('santuario-'+kind.replaceAll(' ','-')+'-real')}
 await page.goto(base+'mi-vida');await expect(page.getByRole('button',{name:'Cuenta',exact:true})).toBeEnabled();await page.getByRole('button',{name:'LUMI: opciones y ayuda de este espacio'}).click();await capture('lumi-contextual-real');await page.getByRole('button',{name:'Hablar con LUMI',exact:true}).click();await capture('lumi-conversacion-invocada-real');await page.getByRole('button',{name:'Cerrar LUMI'}).click()
 await page.goto(base+'ajustes');await expect(page.getByLabel('Atmósfera',{exact:true})).toBeVisible();await capture('ajustes-real')
 await page.goto(base+'aprender');await expect(page.getByRole('switch')).toBeVisible();await capture('aprendizaje-real')
 const coreErrorCount=errors.length
 const media=[]
 if(process.env.CF_MEDIA){
  for(const item of sources.filter(x=>x.content?.audio_url)){
   await page.goto((process.env.CF_TEST_URL||'http://localhost:5183/').replace(/\?.*$/,'')+'vivir/'+item.help_id)
   await expect(page.locator('audio')).toHaveCount(1);await page.getByRole('button',{name:'Reproducir',exact:true}).click()
   await page.waitForFunction(()=>{const a=document.querySelector('audio');return a&&!a.paused&&a.currentTime>0},null,{timeout:30000})
   media.push({help_id:item.help_id,type:'audio',result:'PASS actual playback',position:await page.locator('audio').evaluate(a=>a.currentTime)});await capture('media-'+item.canonical_code)
   await page.getByRole('button',{name:'Pausar',exact:true}).click()
  }
  for(const item of sources.filter(x=>x.content?.video_embed_url)){
   await page.goto((process.env.CF_TEST_URL||'http://localhost:5183/').replace(/\?.*$/,'')+'vivir/'+item.help_id)
   await page.getByRole('button',{name:'Reproducir video original'}).click()
   try{const frame=page.frameLocator('iframe');await frame.getByRole('button',{name:/Play|Reproducir/}).first().click({timeout:15000});await frame.locator('video').evaluate(v=>v.play());await expect.poll(async()=>frame.locator('video').evaluate(v=>v.currentTime)).toBeGreaterThan(0);media.push({help_id:item.help_id,type:'video',result:'PASS actual playback'})}catch(e){media.push({help_id:item.help_id,type:'video',result:'BLOCK playback not demonstrated',reason:String(e.message).slice(0,250)})}
   await capture('media-'+item.canonical_code)
   if(media.at(-1).result.startsWith('BLOCK')){
    await page.getByRole('button',{name:'El reproductor no funciona',exact:true}).click()
    await expect(page.locator('iframe')).toHaveCount(0)
    await expect(page.getByRole('button',{name:'Reintentar video',exact:true})).toBeFocused()
    await expect(page.getByRole('heading',{name:'Terminaste.',exact:true})).toHaveCount(0)
    await expect(page.getByRole('link',{name:'Ver en la fuente original',exact:false}).first()).toHaveAttribute('href',/^https:/)
    await capture('media-'+item.canonical_code+'-salida-independiente')
   }
  }
 }
 assert.equal(coreErrorCount,0,errors.slice(0,coreErrorCount).join('\n'))
 await writeFile(out+'/result.json',JSON.stringify({result:'PASS real Auth/RPC/browser',otp_human_pass:false,mocked_personal_requests:0,original_preserved:true,immutable_versions:true,recurrence_persisted:true,captures:results,media,accessibility,corePageErrors:errors.slice(0,coreErrorCount),mediaPageErrors:errors.slice(coreErrorCount)},null,2))
 console.log(JSON.stringify({result:'PASS',captures:results.length,backend:'real',otp_human_pass:false}))
}finally{await db.auth.signOut();await browser.close();server?.kill()}
