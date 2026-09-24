const fs = require('fs');

const replaceInFile = (file, replacements) => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [search, replace] of replacements) {
    if (content.includes(search)) {
      content = content.split(search).join(replace);
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(file, content);
};

const cssFile = 'C:/Users/Reclutamiento QRO/Desktop/reclutamiento/src/pages/Configuracion.css';
replaceInFile(cssFile, [
  ['.tabulador-tabs', '.config-tabs'],
  ['.tabulador-tab', '.config-tab']
]);

const tabuladorFile = 'C:/Users/Reclutamiento QRO/Desktop/reclutamiento/src/pages/configuracion-views/TabuladorView.tsx';
replaceInFile(tabuladorFile, [
  ['className="tabulador-tabs"', 'className="config-tabs"'],
  ['className={`tabulador-tab', 'className={`config-tab'],
  ['tabulador-tab--active', 'config-tab--active']
]);

const documentosFile = 'C:/Users/Reclutamiento QRO/Desktop/reclutamiento/src/pages/configuracion-views/DocumentosView.tsx';
replaceInFile(documentosFile, [
  ['className="documentos-tabs"', 'className="config-tabs"'],
  ['className={`btn ${isActive ? \\'btn-primary\\' : \\'btn-secondary\\'}`}', 'className={`config-tab${isActive ? \\' config-tab--active\\' : \\'\\'}`}']
]);
