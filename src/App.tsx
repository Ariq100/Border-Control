import { Game } from './gameplay';

export default function App() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Game />
    </div>
  );
}
