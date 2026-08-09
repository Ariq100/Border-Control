import type { Arrival, License, Organization, ToolReadings } from './types';
import { pickRandomPhoto } from '../environment/photoPicker';

/**
 * Generates arrivals along with a hidden `isHuman` truth that every visible
 * signal is consistent with.
 *
 * The contract, so the game is always winnable:
 *   humans  — Earth birthplace, age under 100, valid unexpired licence,
 *             temperature <= 39.0, steady breathing. No tells at all.
 *   aliens  — at least one tool tell (temperature over 39 and/or irregular
 *             breathing), plus optional document tells and, about half the
 *             time, an obviously non-human sprite.
 *
 * So a player who checks both tools can always be certain; appearance and
 * paperwork are the faster shortcuts.
 */

const ORGANIZATIONS: Organization[] = ['SpaceX', 'NASA', 'Blue Origin', 'ULA', 'Sierra Space'];

const EARTH_BIRTHPLACES = [
  'Nairobi, Kenya',
  'Osaka, Japan',
  'Reykjavík, Iceland',
  'Lagos, Nigeria',
  'Valparaíso, Chile',
  'Dhaka, Bangladesh',
  'Perth, Australia',
  'Kraków, Poland',
  'Marseille, France',
  'Quito, Ecuador',
  'Hyderabad, India',
  'Winnipeg, Canada',
  'Cape Town, South Africa',
  'Tbilisi, Georgia',
  'Busan, South Korea',
  'Manaus, Brazil',
  'Tromsø, Norway',
  'Casablanca, Morocco',
  'Christchurch, New Zealand',
  'Da Nang, Vietnam',
];

/** Not on Earth — a document tell, since licences must state an Earth birthplace. */
const OFFWORLD_BIRTHPLACES = [
  'Ganymede Colony',
  'Tharsis Flats, Mars',
  'Europa Deep Station',
  'Ceres Freeport',
  'Kepler Waystation',
  'Titan Ridge',
];

const FIRST_NAMES = [
  'Amara', 'Elias', 'Noor', 'Kenji', 'Rosa', 'Dmitri', 'Ife', 'Lena', 'Tomas', 'Priya',
  'Hassan', 'Marta', 'Yusuf', 'Ingrid', 'Chen', 'Sofia', 'Omar', 'Freya', 'Rafael', 'Nadia',
];

const SURNAMES = [
  'Okoro', 'Vasquez', 'Lindqvist', 'Tanaka', 'Ferreira', 'Haddad', 'Novak', 'Mbeki',
  'Rahman', 'Castellanos', 'Petrov', 'Nakamura', 'Osei', 'Dubois', 'Kowalski', 'Silva',
];

const HUMAN_BREATHING = [
  'Steady, 14 breaths per minute. Even chest rise.',
  'Regular, 16 breaths per minute. Clear on both sides.',
  'Calm, 12 breaths per minute. Slight nervous catch.',
  'Steady, 18 breaths per minute. Mild exertion.',
];

const ALIEN_BREATHING = [
  'Irregular. Long pauses, then rapid bursts.',
  'No detectable rhythm. Faint secondary flutter beneath.',
  'Doubled beat — two overlapping cycles out of phase.',
  'Continuous hiss. No inhale/exhale boundary.',
  'Stops entirely for 40 seconds, then resumes.',
];

let counter = 0;
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const chance = (p: number) => Math.random() < p;
const daysBefore = (from: Date, days: number) =>
  new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
const daysAfter = (from: Date, days: number) =>
  new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
const round1 = (n: number) => Math.round(n * 10) / 10;

function buildLicense(now: Date, tells: Set<string>): License {
  const ageYears = tells.has('age')
    ? 100 + Math.floor(Math.random() * 180) // 100+ is impossible for a human
    : 19 + Math.floor(Math.random() * 62); // 19–80

  const birthdate = daysBefore(now, ageYears * 365 + Math.floor(Math.random() * 365));
  const issueDate = daysBefore(now, 120 + Math.floor(Math.random() * 1500));

  let expiryDate: Date;
  if (tells.has('expired')) {
    expiryDate = daysBefore(now, 1 + Math.floor(Math.random() * 400));
  } else if (tells.has('issueOrder')) {
    // expiry lands before the issue date — paperwork that could never exist
    expiryDate = daysBefore(issueDate, 30 + Math.floor(Math.random() * 300));
  } else {
    expiryDate = daysAfter(now, 30 + Math.floor(Math.random() * 2200));
  }

  return {
    name: `${pick(FIRST_NAMES)} ${pick(SURNAMES)}`,
    birthplace: tells.has('birthplace') ? pick(OFFWORLD_BIRTHPLACES) : pick(EARTH_BIRTHPLACES),
    birthdate,
    organization: pick(ORGANIZATIONS),
    issueDate,
    expiryDate,
  };
}

function buildReadings(isHuman: boolean, forceBoth: boolean): ToolReadings {
  if (isHuman) {
    return {
      temperatureC: round1(36.1 + Math.random() * 2.7), // 36.1–38.8, never over 39
      breathing: pick(HUMAN_BREATHING),
      breathingHuman: true,
    };
  }
  // an alien always fails at least one tool; sometimes both
  const hotOnly = !forceBoth && chance(0.5);
  const oddBreathOnly = !forceBoth && !hotOnly;
  const hot = forceBoth || hotOnly;
  const oddBreath = forceBoth || oddBreathOnly;
  return {
    temperatureC: hot ? round1(39.4 + Math.random() * 5.2) : round1(36.4 + Math.random() * 2.2),
    breathing: oddBreath ? pick(ALIEN_BREATHING) : pick(HUMAN_BREATHING),
    breathingHuman: !oddBreath,
  };
}

/** `humanRate` lets difficulty be tuned without touching the rest of the game. */
export function createArrival(now: Date, humanRate = 0.5): Arrival {
  const isHuman = chance(humanRate);
  const tells = new Set<string>();

  if (!isHuman) {
    // document tells only ever appear on non-humans, so paperwork never lies
    if (chance(0.45)) tells.add('age');
    if (chance(0.35)) tells.add('expired');
    if (chance(0.3)) tells.add('birthplace');
    if (chance(0.15)) tells.add('issueOrder');
  }

  const disguised = !isHuman && chance(0.5);
  // a disguised alien with clean paperwork must be catchable, so both tools fail
  const forceBoth = !isHuman && disguised && tells.size === 0;

  counter += 1;
  return {
    id: `arrival-${counter}-${Math.random().toString(36).slice(2, 7)}`,
    isHuman,
    appearance: 'human',
    variant: Math.floor(Math.random() * 4),
    photo: pickRandomPhoto(isHuman ? 'human' : 'alien'),
    license: buildLicense(now, tells),
    readings: buildReadings(isHuman, forceBoth),
    phase: 'queued',
  };
}

export function ageOnDate(birthdate: Date, now: Date): number {
  let age = now.getFullYear() - birthdate.getFullYear();
  const beforeBirthday =
    now.getMonth() < birthdate.getMonth() ||
    (now.getMonth() === birthdate.getMonth() && now.getDate() < birthdate.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}
