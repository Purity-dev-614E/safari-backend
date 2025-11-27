const PERIOD_MAP = {
  week: { days: 7, canonical: 'weekly' },
  weekly: { days: 7, canonical: 'weekly' },
  month: { months: 1, canonical: 'monthly' },
  monthly: { months: 1, canonical: 'monthly' },
  quarter: { months: 3, canonical: 'quarterly' },
  quarterly: { months: 3, canonical: 'quarterly' },
  '6months': { months: 6, canonical: 'semiannual' },
  'sixmonths': { months: 6, canonical: 'semiannual' },
  'halfyear': { months: 6, canonical: 'semiannual' },
  'half-year': { months: 6, canonical: 'semiannual' },
  semiannual: { months: 6, canonical: 'semiannual' },
  biannual: { months: 6, canonical: 'semiannual' },
  year: { years: 1, canonical: 'yearly' },
  yearly: { years: 1, canonical: 'yearly' },
};

const SUPPORTED_PERIODS = ['monthly', 'quarterly', 'semiannual', 'yearly', 'weekly'];

function normalizePeriod(period) {
  return typeof period === 'string' ? period.trim().toLowerCase() : '';
}

function getPeriodRange(period) {
  const normalized = normalizePeriod(period);
  const config = PERIOD_MAP[normalized];

  if (!config) {
    throw new Error(
      `Invalid period. Supported options: ${SUPPORTED_PERIODS.join(', ')}`
    );
  }

  const endDate = new Date();
  const startDate = new Date(endDate);

  if (config.years) {
    startDate.setFullYear(startDate.getFullYear() - config.years);
  } else if (config.months) {
    startDate.setMonth(startDate.getMonth() - config.months);
  } else if (config.days) {
    startDate.setDate(startDate.getDate() - config.days);
  }

  return {
    startDate,
    endDate,
    canonicalPeriod: config.canonical,
  };
}

function isValidPeriod(period) {
  const normalized = normalizePeriod(period);
  return Boolean(PERIOD_MAP[normalized]);
}

module.exports = {
  getPeriodRange,
  isValidPeriod,
  SUPPORTED_PERIODS,
};

