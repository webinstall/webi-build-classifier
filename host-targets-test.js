'use strict';

let HostTargets = require('./host-targets.js');

function parseUa(ua) {
  let terms = [];
  let parts = ua.split(/\s+/g);
  for (let part of parts) {
    let _terms = part.split(/\//g);
    terms = terms.concat(_terms);
  }
  let target = {};
  HostTargets.termsToTarget(target, terms);
  return target;
}

function assertField(ua, target, field, expected) {
  let actual = target[field];
  if (actual !== expected) {
    throw new Error(
      `[${field}] expected '${expected}' but got '${actual}' for UA:\n  ${ua}`,
    );
  }
}

function testCase(ua, expected) {
  let target = parseUa(ua);
  for (let [field, value] of Object.entries(expected)) {
    assertField(ua, target, field, value);
  }
}

async function main() {
  // Cygwin on 32-bit Windows (reports 'gnu')
  testCase('webi/curl+wget i686/unknown CYGWIN_NT-10.0-WOW/3.3.5(0.341/5/3) gnu', {
    os: 'windows',
    arch: 'x86',
    vendor: 'pc',
  });

  // Cygwin on 32-bit Windows, legacy curl-only UA
  testCase('curl CYGWIN_NT-10.0-WOW/3.3.5(0.341/5/3) i686/unknown gnu', {
    os: 'windows',
    arch: 'x86',
    vendor: 'pc',
  });

  // Cygwin on 64-bit Windows (reports 'libc'), "Cygwin" prefix variant
  testCase('webi/curl x86_64/unknown Cygwin/CYGWIN_NT-10.0/3.3.4(0.341/5/3) libc', {
    os: 'windows',
    arch: 'x86_64',
    vendor: 'pc',
  });

  // Cygwin on 64-bit Windows 10 (build 19045)
  testCase('webi/curl+wget x86_64/unknown Cygwin/CYGWIN_NT-10.0-19045/3.4.10-1.x86_64 libc', {
    os: 'windows',
    arch: 'x86_64',
    vendor: 'pc',
  });

  // Cygwin on 64-bit Windows 11 (build 26200) — from issue #1083
  testCase('webi/curl+wget x86_64/unknown Cygwin/CYGWIN_NT-10.0-26200/3.4.10-1.x86_64 libc', {
    os: 'windows',
    arch: 'x86_64',
    vendor: 'pc',
  });

  // Cygwin UA with GNU/Linux prefix (webi.sh quirk on some Cygwin installs)
  testCase('webi/curl+wget i686/unknown GNU/Linux/CYGWIN_NT-10.0-WOW/3.3.5(0.341/5/3) libc', {
    os: 'windows',
    arch: 'x86',
    vendor: 'pc',
  });

  // MINGW (Git Bash) on 64-bit Windows, webi UA
  testCase('webi/curl x86_64/unknown MINGW64_NT-10.0-19045/3.3.6-341.x86_64 libc', {
    os: 'windows',
    arch: 'x86_64',
    vendor: 'pc',
  });

  // MINGW (Git Bash), legacy curl-only UA
  testCase('curl MINGW64_NT-10.0-19045/3.3.6-341.x86_64 x86_64/unknown libc', {
    os: 'windows',
    arch: 'x86_64',
    vendor: 'pc',
  });

  // MINGW with Linux prefix in UA path (older Git Bash format)
  testCase('curl Linux/MINGW64_NT-10.0-19045/3.3.6-341.x86_64 x86_64/unknown libc', {
    os: 'windows',
    arch: 'x86_64',
    vendor: 'pc',
  });

  // MINGW with Msys prefix (Msys2 variant)
  testCase('webi/curl x86_64/unknown Msys/MINGW64_NT-10.0-19045/3.3.6-341.x86_64 libc', {
    os: 'windows',
    arch: 'x86_64',
    vendor: 'pc',
  });

  // Sanity: real Linux should NOT be classified as Windows
  testCase('webi/curl+wget x86_64/unknown Linux/6.2.0-1012-aws gnu', {
    os: 'linux',
    arch: 'x86_64',
    vendor: 'unknown',
  });

  // Sanity: Darwin should NOT be classified as Windows
  testCase('webi/curl arm64/unknown Darwin/22.6.0', {
    os: 'darwin',
    arch: 'aarch64',
    vendor: 'apple',
  });
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
