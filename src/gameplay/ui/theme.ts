import type { CSSProperties } from 'react';

export const MONO = 'ui-monospace, "SFMono-Regular", "Roboto Mono", Menlo, monospace';

export const COLORS = {
  amber: '#ffb648',
  teal: '#5fe0d0',
  tealDim: '#1e5b57',
  red: '#e2564a',
  ink: 'rgba(12, 17, 22, 0.92)',
  paper: '#e6e0d2',
  paperInk: '#2b2721',
};

export const CUT: CSSProperties = {
  clipPath: 'polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)',
};

export const panel: CSSProperties = {
  background: COLORS.ink,
  border: `1px solid ${COLORS.tealDim}`,
  boxShadow: '0 0 0 1px rgba(0,0,0,0.6), 0 8px 26px rgba(0,0,0,0.55)',
  fontFamily: MONO,
  color: COLORS.teal,
  ...CUT,
};

export const eyebrow: CSSProperties = {
  fontSize: 9,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'rgba(95, 224, 208, 0.55)',
};

export function actionButton(tone: 'accept' | 'reject' | 'neutral'): CSSProperties {
  const color = tone === 'accept' ? COLORS.teal : tone === 'reject' ? COLORS.red : COLORS.amber;
  return {
    ...CUT,
    flex: 1,
    padding: '12px 10px',
    background: 'rgba(12, 17, 22, 0.94)',
    border: `1px solid ${color}`,
    color,
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.16em',
    cursor: 'pointer',
  };
}
