import { ageOnDate, formatDate } from '../arrivals';
import type { Arrival } from '../types';
import { PassportPhoto } from './PassportPhoto';
import { COLORS, CUT, MONO, eyebrow } from './theme';

/**
 * The licence itself. Everything shown here is public information — no hint of
 * the hidden truth appears, not even by styling a suspicious field differently.
 */
export function LicensePanel({ arrival, clock }: { arrival: Arrival; clock: Date }) {
  const { license } = arrival;
  const age = ageOnDate(license.birthdate, clock);

  return (
    <div
      style={{
        ...CUT,
        background: COLORS.paper,
        color: COLORS.paperInk,
        fontFamily: MONO,
        border: '1px solid rgba(0,0,0,0.35)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.55)',
        padding: 12,
        display: 'flex',
        gap: 12,
      }}
    >
      <div>
        <PassportPhoto arrival={arrival} />
        <div style={{ fontSize: 8, letterSpacing: '0.12em', marginTop: 5, opacity: 0.6 }}>
          ISS-DOC-4471
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...eyebrow, color: 'rgba(43,39,33,0.55)' }}>Entry licence</div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '0.02em',
            marginTop: 2,
            marginBottom: 8,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {license.name}
        </div>

        <Field label="Birthplace" value={license.birthplace} />
        <Field label="Birthdate" value={`${formatDate(license.birthdate)}  (age ${age})`} />
        <Field label="Sent by" value={license.organization} />
        <Field label="Issued" value={formatDate(license.issueDate)} />
        <Field label="Expires" value={formatDate(license.expiryDate)} />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 11, lineHeight: '18px' }}>
      <span style={{ width: 74, flexShrink: 0, opacity: 0.55, letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
    </div>
  );
}
