export const shortHash = (hash) => `${hash.substring(0, 6)}…${hash.substring(hash.length - 4, hash.length)}`;
export const wait = async (ms) => new Promise((resolve) => {
    return setTimeout(resolve, ms);
});
// from https://stackoverflow.com/questions/19269545/how-to-get-a-number-of-random-elements-from-an-array
export const getRandom = (arr, n) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
};
// Return array chunks of n size
export const chunker = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
// Return a reverse ordered array filled from range
export const reverseRange = (start, stop, step) => Array.from({ length: (stop - start) / step + 1 }, (_, i) => stop - i * step);
// Return filled array from range
export const range = (start, stop, step) => Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);
