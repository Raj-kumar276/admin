// Seeded random generator so the sample data is the same on every load.
let SEED = 20260928;

export const rnd = () => (SEED = (SEED * 16807) % 2147483647) / 2147483647;
export const pick = (a) => a[Math.floor(rnd() * a.length)];
export const ri = (a, b) => Math.floor(a + rnd() * (b - a + 1));
