import { EnvironmentScene } from '../environment';
import { useBorderControl } from './useBorderControl';
import { Cutscene } from './ui/Cutscene';
import { DecisionButtons } from './ui/DecisionButtons';
import { EndScreen } from './ui/EndScreen';
import { InspectionPopup } from './ui/InspectionPopup';
import { LicensePanel } from './ui/LicensePanel';
import { StartScreen } from './ui/StartScreen';
import { COLORS, MONO } from './ui/theme';

/**
 * Composition root. The environment draws the hall and animates whoever it's
 * told to; everything else here is gameplay state layered on top of it.
 */
export function Game() {
  const game = useBorderControl();
  const { state } = game;
  const atDesk = state.phase === 'playing' && game.inspecting?.phase === 'investigation';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <EnvironmentScene
        state={{
          npcs: game.envNpcs,
          inventory: game.inventory,
          heldItem: null,
          clock: state.clock,
        }}
        onEvent={game.onEnvEvent}
        onNpcClick={game.inspectNpc}
        onSlotPress={game.equipSlot}
        activeSlot={state.equippedSlot ?? undefined}
        showHeldSlot={false}
      />

      {/* right-side stack: reading (when open) → licence → decision */}
      {atDesk && game.inspecting && (
        <div
          style={{
            position: 'absolute',
            right: 14,
            bottom: 14,
            width: 'min(340px, 46vw)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            zIndex: 10,
          }}
        >
          {state.readout && state.readout.npcId === game.inspecting.id && (
            <InspectionPopup readout={state.readout} onClose={game.closeReadout} />
          )}
          <LicensePanel arrival={game.inspecting} clock={state.clock} />
          <DecisionButtons onDecide={game.decide} />
        </div>
      )}

      {state.phase === 'playing' && state.equippedSlot !== null && !state.readout && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 18,
            transform: 'translateX(-50%)',
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.18em',
            color: COLORS.teal,
            opacity: 0.55,
            pointerEvents: 'none',
          }}
        >
          CLICK THE ARRIVAL AT THE DESK TO TAKE A READING
        </div>
      )}

      {state.phase === 'cutscene' && state.fatalMistake && (
        <Cutscene kind={state.fatalMistake} onDone={game.finishCutscene} />
      )}

      {state.phase === 'start' && <StartScreen onStart={game.start} />}

      {state.phase === 'end' && (
        <EndScreen name={state.playerName} score={state.score} onRestart={game.restart} />
      )}
    </div>
  );
}
