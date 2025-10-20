const fs = require('fs');

const sourcePath = 'sample data/Finance 2025 - History.csv';
const rawLines = fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/).filter(Boolean);
if (rawLines.length < 2) {
  throw new Error('CSV file appears to be empty.');
}

const headers = rawLines[1].split(',').map((header) => header.trim().replace(/\r$/, ''));
const rows = rawLines.slice(2).map((line) => {
  const parts = line.split(',');
  while (parts.length < headers.length) parts.push('');
  return headers.reduce((acc, header, index) => {
    acc[header] = (parts[index] ?? '').trim();
    return acc;
  }, {});
});

const parseNumber = (value) => {
  if (!value || value === '-') return null;
  const num = Number(value.replace(/,/g, ''));
  return Number.isFinite(num) ? num : null;
};

const parseDate = (value) => {
  if (!value || value === '-' || value === '--') return null;
  const [rawDay, rawMonth, rawYear] = value.split(/\//);
  if (!rawYear) return null;
  const day = Number(rawDay);
  const month = Number(rawMonth);
  const year = Number(rawYear.length === 2 ? `20${rawYear}` : rawYear);
  if (!day || !month || !year) return null;
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
};

const activeRows = rows.filter((row) => row.Status.toLowerCase() === 'active');
const holdingsMap = new Map();
const transactions = [];
const fixedDeposits = [];

activeRows.forEach((row, index) => {
  const type = row.Type.toLowerCase();
  const action = row.Action.toLowerCase();
  const totalAmount = parseNumber(row['Total Amount']);
  const quantity = parseNumber(row['Quantity/Amount']);
  const unitPrice = parseNumber(row['Unit Price']);
  const interest = parseNumber(row['Interest/Dividend']);
  const date = parseDate(row.Date);
  if (!date) return;
  const name = row.Name;
  const description = row.Remarks ? row.Remarks : undefined;

  const baseTransaction = {
    id: `txn-${index}`,
    date,
    name: name || undefined,
    description,
    currency: 'MYR',
  };

  const appendHolding = (category) => {
    if (!name) return;
    if (!quantity || !unitPrice) return;
    const key = `${category}:${name.toUpperCase()}`;
    const current = holdingsMap.get(key) || {
      id: `holding-${key}`,
      category,
      name,
      symbol: name.toUpperCase(),
      quantity: 0,
      totalCost: 0,
    };
    current.quantity += quantity;
    current.totalCost += unitPrice * quantity;
    holdingsMap.set(key, current);
  };

  const pushTransaction = (category, amount, extra = {}) => {
    if (!amount) return;
    transactions.push({
      ...baseTransaction,
      category,
      amount,
      ...extra,
    });
  };

  if (type === 'stock' || type === 'reit') {
    const category = type === 'stock' ? 'stocks' : 'reit';
    if (action.includes('buy')) {
      pushTransaction(category, totalAmount);
      appendHolding(category);
    } else if (action.includes('dividend') && interest) {
      pushTransaction(category, interest, {
        description: row.Remarks ? `${row.Action} · ${row.Remarks}` : row.Action,
      });
    }
  } else if (type === 'fd') {
    pushTransaction('fixedDeposit', totalAmount, {
      description: row.Remarks || row.Action,
    });
    const maturity = parseDate(row['Maturity Date']);
    fixedDeposits.push({
      id: `fd-${index}`,
      bank: name,
      name: row.Remarks ? row.Remarks : row.Action,
      principal: totalAmount || 0,
      ratePct: 0,
      startDate: date,
      maturityDate: maturity ?? date,
      currency: 'MYR',
    });
  } else if (type === 'epf') {
    pushTransaction('epf', totalAmount, { description: row.Action });
  } else if (type === 'other') {
    pushTransaction('other', totalAmount, { description: row.Action });
    appendHolding('other');
  } else if (type === 'property') {
    const amount = totalAmount ? Math.abs(totalAmount) : null;
    pushTransaction('property', amount, {
      description: row.Action,
      subcategory: name,
    });
  } else {
    const amount = totalAmount ?? interest;
    pushTransaction('business', amount, { description: row.Action });
  }
});

const holdings = Array.from(holdingsMap.values()).map((holding, index) => ({
  id: `holding-${index}`,
  category: holding.category,
  name: holding.name,
  symbol: holding.symbol,
  quantity: Number(holding.quantity.toFixed(4)),
  avgCost: holding.quantity
    ? Number((holding.totalCost / holding.quantity).toFixed(4))
    : 0,
  holdingCurrency: 'MYR',
}));

const payload = {
  holdings,
  transactions,
  fixedDeposits,
};

fs.writeFileSync('sample-data-active.json', JSON.stringify(payload, null, 2));
console.log('Generated sample-data-active.json with', payload);
