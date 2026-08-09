import { PALETTE } from './constants';
import type { Facing, Species } from './types';

/**
 * Sprites are loaded from the public image folder — humans use `human.*`,
 * aliens use `alien.*`, exactly as specified. If an asset is missing the
 * character is drawn procedurally instead, so the scene never renders empty.
 */
export const IMAGE_BASE = '/image';
const EXTENSIONS = ['png', 'gif', 'jpg', 'jpeg', 'webp'];

const cache = new Map<string, HTMLImageElement | null>();

function tryLoad(name: string, extIndex = 0) {
  if (extIndex >= EXTENSIONS.length) {
    cache.set(name, null);
    return;
  }
  const img = new Image();
  img.onload = () => cache.set(name, img);
  img.onerror = () => tryLoad(name, extIndex + 1);
  img.src = `${IMAGE_BASE}/${name}.${EXTENSIONS[extIndex]}`;
}

/** Call once on mount. */
export function preloadCharacterImages(names = ['human', 'alien', 'player', 'police']) {
  for (const name of names) {
    if (cache.has(name)) continue;
    cache.set(name, null);
    tryLoad(name);
  }
}

export function getImage(name: string): HTMLImageElement | null {
  return cache.get(name) ?? null;
}

interface Style {
  skin: string;
  skinShade: string;
  shirt: string;
  shirtShade: string;
  pants: string;
  hair: string;
  accent: string;
  alien?: boolean;
  cap?: boolean;
  headset?: boolean;
}

const HUMAN_VARIANTS: Style[] = [
  { skin: '#e8b48c', skinShade: '#c58f68', shirt: '#c9564f', shirtShade: '#9c3d38', pants: '#39404d', hair: '#3a2b23', accent: '#f2e6d2' },
  { skin: '#b9805a', skinShade: '#96603f', shirt: '#4b7fc1', shirtShade: '#35608f', pants: '#2f3540', hair: '#161311', accent: '#d8e6f5' },
  { skin: '#f2cfa8', skinShade: '#d0a77e', shirt: '#7bb86a', shirtShade: '#548c49', pants: '#42392f', hair: '#8a5a2b', accent: '#f7f3e6' },
  { skin: '#8d5c3d', skinShade: '#6d452c', shirt: '#c9a24a', shirtShade: '#9c7a30', pants: '#343b45', hair: '#221a15', accent: '#fff0c9' },
];

const ALIEN_VARIANTS: Style[] = [
  { skin: '#7fd07a', skinShade: '#57a154', shirt: '#54486e', shirtShade: '#3d3452', pants: '#2d2740', hair: '#54a054', accent: '#d8ffcf', alien: true },
  { skin: '#8fb7e0', skinShade: '#6690b8', shirt: '#3f5a63', shirtShade: '#2c414a', pants: '#26333a', hair: '#6f9fd0', accent: '#e0f2ff', alien: true },
  { skin: '#d08fc4', skinShade: '#a86a9d', shirt: '#3d4a63', shirtShade: '#2b3549', pants: '#242c3b', hair: '#b16fa5', accent: '#ffe0f7', alien: true },
  { skin: '#d8c46a', skinShade: '#ab9a4c', shirt: '#4a5a3f', shirtShade: '#35422d', pants: '#2b3326', hair: '#b8a44f', accent: '#fbf5cf', alien: true },
];

const POLICE_STYLE: Style = {
  skin: '#c9a07c',
  skinShade: '#a37d5c',
  shirt: PALETTE.police,
  shirtShade: '#0c0e11',
  pants: '#0e1114',
  hair: '#101317',
  accent: '#3f4a5c',
  cap: true,
};

const PLAYER_STYLE: Style = {
  skin: '#e3b184',
  skinShade: '#bd8b60',
  shirt: '#22415e',
  shirtShade: '#17304a',
  pants: '#1b2530',
  hair: '#2a211c',
  accent: PALETTE.amber,
  headset: true,
};

export function styleFor(species: Species, variant = 0): Style {
  const list = species === 'alien' ? ALIEN_VARIANTS : HUMAN_VARIANTS;
  return list[Math.abs(variant) % list.length];
}

/**
 * Billboard character: 12x18 unit grid, base at the feet, taller than wide so
 * it reads as standing upright on the flat floor grid.
 */
