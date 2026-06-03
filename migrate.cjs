const fs = require('fs');
const path = require('path');

const replacements = [
  // Hex Colors
  { from: /#ebc32b/gi, to: '#86C873' },
  { from: /#f5d75a/gi, to: '#A8E096' },
  { from: /#c99f16/gi, to: '#5A9E4A' },
  { from: /#05090f/gi, to: '#0a0f0a' },
  { from: /#0c182b/gi, to: '#111811' },
  { from: /#18243f/gi, to: '#1a241a' },
  { from: /#425b8b/gi, to: '#3a5c3a' },
  { from: /#6e83ad/gi, to: '#5a825a' },
  { from: /#faf7f0/gi, to: '#f0f5ee' },
  { from: /#f0eadb/gi, to: '#e2eede' },
  { from: /#2b3a5a/gi, to: '#1e3020' },
  { from: /#5f6e8a/gi, to: '#4a6b50' },
  { from: /#a8b2c4/gi, to: '#8aaa8e' },

  // Cyan colors
  { from: /#22D9DF/gi, to: '#86C873' },
  { from: /#28FFFF/gi, to: '#A8E096' },
  { from: /#148B91/gi, to: '#5A9E4A' },
  { from: /#020F27/gi, to: '#0F1410' },
  { from: /#071A3A/gi, to: '#161D17' },
  { from: /#0F2145/gi, to: '#1C261D' },
  { from: /#0F2B4F/gi, to: '#1E2B1F' },
  { from: /#17376A/gi, to: '#263328' },
  { from: /#1E3B6E/gi, to: '#2E402F' },

  // RGBA partials
  { from: /rgba\(\s*235\s*,\s*195\s*,\s*43\s*/g, to: 'rgba(134,200,115' },
  { from: /rgba\(\s*34\s*,\s*217\s*,\s*223\s*/g, to: 'rgba(134,200,115' },
  { from: /rgba\(\s*66\s*,\s*91\s*,\s*139\s*/g, to: 'rgba(58,125,68' },

  // Logos
  { from: /one-prode-talento-new3\.png/g, to: 'one-prode-blanco.png' },
  { from: /one-prode-talento-new\.png/g, to: 'one-prode-blanco.png' },

  // Specific text overrides requested
  { from: /Prode Talento/g, to: 'PRODE LUIS BARRIONUEVO' },
  { from: /SOGEFI GROUP/g, to: 'SINDICATO DE CAMIONEROS' },
  { from: /SOGEFI/g, to: 'CAMIONEROS' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content;
      for (const r of replacements) {
        newContent = newContent.replace(r.from, r.to);
      }
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log('Updated: ' + fullPath);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src'));
console.log('Migration complete.');
