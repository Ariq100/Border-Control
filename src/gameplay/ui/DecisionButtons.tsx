import type { Decision } from '../types';
import { actionButton } from './theme';

export function DecisionButtons({
  onDecide,
  disabled,
}: {
  onDecide: (decision: Decision) => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDecide('accept')}
        style={{ ...actionButton('accept'), opacity: disabled ? 0.4 : 1 }}
      >
        ACCEPT
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDecide('reject')}
        style={{ ...actionButton('reject'), opacity: disabled ? 0.4 : 1 }}
      >
        REJECT
      </button>
    </div>
  );
}
