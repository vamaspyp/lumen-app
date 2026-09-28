import {test,expect,type Page} from '@playwright/test'

// Regression double only: this suite never certifies live identity or persistence.
// All Auth and RPC calls are intercepted; live certification remains a separate gate.
async function backend(page:Page, signedIn=false){
 const origin='https://vbuixagaguasejputubp.supabase.co'
 const calls: string[]=[]
 let memory=false
 let faro: {trajectory_id:string;faro_text:string;status:string;path:unknown[]} | null=null
 const entries: {entry_id:string;entry_kind:string;title:string;content:string;source_help_id:string}[]=[]
 let failNextRead=false
 const session={access_token:'regression-only-token',refresh_token:'regression-only-refresh',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'regression-user',aud:'authenticated',role:'authenticated',email:'regression@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-09-28T00:00:00Z'}}
 if(signedIn)await page.addInitScript(s=>localStorage.setItem('sb-vbuixagaguasejputubp-auth-token',JSON.stringify(s)),session)
 await page.route(`${origin}/auth/v1/**`,async route=>{await route.fulfill({json:route.request().url().includes('/verify')?session:{}})})
 const resource={help_id:'help-1',help_type:'practice',title:'Pausa real de prueba',summary:'Una pausa de prueba',content:{steps:['Detenete un momento.']},duration_minutes:2,areas:[],capacities:[]}
 await page.route(`${origin}/rest/v1/rpc/**`,async route=>{
  const name=route.request().url().split('/').pop()!;calls.push(name)
  const p=route.request().postDataJSON()||{}
  let data:unknown={}
  if(name==='lumen_bootstrap_person')data={person_id:'person-test',preferences:{memory_allowed:memory}}
  else if(name==='lumen_s2_snapshot')data={memory_allowed:memory,trajectories:faro?[faro]:[],repertoire:[],sanctuary_count:entries.length}
  else if(name==='lumen_s2_list_sanctuary'){
   if(failNextRead){failNextRead=false;await route.fulfill({status:503,json:{message:'Lectura temporalmente no disponible'}});return}
   data=entries
  }
  else if(name==='lumen_living_map_snapshot')data={memory_allowed:memory,direction:memory&&faro?[{faro_id:faro.trajectory_id,text:faro.faro_text,status:'active'}]:[],potential:[],conditions:[],realization:[],epistemic_note:memory?'Mapa de prueba, parcial y corregible.':'El Mapa Vivo requiere memoria consentida.'}
  else if(name==='lumen_s1_accompany_moment')data={episode_id:'episode-test',moment_id:'moment-test',interpretation:{capacity_keys:[]}}
  else if(name==='lumen_s1_moment_constellation')data={items:[resource]}
  else if(name==='lumen_s2_create_trajectory'||name==='lumen_s2_create_trajectory_from_moment'){faro={trajectory_id:'faro-test',faro_text:p.p_faro_text,status:'active',path:[]};data=faro}
  else if(name==='lumen_s2_update_trajectory'){if(faro)faro.faro_text=p.p_faro_text.trim();data={updated:true}}
  else if(name==='lumen_s2_set_memory'){memory=p.p_enabled;data={memory_allowed:memory}}
  else if(name==='lumen_s2_save_sanctuary'){
   if(!memory){await route.fulfill({status:403,json:{message:'memory consent required'}});return}
   const entry={entry_id:`entry-${entries.length+1}`,entry_kind:p.p_entry_kind,title:p.p_title,content:p.p_content,source_help_id:p.p_source_help_id};entries.push(entry);data={entry_id:entry.entry_id}
  }
  await route.fulfill({json:data})
 })
 return {calls,entries,failRead:()=>{failNextRead=true}}
}
async function momentToReturn(page:Page){
 await page.getByText('Cuéntame en qué momento estás...').click()
 await page.locator('.gm-moment textarea').fill('Mi trabajo me agota y quiero cultivar calma al volver a casa.')
 await page.getByRole('button',{name:'Continuar'}).click()
 await page.getByRole('button',{name:'Ver mi Faro'}).click()
 await page.getByRole('button',{name:'Abrir una constelación para avanzar'}).click()
 await page.getByText('Pausa real de prueba',{exact:true}).click()
 await page.getByRole('button',{name:'Marcar como realizada'}).click()
 await page.locator('.gm-return textarea').fill('Reflexión única de regresión')
}
test('OTP completion resumes the pending Momento once',async({page})=>{
 const b=await backend(page)
 await page.goto('/?vnext=1')
 await page.getByText('Cuéntame en qué momento estás...').click()
 await page.locator('.gm-moment textarea').fill('Mi trabajo me agota y quiero cultivar calma al volver a casa.')
 await page.getByRole('button',{name:'Continuar'}).click()
 await page.getByLabel('Email',{exact:true}).fill('regression@example.invalid')
 await page.getByRole('button',{name:'Enviar código',exact:true}).click()
 await page.getByLabel('Código',{exact:true}).fill('123456')
 await page.getByRole('button',{name:'Entrar',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Mi Mapa Vivo'})).toBeVisible()
 await expect(page.getByRole('dialog')).toHaveCount(0)
 expect(b.calls.filter(n=>n==='lumen_s1_accompany_moment')).toHaveLength(1)
})
test('Faro can be created without a Momento and reread after reload',async({page})=>{
 const b=await backend(page,true)
 await page.goto('/?vnext=1')
 await expect.poll(()=>b.calls.includes('lumen_living_map_snapshot')).toBe(true)
 await page.getByText('Mi Vida',{exact:true}).click()
 await page.getByRole('button',{name:'Ver mi Faro'}).click()
 await page.getByRole('button',{name:'Editar mi Faro'}).click()
 await page.locator('.gm-faro-main textarea').fill('Cuidar mi tiempo con calma')
 await page.getByRole('button',{name:'Guardar mi Faro'}).click()
 await expect(page.getByRole('button',{name:'Editar mi Faro'})).toBeVisible()
 expect(b.calls.filter(n=>n==='lumen_s2_create_trajectory')).toHaveLength(1)
 await page.reload()
 await page.getByText('Mi Vida',{exact:true}).click()
 await page.getByRole('button',{name:'Ver mi Faro'}).click()
 await expect(page.locator('.gm-faro-main blockquote')).toHaveText('Cuidar mi tiempo con calma')
})
test('return asks for memory, preserves refusal and rereads saved reflection',async({page})=>{
 const b=await backend(page,true)
 await page.goto('/?vnext=1')
 await expect.poll(()=>b.calls.includes('lumen_living_map_snapshot')).toBe(true)
 await momentToReturn(page)
 await page.getByRole('button',{name:'Guardar en mi Santuario'}).click()
 await expect(page.getByRole('dialog',{name:'Memoria personal'})).toBeVisible()
 await page.getByRole('button',{name:'Ahora no',exact:true}).click()
 expect(b.entries).toHaveLength(0)
 expect(b.calls).not.toContain('lumen_s2_set_memory')
 await page.getByRole('button',{name:'Guardar en mi Santuario'}).click()
 await page.getByRole('button',{name:'Activar memoria y guardar'}).click()
 await expect(page.getByRole('heading',{name:'Mi Santuario'})).toBeVisible()
 await expect(page.getByText('Reflexión única de regresión',{exact:true})).toBeVisible()
 expect(b.entries).toHaveLength(1)
 await page.reload()
 await expect.poll(()=>b.calls.filter(n=>n==='lumen_bootstrap_person').length).toBeGreaterThan(1)
 await page.getByRole('button',{name:'Cuenta',exact:true}).click()
 await page.getByRole('button',{name:'Reflexiones',exact:true}).click()
 await expect(page.getByText('Reflexión única de regresión',{exact:true})).toBeVisible()
})
test('retry after failed reread does not duplicate return or sanctuary entry',async({page})=>{
 const b=await backend(page,true)
 await page.goto('/?vnext=1')
 await expect.poll(()=>b.calls.includes('lumen_living_map_snapshot')).toBe(true)
 await momentToReturn(page)
 await page.getByRole('button',{name:'Guardar en mi Santuario'}).click()
 b.failRead()
 await page.getByRole('button',{name:'Activar memoria y guardar'}).click()
 await expect(page.getByText('No pudimos guardar el retorno')).toBeVisible()
 await expect(page.getByRole('heading',{name:'¿Cómo fue?'})).toBeVisible()
 expect(b.entries).toHaveLength(1)
 await page.getByRole('button',{name:'Guardar en mi Santuario'}).click()
 await expect(page.getByRole('heading',{name:'Mi Santuario'})).toBeVisible()
 expect(b.entries).toHaveLength(1)
 expect(b.calls.filter(n=>n==='lumen_s1_record_outcome')).toHaveLength(1)
})
