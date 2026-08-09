import { useEffect, useRef, useState } from 'react';
import { getRank, saveScore } from '../highscoreStore';
import { Backdrop } from './StartScreen';
import { COLORS, MONO, eyebrow, panel } from './theme';

type RankState =
  | { status: 'loading' }
  | { status: 'ready'; rank: number }
  | { status: 'error' };

export function EndScreen({
  name,
  score,
  onRestart,
}: {
  name: string;
  score: number;
  onRestart: () => void;
}) {
  const [rank, setRank] = useState<RankState>({ status: 'loading' });
  const [armed, setArmed] = useState(false);
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current) return;
    submitted.current = true;
    let cancelled = false;

    (async () => {
      try {
        await saveScore(name, score);
        const placement = await getRank(score);
        if (!cancelled) setRank({ status: 'ready', rank: placement });
      } catch {
        if (!cancelled) setRank({ status: 'error' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [name, score]);

  // short delay so a stray click at game over doesn't skip the screen instantly
  useEffect(() => {
    const id = setTimeout(() => setArmed(true), 900);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!armed) return;
    const go = () => onRestart();
    window.addEventListener('pointerdown', go);
    window.addEventListener('keydown', go);
    return () => {
      window.removeEventListener('pointerdown', go);
      window.removeEventListener('keydown', go);
    };
  }, [armed, onRestart]);

  return (
    <Backdrop>
      <div style={{ width: 'min(460px, 92vw)', display: 'grid', gap: 20, textAlign: 'center' }}>
        <h1
          style={{
            fontFamily: MONO,
            fontSize: 'clamp(28px, 7vw, 44px)',
            letterSpacing: '0.04em',
            color: COLORS.red,
            margin: 0,
            textShadow: '0 0 24px rgba(226,86,74,0.4)',
          }}
        >
          You messed up!!
        </h1>

        <div style={{ ...panel, padding: '18px 16px' }}>
          <div style={eyebrow}>Final score</div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 52,
              fontWeight: 700,
              color: COLORS.amber,
              lineHeight: 1.1,
              margin: '4px 0 10px',
            }}
          >
            {score}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 13, color: COLORS.teal }}>
            {rank.status === 'loading' && <span style={{ opacity: 0.6 }}>Checking leaderboard…</span>}
            {rank.status === 'error' && (
              <span style={{ opacity: 0.6 }}>Leaderboard unavailable — score not saved</span>
            )}
            {rank.status === 'ready' &&
              (rank.rank === 1 ? (
                <span style={{ color: COLORS.amber, fontWeight: 700 }}>New high score!</span>
              ) : (
                <span>You ranked #{rank.rank}!</span>
              ))}
          </div>
          <div style={{ ...eyebrow, marginTop: 12 }}>Officer {name}</div>
        </div>

        <div
          style={{
            fontFamily: MONO,
            fontSize: 12,
            color: COLORS.teal,
            opacity: armed ? 0.75 : 0.25,
            transition: 'opacity 400ms',
          }}
        >
          Click anywhere to play again
        </div>
      </div>
    </Backdrop>
  );
}
