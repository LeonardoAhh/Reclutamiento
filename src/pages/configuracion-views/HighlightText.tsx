const ACCENT_MAP: Record<string, string> = {
  a: 'aáàäâãå',
  e: 'eéèëê',
  i: 'iíìïî',
  o: 'oóòöôõ',
  u: 'uúùüû',
  n: 'nñ',
  c: 'cç',
};

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildAccentInsensitivePattern(token: string) {
  return Array.from(token.toLowerCase())
    .map((char) => ACCENT_MAP[char] ?? escapeRegex(char))
    .join('');
}

interface HighlightTextProps {
  text: string;
  tokens: string[];
}

/**
 * Resalta en <mark> las coincidencias de los tokens de búsqueda dentro de
 * `text`, sin distinguir acentos ni mayúsculas. Sin tokens, devuelve el
 * texto intacto.
 */
export function HighlightText({ text, tokens }: HighlightTextProps) {
  const validTokens = tokens.filter((token) => token.length > 0);
  if (validTokens.length === 0) return <>{text}</>;

  const pattern = new RegExp(
    `(${validTokens.map(buildAccentInsensitivePattern).join('|')})`,
    'gi',
  );
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index}>{part}</mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}
