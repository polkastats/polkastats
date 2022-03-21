"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const backend_config_1 = require("../backend.config");
const pino_1 = __importDefault(require("pino"));
exports.logger = (0, pino_1.default)({
    level: backend_config_1.backendConfig.logLevel,
});
