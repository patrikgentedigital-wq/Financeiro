const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    if (f === 'node_modules' || f === '.git' || f === 'dist') return;
    if (fs.statSync(p).isDirectory()) walk(p);
    else {
      let c = fs.readFileSync(p, 'utf8');
      if (c.includes('litugojwlmlvmtrmflgg')) console.log('FOUND IN:', p);
    }
  });
}
walk('.');
