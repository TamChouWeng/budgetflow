const fs = require('fs');
const payload = JSON.parse(fs.readFileSync('src/lib/seedData.json','utf8'));
const format = (key) => JSON.stringify(payload[key], null, 2);
const content = `export const seedHoldings = ${format('holdings')} as const;\nexport const seedTransactions = ${format('transactions')} as const;\nexport const seedFixedDeposits = ${format('fixedDeposits')} as const;\n`;
fs.writeFileSync('src/lib/seedData.ts', content);
console.log('Wrote seedData.ts');
