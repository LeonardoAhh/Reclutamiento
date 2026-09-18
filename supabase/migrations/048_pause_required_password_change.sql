-- Aplicar antes del frontend que retira el guard. Cierra la campaña temporal
-- sin borrar su historial ni afectar el cambio voluntario de contraseña.
begin;

update account_security.password_change_campaign
set enabled = false
where singleton;

notify pgrst, 'reload schema';
commit;

-- Rollback seguro: restaurar primero el frontend con PasswordChangeGuard y
-- después ejecutar:
-- update account_security.password_change_campaign set enabled = true where singleton;
