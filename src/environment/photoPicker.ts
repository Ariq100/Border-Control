const HUMAN_IMAGES = ['human1', 'human2', 'human3'];
const ALIEN_IMAGES = ['alien1', 'alien2', 'alien3'];

function pick<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function pickRandomPhoto(kind: 'human' | 'alien'): string {
    const name = kind === 'human' ? pick(HUMAN_IMAGES) : pick(ALIEN_IMAGES);
    // expect files like ./src/environment/images/human1.png etc.
    return new URL(`./images/${name}.png`, import.meta.url).href;
}

export default pickRandomPhoto;
