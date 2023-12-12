'use strict';

let Path = require('node:path');
let Fs = require('node:fs/promises');

let Lexver = require('./lexver.js');

async function main() {
  let matchVer = process.argv[2];
  if (!matchVer) {
    // matchVer = 'v1.91.1';
    matchVer = 'v1.991';
  }

  let versions;
  {
    let filepath = Path.join(__dirname, 'versions.txt');
    let versionsTxt = await Fs.readFile(filepath, 'utf-8');
    versionsTxt = versionsTxt.trim();
    versions = versionsTxt.split('\n');
    versions.push('1.990.0-rc1');
    versions.push('1.990.0');
    versions.push('1.990.0+hotfix1');
    versions.push('1.991.0-rc1');
    versions.push('1.991.0');
    versions.push('1.991.0+hotfix1');
    versions.push('1.991.1-rc9');
    versions.push('1.991.1-rc10');
    versions.push('1.991.1');
    versions.push('1.991.1+hotfix1');
    versions.push('1.991.1+hotfix2');
    versions.push('1.991.2-rc1');
    versions.push('1.991.2-rc2');
    // versions.push('1.991.2');
    versions.push('1.992.2-rc1');
    versions.push('1.992.2-rc2');
  }

  for (let i = 0; i < versions.length; i += 1) {
    versions[i] = Lexver.parseVersion(versions[i]);
  }

  {
    let versionsTxt = versions.join('\n');
    console.info(versionsTxt);
  }

  let verPrefix = Lexver.parsePrefix(matchVer);

  versions.sort();
  versions.reverse();
  let selected = Lexver.matchSorted(versions, verPrefix);

  console.error(matchVer, verPrefix);
  console.error('Selected:', selected);
}

main()
  .then(function () {
    console.error('');
    console.error('Done.');
    process.exit(0);
  })
  .catch(function (e) {
    console.error(e.stack);
    process.exit(1);
  });
