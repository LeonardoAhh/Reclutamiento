import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const sources = [
  ['routes_current', 'rutas.json', 'array'],
  ['routes_previous', 'rutas-anterior.json', 'array'],
  ['routes_info', 'rutas-info.json', 'object'],
  ['salary_union', 'sindicalizado.json', 'array'],
  ['salary_non_union', 'nosindicalizado.json', 'array'],
];

const rows = await Promise.all(
  sources.map(async ([id, filename, kind]) => {
    const source = await readFile(resolve('.private-import', filename), 'utf8');
    const payload = JSON.parse(source);
    if (
      kind === 'array'
        ? !Array.isArray(payload) || payload.length === 0
        : !payload || Array.isArray(payload) || typeof payload !== 'object'
    ) {
      throw new Error(`El conjunto de datos privados no es válido: ${filename}`);
    }
    return { id, payload };
  }),
);

if (!process.argv.includes('--apply')) {
  process.stdout.write(`Se validaron ${rows.length} conjuntos de datos privados. Usa --apply para importarlos.\n`);
  process.exit(0);
}

async function readLocalProjectUrl() {
  for (const filename of ['.env.local', '.env']) {
    try {
      const localEnv = await readFile(resolve(filename), 'utf8');
      const value = localEnv.match(/^(?:SUPABASE_URL|VITE_SUPABASE_URL)\s*=\s*(.+)\s*$/m)?.[1]?.trim();
      if (value) return value.replace(/^(['"])(.*)\1$/, '$2');
    } catch {
      // El archivo es opcional; se prueba el siguiente.
    }
  }
  return undefined;
}

const url = process.env.SUPABASE_URL?.trim() || await readLocalProjectUrl();
const serviceKey = process.env.SUPABASE_SECRET_KEY?.trim()
  || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !/^https:\/\/[^/]+\.supabase\.co$/.test(url)) {
  throw new Error('Falta una URL válida: configura SUPABASE_URL o VITE_SUPABASE_URL en .env o .env.local.');
}
if (!serviceKey) {
  throw new Error('Falta SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY en esta sesión de PowerShell.');
}

const legacyServiceKey = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(serviceKey);
const modernSecretKey = /^sb_secret_[A-Za-z0-9_-]+$/.test(serviceKey);
if (!legacyServiceKey && !modernSecretKey) {
  if (serviceKey.length < 20) {
    throw new Error('La clave recibida está incompleta. En el prompt pega el valor completo de service_role o de Secret key.');
  }
  if (serviceKey.startsWith('sb_publishable_')) {
    throw new Error('Se recibió una clave pública. Copia una Secret key o la clave antigua service_role.');
  }
  throw new Error('La clave privada no tiene un formato válido. Copia solo su valor, sin etiqueta, comillas ni saltos de línea.');
}

const endpoint = new URL('/rest/v1/private_app_datasets', url);
endpoint.searchParams.set('on_conflict', 'id');
const headers = {
  apikey: serviceKey,
  ...(legacyServiceKey ? { Authorization: `Bearer ${serviceKey}` } : {}),
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates',
};

const upload = await fetch(endpoint, {
  method: 'POST',
  headers,
  body: JSON.stringify(rows),
});
if (!upload.ok) throw new Error(`Falló la importación de datos privados (HTTP ${upload.status}).`);

const verificationUrl = new URL('/rest/v1/private_app_datasets', url);
verificationUrl.searchParams.set('select', 'id,payload');
verificationUrl.searchParams.set('id', `in.(${rows.map((row) => row.id).join(',')})`);
const verification = await fetch(verificationUrl, {
  headers: {
    apikey: serviceKey,
    ...(legacyServiceKey ? { Authorization: `Bearer ${serviceKey}` } : {}),
  },
});
if (!verification.ok) throw new Error(`Falló la verificación de datos privados (HTTP ${verification.status}).`);
const stored = await verification.json();
if (
  !Array.isArray(stored) ||
  stored.length !== rows.length ||
  rows.some((row) => !isDeepStrictEqual(stored.find((item) => item.id === row.id)?.payload, row.payload))
) {
  throw new Error('Los datos guardados no coinciden con los archivos locales.');
}

process.stdout.write(`Se verificaron ${rows.length} conjuntos de datos privados.\n`);
