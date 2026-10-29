export const colors = {
  periodConfirmed: '#D95F78',
  periodPredicted: '#D95F78',
  fertile: '#5B8FD4',
  fertileAccent: '#B8D0F5',
  today: '#1A1A2E',
  text: '#1A1A2E',
  textLight: '#FFFFFF',
  textMuted: '#9A9AAF',
  textSecondary: '#5A5A72',
  background: '#F7F7FA',
  surface: '#FFFFFF',
  border: '#EBEBF2',
  sheetHandle: '#D0D0DC',
  overlay: 'rgba(0,0,0,0.35)',
} as const;

export type Colors = typeof colors;
