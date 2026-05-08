export const formatCurrency = (n: number, currency = 'GYD') =>
  new Intl.NumberFormat('en-GY', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n ?? 0);

export const formatDate = (d: string | Date) =>
  new Intl.DateTimeFormat('en-GY', { year: 'numeric', month: 'short', day: '2-digit' })
    .format(new Date(d));

export const formatDateTime = (d: string | Date) =>
  new Intl.DateTimeFormat('en-GY', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(d));

export const formatNumber = (n: number, fractionDigits = 0) =>
  new Intl.NumberFormat('en-GY', {
    minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits,
  }).format(n ?? 0);
