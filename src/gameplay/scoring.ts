import type { Arrival, Decision } from './types';

/**
 * All scoring lives here so it can be retuned in one place.
 * Correct call = +1. Wrong calls cost a life, not points.
 */
export const POINTS_PER_CORRECT_CALL = 1;

export function isDecisionCorrect(arrival: Arrival, decision: Decision): boolean {
  return decision === 'accept' ? arrival.isHuman : !arrival.isHuman;
}

export function scoreForDecision(arrival: Arrival, decision: Decision): number {
  return isDecisionCorrect(arrival, decision) ? POINTS_PER_CORRECT_CALL : 0;
}

export function applyDecisionToScore(
  currentScore: number,
  arrival: Arrival,
  decision: Decision,
): number {
  return currentScore + scoreForDecision(arrival, decision);
}
