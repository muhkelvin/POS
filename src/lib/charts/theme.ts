/**
 * NexaPOS Centralized Recharts Theme
 * Defined according to Section 5A.3 & 5A.5 (Kertas & Tinta)
 */

export const CHART_THEME = {
  colors: {
    paper: '#F4F1E8',
    surface: '#FBFAF5',
    ink: '#1B1A17',
    inkMuted: '#6A655A',
    line: '#D8D3C5',
    lineDashed: '#B9B3A2',
    tag: '#F2B705',
    success: '#2F7D4F',
    warning: '#A8520B',
    danger: '#B8321F',
    categories: {
      minuman: '#2B7A78',
      makanan: '#C4622D',
      rumah: '#7A7F2A',
      perawatan: '#7B4B6A',
      aksesori: '#4A5A73',
    },
  },
  grid: {
    stroke: '#D8D3C5',
    strokeDasharray: '3 3',
  },
  axis: {
    stroke: '#D8D3C5',
    tick: {
      fill: '#6A655A',
      fontSize: 12,
      fontFamily: 'var(--font-ibm-plex-mono), monospace',
    },
  },
  tooltipStyle: {
    backgroundColor: '#FBFAF5',
    border: '1px solid #1B1A17',
    borderRadius: '4px',
    padding: '8px 12px',
    boxShadow: 'none',
    fontFamily: 'var(--font-ibm-plex-mono), monospace',
    fontSize: '12px',
    color: '#1B1A17',
  },
};
