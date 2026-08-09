import { useEffect, useState } from 'react';
import { playScream } from '../audio';
import type { MistakeType } from '../types';
import { COLORS, MONO } from './theme';

const DURATION_MS = 3400;

/**
 * The only moment the game ever reacts to a mistake. Which cue plays depends on
 * the third mistake: an alien waved through screams from beyond the Entry gate
 * (top-left of the hall), a human sent to detention screams from the block
 * (right side).
 */
export function Cutscene({ kind, onDone }: { kind: MistakeType; onDone: () => void }) {
  const [visible, setVisible] = useState(false);
  const fromEntry = kind === 'accepted-alien';

  useEffect(() => {
    setVisible(true);
    const stop = playScream(fromEntry ? -0.85 : 0.85, 2.4);
    const id = setTimeout(onDone, DURATION_MS);
    return () => {
      clearTimeout(id);
      stop();
    };
  }, [fromEntry, onDone]);

  const origin = fromEntry ? '18% 26%' : '86% 34%';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 15,
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 500ms ease-out',
        background: `radial-gradient(60% 60% at ${origin}, rgba(226,86,74,0.55) 0%, rgba(226,86,74,0.16) 38%, rgba(4,5,8,0.88) 78%)`,
        display: 'grid',
        placeItems: 'end center',
        paddingBottom: '14vh',
        animation: 'bc-shudder 220ms steps(2) infinite',
      }}
    >
      <style>{`
        @keyframes bc-shudder {
          0%   { transform: translate(0, 0); }
          50%  { transform: translate(1.5px, -1px); }
          100% { transform: translate(-1px, 1px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-cutscene] { animation: none !important; }
        }
      `}</style>
      <div
        data-cutscene
        style={{
          fontFamily: MONO,
          fontSize: 'clamp(14px, 3vw, 20px)',
          letterSpacing: '0.14em',
          color: COLORS.red,
          textAlign: 'center',
          textShadow: '0 0 18px rgba(0,0,0,0.9)',
          maxWidth: '80vw',
        }}
      >
        {fromEntry
          ? 'Screaming from inside the station.'
          : 'Screaming from the detention block.'}
      </div>
    </div>
  );
}
