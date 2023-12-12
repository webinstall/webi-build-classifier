'use strict';

let Lexver = require('./lexver.js');

async function main() {
  let matchVer = process.argv[2];
  if (!matchVer) {
    // matchVer = 'v1.91.1';
    matchVer = 'v1.991';
  }

  let versions = [];
  {
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

  console.info('');
  console.info(`Parsing Versions:`);
  for (let i = 0; i < versions.length; i += 1) {
    let lexver = Lexver.parseVersion(versions[i]);
    console.info(`    ${versions[i]} => ${lexver}`);
    versions[i] = lexver;
  }

  console.info('');
  console.info(`Parsing Search Prefix:`);
  let verPrefix = Lexver.parsePrefix(matchVer);
  console.info(`    ${matchVer} => ${verPrefix}`);

  if (verPrefix !== '0001.0991') {
    throw new Error(
      `didn't parse search version '${matchVer}' correctly: '${verPrefix}' != '0001.0991'`,
    );
  }

  versions.sort();
  versions.reverse();
  let selected = Lexver.matchSorted(versions, verPrefix);
  let selectedKeys = Object.keys(selected);

  let known = {
    default: '0001.0991.0001.0000@hotfix02', // stable or latest
    matches: [
      '0001.0991.0002.0000-rc02',
      '0001.0991.0002.0000-rc01',
      '0001.0991.0001.0000@hotfix02',
      '0001.0991.0001.0000@hotfix01',
      '0001.0991.0001.0000@',
      '0001.0991.0001.0000-rc10',
      '0001.0991.0001.0000-rc09',
      '0001.0991.0000.0000@hotfix01',
      '0001.0991.0000.0000@',
      '0001.0991.0000.0000-rc01',
    ],
    previous: '0001.0990.0000.0000@hotfix01', // BEFORE match
    previousStep: '0001.0991.0001.0000@hotfix01', // matched, but not selected
    stable: '0001.0991.0001.0000@hotfix02', // stable, but in this case not latest
    nextStep: '0001.0991.0002.0000-rc01', // the very next after stable
    latest: '0001.0991.0002.0000-rc02', // latest matching (in this case not stable)
    next: '0001.0992.0002.0000-rc01', // AFTER match
  };
  let knownKeys = Object.keys(known);

  for (let key of knownKeys) {
    if (selected[key].toString() !== known[key].toString()) {
      console.error('Expected:');
      console.error(known);
      console.error('Selected:');
      console.error(selected);
      throw new Error('selected versions do not match expected versions');
    }
  }

  if (selectedKeys.length !== knownKeys.length) {
    console.error('Expected:');
    console.error(known);
    console.error('Selected:');
    console.error(selected);
    throw new Error('mismatch number of keys');
  }

  console.info('');
  console.info('Selected:');
  console.info(selected);
}

main()
  .then(function () {
    console.error('');
    console.error('PASS');
    process.exit(0);
  })
  .catch(function (e) {
    console.error(e.stack);
    process.exit(1);
  });
