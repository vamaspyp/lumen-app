import { useState } from 'react'
import './MasterExact.css'

type Scene = 'home' | 'sanctuary' | 'practice' | 'resource' | 'integrate'

const LABELS: Record<Scene, string> = {
  home: 'Hoy',
  sanctuary: 'Tu constelación',
  practice: 'Práctica guiada',
  resource: 'Calma en lo cotidiano',
  integrate: 'Integrar esta experiencia',
}

function MasterExact() {
  const [scene, setScene] = useState<Scene>('home')
  const [toast, setToast] = useState('')
  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 1200)
  }

  return (
    <main className="master-exact-shell">
      <aside className="master-exact-rail" aria-label="Escenas del master visual">
        <div className="master-exact-brand">LUMEN</div>
        <div className="master-exact-kicker">MASTER EXACTO · REACT</div>
        <nav>
          {(Object.keys(LABELS) as Scene[]).map((id) => (
            <button key={id} className={scene === id ? 'active' : ''} onClick={() => setScene(id)}>
              {LABELS[id]}
            </button>
          ))}
        </nav>
        <p>La imagen visible es el master aprobado. React aporta navegación e interacción sin reinterpretar la composición.</p>
      </aside>

      <section className="master-exact-stage" aria-label={LABELS[scene]}>
        <div className={`master-exact-frame master-exact-${scene}`}>
          <img src={`/master-exact/${scene}.webp`} alt={LABELS[scene]} draggable={false} />

          {scene === 'home' && <>
            <button className="mx-hot mx-home-talk" aria-label="Conversar" onClick={() => setScene('practice')} />
            <button className="mx-hot mx-home-sanctuary" aria-label="Santuario" onClick={() => setScene('sanctuary')} />
            <button className="mx-hot mx-home-resource" aria-label="Recursos" onClick={() => setScene('resource')} />
            <button className="mx-hot mx-home-calm" aria-label="Un momento de calma" onClick={() => setScene('practice')} />
            <button className="mx-hot mx-home-clarity" aria-label="Claridad para decidir" onClick={() => setScene('resource')} />
          </>}

          {scene === 'sanctuary' && <>
            <button className="mx-hot mx-back" aria-label="Volver" onClick={() => setScene('home')} />
            <button className="mx-hot mx-sanctuary-explore" aria-label="Explorar" onClick={() => setScene('resource')} />
            <button className="mx-hot mx-sanctuary-create" aria-label="Crear" onClick={() => setScene('integrate')} />
          </>}

          {scene === 'practice' && <>
            <button className="mx-hot mx-practice-exit" aria-label="Salir" onClick={() => setScene('home')} />
            <button className="mx-hot mx-practice-pause" aria-label="Pausar" onClick={() => showToast('Pausa. No hay apuro.')} />
            <button className="mx-hot mx-practice-next" aria-label="Siguiente" onClick={() => setScene('integrate')} />
          </>}

          {scene === 'resource' && <>
            <button className="mx-hot mx-back" aria-label="Volver" onClick={() => setScene('home')} />
            <button className="mx-hot mx-resource-heart" aria-label="Guardar" onClick={() => showToast('Guardado en tu Santuario')} />
            <button className="mx-hot mx-resource-start" aria-label="Comenzar práctica" onClick={() => setScene('practice')} />
          </>}

          {scene === 'integrate' && <>
            <button className="mx-hot mx-back" aria-label="Volver" onClick={() => setScene('home')} />
            <button className="mx-hot mx-integrate-save" aria-label="Guardar" onClick={() => { showToast('Guardado'); window.setTimeout(() => setScene('sanctuary'), 650) }} />
            <button className="mx-hot mx-integrate-note" aria-label="Escribir nota" onClick={() => showToast('Aquí se abre la escritura real')} />
            <button className="mx-hot mx-integrate-chip1" aria-label="Una frase clave" onClick={() => showToast('Una frase clave')} />
            <button className="mx-hot mx-integrate-chip2" aria-label="Cómo te sientes" onClick={() => showToast('Cómo te sientes')} />
            <button className="mx-hot mx-integrate-chip3" aria-label="Un aprendizaje" onClick={() => showToast('Un aprendizaje')} />
            <button className="mx-hot mx-integrate-chip4" aria-label="Un compromiso" onClick={() => showToast('Un compromiso')} />
          </>}
        </div>
      </section>

      {toast && <div className="master-exact-toast" role="status">{toast}</div>}
    </main>
  )
}

export default MasterExact
