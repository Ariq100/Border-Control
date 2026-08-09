import type { CSSProperties } from 'react';
import { PALETTE } from './constants';
import type { InventoryItem } from './types';

export interface HUDProps {
  clock: Date;
  inventory: (InventoryItem | null)[];
  heldItem: InventoryItem | null;
  /** Optional callback so gameplay can wire slot selection in later. */
  onSlotPress?: (index: number) => void;
  /** Index of the equipped slot — gets a glowing border. */
  activeSlot?: number;
  /**
   * Set false to hide the separate "in hand" slot; the equipped tool is then
   * shown only by the highlight on its inventory slot.
   */
  showHeldSlot?: boolean;
}

const MONO = 'ui-monospace, "SFMono-Regular", "Roboto Mono", Menlo, monospace';

const CUT: CSSProperties = {
  clipPath: 'polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)',
};

const panel: CSSProperties = {
  background: 'rgba(12, 17, 22, 0.86)',
  border: `1px solid ${PALETTE.tealDim}`,
  boxShadow: '0 0 0 1px rgba(0,0,0,0.6), 0 6px 22px rgba(0,0,0,0.5)',
  fontFamily: MONO,
  color: PALETTE.teal,
  ...CUT,
};

const label: CSSProperties = {
  fontSize: 9,
  letterSpacing: '0.22em',
  color: 'rgba(95, 224, 208, 0.55)',
  textTransform: 'uppercase',
};

function pad(n: number, size = 2) {
  return String(n).padStart(size, '0');
}

/** Station date/time, shown in-fiction so expiry dates can be judged at a glance. */
export function StationClock({ clock }: { clock: Date }) {
  const date = `${clock.getFullYear()}.${pad(clock.getMonth() + 1)}.${pad(clock.getDate())}`;
  const time = `${pad(clock.getHours())}:${pad(clock.getMinutes())}`;
  const seconds = pad(clock.getSeconds());
  return (
    <div style={{ ...panel, padding: '8px 14px', minWidth: 178 }}>
      <div style={label}>Station time</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: PALETTE.amber, letterSpacing: '0.06em' }}>
          {time}
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,182,72,0.6)' }}>:{seconds}</span>
      </div>
      <div style={{ fontSize: 12, letterSpacing: '0.14em', marginTop: 2 }}>{date}</div>
    </div>
  );
}

function Slot({
  item,
  size,
  active,
  onPress,
  index,
}: {
  item: InventoryItem | null;
  size: number;
  active?: boolean;
  onPress?: () => void;
  index?: number;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={item ? item.label : `Empty slot ${(index ?? 0) + 1}`}
      style={{
        ...CUT,
        position: 'relative',
        width: size,
        height: size,
        padding: 0,
        cursor: onPress ? 'pointer' : 'default',
        background: item ? 'rgba(24, 34, 42, 0.94)' : 'rgba(12, 17, 22, 0.72)',
        border: `1px solid ${active ? PALETTE.amber : PALETTE.tealDim}`,
        boxShadow: active ? `0 0 0 1px ${PALETTE.amber}, 0 0 14px rgba(255,182,72,0.55)` : 'none',
        outlineOffset: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        fontFamily: MONO,
        color: item?.color ?? PALETTE.teal,
      }}
    >
      {item ? (
        <>
          <span style={{ fontSize: size * 0.3, fontWeight: 700 }}>{item.glyph ?? '·'}</span>
          <span style={{ fontSize: 8, letterSpacing: '0.1em', opacity: 0.7 }}>{item.label}</span>
        </>
      ) : (
        <span style={{ fontSize: 9, letterSpacing: '0.18em', opacity: 0.35 }}>EMPTY</span>
      )}
      {index !== undefined && (
        <span style={{ position: 'absolute', top: 4, left: 6, fontSize: 8, opacity: 0.45 }}>
          {index + 1}
        </span>
      )}
    </button>
  );
}

/** Bottom-left: three carry slots. Bottom-right: whatever is in hand. */
export function HUD({
  clock,
  inventory,
  heldItem,
  onSlotPress,
  activeSlot,
  showHeldSlot = true,
}: HUDProps) {
  const slots = [0, 1, 2].map((i) => inventory[i] ?? null);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <StationClock clock={clock} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <div style={{ ...label, marginBottom: 6 }}>Inventory</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {slots.map((item, i) => (
              <Slot
                key={i}
                item={item}
                index={i}
                size={54}
                active={activeSlot === i}
                onPress={onSlotPress ? () => onSlotPress(i) : undefined}
              />
            ))}
          </div>
        </div>

        {showHeldSlot && (
          <div style={{ pointerEvents: 'auto', textAlign: 'right' }}>
            <div style={{ ...label, marginBottom: 6 }}>In hand</div>
            <Slot item={heldItem} size={68} active={!!heldItem} />
          </div>
        )}
      </div>
    </div>
  );
}
