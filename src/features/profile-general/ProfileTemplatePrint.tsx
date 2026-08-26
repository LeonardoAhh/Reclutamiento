import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ProfileTemplate } from './types';

interface ProfileTemplatePrintProps {
  template: ProfileTemplate;
  onComplete: () => void;
}

export function ProfileTemplatePrint({ template, onComplete }: ProfileTemplatePrintProps) {
  useEffect(() => {
    const documentRoot = document.documentElement;
    const handleAfterPrint = () => onComplete();

    documentRoot.classList.add('is-printing-profile-template');
    window.addEventListener('afterprint', handleAfterPrint, { once: true });
    const frame = window.requestAnimationFrame(() => window.print());

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('afterprint', handleAfterPrint);
      documentRoot.classList.remove('is-printing-profile-template');
    };
  }, [onComplete, template.id]);

  return createPortal(
    <div id="profile-template-print-root" aria-hidden="true">
      <article className="profile-template-document">
        <header className="profile-template-document__header">
          <p>Perfil General</p>
          <h1>Plantilla de evaluación</h1>
          <span>Versión {template.version}</span>
        </header>

        <section className="profile-template-document__section">
          <h2>Datos del puesto</h2>
          <dl className="profile-template-document__data profile-template-document__data--job">
            <div><dt>Área</dt><dd>{template.area}</dd></div>
            <div><dt>Puesto</dt><dd>{template.puesto}</dd></div>
          </dl>
        </section>

        <section className="profile-template-document__section">
          <h2>Datos del empleado</h2>
          <dl className="profile-template-document__data profile-template-document__data--employee">
            <div className="profile-template-document__employee-name"><dt>Nombre</dt><dd /></div>
            <div><dt>Estado laboral</dt><dd /></div>
            <div><dt>Fecha de ingreso</dt><dd /></div>
            <div><dt>Reclutador</dt><dd /></div>
            <div><dt>Fecha de baja</dt><dd /></div>
          </dl>
        </section>

        <section className="profile-template-document__section profile-template-document__criteria">
          <h2>Criterios de evaluación</h2>
          <table className="profile-template-document__table">
            <colgroup>
              <col className="profile-template-document__column-index" />
              <col className="profile-template-document__column-category" />
              <col className="profile-template-document__column-criterion" />
              <col className="profile-template-document__column-weight" />
              <col className="profile-template-document__column-answer" />
              <col className="profile-template-document__column-answer" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Categoría</th>
                <th scope="col">Criterio</th>
                <th scope="col">Peso</th>
                <th scope="col">Cumple</th>
                <th scope="col">No cumple</th>
              </tr>
            </thead>
            <tbody>
              {template.criteria.map((criterion, index) => (
                <tr key={criterion.id}>
                  <td>{index + 1}</td>
                  <td>{criterion.category}</td>
                  <td>{criterion.description}</td>
                  <td>{criterion.is_scorable ? `${(criterion.weight_bps / 100).toFixed(2)}%` : 'Informativo'}</td>
                  <td>{criterion.is_scorable ? <span className="profile-template-document__checkbox" /> : '—'}</td>
                  <td>{criterion.is_scorable ? <span className="profile-template-document__checkbox" /> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="profile-template-document__result">
          <strong>Resultado</strong>
          <span>__________ %</span>
        </footer>
      </article>
    </div>,
    document.body,
  );
}
