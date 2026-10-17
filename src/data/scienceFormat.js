export const unavailable = 'Data belum tersedia';
const superscripts = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const exponentText = exponent => String(Number(exponent)).replace('-', '⁻').replace(/\d/g, digit => superscripts[Number(digit)]);

export function formatScienceValue(value, unit = '') {
  if (value == null || (typeof value === 'number' && !Number.isFinite(value))) return unavailable;
  let text;
  if (typeof value === 'number') {
    text = Math.abs(value) >= 1e12 || (value !== 0 && Math.abs(value) < 1e-4)
      ? value.toExponential(3).replace('.', ',')
      : value.toLocaleString('id-ID', { maximumFractionDigits: 6 });
  } else if (typeof value === 'string') text = value.trim();
  else return unavailable;
  if (!text || /^(null|undefined|nan|belum diverifikasi|tidak diketahui)$/i.test(text)) return unavailable;
  text = text.replace(/(-?\d+(?:[.,]\d+)?)e([+-]?\d+)/gi, (_, mantissa, exponent) => `${mantissa.replace('.', ',')} × 10${exponentText(exponent)}`)
    .replace(/(\d)\.(\d+)(?=\s*m\/s)/g, '$1,$2')
    .replace(/m\/s\^?2\b/g, 'm/s²').replace(/\bAU\b/g, 'au');
  return unit ? `${text} ${unit}` : text;
}

export function scienceSections(data) {
  return [
    { title: 'Karakteristik fisik', rows: [
      ['Diameter', formatScienceValue(data.diameterKm, 'km')], ['Massa', formatScienceValue(data.mass)],
      ['Gravitasi', formatScienceValue(data.gravity)], ['Suhu', formatScienceValue(data.temperature)],
      ['Komposisi', formatScienceValue(data.composition)]
    ] },
    { title: 'Orbit dan rotasi', rows: [
      [data.type === 'moon' ? 'Jarak dari induk' : 'Jarak dari Matahari', formatScienceValue(data.distance)],
      ['Periode rotasi', formatScienceValue(data.rotation)],
      ['Periode orbit', data.type === 'star' && data.orbitPeriod === '—' ? 'Tidak berlaku (orbit heliosentris)' : formatScienceValue(data.orbitPeriod)],
      ['Jumlah bulan', formatScienceValue(data.moons)]
    ] }
  ];
}
