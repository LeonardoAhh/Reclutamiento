const placeholders = ['one', 'two', 'three'];

export function LeaveRequestsSkeletonFixture() {
  return (
    <main className="leave-requests-page container" aria-hidden="true">
      <section className="leave-requests-page__content">
        <div className="leave-requests-page__table-scroll">
          <table className="leave-requests-page__table">
            <thead>
              <tr>
                {['Solicitante', 'Tipo', 'Fechas', 'Solicitada el', 'Estado', 'Acciones'].map((column) => (
                  <th key={column} scope="col">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {placeholders.map((placeholder) => (
                <tr key={placeholder}>
                  {['requester', 'type', 'dates', 'requested', 'status'].map((column) => (
                    <td key={column}>
                      <span className="leave-requests-page__skeleton-line" />
                    </td>
                  ))}
                  <td className="leave-requests-page__row-actions">
                    <div className="leave-requests-page__actions">
                      <span className="leave-requests-page__skeleton-action" />
                      <span className="leave-requests-page__skeleton-action" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="leave-requests-page__cards">
          {placeholders.map((placeholder) => (
            <li key={placeholder} className="leave-requests-page__card">
              <div className="leave-requests-page__card-header">
                <div className="leave-requests-page__card-requester">
                  <h2>
                    <span className="leave-requests-page__skeleton-line leave-requests-page__skeleton-line--title" />
                  </h2>
                </div>
                <span className="leave-requests-page__skeleton-line leave-requests-page__skeleton-line--short" />
              </div>
              <div className="leave-requests-page__card-period">
                {['Inicio', 'Fin'].map((period) => (
                  <div key={period}>
                    <span className="leave-requests-page__skeleton-line leave-requests-page__skeleton-line--short" />
                    <span className="leave-requests-page__skeleton-line" />
                  </div>
                ))}
              </div>
              <div className="leave-requests-page__card-details">
                <div className="leave-requests-page__card-state">
                  <span className="leave-requests-page__skeleton-line leave-requests-page__skeleton-line--short" />
                </div>
                <div className="leave-requests-page__card-requested">
                  <span className="leave-requests-page__card-label">Solicitada el</span>
                  <span className="leave-requests-page__skeleton-line" />
                </div>
              </div>
              <footer className="leave-requests-page__card-footer">
                <span className="leave-requests-page__skeleton-action" />
                <span className="leave-requests-page__skeleton-action" />
              </footer>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
