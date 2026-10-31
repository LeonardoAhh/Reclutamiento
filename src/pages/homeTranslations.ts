import type { Language } from '@/contexts/LanguageContext';

const EN: Record<string, string> = {
  'LA ESENCIA DE NUESTRO EQUIPO': 'THE HEART OF OUR TEAM',
  'Detrás de cada oportunidad, hay una persona.': 'Behind every opportunity is a person.',
  'Cada día tenemos la oportunidad de escuchar historias, acompañar decisiones y abrir caminos. Nuestro trabajo va más allá de cubrir una vacante o completar un proceso: se trata de la confianza que construimos y de las personas que encontramos en el camino.': 'Every day brings a chance to hear people’s stories, support their decisions, and open new paths. Our work goes beyond filling a vacancy or completing a process. It is about the trust we build and the people we meet along the way.',
  'Nos importan las personas.': 'People matter to us.',
  'Escuchamos sin prejuicios, tratamos con respeto y recordamos que detrás de cada solicitud, entrevista o decisión hay una historia que merece ser valorada.': 'We listen without judgment, treat people with respect, and remember that behind every application, interview, and decision is a story worth valuing.',
  'La confianza se construye.': 'Trust is built.',
  'Cumplimos nuestra palabra, hablamos con honestidad y acompañamos cada proceso con sensibilidad y responsabilidad.': 'We keep our word, speak honestly, and guide each process with care and responsibility.',
  'Crecemos cuando crecemos juntos.': 'We grow when we grow together.',
  'Compartimos conocimientos, aprendemos de nuestros errores y reconocemos que cada integrante del equipo tiene algo valioso que aportar.': 'We share what we know, learn from our mistakes, and recognize that every team member has something valuable to contribute.',
  '«No solo conectamos talento con oportunidades. Conectamos historias con nuevos comienzos».': '“We do more than connect talent with opportunities. We connect stories with new beginnings.”',
  'Eso es lo que nos une como equipo.': 'That is what brings us together as a team.',
  'Vacaciones y permisos': 'Vacation and leave requests',
  'Solicita autorización para vacaciones o permisos.': 'Request approval for vacation or leave.',
  'Solicita vacaciones con al menos 14 días naturales de anticipación.': 'Request vacation at least 14 calendar days in advance.',
  'El primer periodo vacacional debe ser de al menos 6 días continuos.': 'The first vacation period must be at least 6 consecutive days.',
  'No se permiten fechas pasadas ni canjear faltas por vacaciones.': 'Past dates and exchanging absences for vacation are not allowed.',
  'Una anticipación menor requiere autorización del jefe de área, buen desempeño y ninguna falta injustificada en los últimos 30 días.': 'Shorter notice requires approval from the area manager, good performance, and no unjustified absences in the last 30 days.',
  'Antes de ausentarte, deja tus pendientes y el estatus de procesos, vacantes y entrevistas para darles seguimiento.': 'Before your absence, leave an update on pending work, processes, vacancies, and interviews so they can be followed up.',
};

export function homeText(value: string, language: Language): string {
  return language === 'en' ? EN[value] ?? value : value;
}
