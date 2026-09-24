import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wtfwvagckcifutfhnfqc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0Znd2YWdja2NpZnV0ZmhuZnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTkyMjYsImV4cCI6MjA5MjAzNTIyNn0.6-xTMKU66umzJ1x1yhHVnAmT4ocY3H9Ll1kZt-vOTTg';
const supabase = createClient(supabaseUrl, supabaseKey);

const userExcel = [
  { "Num Empleado": "2315", "Nombre": "NIEVES MANDUJANO YOLANDA", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "2545", "Nombre": "VARGAS GUZMAN RAQUEL", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "2934", "Nombre": "SILVAR FLORES MONICA CECILIA", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "3316", "Nombre": "PEREZ SANCHEZ LUIS ALBERTO", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "3396", "Nombre": "TREJO GARCIA EUGENIO", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "3593", "Nombre": "DE LA CRUZ BECERRA ENRIQUE", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "3734", "Nombre": "CORTEZ HILARIO CARLOS ALBERTO", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "3773", "Nombre": "PEREZ UGALDE KARLA MARIANA", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "3776", "Nombre": "ROJAS SANCHEZ ELIZABETH", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "3883", "Nombre": "AGUILAR HERNANDEZ SAMARA ODETTE", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "3945", "Nombre": "LOPEZ  OLVERA JUAN DIEGO", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4000", "Nombre": "MARQUEZ MORENO ALONDRA", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4046", "Nombre": "MARTINEZ OLVERA ARACELI", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4054", "Nombre": "ESCOBEDO  DE LA CRUZ MARIA DANIELA", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4063", "Nombre": "HERNANDEZ CABRERA JUANA", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4078", "Nombre": "SUSANO TEODORO YOSELIN", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4111", "Nombre": "HERNANDEZ PEREZ CARLOS LORENZO", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4114", "Nombre": "BELTRAN  MENDOZA MARIA FERNANDA", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4165", "Nombre": "RANGEL GARDUÑO ELIZABETH", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4168", "Nombre": "ANTONIO GARCIA ERIKA YAZMIN", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4169", "Nombre": "LUNA JIMENEZ JENNIFER AMERICA", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4172", "Nombre": "AGUILAR HIDALGO LISBET", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4185", "Nombre": "SANTOS ENCARNACION JUAN JOSE", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4187", "Nombre": "NAVA VELAZQUEZ GONZALO EDUARDO", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4193", "Nombre": "GAYTAN RAMIREZ MARIA ISABEL", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4226", "Nombre": "CALDERON GOMEZ ALEXIS", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4229", "Nombre": "DEL ANGEL CAMACHO LIZBETH DANIELA", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4238", "Nombre": "VELASCO PEREZ ADRIAN ELI", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4255", "Nombre": "MENDOZA GARCIA JOSE CARLOS", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4271", "Nombre": "FONSECA SOLIS MARIA DEL CARMEN", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4302", "Nombre": "RAMIREZ ACOSTA LUIS MANUEL", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" },
  { "Num Empleado": "4303", "Nombre": "JUAREZ GUTIERREZ ARLETTE ESMERALDA", "Seccion": "PRODUCCIÓN 1ER. TURNO", "Puesto": "OPERADOR DE MÁQUINA", "Proyecto": "VIÑOPLASTIC" }
];

async function run() {
  const { data: employees, error } = await supabase
    .from('empleados')
    .select('*');

  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log("=== EMPLEADOS FALTANTES EN EL SISTEMA ===");
  const missingInSystem = userExcel.filter(u => !employees.some(sys => sys.num_empleado === u["Num Empleado"]));
  
  if (missingInSystem.length === 0) {
    console.log("Ninguno! Todos los 32 existen en la base de datos como Activos.");
  } else {
    missingInSystem.forEach(m => {
      console.log(`- ${m["Num Empleado"]} | ${m.Nombre}`);
    });
  }
  
  console.log("\n=== EMPLEADOS EN EL SISTEMA PERO CON PUESTO O SECCION DIFERENTE ===");
  let countDiferentes = 0;
  userExcel.forEach(u => {
    const inSys = employees.find(sys => sys.num_empleado === u["Num Empleado"]);
    if (inSys) {
      if (!inSys.puesto.includes("OPERADOR") || (!inSys.seccion.includes("1ER") && inSys.seccion !== "1ER TURNO")) {
        console.log(`- ${u["Num Empleado"]} | ${u.Nombre} | En BD dice: Área: ${inSys.area}, Sección: ${inSys.seccion}, Puesto: ${inSys.puesto}`);
        countDiferentes++;
      }
    }
  });
  if (countDiferentes === 0) console.log("Todos tienen el puesto y sección correctos.");
}

run();
