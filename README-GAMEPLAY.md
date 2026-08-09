# Gameplay layer

Sits on top of the existing environment. The environment still owns the hall, the queue, the
walking and the sprites; this folder owns arrivals, licences, tools, decisions, lives, score and
the leaderboard. They talk through one state object and three events.

## Install

```bash
npm install firebase
```

Copy into your project:

- `src/gameplay/` — new, everything below
- `src/environment/` — **updated**, five files gained hooks (see "Environment changes")
- `src/App.tsx` — renders `<Game />`
- `.env`, `.env.example`, `.gitignore`

Then `npm run dev`.

## Firestore setup

`.env` is already filled in with your `border-control-bc166` project. Two things left in the
Firebase console:

1. **Build → Firestore Database → Create database.** Pick a region and start in test mode.
2. If it's in production mode, the leaderboard will silently fail to load. Rules that work:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /highscores/{doc} {
      allow read: if true;
      allow create: if request.resource.data.score is number
                    && request.resource.data.name is string;
      allow update, delete: if false;
    }
  }
}
```

`.env` is gitignored so the keys don't get committed. Note that Firebase web API keys aren't
secrets — they identify the project, they don't authorise anything. Your security rules are what
actually protect the data, which is why the rules above block updates and deletes.

**Known limitation, also flagged in `highscoreStore.ts`:** writes go straight from the browser,
so anyone comfortable with dev tools could post a fabricated score. Fine for a casual project. If
that ever matters, move `saveScore` behind a Cloud Function and make the collection read-only.

## The five NPC states

`queued → investigation → accepted → movingForward` (through the Entry gate, despawn)
`queued → investigation → detained` (escorted to the block, despawn)

Arrivals spawn at the docking corridor, walk to the back of the zigzag, and shuffle forward as the
line clears. When the front one settles at the desk the environment fires `reachedDesk` and the
licence appears.

## Ground truth, and why the game is always winnable

Every arrival gets a hidden `isHuman` flag. Everything visible is generated to be consistent with
it — the game never lies to you:

| | humans | aliens |
| --- | --- | --- |
| birthplace | real Earth city | sometimes off-world |
| age | always under 100 | sometimes 100+ |
| licence dates | valid, unexpired | sometimes expired, or expiring before issue |
| temperature | never above 39.0 °C | often above |
| breathing | steady and paired | often irregular |
| sprite | human | half look alien, half pass as human |

Document red flags only ever appear on non-humans, so rejecting someone over a bad licence is
never a mistake. And every alien fails **at least one tool**, so a disguised alien with clean
paperwork is still catchable — check both tools and you can always be certain.

Tune the mix in `arrivals.ts`: `createArrival(now, humanRate)`, the `chance()` values for each
tell, and the 0.5 disguise rate.

## Tools

Slot 1 is the thermometer, slot 2 the stethoscope. Click a slot to equip — the slot itself glows,
there's no separate held-item display. Click it again to unequip. With a tool equipped, click the
arrival standing at the desk to open the reading popup; it has an X to dismiss.

## Lives and the cutscene

Three lives. A mistake is any decision that contradicts `isHuman`. Mistakes one and two are
completely silent — no counter, no flash, no sound, nothing. You cannot tell how you're doing.

The third mistake ends the run, and which cutscene plays depends on what that third mistake was:

- **wrongly accepted an alien** → screaming from beyond the Entry gate (audio panned left, red
  bloom from the gate corner)
- **wrongly rejected a human** → screaming from the detention block (panned right, bloom from the
  jail side)

Audio is synthesised with the Web Audio API, so there are no sound files to ship.

## Score

Hidden the entire run. +1 per correct call, wrong calls cost a life rather than points. All of it
is in `scoring.ts` so it's one file to retune. Revealed for the first time on the end screen,
alongside your rank from the leaderboard.

## Files

| file | job |
| --- | --- |
| `types.ts` | Arrival, License, GameState, the five phases |
| `arrivals.ts` | generates arrivals, licences, tells and tool readings from the hidden truth |
| `scoring.ts` | correctness and points, isolated for tuning |
| `useBorderControl.ts` | the reducer: spawning, state machine, decisions, lives, clock |
| `highscoreStore.ts` | Firestore `getTopScores` / `saveScore` / `getRank` |
| `audio.ts` | synthesised scream, stereo-panned toward the gate or the block |
| `Game.tsx` | composition root — wires gameplay state into `<EnvironmentScene />` |
| `ui/StartScreen.tsx` | top 3 leaderboard, loading and failure states, name entry |
| `ui/LicensePanel.tsx` | the licence, bottom-right |
| `ui/InspectionPopup.tsx` | tool reading, above the licence, with close button |
| `ui/DecisionButtons.tsx` | Accept / Reject, below the licence |
| `ui/EndScreen.tsx` | "You messed up!!", score reveal, rank, save, click to replay |
| `ui/Cutscene.tsx` | the directional game-over cue |
| `ui/PassportPhoto.tsx` | licence photo, drawn with the environment's own sprite renderer |
| `ui/theme.ts` | shared panel and button styling |

Screen layout, right side, top to bottom: reading popup (when open) → licence → Accept/Reject.
Inventory stays bottom-left in the environment's existing HUD.

## Environment changes

Nothing was rebuilt or replaced. Five files gained additive hooks; every new parameter is optional
and the environment still runs standalone with its demo:

| file | change |
| --- | --- |
| `ActorSystem.ts` | emits `reachedDesk` / `exitedThroughGate` / `reachedJail`; new `positions()` for hit-testing |
| `Renderer.tsx` | new optional `onEvent` and `onNpcClick` props; pointer picking against actor billboards |
| `HUD.tsx` | new optional `showHeldSlot` (set false here); equipped slot gets a glow; fixed slot-number placement |
| `EnvironmentScene.tsx` | passes the three new props through |
| `index.ts` | exports the new event types and `drawCharacter` for the licence photo |

Gameplay never reaches into environment internals — it hands over a list of NPCs with an
`activity` flag and listens for the three events.
