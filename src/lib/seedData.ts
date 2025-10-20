export const seedHoldings = [
  {
    "id": "holding-0",
    "category": "reit",
    "name": "SUNWAY",
    "symbol": "SUNWAY",
    "quantity": 100,
    "avgCost": 5.54,
    "holdingCurrency": "MYR"
  },
  {
    "id": "holding-1",
    "category": "stocks",
    "name": "FFB",
    "symbol": "FFB",
    "quantity": 600,
    "avgCost": 2.0967,
    "holdingCurrency": "MYR"
  },
  {
    "id": "holding-2",
    "category": "reit",
    "name": "PAVREIT",
    "symbol": "PAVREIT",
    "quantity": 100,
    "avgCost": 1.75,
    "holdingCurrency": "MYR"
  },
  {
    "id": "holding-3",
    "category": "stocks",
    "name": "AMWAY",
    "symbol": "AMWAY",
    "quantity": 200,
    "avgCost": 6.83,
    "holdingCurrency": "MYR"
  },
  {
    "id": "holding-4",
    "category": "stocks",
    "name": "BIMB",
    "symbol": "BIMB",
    "quantity": 300,
    "avgCost": 2.3767,
    "holdingCurrency": "MYR"
  },
  {
    "id": "holding-5",
    "category": "stocks",
    "name": "GENTING",
    "symbol": "GENTING",
    "quantity": 100,
    "avgCost": 4.14,
    "holdingCurrency": "MYR"
  },
  {
    "id": "holding-6",
    "category": "stocks",
    "name": "KOPI",
    "symbol": "KOPI",
    "quantity": 200,
    "avgCost": 0.867,
    "holdingCurrency": "MYR"
  },
  {
    "id": "holding-7",
    "category": "stocks",
    "name": "MAYBANK",
    "symbol": "MAYBANK",
    "quantity": 500,
    "avgCost": 9.876,
    "holdingCurrency": "MYR"
  },
  {
    "id": "holding-8",
    "category": "stocks",
    "name": "PADINI",
    "symbol": "PADINI",
    "quantity": 100,
    "avgCost": 2.18,
    "holdingCurrency": "MYR"
  },
  {
    "id": "holding-9",
    "category": "stocks",
    "name": "PBBANK",
    "symbol": "PBBANK",
    "quantity": 300,
    "avgCost": 4.3433,
    "holdingCurrency": "MYR"
  },
  {
    "id": "holding-10",
    "category": "stocks",
    "name": "SIME",
    "symbol": "SIME",
    "quantity": 100,
    "avgCost": 2.22,
    "holdingCurrency": "MYR"
  },
  {
    "id": "holding-11",
    "category": "stocks",
    "name": "RHBBANK",
    "symbol": "RHBBANK",
    "quantity": 100,
    "avgCost": 6.15,
    "holdingCurrency": "MYR"
  },
  {
    "id": "holding-12",
    "category": "stocks",
    "name": "TM",
    "symbol": "TM",
    "quantity": 200,
    "avgCost": 6.62,
    "holdingCurrency": "MYR"
  },
  {
    "id": "holding-13",
    "category": "investment",
    "name": "Other",
    "symbol": "OTHER",
    "quantity": 1,
    "avgCost": 4850,
    "holdingCurrency": "MYR",
    "notes": "Buy Gold - 999 Gold 10gram"
  }
] as const;
export const seedTransactions = [
  {
    "id": "txn-0",
    "date": "2025-10-15T00:00:00.000Z",
    "name": "SUNWAY",
    "currency": "MYR",
    "category": "reit",
    "amount": 554
  },
  {
    "id": "txn-1",
    "date": "2025-10-17T00:00:00.000Z",
    "name": "FFB",
    "currency": "MYR",
    "category": "stocks",
    "amount": 484
  },
  {
    "id": "txn-2",
    "date": "2025-10-15T00:00:00.000Z",
    "name": "FFB",
    "currency": "MYR",
    "category": "stocks",
    "amount": 480
  },
  {
    "id": "txn-3",
    "date": "2025-10-09T00:00:00.000Z",
    "name": "EPF",
    "description": "Employee contribute",
    "currency": "MYR",
    "category": "epf",
    "amount": 1380
  },
  {
    "id": "txn-4",
    "date": "2025-10-02T00:00:00.000Z",
    "name": "PBBANK",
    "description": "-",
    "currency": "MYR",
    "category": "fixedDeposit",
    "amount": 12000
  },
  {
    "id": "txn-5",
    "date": "2025-09-28T00:00:00.000Z",
    "name": "MAYBANK",
    "description": "-",
    "currency": "MYR",
    "category": "fixedDeposit",
    "amount": 10000
  },
  {
    "id": "txn-6",
    "date": "2025-09-26T00:00:00.000Z",
    "name": "PBBANK",
    "description": "Dividend",
    "currency": "MYR",
    "category": "stocks",
    "amount": 10.5
  },
  {
    "id": "txn-7",
    "date": "2025-09-25T00:00:00.000Z",
    "name": "AMWAY",
    "description": "Dividend",
    "currency": "MYR",
    "category": "stocks",
    "amount": 10
  },
  {
    "id": "txn-8",
    "date": "2025-09-26T00:00:00.000Z",
    "name": "PBBANK",
    "description": "Buy",
    "currency": "MYR",
    "category": "fixedDeposit",
    "amount": 7000
  },
  {
    "id": "txn-9",
    "date": "2025-09-26T00:00:00.000Z",
    "name": "MAYBANK",
    "description": "Dividend",
    "currency": "MYR",
    "category": "stocks",
    "amount": 120
  },
  {
    "id": "txn-10",
    "date": "2025-09-25T00:00:00.000Z",
    "name": "EPF",
    "description": "Self contribute",
    "currency": "MYR",
    "category": "epf",
    "amount": 300
  },
  {
    "id": "txn-11",
    "date": "2025-09-24T00:00:00.000Z",
    "name": "PBBANK",
    "description": "Dividend",
    "currency": "MYR",
    "category": "stocks",
    "amount": 22
  },
  {
    "id": "txn-12",
    "date": "2025-09-20T00:00:00.000Z",
    "name": "PBBANK",
    "description": "-",
    "currency": "MYR",
    "category": "fixedDeposit",
    "amount": 6000
  },
  {
    "id": "txn-14",
    "date": "2025-09-12T00:00:00.000Z",
    "name": "EPF",
    "description": "Employee contribute",
    "currency": "MYR",
    "category": "epf",
    "amount": 3312
  },
  {
    "id": "txn-15",
    "date": "2025-09-12T00:00:00.000Z",
    "name": "PBBANK",
    "description": "-",
    "currency": "MYR",
    "category": "fixedDeposit",
    "amount": 8000
  },
  {
    "id": "txn-16",
    "date": "2025-09-10T00:00:00.000Z",
    "name": "PAVREIT",
    "currency": "MYR",
    "category": "reit",
    "amount": 175
  },
  {
    "id": "txn-17",
    "date": "2025-08-28T00:00:00.000Z",
    "name": "MAYBANK",
    "description": "Buy",
    "currency": "MYR",
    "category": "fixedDeposit",
    "amount": 5000
  },
  {
    "id": "txn-18",
    "date": "2025-08-26T00:00:00.000Z",
    "name": "AMWAY",
    "description": "Rakuten Trade by far record",
    "currency": "MYR",
    "category": "stocks",
    "amount": 1366
  },
  {
    "id": "txn-19",
    "date": "2025-08-26T00:00:00.000Z",
    "name": "BIMB",
    "description": "Rakuten Trade by far record",
    "currency": "MYR",
    "category": "stocks",
    "amount": 247
  },
  {
    "id": "txn-20",
    "date": "2025-08-26T00:00:00.000Z",
    "name": "FFB",
    "description": "Rakuten Trade by far record",
    "currency": "MYR",
    "category": "stocks",
    "amount": 294
  },
  {
    "id": "txn-21",
    "date": "2025-08-26T00:00:00.000Z",
    "name": "GENTING",
    "description": "Rakuten Trade by far record",
    "currency": "MYR",
    "category": "stocks",
    "amount": 414
  },
  {
    "id": "txn-22",
    "date": "2025-08-26T00:00:00.000Z",
    "name": "KOPI",
    "description": "Rakuten Trade by far record",
    "currency": "MYR",
    "category": "stocks",
    "amount": 173.4
  },
  {
    "id": "txn-23",
    "date": "2025-08-26T00:00:00.000Z",
    "name": "MAYBANK",
    "description": "Rakuten Trade by far record",
    "currency": "MYR",
    "category": "stocks",
    "amount": 970
  },
  {
    "id": "txn-24",
    "date": "2025-08-26T00:00:00.000Z",
    "name": "PADINI",
    "description": "Rakuten Trade by far record",
    "currency": "MYR",
    "category": "stocks",
    "amount": 218
  },
  {
    "id": "txn-25",
    "date": "2025-08-26T00:00:00.000Z",
    "name": "PBBANK",
    "description": "Rakuten Trade by far record",
    "currency": "MYR",
    "category": "stocks",
    "amount": 436
  },
  {
    "id": "txn-26",
    "date": "2025-08-26T00:00:00.000Z",
    "name": "SIME",
    "description": "Rakuten Trade by far record",
    "currency": "MYR",
    "category": "stocks",
    "amount": 222
  },
  {
    "id": "txn-27",
    "date": "2025-08-26T00:00:00.000Z",
    "name": "BIMB",
    "description": "M+ Global by far record",
    "currency": "MYR",
    "category": "stocks",
    "amount": 466
  },
  {
    "id": "txn-28",
    "date": "2025-08-26T00:00:00.000Z",
    "name": "MAYBANK",
    "description": "M+ Global by far record",
    "currency": "MYR",
    "category": "stocks",
    "amount": 3968
  },
  {
    "id": "txn-29",
    "date": "2025-08-26T00:00:00.000Z",
    "name": "PBBANK",
    "description": "M+ Global by far record",
    "currency": "MYR",
    "category": "stocks",
    "amount": 867
  },
  {
    "id": "txn-30",
    "date": "2025-08-26T00:00:00.000Z",
    "name": "RHBBANK",
    "description": "M+ Global by far record",
    "currency": "MYR",
    "category": "stocks",
    "amount": 615
  },
  {
    "id": "txn-31",
    "date": "2025-08-26T00:00:00.000Z",
    "name": "TM",
    "description": "M+ Global by far record",
    "currency": "MYR",
    "category": "stocks",
    "amount": 1324
  },
  {
    "id": "txn-32",
    "date": "2025-08-24T00:00:00.000Z",
    "name": "EPF",
    "description": "EPF by far",
    "currency": "MYR",
    "category": "epf",
    "amount": 62824.81
  },
  {
    "id": "txn-33",
    "date": "2025-08-24T00:00:00.000Z",
    "name": "Other",
    "description": "Buy Gold - 999 Gold 10gram",
    "currency": "MYR",
    "category": "investment",
    "subcategory": "Buy Gold",
    "amount": 4850
  },
  {
    "id": "txn-34",
    "date": "2025-08-06T00:00:00.000Z",
    "name": "RHB",
    "description": "-",
    "currency": "MYR",
    "category": "fixedDeposit",
    "amount": 5000
  },
  {
    "id": "txn-35",
    "date": "2025-08-01T00:00:00.000Z",
    "name": "The Skies",
    "description": "Pay",
    "currency": "MYR",
    "category": "property",
    "amount": 1000,
    "subcategory": "The Skies"
  },
  {
    "id": "txn-36",
    "date": "2025-07-07T00:00:00.000Z",
    "name": "PBBANK",
    "description": "-",
    "currency": "MYR",
    "category": "fixedDeposit",
    "amount": 11000
  },
  {
    "id": "txn-37",
    "date": "2025-05-28T00:00:00.000Z",
    "name": "PBBANK",
    "description": "-",
    "currency": "MYR",
    "category": "fixedDeposit",
    "amount": 6000
  },
  {
    "id": "txn-38",
    "date": "2025-05-07T00:00:00.000Z",
    "name": "MAYBANK",
    "description": "-",
    "currency": "MYR",
    "category": "fixedDeposit",
    "amount": 5000
  },
  {
    "id": "txn-39",
    "date": "2024-10-28T00:00:00.000Z",
    "name": "MAYBANK",
    "description": "-",
    "currency": "MYR",
    "category": "fixedDeposit",
    "amount": 15000
  },
  {
    "id": "txn-40",
    "date": "2024-10-28T00:00:00.000Z",
    "name": "PBBANK",
    "description": "-",
    "currency": "MYR",
    "category": "fixedDeposit",
    "amount": 10000
  }
] as const;
export const seedFixedDeposits = [
  {
    "id": "fd-4",
    "bank": "PBBANK",
    "name": "-",
    "principal": 12000,
    "ratePct": 0,
    "startDate": "2025-10-02T00:00:00.000Z",
    "maturityDate": "2026-04-02T00:00:00.000Z",
    "currency": "MYR"
  },
  {
    "id": "fd-5",
    "bank": "MAYBANK",
    "name": "-",
    "principal": 10000,
    "ratePct": 0,
    "startDate": "2025-09-28T00:00:00.000Z",
    "maturityDate": "2026-03-28T00:00:00.000Z",
    "currency": "MYR"
  },
  {
    "id": "fd-8",
    "bank": "PBBANK",
    "name": "Buy",
    "principal": 7000,
    "ratePct": 0,
    "startDate": "2025-09-26T00:00:00.000Z",
    "maturityDate": "2026-03-26T00:00:00.000Z",
    "currency": "MYR"
  },
  {
    "id": "fd-12",
    "bank": "PBBANK",
    "name": "-",
    "principal": 6000,
    "ratePct": 0,
    "startDate": "2025-09-20T00:00:00.000Z",
    "maturityDate": "2026-03-20T00:00:00.000Z",
    "currency": "MYR"
  },
  {
    "id": "fd-15",
    "bank": "PBBANK",
    "name": "-",
    "principal": 8000,
    "ratePct": 0,
    "startDate": "2025-09-12T00:00:00.000Z",
    "maturityDate": "2026-03-12T00:00:00.000Z",
    "currency": "MYR"
  },
  {
    "id": "fd-17",
    "bank": "MAYBANK",
    "name": "Buy",
    "principal": 5000,
    "ratePct": 0,
    "startDate": "2025-08-28T00:00:00.000Z",
    "maturityDate": "2026-02-28T00:00:00.000Z",
    "currency": "MYR"
  },
  {
    "id": "fd-34",
    "bank": "RHB",
    "name": "-",
    "principal": 5000,
    "ratePct": 0,
    "startDate": "2025-08-06T00:00:00.000Z",
    "maturityDate": "2026-06-02T00:00:00.000Z",
    "currency": "MYR"
  },
  {
    "id": "fd-36",
    "bank": "PBBANK",
    "name": "-",
    "principal": 11000,
    "ratePct": 0,
    "startDate": "2025-07-07T00:00:00.000Z",
    "maturityDate": "2026-01-07T00:00:00.000Z",
    "currency": "MYR"
  },
  {
    "id": "fd-37",
    "bank": "PBBANK",
    "name": "-",
    "principal": 6000,
    "ratePct": 0,
    "startDate": "2025-05-28T00:00:00.000Z",
    "maturityDate": "2025-11-28T00:00:00.000Z",
    "currency": "MYR"
  },
  {
    "id": "fd-38",
    "bank": "MAYBANK",
    "name": "-",
    "principal": 5000,
    "ratePct": 0,
    "startDate": "2025-05-07T00:00:00.000Z",
    "maturityDate": "2025-11-07T00:00:00.000Z",
    "currency": "MYR"
  },
  {
    "id": "fd-39",
    "bank": "MAYBANK",
    "name": "-",
    "principal": 15000,
    "ratePct": 0,
    "startDate": "2024-10-28T00:00:00.000Z",
    "maturityDate": "2026-03-05T00:00:00.000Z",
    "currency": "MYR"
  },
  {
    "id": "fd-40",
    "bank": "PBBANK",
    "name": "-",
    "principal": 10000,
    "ratePct": 0,
    "startDate": "2024-10-28T00:00:00.000Z",
    "maturityDate": "2025-10-28T00:00:00.000Z",
    "currency": "MYR"
  }
] as const;
