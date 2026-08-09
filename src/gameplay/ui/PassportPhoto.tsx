import type { Arrival } from '../types';

export function PassportPhoto({ arrival, size = 92 }: { arrival: Arrival; size?: number }) {
  const src = arrival.photo;
  const alt = arrival.isHuman ? 'Human photograph' : 'Alien photograph';

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size * 1.25}
      style={{
        width: size,
        height: size * 1.25,
        objectFit: 'cover',
        display: 'block',
        borderRadius: 4,
        border: '1px solid rgba(0,0,0,0.12)',
      }}
    />
  );
}
