# 📋 Instrucciones: Actualizar Turnos de Bajas

## ✅ Nueva Funcionalidad Implementada

Ahora puedes actualizar **SOLO el campo turno** de las bajas existentes sin modificar ningún otro dato.

---

## 🎯 ¿Qué hace?

- **Busca** bajas existentes por `Num Empleado`
- **Actualiza** únicamente el campo `turno`
- **Preserva** todos los demás datos (nombre, área, puesto, fechas, coberturas manuales, etc.)
- **Muestra preview** antes de aplicar cambios

---

## 📝 Pasos para usar

### 1. Prepara tu archivo JSON

Crea un archivo JSON con solo dos campos obligatorios:

```json
[
  {
    "Num Empleado": "1234",
    "Turno": "1"
  },
  {
    "Num Empleado": "5678",
    "Turno": "2"
  }
]
```

**Campos requeridos:**
- `Num Empleado`: Número de empleado (debe existir en bajas)
- `Turno`: Valor del turno (1, 2, 3, 4, 5, etc.)

### 2. Ve a la página de Bajas

En la interfaz, verás dos botones:
- 📤 **Upload** (importar bajas completo - actualiza todos los datos)
- 🔄 **Actualizar Turnos** (nuevo - solo actualiza turnos)

### 3. Carga el archivo

1. Haz clic en **"Actualizar Turnos"**
2. Selecciona tu archivo JSON
3. Espera el preview

### 4. Revisa el Preview

Se abrirá un modal mostrando:

| Num. Empleado | Nombre | Turno Anterior | Turno Nuevo |
|---------------|--------|----------------|-------------|
| 1234 | Juan Pérez | — | 1 |
| 5678 | María López | 2 | 3 |

- **Turno Anterior**: En gris (valor actual o "—" si está vacío)
- **Turno Nuevo**: En azul (valor que se aplicará)

### 5. Confirma o Cancela

- ✅ **Aplicar X cambio(s)**: Actualiza los turnos
- ❌ **Cancelar**: Descarta los cambios

---

## ⚠️ Importante

### ✅ Lo que se actualiza:
- Solo el campo `turno`

### 🔒 Lo que se preserva:
- Nombre, área, sección, puesto
- Fechas de ingreso y baja
- Tipo y motivo de baja
- **Marcas de cobertura manual** (cubierta_manual, cubierta_fecha, cubierta_nota)
- Todos los demás campos

### ⚡ Ventana de cobertura automática

La ventana de matching automático se cambió de **10 a 12 días**:
- Un ingreso cubre una baja si ocurre dentro de **12 días** después de la fecha de baja
- Mismo área y puesto (sin considerar A/B/C/D)

---

## 🔧 Requisitos previos

1. **Ejecuta el script SQL** en Supabase (solo una vez):
   ```sql
   -- Ubicado en: add-turno-to-bajas.sql
   ALTER TABLE bajas ADD COLUMN IF NOT EXISTS turno TEXT;
   ```

2. **Asegúrate** que tu archivo JSON tiene las columnas correctas

---

## 📊 Ejemplo completo

### Archivo JSON (`turnos-update.json`):

```json
[
  {
    "Num Empleado": "1234",
    "Turno": "1"
  },
  {
    "Num Empleado": "5678",
    "Turno": "2"
  },
  {
    "Num Empleado": "9012",
    "Turno": "3"
  }
]
```

### Resultado:

```
✅ 3 actualizaciones disponibles

Preview:
- Juan Pérez (1234): — → 1
- María López (5678): 2 → 2 (sin cambio)
- Pedro García (9012): 1 → 3

[Aplicar 3 cambio(s)] [Cancelar]
```

---

## 💡 Tips

- Puedes actualizar todos los turnos de una vez o solo algunos
- Si un `Num Empleado` no existe, se reportará en el mensaje como "no encontrado"
- Los cambios se aplican tanto en localStorage como en Supabase
- Las marcas de cobertura manual **nunca se pierden**

---

## 🆚 Diferencia entre importaciones

| Característica | Importar Bajas (Upload) | Actualizar Turnos |
|----------------|-------------------------|-------------------|
| Campos actualizados | Todos | Solo turno |
| Preview | No | Sí |
| Requiere todos los campos | Sí | No (solo num + turno) |
| Preserva coberturas manuales | Sí | Sí |
| Uso recomendado | Primera carga o actualización completa | Solo actualizar turnos |

---

¿Dudas? Revisa el código en:
- `src/components/ui/TurnosUpdater.tsx`
- `src/hooks/useBajas.ts`
