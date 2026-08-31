/**
 * Validador de lenguaje inapropiado para comentarios.
 * Ampliado con más categorías, normalización de acentos y variantes leetspeak.
 */

// --- Listas de palabras por categoría (facilita mantenimiento y activar/desactivar grupos) ---

const INSULTOS_GENERALES = [
  'pendejo', 'pendeja', 'estupido', 'estupida', 'idiota', 'imbecil',
  'menso', 'mensa', 'baboso', 'babosa', 'tarado', 'tarada',
  'inutil', 'bruto', 'bruta', 'tonto', 'tonta',
];

const GROSERIAS_FUERTES = [
  'puta', 'puto', 'verga', 'mierda', 'chinga', 'chingar', 'chingado',
  'chingada', 'cabron', 'cabrona', 'joder', 'coño', 'carajo',
  'pinche', 'culero', 'culera', 'pendejada', 'mamada', 'mamon', 'mamona',
];

const DESPECTIVOS_DISCRIMINATORIOS = [
  // Términos usados de forma despectiva; se filtran en contexto laboral
  'marica', 'maricon', 'joto', 'zorra', 'perra', 'puñal', 'invertido',
];

const AMENAZAS_AGRESIVAS = [
  'maldito', 'maldita', 'imbecil', 'estupidez', 'basura', 'asqueroso',
  'asquerosa', 'desgraciado', 'desgraciada', 'ojete',
];

// Combina todas las categorías activas
const TODAS_LAS_PALABRAS = [
  ...INSULTOS_GENERALES,
  ...GROSERIAS_FUERTES,
  ...DESPECTIVOS_DISCRIMINATORIOS,
  ...AMENAZAS_AGRESIVAS,
];

// --- Normalización de texto ---

/**
 * Quita acentos, convierte a minúsculas y normaliza sustituciones
 * tipo leetspeak comunes (0->o, 1->i, 3->e, 4->a, 5->s, @->a, $->s).
 */
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos (á -> a, é -> e, etc.)
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/(.)\1{2,}/g, '$1$1'); // colapsa repeticiones ("puuuuuta" -> "puuta")
}

/**
 * Construye el regex a partir de una lista de palabras.
 * Usa \b para límites de palabra y escapa caracteres especiales.
 */
function construirRegex(palabras: string[]): RegExp {
  const patron = palabras
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  return new RegExp(`\\b(${patron})\\b`, 'i');
}

const profanityRegex = construirRegex(TODAS_LAS_PALABRAS);

// --- Opciones de validación ---

interface OpcionesValidacion {
  /** Si es true, solo advierte (retorna boolean) en vez de lanzar error */
  modoSuave?: boolean;
  /** Categorías adicionales a excluir de la validación */
  excluirCategorias?: Array<'insultos' | 'groserias' | 'despectivos' | 'amenazas'>;
}

const MAPA_CATEGORIAS: Record<string, string[]> = {
  insultos: INSULTOS_GENERALES,
  groserias: GROSERIAS_FUERTES,
  despectivos: DESPECTIVOS_DISCRIMINATORIOS,
  amenazas: AMENAZAS_AGRESIVAS,
};

/**
 * Valida si un texto contiene lenguaje inapropiado.
 * @returns true si el texto es apropiado (o el listado de coincidencias si modoSuave)
 * @throws Error si contiene lenguaje inapropiado y modoSuave es false
 */
function validarComentario(
  comentario: string,
  opciones: OpcionesValidacion = {}
): boolean {
  const { modoSuave = false, excluirCategorias = [] } = opciones;

  let palabrasActivas = TODAS_LAS_PALABRAS;
  if (excluirCategorias.length > 0) {
    const excluidas = new Set(
      excluirCategorias.flatMap((cat) => MAPA_CATEGORIAS[cat] ?? [])
    );
    palabrasActivas = TODAS_LAS_PALABRAS.filter((p) => !excluidas.has(p));
  }

  const regex = excluirCategorias.length > 0
    ? construirRegex(palabrasActivas)
    : profanityRegex;

  const textoNormalizado = normalizarTexto(comentario);

  if (regex.test(textoNormalizado)) {
    if (modoSuave) return false;
    throw new Error(
      'El comentario contiene lenguaje inapropiado.'
    );
  }

  return true;
}

export { validarComentario, normalizarTexto };
