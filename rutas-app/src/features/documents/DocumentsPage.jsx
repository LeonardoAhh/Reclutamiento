import { useState } from 'react';
import { FileText, Download, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CSFMockup from './mockups/CSFMockup';

const documentTypes = [
  {
    id: 'csf',
    title: 'Constancia de Situación Fiscal',
    description: 'Documento emitido por el SAT que acredita tu situación fiscal actual',
    component: CSFMockup,
  },
  // Aquí se pueden agregar más tipos de documentos en el futuro
];

export default function DocumentsPage({ onBack }) {
  const [selectedDoc, setSelectedDoc] = useState(null);

  if (selectedDoc) {
    const DocComponent = selectedDoc.component;
    return (
      <div className="animate-fade-in-up">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedDoc(null)}
            data-testid="back-to-documents"
            className="gap-2"
          >
            <ChevronLeft className="size-4" />
            Volver
          </Button>
        </div>
        <DocComponent />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-display-xl font-display-xl mb-3 text-ink">
          Guía de Documentos
        </h1>
        <p className="text-body-md text-body max-w-2xl">
          Revisa los ejemplos de documentos requeridos. Cada guía muestra cómo debe verse el
          documento correcto con los datos y fechas actualizados.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {documentTypes.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setSelectedDoc(doc)}
            data-testid={`document-card-${doc.id}`}
            className="group flex flex-col gap-4 rounded-lg border border-hairline bg-surface p-6 text-left transition-all hover:border-hairline-strong hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <div className="flex size-12 items-center justify-center rounded-md bg-surface-card text-primary">
              <FileText className="size-6" />
            </div>
            <div>
              <h3 className="text-heading-md font-heading-md mb-2 text-ink group-hover:text-primary">
                {doc.title}
              </h3>
              <p className="text-caption-md text-mute">{doc.description}</p>
            </div>
          </button>
        ))}
      </div>

      {onBack && (
        <div className="mt-8">
          <Button
            variant="secondary"
            onClick={onBack}
            data-testid="back-to-main"
            className="gap-2"
          >
            <ChevronLeft className="size-4" />
            Volver a Horarios
          </Button>
        </div>
      )}
    </div>
  );
}
