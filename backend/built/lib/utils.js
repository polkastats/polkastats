"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.range = exports.reverseRange = exports.chunker = exports.getRandom = exports.wait = exports.shortHash = void 0;
const shortHash = (hash) => `${hash.substring(0, 6)}…${hash.substring(hash.length - 4, hash.length)}`;
exports.shortHash = shortHash;
const wait = async (ms) => new Promise((resolve) => {
    return setTimeout(resolve, ms);
});
exports.wait = wait;
// from https://stackoverflow.com/questions/19269545/how-to-get-a-number-of-random-elements-from-an-array
const getRandom = (arr, n) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
};
exports.getRandom = getRandom;
// Return array chunks of n size
const chunker = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
exports.chunker = chunker;
// Return a reverse ordered array filled from range
const reverseRange = (start, stop, step) => Array.from({ length: (stop - start) / step + 1 }, (_, i) => stop - i * step);
exports.reverseRange = reverseRange;
// Return filled array from range
const range = (start, stop, step) => Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);
exports.range = range;
