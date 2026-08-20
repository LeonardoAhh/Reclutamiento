const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Reclutamiento QRO/Desktop/reclutamiento/src/pages/configuracion-views';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove <header className="config-page__header">...</header> entirely if it only contains the title
  content = content.replace(/\s*<header className="config-page__header">[\s\S]*?<\/header>/g, '');
  
  // Sometimes it's just an <h2> without a header, let's remove <h2>...</h2> if it has config-page__title
  content = content.replace(/\s*<h2[^>]*className="[^"]*config-page__title[^"]*"[^>]*>[\s\S]*?<\/h2>/g, '');

  // Standardize the root container.
  content = content.replace(/className="([^"]+-view)\s+config-page__content"/g, 'className="$1 config-page"');
  
  // If it just has 'className="something-view"' without config-page, add it.
  content = content.replace(/className="([^"]+-view)"/g, (match, p1) => {
    if (match.includes('config-page')) return match;
    return `className="${p1} config-page"`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Processed', file);
}
