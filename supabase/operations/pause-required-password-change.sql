-- Reversión no destructiva: conserva asignaciones y confirmaciones.
update account_security.password_change_campaign set enabled = false where singleton;
