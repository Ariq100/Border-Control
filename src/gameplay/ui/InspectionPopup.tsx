import type { ToolReadout } from '../types';
import { COLORS, MONO, eyebrow, panel } from './theme';

/** Shows whichever reading the equipped tool produced. Sits above the licence. */
export function InspectionPopup({
  readout,
  onClose,
}: {
  readout: ToolReadout;
  onClose: () => void;
}) {
  return (
    <div style={{ ...panel, padding: '10px 12px 12px', position: 'relative' }}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close reading"
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          width: 22,
          height: 22,
          lineHeight: '20px',
          padding: 0,
          background: 'transparent',
          border: `1px solid ${COLORS.tealDim}`,
          color: COLORS.teal,
          fontFamily: MONO,
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        ✕
      </button>

      <div style={eyebrow}>{readout.title}</div>
      <div
        style={{
          fontSize: readout.tool === 'thermometer' ? 26 : 13,
          fontWeight: 700,
          color: COLORS.amber,
          margin: '4px 26px 6px 0',
          lineHeight: 1.35,
        }}
      >
        {readout.value}
      </div>
      <div style={{ fontSize: 10, opacity: 0.6, lineHeight: 1.5 }}>{readout.detail}</div>
    </div>
  );
}
