import { useEffect, useState } from 'react';
import { getTopScores, type HighscoreEntry } from '../highscoreStore';
import { COLORS, CUT, MONO, actionButton, eyebrow, panel } from './theme';

type LoadState = 'loading' | 'ready' | 'error';

export function StartScreen({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState('');
  const [scores, setScores] = useState<HighscoreEntry[]>([]);
  const [status, setStatus] = useState<LoadState>('loading');

  useEffect(() => {
    let cancelled = false;
    getTopScores(3)
      .then((entries) => {
        if (cancelled) return;
        setScores(entries);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const trimmed = name.trim();

  return (
    <Backdrop>
      <div style={{ width: 'min(420px, 92vw)', display: 'grid', gap: 18 }}>
        <header style={{ textAlign: 'center' }}>
          <div style={eyebrow}>Sector 7 · Arrivals</div>
          <h1
            style={{
              fontFamily: MONO,
              fontSize: 32,
              letterSpacing: '0.06em',
              color: COLORS.amber,
              margin: '6px 0 4px',
            }}
          >
            BORDER CONTROL
          </h1>
          <p style={{ fontFamily: MONO, fontSize: 11, color: COLORS.teal, opacity: 0.7, margin: 0 }}>
            Only humans may board the station.
          </p>
        </header>

        <div style={{ ...panel, padding: '12px 14px' }}>
          <div style={eyebrow}>Top officers</div>
          <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
            {status === 'loading' && <Muted>Loading leaderboard…</Muted>}
            {status === 'error' && <Muted>Leaderboard unavailable</Muted>}
            {status === 'ready' && scores.length === 0 && <Muted>No scores yet — set one.</Muted>}
            {status === 'ready' &&
              scores.map((entry, i) => (
                <div
                  key={`${entry.name}-${i}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: MONO,
                    fontSize: 13,
                    color: i === 0 ? COLORS.amber : COLORS.teal,
                  }}
                >
                  <span style={{ opacity: 0.85 }}>
                    {i + 1}. {entry.name}
                  </span>
                  <span style={{ fontWeight: 700 }}>{entry.score}</span>
                </div>
              ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ ...eyebrow, textAlign: 'center' }} htmlFor="officer-name">
            Officer name
          </label>
          <input
            id="officer-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && trimmed) onStart(trimmed);
            }}
            maxLength={24}
            placeholder="Enter your name"
            style={{
              ...CUT,
              padding: '12px 14px',
              background: 'rgba(12,17,22,0.94)',
              border: `1px solid ${COLORS.tealDim}`,
              color: COLORS.teal,
              fontFamily: MONO,
              fontSize: 15,
              textAlign: 'center',
              letterSpacing: '0.08em',
            }}
          />
          <button
            type="button"
            disabled={!trimmed}
            onClick={() => onStart(trimmed)}
            style={{ ...actionButton('neutral'), opacity: trimmed ? 1 : 0.4 }}
          >
            START SHIFT
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 12, color: COLORS.teal, opacity: 0.5 }}>
      {children}
    </div>
  );
}

export function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        background: 'radial-gradient(120% 90% at 50% 0%, #0d1720 0%, #05070d 70%)',
        zIndex: 20,
      }}
    >
      {children}
    </div>
  );
}
