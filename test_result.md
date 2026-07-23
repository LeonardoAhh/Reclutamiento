# Test Result

## user_problem_statement
Verificar que al expirar el JWT la sesión se invalide inmediatamente y AuthGuard redirija a `/login`, evitando que el usuario continúe trabajando o guardando con una sesión zombie.

## Testing Protocol
- Alcance exclusivo: flujo frontend de expiración JWT y redirección a login.
- No modificar datos reales ni crear usuarios.
- Usar credenciales existentes solo si están disponibles en `/app/memory/test_credentials.md`.
- Si no existen credenciales Supabase válidas, reportar el bloqueo y no inventar sesiones ni tokens.
- Confirmar por separado: evento global de JWT expirado, limpieza inmediata de sesión en memoria, aviso al usuario y redirección de ruta protegida a `/login`.

## Incorporate User Feedback
- Responder en español y directo al punto.
- No afirmar validación en vivo si faltan credenciales.
