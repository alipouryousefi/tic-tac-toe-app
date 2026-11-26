const fs = require('node:fs');
const path = require('node:path');

const testDirectory = path.resolve(__dirname, '../tests');
for (const file of fs.readdirSync(testDirectory).filter((name) => name.endsWith('.test.cjs')).sort()) {
  require(path.join(testDirectory, file));
}
