// Required imports
import '@polkadot/api-augment';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Metadata } from '@polkadot/types';

async function main () {
  // Initialise the provider to connect to the local node
  const provider = new WsProvider('wss://kusama-rpc.polkadot.io');

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider });

  const metadata: Metadata = await api.rpc.state.getMetadata();

  //console.log(JSON.stringify(metadata.asV14.lookup.types.toJSON(), null, 2))
  // get events from metadata
  const moduleEvents: any[] = [];
  metadata.asV14.lookup.types
    .filter(({ type }: any) => type.toJSON().path[2] === 'Event')
    .forEach(type => {
      const moduleName = type.type.path[0].split(/_/)[1];
      type.type.def.asVariant.variants.forEach(variant => {
        //moduleEvents.push([moduleName, variant.toJSON()]);
        moduleEvents.push([moduleName, variant.name.toString()]);
      });
      
    });
  // moduleEvents.map(([moduleName, moduleEvent]) => console.log(moduleName, JSON.stringify(moduleEvent, null, 2)));
  moduleEvents.map(([moduleName, moduleEvent]) => console.log(moduleName, moduleEvent));
  
}

main().catch(console.error).finally(() => process.exit());
