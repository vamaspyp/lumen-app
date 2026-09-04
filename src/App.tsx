import './App.css'
import { foundationSnapshot } from './greenfield/foundation'

function App() {
  return (
    <main className="foundation-shell">
      <section className="foundation-card" aria-labelledby="foundation-title">
        <p className="eyebrow">VA+LUMEN · V0.4 / V39 / V40</p>
        <h1 id="foundation-title">Foundation Greenfield</h1>
        <p className="lede">
          Base técnica aislada para hacer nacer el organismo sin dependencias de negocio legacy.
        </p>

        <dl className="status-grid">
          <div>
            <dt>Slice</dt>
            <dd>{foundationSnapshot.slice}</dd>
          </div>
          <div>
            <dt>Arquitectura</dt>
            <dd>{foundationSnapshot.architecture}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{foundationSnapshot.status}</dd>
          </div>
        </dl>

        <h2>Fronteras de dominio</h2>
        <ul className="module-list">
          {foundationSnapshot.modules.map((module) => (
            <li key={module.id}>
              <strong>{module.id}</strong>
              <span>{module.name}</span>
            </li>
          ))}
        </ul>

        <p className="footnote">
          S0 no implementa todavía acompañamiento: prepara contratos, trazabilidad y aislamiento para S1.
        </p>
      </section>
    </main>
  )
}

export default App