function paint(
  ctx: CanvasRenderingContext2D,
  s: Style,
  x: number,
  yBase: number,
  height: number,
  frame: number,
  facing: Facing,
) {
  const u = height / 18;
  const left = x - 6 * u;
  const top = yBase - height;
  const P = (gx: number, gy: number, gw: number, gh: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(
      Math.round(left + gx * u),
      Math.round(top + gy * u),
      Math.max(1, Math.round(gw * u)),
      Math.max(1, Math.round(gh * u)),
    );
  };

  const step = [0, 1, 0, -1][frame % 4];
  const bob = frame % 2 === 1 ? -0.35 : 0;

  // legs
  P(3.4, 13 + Math.max(0, step) * 0.4, 2.2, 5 - Math.max(0, step) * 0.4, s.pants);
  P(6.4, 13 + Math.max(0, -step) * 0.4, 2.2, 5 - Math.max(0, -step) * 0.4, s.pants);
  P(3.4, 17.2, 2.2, 0.8, '#15181c');
  P(6.4, 17.2, 2.2, 0.8, '#15181c');

  // torso
  P(3, 8.4 + bob, 6, 5, s.shirt);
  P(3, 8.4 + bob, 6, 0.8, s.shirtShade);
  P(3, 12.4 + bob, 6, 0.9, s.shirtShade);
  // arms
  P(2, 9 + bob, 1.2, 3.6, s.shirtShade);
  P(8.8, 9 + bob, 1.2, 3.6, s.shirtShade);
  P(2, 12.4 + bob, 1.2, 1, s.skin);
  P(8.8, 12.4 + bob, 1.2, 1, s.skin);

  if (s.alien) {
    // taller cranium + antenna
    P(2.4, 2.4 + bob, 7.2, 6.4, s.skin);
    P(2.4, 2.4 + bob, 7.2, 0.8, s.accent);
    P(2.4, 7.6 + bob, 7.2, 0.9, s.skinShade);
    P(5.6, 0.4 + bob, 0.8, 2.2, s.skinShade);
    P(5.2, -0.3 + bob, 1.6, 1, s.accent);
  } else {
    P(3.2, 3.6 + bob, 5.6, 5.4, s.skin);
    P(3.2, 8.2 + bob, 5.6, 0.7, s.skinShade);
    P(3, 3 + bob, 6, 1.8, s.hair); // hair
    P(3, 3 + bob, 6, 0.6, '#00000022');
  }

  if (s.cap) {
    P(2.8, 2.6 + bob, 6.4, 1.6, '#0b0d10');
    P(2.4, 4 + bob, 7.2, 0.7, '#0b0d10'); // brim
    P(5.4, 2.9 + bob, 1.2, 1, s.accent); // badge
  }
  if (s.headset) {
    P(2.6, 4.6 + bob, 0.9, 1.6, s.accent);
    P(8.5, 4.6 + bob, 0.9, 1.6, s.accent);
    P(2.6, 4.2 + bob, 6.8, 0.5, s.accent);
  }

  // face — only when the character can be seen from the front or side
  const eyeY = (s.alien ? 5.4 : 5.8) + bob;
  const eye = s.alien ? '#101317' : '#20262c';
  if (facing === 'down') {
    P(4.4, eyeY, 1, 1.1, eye);
    P(6.6, eyeY, 1, 1.1, eye);
  } else if (facing === 'left') {
    P(3.8, eyeY, 1, 1.1, eye);
  } else if (facing === 'right') {
    P(7.2, eyeY, 1, 1.1, eye);
  }
}

export interface DrawCharacterOptions {
  /** Image asset name to prefer, e.g. 'human' | 'alien' | 'police' | 'player'. */
  asset?: string;
  species?: Species;
  variant?: number;
  height: number;
  frame?: number;
  facing?: Facing;
  /** Draw with a police/officer look when no asset is available. */
  role?: 'npc' | 'police' | 'player';
  tint?: string;
}

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  yBase: number,
  opts: DrawCharacterOptions,
) {
  const { asset, species = 'human', variant = 0, height, frame = 0, facing = 'down', role = 'npc' } = opts;

  const img = asset ? getImage(asset) : null;
  if (img && img.complete && img.naturalWidth > 0) {
    const aspect = img.naturalWidth / img.naturalHeight;
    const w = height * aspect;
    const bob = frame % 2 === 1 ? -1 : 0;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(x - w / 2), Math.round(yBase - height + bob), Math.round(w), Math.round(height));
    return;
  }

  const style =
    role === 'police' ? POLICE_STYLE : role === 'player' ? PLAYER_STYLE : styleFor(species, variant);
  paint(ctx, style, x, yBase, height, frame, facing);
}
