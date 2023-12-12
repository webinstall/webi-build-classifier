'use strict';

let HostTargets = require('./host-targets.js');

let uaMap = require('./uas.json');
let uas = Object.keys(uaMap);

let partialsMap = {};
let termsMap = {};
let termNames = Object.keys(HostTargets.TERMS);
for (let term of termNames) {
  termsMap[term] = 0;
}

function main() {
  //let hostTargets = HostTargets.create({});
  let tripletsMap = {};

  for (let ua of uas) {
    let terms = [];

    let parts = ua.split(/\s+/g);
    for (let part of parts) {
      let _terms = part.split(/\//g);
      for (let term of _terms) {
        if (HostTargets.TERMS[term]) {
          // TODO how to account for non-exact matches
          // abXXXXXXXX, android12-*, and MINGW*
          termsMap[term] += 1;
        }
      }

      terms = terms.concat(_terms);
    }

    let target = {};
    let bogoTerms;
    try {
      bogoTerms = HostTargets.termsToTarget(target, terms);
    } catch (e) {
      // we can't realistically guarantee what the user should get
      throw e;
    }

    if (!target.arch) {
      // 'curl/x.y.z', 'MS', 'Wget'
      if (parts.length !== 1) {
        let msg = `'arch' not detected for '${ua}'`;
        let err = new Error(msg);
        console.error('Error:', err.message);
      }
      continue;
    }
    if (!target.os) {
      // 'curl/x.y.z', 'MS', 'Wget'
      if (parts.length !== 1) {
        let msg = `'os' not detected for '${ua}'`;
        let err = new Error(msg);
        console.error('Error:', err.message);
      }
      continue;
    }

    if (!bogoTerms) {
      continue;
    }

    for (let term of bogoTerms) {
      let strs = term.split(/[\.]+/g);
      for (let str of strs) {
        if (!partialsMap[str]) {
          partialsMap[str] = 0;
        }
        partialsMap[str] += 1;
      }
    }

    let triplet = `${target.arch}-${target.vendor}-${target.os}-${target.libc}`;
    tripletsMap[triplet] = true;
    if (!target.os || !target.arch) {
      throw new Error(`missing 'os' or 'arch' in '${ua}'`);
    }
    if (!target.libc) {
      // TODO
      console.error(`missing 'libc' in '${ua}'`);
    }

    //console.log(bogoTerms);
  }

  console.info('');
  console.info('Partial Terms');
  console.log(partialsMap);

  console.info('');
  console.log('Known Terms:');
  console.log(termsMap);

  let triplets = Object.keys(tripletsMap);
  console.info('');
  console.info('Triplets');
  for (let triplet of triplets) {
    console.info(`    ${triplet}`);
  }
}

main();
