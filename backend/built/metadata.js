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
// Required imports
require("@polkadot/api-augment");
const api_1 = require("@polkadot/api");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Initialise the provider to connect to the local node
        const provider = new api_1.WsProvider('wss://kusama-rpc.polkadot.io');
        // Create the API and wait until ready
        const api = yield api_1.ApiPromise.create({ provider });
        const metadata = yield api.rpc.state.getMetadata();
        //console.log(JSON.stringify(metadata.asV14.lookup.types.toJSON(), null, 2))
        // get events from metadata
        const moduleEvents = [];
        metadata.asV14.lookup.types
            .filter(({ type }) => type.toJSON().path[2] === 'Event')
            .forEach(type => {
            const moduleName = type.type.path[0].split(/_/)[1];
            type.type.def.asVariant.variants.forEach(variant => {
                //moduleEvents.push([moduleName, variant.toJSON()]);
                moduleEvents.push([moduleName, variant.name.toString()]);
            });
        });
        // moduleEvents.map(([moduleName, moduleEvent]) => console.log(moduleName, JSON.stringify(moduleEvent, null, 2)));
        moduleEvents.map(([moduleName, moduleEvent]) => console.log(moduleName, moduleEvent));
    });
}
main().catch(console.error).finally(() => process.exit());
