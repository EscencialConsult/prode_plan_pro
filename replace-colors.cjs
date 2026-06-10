const fs = require('fs');
const path = require('path');

const REPLACEMENTS = [
  // Hex Colors (case-insensitive search, but we specify regex with 'i' flag)
  { regex: /#ebc32b/gi, replacement: '#A6C934' },
  { regex: /#c99f16/gi, replacement: '#8fae27' },
  { regex: /#f5d75a/gi, replacement: '#bde04b' },
  { regex: /#0057B8/gi, replacement: '#0E5DA8' },
  { regex: /#00479A/gi, replacement: '#0b4e8c' },

  // RGB Colors
  { regex: /235\s*,\s*195\s*,\s*43/g, replacement: '166,201,52' },
  { regex: /201\s*,\s*159\s*,\s*22/g, replacement: '143,174,39' },
  { regex: /245\s*,\s*215\s*,\s*90/g, replacement: '189,224,75' },
  { regex: /0\s*,\s*87\s*,\s*184/g, replacement: '14,93,168' },
  { regex: /0\s*,\s*71\s*,\s*154/g, replacement: '11,78,140' },
  
  // Subtle backgrounds (yellowish -> greenish)
  { regex: /#fffdf5/gi, replacement: '#f8fbef' },
];

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && fullPath.endsWith('.jsx')) {
      // Don't modify the brand components themselves
      if (fullPath.includes('AlianzaMark') || fullPath.includes('AlianzaWordmark')) {
          continue;
      }
      
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const { regex, replacement } of REPLACEMENTS) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          modified = true;
        }
        // reset lastIndex just in case
        regex.lastIndex = 0;
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated colors in: ${fullPath}`);
      }
    }
  }
}

const targetDirs = [
  path.join(__dirname, 'src', 'pages'),
  path.join(__dirname, 'src', 'dashboard'),
  path.join(__dirname, 'src', 'components')
];

for (const dir of targetDirs) {
  if (fs.existsSync(dir)) {
    processDirectory(dir);
  }
}

console.log("Color replacement completed.");
