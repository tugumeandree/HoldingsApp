/**
 * Uganda Revenue Authority (URA) Tax Utilities
 * PAYE rates effective FY 2024/25
 */

export function formatUGX(amount: number): string {
  return `UGX ${Math.round(amount).toLocaleString('en-UG')}`;
}

/**
 * Uganda PAYE monthly tax bands (URA)
 * Band 1: 0 – 235,000         = 0%
 * Band 2: 235,001 – 335,000   = 10%
 * Band 3: 335,001 – 410,000   = 20%
 * Band 4: 410,001 – 10,000,000 = 30%
 * Band 5: Above 10,000,000    = 40%
 */
export function calculateMonthlyPAYE(monthlyIncome: number): number {
  if (monthlyIncome <= 0) return 0;
  if (monthlyIncome <= 235000) return 0;
  if (monthlyIncome <= 335000) return (monthlyIncome - 235000) * 0.1;
  if (monthlyIncome <= 410000) return 10000 + (monthlyIncome - 335000) * 0.2;
  if (monthlyIncome <= 10000000) return 25000 + (monthlyIncome - 410000) * 0.3;
  return 2902000 + (monthlyIncome - 10000000) * 0.4;
}

export function calculateAnnualPAYE(annualIncome: number): number {
  return calculateMonthlyPAYE(annualIncome / 12) * 12;
}

export interface TakeHomeResult {
  grossMonthly: number;
  paye: number;
  whtCredit: number;
  netTaxLiability: number;
  netTakeHome: number;
  effectiveTaxRate: number;
}

export function calculateTakeHome(grossMonthly: number, whtCreditMonthly = 0): TakeHomeResult {
  const paye = calculateMonthlyPAYE(grossMonthly);
  const whtCredit = Math.min(whtCreditMonthly, paye);
  const netTaxLiability = Math.max(0, paye - whtCredit);
  const netTakeHome = grossMonthly - netTaxLiability;
  const effectiveTaxRate = grossMonthly > 0 ? (netTaxLiability / grossMonthly) * 100 : 0;
  return { grossMonthly, paye, whtCredit, netTaxLiability, netTakeHome, effectiveTaxRate };
}

/** Detailed band-by-band PAYE breakdown for a given monthly income */
export function getPAYEBreakdown(monthlyIncome: number) {
  const bands = [
    { label: '0 – 235,000', min: 0, max: 235000, rate: 0 },
    { label: '235,001 – 335,000', min: 235001, max: 335000, rate: 0.1 },
    { label: '335,001 – 410,000', min: 335001, max: 410000, rate: 0.2 },
    { label: '410,001 – 10,000,000', min: 410001, max: 10000000, rate: 0.3 },
    { label: 'Above 10,000,000', min: 10000001, max: Infinity, rate: 0.4 },
  ];

  return bands.map((band) => {
    if (monthlyIncome <= band.min - 1) return { ...band, taxableAmount: 0, taxDue: 0 };
    const taxableAmount = Math.max(0, Math.min(monthlyIncome, band.max) - (band.min - 1));
    return { ...band, taxableAmount, taxDue: taxableAmount * band.rate };
  });
}

export const PAYE_BANDS = [
  { range: '0 – 235,000', min: 0, max: 235000, rate: '0%', rateNum: 0 },
  { range: '235,001 – 335,000', min: 235001, max: 335000, rate: '10%', rateNum: 0.1 },
  { range: '335,001 – 410,000', min: 335001, max: 410000, rate: '20%', rateNum: 0.2 },
  { range: '410,001 – 10,000,000', min: 410001, max: 10000000, rate: '30%', rateNum: 0.3 },
  { range: 'Above 10,000,000', min: 10000001, max: Infinity, rate: '40%', rateNum: 0.4 },
];

export const WHT_RATES: Record<string, number> = {
  'Professional Services': 0.06,
  'Consultancy Fees': 0.06,
  'Dividends': 0.15,
  'Interest / Deposits': 0.15,
  'Rental Income': 0.15,
  'Management Fees': 0.15,
  'Royalties': 0.15,
  'Commissions': 0.06,
};

export const EXPENSE_CATEGORIES = [
  'Travel & Transport',
  'Marketing & Advertising',
  'Office Supplies',
  'Utilities',
  'Professional Services',
  'Salaries & Wages',
  'Equipment & Machinery',
  'Rent & Premises',
  'Software & Technology',
  'Training & Development',
  'Insurance',
  'Banking & Finance Charges',
  'Repairs & Maintenance',
  'Entertainment',
  'Other',
];

export const INCOME_SOURCES = [
  'Employment / Salary',
  'Business Profits',
  'Consultancy / Professional Fees',
  'Rental Income',
  'Dividends',
  'Interest Income',
  'Capital Gains',
  'Freelance / Gig Work',
  'Government Contracts',
  'Investments',
  'Other',
];
