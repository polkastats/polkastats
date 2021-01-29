const config = require('./backend.config.js');
const Backend = require('./lib/Backend.js');

async function main() {
  const backend = new Backend(config);
  backend.runCrawlers();
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
