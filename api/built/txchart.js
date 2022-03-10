"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const main = async () => {
    const history = 30;
    const timestamps = [];
    const now = (0, moment_1.default)();
    // today at 00:00:00
    const today = (0, moment_1.default)().set({
        'year': now.year(),
        'month': now.month(),
        'date': now.date(),
        'hour': 0,
        'minute': 0,
        'second': 0,
        'millisecond': 0,
    });
    console.log('today', today.format());
    const iterator = today.subtract(history, 'days');
    for (let offset = 1; offset <= history; offset++) {
        iterator.add(1, 'days');
        timestamps.push([
            today.format(),
            today.valueOf(), // timestamp in ms
        ]);
    }
    timestamps.push([
        now.format(),
        now.valueOf(), // timestamp in ms
    ]);
    timestamps.map(([date, timestampMs]) => console.log(date, timestampMs));
};
main().catch(console.error).finally(() => process.exit());
