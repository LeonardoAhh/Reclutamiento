const DEPARTMENT_IMAGE_SOURCES: Readonly<Record<string, string>> = {
  ALMACEN: '/images/department-cards/warehouse.jpg',
  CALIDAD: '/images/organization-chart/safety.jpg',
  COMERCIAL: '/images/organization-chart/interview.jpg',
  'GERENCIA DE PLANTA': '/images/organization-chart/management.jpg',
  LOGISTICA: '/images/organization-chart/coordination.jpg',
  MANTENIMIENTO: '/images/department-cards/factory-operator.jpg',
  PRODUCCION: '/images/department-cards/injection-molding.png',
  PROYECTOS: '/images/organization-chart/training.jpg',
  'RECURSOS HUMANOS': '/images/organization-chart/recruitment.jpg',
  SGI: '/images/organization-chart/hr-analysis.jpg',
  SISTEMAS: '/images/organization-chart/hr-support.jpg',
  'TALLER DE MOLDES': '/images/organization-chart/cleaning-team.jpg',
};

function getDepartmentImageSource(department: string): string | undefined {
  const normalizedDepartment = department
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  return DEPARTMENT_IMAGE_SOURCES[normalizedDepartment];
}

interface DepartmentCardImageProps {
  department: string;
}

export function DepartmentCardImage({ department }: DepartmentCardImageProps) {
  const imageSource = getDepartmentImageSource(department);

  if (!imageSource) return null;

  return (
    <img className="department-incidences-page__card-image" src={imageSource} alt="" loading="lazy" decoding="async" />
  );
}
