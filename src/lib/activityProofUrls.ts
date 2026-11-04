import { supabase } from './supabase';

const bucket = supabase.storage.from('activity-proofs');
const publicBase = new URL(bucket.getPublicUrl('proof').data.publicUrl);
const publicPathPrefix = publicBase.pathname.replace(/proof$/, '');
const signedPathPrefix = publicPathPrefix.replace('/object/public/', '/object/sign/');
const signedUrlLifetimeSeconds = 3600;

export function getActivityProofPath(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== publicBase.origin) return null;
    const prefix = [publicPathPrefix, signedPathPrefix].find((value) => parsed.pathname.startsWith(value));
    if (!prefix) return null;
    const path = decodeURIComponent(parsed.pathname.slice(prefix.length));
    return path.includes('/') && !path.split('/').includes('..') ? path : null;
  } catch {
    return null;
  }
}

export async function signActivityProofUrl(url: string): Promise<string> {
  const path = getActivityProofPath(url);
  if (!path) throw new Error('La URL de la prueba no es válida.');
  const { data, error } = await bucket.createSignedUrl(path, signedUrlLifetimeSeconds);
  if (error || !data?.signedUrl) throw error ?? new Error('No se pudo generar el enlace de la prueba.');
  return data.signedUrl;
}

export async function signActivityProofUrls(urls: readonly string[]): Promise<string[]> {
  if (urls.length === 0) return [];
  const paths = urls.map(getActivityProofPath).filter((path): path is string => path !== null);
  if (paths.length !== urls.length) throw new Error('La URL de la prueba no es válida.');
  const { data, error } = await bucket.createSignedUrls(paths, signedUrlLifetimeSeconds);
  if (error || !data || data.some((item) => item.error || !item.signedUrl)) {
    throw error ?? new Error('No se pudieron generar los enlaces de las pruebas.');
  }
  return data.map((item) => {
    if (!item.signedUrl) throw new Error('No se pudo generar el enlace de la prueba.');
    return item.signedUrl;
  });
}
