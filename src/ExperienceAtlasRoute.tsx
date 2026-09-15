import { useState } from 'react'
import { ExperienceSurface, PossibilityPreview } from './ExperienceField'
import type { HelpPossibility } from './greenfield/application/s1'
import './experience-field.css'

const sample = (help_type: string, title: string, summary: string, content: Record<string, unknown> = {}): HelpPossibility => ({
  help_id: `a63-${help_type}`, help_version_id: `a63-${help_type}-v1`, help_type, title, summary, content, duration_minutes: 4, energy: 'low', detail: { certification_only: true, authority: 'V55 + Atlas Premium A63' },
})

const families: HelpPossibility[] = [
  sample('reflection','Una pregunta que deja espacio','Lectura editorial para sostener una perspectiva sin convertirla en respuesta.',{paragraphs:['Hay momentos en que una respuesta rápida achica lo que todavía necesita ser mirado.','Una perspectiva puede servir no porque cierre algo, sino porque devuelve libertad para verlo de otra manera.'],pull_quote:'No todo lo importante necesita resolverse hoy.',prompts:['¿Qué cambia si no intentás cerrar esto todavía?']}),
  sample('practice','Volver al cuerpo','Una práctica guiada que se retira progresivamente.',{steps:['Aflojá apenas la mandíbula y los hombros.','Notá dos puntos de apoyo.','Exhalá un poco más lento, sin forzar.','Elegí una acción pequeña que pertenezca a los próximos diez minutos.']}),
  sample('audio','Escuchar sin mirar','Muestra técnica de la experiencia de escucha. El contenido editorial definitivo pertenece a la revisión de Fuente.',{audio_url:'https://github.com/mdn/learning-area/raw/refs/heads/main/html/multimedia-and-embedding/tasks/media-embed/media/audio.mp3',transcript:['Muestra técnica de audio para certificar reproducción, foco y retirada visual.']}),
  sample('video','Mirar con atención completa','Muestra técnica audiovisual para certificar el tratamiento full-bleed; no es contenido editorial de Fuente.',{video_url:'https://github.com/mdn/learning-area/raw/refs/heads/main/html/multimedia-and-embedding/tasks/media-embed/media/video.mp4'}),
  sample('external_resource','Una obra que sigue siendo de su fuente','LUMEN acompaña hasta la puerta y preserva procedencia.',{external_url:'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video'}),
  sample('human_action','Una conversación que ocurre afuera','Una acción real breve cuyo valor sucede fuera de la pantalla.',{steps:['Elegí a una persona con la que valga la pena hablar.','Decile una sola cosa verdadera que todavía no dijiste.']}),
  sample('professional_support','Hablar con alguien preparado','La experiencia muestra propósito, límites y salida hacia apoyo humano.',{boundaries:['no reemplaza emergencia','la persona elige si contactar'],contact:'https://www.who.int/'}),
  sample('circle','Un círculo pequeño','Presencia colectiva deliberada, sin feed ni métricas sociales.',{boundaries:['por invitación','salida libre','sin ranking']}),
  sample('place','Salir a un lugar que ayude','Una transición clara hacia un lugar o servicio real.',{where:'fuera de LUMEN',when:'cuando tenga sentido para vos',steps:['Revisá condiciones reales antes de ir.']}),
  sample('material_help','Ayuda concreta','Condiciones, disponibilidad y límites visibles sólo cuando importan.',{availability:'verificar antes de salir',cost:'informar si aplica'}),
  sample('quiet','Quedarse un momento','Una experiencia legítima de no-hacer.',{}),
]

export default function ExperienceAtlasRoute(){
  const [selected,setSelected]=useState<HelpPossibility|null>(null)
  return <main className="lumen-field"><section className="field-scene"><p className="field-eyebrow">A63 · CERTIFICACIÓN MATERIAL · NO ES FUENTE</p><h1>Gramática vivible de posibilidades.</h1><p className="field-copy">Este atlas existe sólo para demostrar que el runtime real puede expresar todas las familias exigidas por V55 sin renderer universal. Audio y video usan assets técnicos de prueba; la curaduría premium de Fuente se revisa después.</p><div className="possibility-grid">{families.map((help)=><PossibilityPreview key={help.help_id} help={help} onOpen={()=>setSelected(help)}/>)}</div></section>{selected&&<ExperienceSurface help={selected} onExit={()=>setSelected(null)}/>}</main>
}
