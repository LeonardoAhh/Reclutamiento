const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/REPORTE JULIO.json', 'utf8'));

const almacenes = data.filter(d => 
  ['30', '31'].includes(d.turno)
);

function getISOWeek(date) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
}

almacenes.forEach(emp => {
  const descansos = [];
  for (let i = 1; i <= 31; i++) {
    const dayStr = i.toString().padStart(2, '0');
    if (emp[dayStr] === 'D' || emp[dayStr] === 'DF') {
      const date = new Date(2026, 6, i); // Julio 2026
      const dowName = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'][date.getDay()];
      const week = getISOWeek(date);
      descansos.push(`${i}(${dowName},W${week})`);
    }
  }
  console.log(`Emp ${emp.nombre.substring(0, 15).padEnd(15)} | Turno ${emp.turno.padStart(2)} | Descansos: ${descansos.join(', ')}`);
});
