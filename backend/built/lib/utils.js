"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.range = exports.reverseRange = exports.chunker = exports.getRandom = exports.wait = exports.shortHash = void 0;
const shortHash = (hash) => `${hash.substring(0, 6)}…${hash.substring(hash.length - 5, hash.length - 1)}`;
exports.shortHash = shortHash;
const wait = (ms) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        return setTimeout(resolve, ms);
    });
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
const reverseRange = (start, stop, step) => Array
    .from({ length: (stop - start) / step + 1 }, (_, i) => stop - (i * step));
exports.reverseRange = reverseRange;
// Return filled array from range
const range = (start, stop, step) => Array
    .from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));
exports.range = range;
