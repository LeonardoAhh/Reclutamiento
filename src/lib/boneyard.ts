/**
 * Boneyard establece esta bandera antes de cargar la aplicación durante la
 * captura. El bypass se limita a desarrollo; nunca altera las protecciones de
 * las compilaciones de producción.
 */
export function isBoneyardBuild(): boolean {
  return (
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    (window as Window & { __BONEYARD_BUILD?: boolean }).__BONEYARD_BUILD === true
  );
}
