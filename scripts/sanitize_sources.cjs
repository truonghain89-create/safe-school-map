const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '../src/lib/constants/schools-bien-hoa.ts');
let content = fs.readFileSync(target, 'utf8');

const lines = content.split('\n');
const fixedLines = lines.map(line => {
  if (!line.includes('verification_source:')) return line;
  
  // Extract key and value
  const prefixMatch = line.match(/^(\s*verification_source:\s*')(.*)(',?\s*)$/);
  if (!prefixMatch) return line;

  let val = prefixMatch[2];
  // Replace degree minutes ' with prime symbol ′
  val = val.replace(/(\d+)'(\d+)/g, '$1′$2');
  // If there are duplicate tails like '48"N 106°53'55"E (Cổng chính KP9 Tân Biên)'
  // remove any remaining unescaped single quotes
  val = val.replace(/'/g, '’');

  return `${prefixMatch[1]}${val}${prefixMatch[3]}`;
});

fs.writeFileSync(target, fixedLines.join('\n'), 'utf8');
console.log('Successfully sanitized all verification_source lines!');
