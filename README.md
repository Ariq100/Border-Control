# Border Control

A Web game where you process arrivals at a spaceship checkpoint, inspect their documentation, and decide whether they can board or must be detained.

Website: https://border-control-gamma.vercel.app/

## Install

To run the game locally:

```bash
npm install
npm run dev
```

Build for production with:

```bash
npm run build
```

## Platform and technology

This project is built with TypeScript, React, Vite, HTML, CSS, and the browser Web Audio API for audio cues. It uses Firebase for score persistence and leaderboard storage.

## Firebase and persistence

The game saves player scores to a Firebase-backed datastore and loads leaderboard rankings from the same source. Scores are written from the browser and fetched when the start screen loads, so players can compare their results against previously saved runs.

## How the game works

Players inspect each arrival at the desk using two tools: a thermometer and a stethoscope. Equip a tool by clicking its slot, then use it on the current arrival to open the reading popup.

Each decision is either Accept or Reject. Correct decisions earn points; incorrect decisions cost one of the player’s three lives. After the third mistake, the run ends and a disaster sequence plays out on the ship.

## Lives and failure

The player has three lives. The first two mistakes are warnings only, but the third mistake triggers the ship disaster and ends the run.

## Scoring

Score is measured by how many correct calls the player makes during the run. Every valid Accept or Reject increases the score when the decision matches the arrival’s true status. Scores are saved to Firebase and fetched back for leaderboard display.

## Tools

- Slot 1: thermometer
- Slot 2: stethoscope

Click a slot to equip it. With a tool equipped, click the arrival standing at the desk to inspect them. The reading popup gives the information needed to decide.

## Notes

The game is designed as a browser-first experience with a polished illusion of a spaceship checkpoint, reactive HUD elements, and procedural audio feedback.
