export const shortHash = (hash: string): string =>
  `${hash.substring(0, 6)}…${hash.substring(hash.length - 5, hash.length - 1)}`;

export const wait = async (ms: number): Promise<number> =>
  new Promise((resolve) => {
    return setTimeout(resolve, ms);
  });

// from https://stackoverflow.com/questions/19269545/how-to-get-a-number-of-random-elements-from-an-array
export const getRandom = (arr: any[], n: number): any[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};

// Return array chunks of n size
export const chunker = (a: any[], n: number): any[] =>
  Array.from({ length: Math.ceil(a.length / n) }, (_, i) =>
    a.slice(i * n, i * n + n),
  );

// Return a reverse ordered array filled from range
export const reverseRange = (
  start: number,
  stop: number,
  step: number,
): number[] =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => stop - i * step);

// Return filled array from range
export const range = (start: number, stop: number, step: number): number[] =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);
