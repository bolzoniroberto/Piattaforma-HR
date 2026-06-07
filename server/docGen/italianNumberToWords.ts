const ones = ['', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove',
  'dieci', 'undici', 'dodici', 'tredici', 'quattordici', 'quindici', 'sedici',
  'diciassette', 'diciotto', 'diciannove'];
const tens = ['', '', 'venti', 'trenta', 'quaranta', 'cinquanta', 'sessanta', 'settanta', 'ottanta', 'novanta'];

function hundredsToWords(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  if (one === 0) return tens[ten];
  // Drop trailing vowel before uno/otto
  const tenStr = (one === 1 || one === 8) ? tens[ten].replace(/[aeiou]$/, '') : tens[ten];
  return tenStr + ones[one];
}

function threeDigitsToWords(n: number): string {
  if (n === 0) return '';
  if (n < 100) return hundredsToWords(n);
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const restStr = hundredsToWords(rest);
  // Drop trailing 'o' from "cento" before words starting with vowel (otto, ottanta…)
  const prefix = hundreds === 1
    ? (restStr.startsWith('o') ? 'cent' : 'cento')
    : ones[hundreds] + 'cento';
  return prefix + restStr;
}

export function italianNumberToWords(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '';
  const intPart = Math.floor(n);
  if (intPart === 0) return 'zero/00';

  if (intPart === 1000000) return 'unmilione/00';

  let result = '';

  const millions = Math.floor(intPart / 1_000_000);
  const thousands = Math.floor((intPart % 1_000_000) / 1_000);
  const remainder = intPart % 1_000;

  if (millions > 0) {
    result += millions === 1 ? 'unmilione' : threeDigitsToWords(millions) + 'milioni';
  }

  if (thousands > 0) {
    if (thousands === 1) {
      result += 'mille';
    } else {
      result += threeDigitsToWords(thousands) + 'mila';
    }
  }

  result += threeDigitsToWords(remainder);

  return result + '/00';
}

export function italianCurrencyFormat(n: number): string {
  return new Intl.NumberFormat('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.floor(n));
}
