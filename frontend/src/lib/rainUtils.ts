export const RAIN_RANGES = [
  { min: 50, label: '> 50 mm', color: '#ff0000ff', desc: 'Extrema' },
  { min: 30, label: '30–50 mm', color: '#10053aff', desc: 'Alta' },
  { min: 15, label: '15–30 mm', color: '#0f0984', desc: 'Moderada' },
  { min: 4.5, label: '5–15 mm', color: '#6f6ff8ff', desc: 'Ligera' },
  { min: 0, label: 'Sin lluvia', color: '#f5f5f0', desc: '—' },
];

export const getColor = (value: number): string => {
  for (const range of RAIN_RANGES) {
    if (value > range.min) return range.color;
  }
  return RAIN_RANGES[RAIN_RANGES.length - 1].color;
};