import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { rutas } from '../data/rutas';

export const downloadRutasExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Transporte';

  // Helper styles
  const defaultFont = { name: 'Aptos Mono', size: 12 };
  const headerFont = { name: 'Aptos Mono', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  const alignmentCenter = { vertical: 'middle', horizontal: 'center' };
  const alignmentLeft = { vertical: 'middle', horizontal: 'left', wrapText: true };
  const borderStyle = {
    top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
    left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
    bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
    right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
  };

  rutas.forEach((ruta) => {
    // Sheet names max 31 chars and no special chars
    let sheetName = ruta.id + ' ' + (ruta.nombre.split('.')[1] || ruta.nombre).trim();
    sheetName = sheetName.replace(/[\[\]\/\*\?\:\\]/g, '');
    if (sheetName.length > 31) {
      sheetName = sheetName.substring(0, 31);
    }
    
    const sheet = workbook.addWorksheet(sheetName);

    // Columns config
    const columns = [
      { header: 'No.', key: 'no', width: 8 },
      { header: 'Colonia', key: 'colonia', width: 35 },
      { header: 'Referencia', key: 'referencia', width: 70 },
    ];
    
    ruta.turnos.forEach((turno) => {
      columns.push({ header: turno, key: turno, width: 16 });
    });
    
    sheet.columns = columns;

    // Style the header row
    const headerRow = sheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = headerFont;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' } // Blue header background
      };
      cell.alignment = alignmentCenter;
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1D4ED8' } },
        left: { style: 'thin', color: { argb: 'FF1D4ED8' } },
        bottom: { style: 'thin', color: { argb: 'FF1D4ED8' } },
        right: { style: 'thin', color: { argb: 'FF1D4ED8' } }
      };
    });

    // Add rows for stops
    ruta.paradas.forEach((parada) => {
      const rowData = {
        no: parada.no,
        colonia: parada.colonia,
        referencia: parada.referencia,
      };
      // Map horarios
      ruta.turnos.forEach((turno, index) => {
        rowData[turno] = parada.horarios[index] || 'N/A';
      });

      const row = sheet.addRow(rowData);
      // Removed fixed row.height to allow Excel to auto-fit wrapped text

      // Style each cell in the row
      row.eachCell((cell, colNumber) => {
        cell.font = defaultFont;
        cell.border = borderStyle;
        
        // Colonia and Referencia (cols 2 and 3) left aligned, others centered
        if (colNumber === 2 || colNumber === 3) {
          cell.alignment = alignmentLeft;
        } else {
          cell.alignment = alignmentCenter;
        }
      });
    });
    
    // Auto filter for headers
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length }
    };
  });

  // Export
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'Horarios_Rutas_Transporte.xlsx');
};
