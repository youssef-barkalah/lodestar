const EXPR_RE = /^[\d\s()+\-*/%^.,eE]+$/;
const BINARY_RE = /\d+\s*[+\-*/%^]\s*\d+/;

function safeEval(expr) {
  const cleaned = String(expr)
    .replace(/[\u00a0\u2212]/g, ' ')
    .replace(/\^/g, '**')
    .replace(/(\d)\s*%\s*/g, '$1/100*')
    .replace(/([0-9)])(?=\()/g, '$1*')
    .replace(/\)(?=[0-9])/g, ')*');
  if (!EXPR_RE.test(cleaned)) return null;
  if (!BINARY_RE.test(cleaned.replace(/\s/g, ''))) return null;
  try {
    const value = Function(
      '"use strict";return (' + cleaned + ');'
    )();
    if (typeof value !== 'number' || !isFinite(value)) return null;
    return round(value);
  } catch (err) {
    return null;
  }
}

function round(value) {
  const abs = Math.abs(value);
  const decimals = abs >= 1e12 || (abs > 0 && abs < 1e-6) ? 6 : 10;
  const scaled = Number(value.toFixed(decimals));
  return Object.is(scaled, -0) ? 0 : scaled;
}

function niceNumber(value) {
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e15 || abs < 1e-6)) {
    return value.toExponential(6).replace(/\.?0+e/, 'e');
  }
  return String(value).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
}

const UNITS = {
  temperature: {
    base: 'k',
    convert: {
      c: { to: function (v) { return v + 273.15; }, from: function (v) { return v - 273.15; } },
      f: { to: function (v) { return (v + 459.67) * 5 / 9; }, from: function (v) { return v * 9 / 5 - 459.67; } },
      k: { to: function (v) { return v; }, from: function (v) { return v; } },
    },
  },
  length: {
    base: 'm',
    factors: { m: 1, meter: 1, meters: 1, km: 1000, kilometer: 1000, kilometers: 1000, cm: 0.01, centimeter: 0.01, centimeters: 0.01, mm: 0.001, millimeter: 0.001, millimeters: 0.001, mi: 1609.344, mile: 1609.344, miles: 1609.344, ft: 0.3048, foot: 0.3048, feet: 0.3048, yd: 0.9144, yard: 0.9144, yards: 0.9144, in: 0.0254, inch: 0.0254, inches: 0.0254 },
  },
  mass: {
    base: 'kg',
    factors: { kg: 1, kilogram: 1, kilograms: 1, g: 0.001, gram: 0.001, grams: 0.001, mg: 1e-6, milligram: 1e-6, lb: 0.45359237, lbs: 0.45359237, pound: 0.45359237, pounds: 0.45359237, oz: 0.028349523125, ounce: 0.028349523125, ounces: 0.028349523125, t: 1000, tonne: 1000, tonnes: 1000, st: 6.35029318, stone: 6.35029318 },
  },
  volume: {
    base: 'l',
    factors: { l: 1, liter: 1, liters: 1, litre: 1, litres: 1, ml: 0.001, milliliter: 0.001, milliliters: 0.001, gal: 3.785411784, gallon: 3.785411784, gallons: 3.785411784, 'fl oz': 0.0295735295625, 'floz': 0.0295735295625, cup: 0.2365882365, cups: 0.2365882365, pint: 0.473176473, pints: 0.473176473, tbsp: 0.01478676478125, tablespoon: 0.01478676478125, tsp: 0.00492892159375, teaspoon: 0.00492892159375 },
  },
  speed: {
    base: 'm/s',
    factors: { 'm/s': 1, mph: 0.44704, kph: 0.2777777778, 'km/h': 0.2777777778, 'kmh': 0.2777777778, knot: 0.5144444444, knots: 0.5144444444, 'fps': 0.3048 },
  },
  data: {
    base: 'mb',
    factors: { mb: 1, mbyte: 1, gb: 1024, gbyte: 1024, tb: 1048576, tbyte: 1048576, kb: 1 / 1024, kbyte: 1 / 1024, b: 1 / 1048576, byte: 1 / 1048576 },
  },
};

const PREFIXES = ['/', ' to ', ' in ', ' = ', '=\u00a0', ' in ', ' into '];
const SPLIT_RE = /\s+(?:to|in|into|as|is|equals?)\s+|\s*=\s*/i;

function parseConversion(query) {
  const text = String(query).trim();
  const match = text.match(
    /^(-?[\d.,]+\s*(?:[eE][+-]?\d+)?)\s*([a-zA-Z/]+)\s+(?:to|in|into|as|equals?)\s+([a-zA-Z/]+)$/i
  );
  if (!match) return null;
  const value = Number(String(match[1]).replace(/,/g, ''));
  if (!isFinite(value)) return null;
  const from = match[2].toLowerCase();
  const to = match[3].toLowerCase();
  if (from === to) return null;

  for (const group of Object.keys(UNITS)) {
    const table = UNITS[group];
    if (group === 'temperature') {
      const c = table.convert;
      if (c[from] && c[to]) {
        const result = c[to].from(c[from].to(value));
        return {
          kind: 'conversion',
          value,
          from: from.toUpperCase(),
          to: to.toUpperCase(),
          result: round(result),
          text: niceNumber(value) + ' ' + from + ' = ' + niceNumber(round(result)) + ' ' + to,
        };
      }
      continue;
    }
    const f = table.factors;
    const a = f[from];
    const b = f[to];
    if (a != null && b != null) {
      const result = (value * a) / b;
      return {
        kind: 'conversion',
        value,
        from,
        to,
        result: round(result),
        text: niceNumber(value) + ' ' + from + ' = ' + niceNumber(round(result)) + ' ' + to,
      };
    }
  }
  return null;
}

function percentAnswer(query) {
  const match = String(query)
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*(?:%|percent)\s+of\s+(\d+(?:\.\d+)?)$/i);
  if (!match) return null;
  const percent = Number(match[1]);
  const base = Number(match[2]);
  if (!isFinite(percent) || !isFinite(base)) return null;
  const result = (percent / 100) * base;
  return {
    kind: 'math',
    expression: query,
    result: round(result),
    text: niceNumber(round(result)) + ' is ' + niceNumber(percent) + '% of ' + niceNumber(base),
  };
}

export function instantAnswer(query) {
  const q = String(query || '').trim();
  if (!q) return null;

  const conversion = parseConversion(q);
  if (conversion) return conversion;

  const percent = percentAnswer(q);
  if (percent) return percent;

  const math = safeEval(q);
  if (math !== null) {
    return {
      kind: 'math',
      expression: q,
      result: math,
      text: q + ' = ' + niceNumber(math),
    };
  }
  return null;
}
