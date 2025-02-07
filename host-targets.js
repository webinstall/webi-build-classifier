/** @typedef {import('./types.js').OsString} OsString */
/** @typedef {import('./types.js').LibcString} LibcString */
/** @typedef {import('./types.js').ArchString} ArchString */
/** @typedef {import('./types.js').TargetTriplet} TargetTriplet */
/** @typedef {import('./types.js').TargetMatcher} TargetMatcher */

let HostTargets = {};

let reVersionOnly = /^[\d\.]+(-RELEASE)?$/;
let reLeadingVer = /^\d([\d\.\-\+_])+/;
// Notes:
//   gki = Generic Kernel Image
//   qgki = Qualcomm Generic Kernel Image

let X86_64 = {
  x86_64_rocm: ['x86_64_rocm', 'x86_64_v4', 'x86_64_v3', 'x86_64_v2', 'x86_64'],
  x86_64_v4: ['x86_64_v4', 'x86_64_v3', 'x86_64_v2', 'x86_64'],
  x86_64_v3: ['x86_64_v3', 'x86_64_v2', 'x86_64', 'x86'],
  x86_64_v2: ['x86_64_v2', 'x86_64', 'x86'],
  x86_64: ['x86_64', 'x86'],
};

HostTargets.WATERFALL = {
  darwin: { aarch64: ['aarch64', 'x86_64'] },
  windows: Object.assign(
    {
      aarch64: ['aarch64', 'x86_64'],
    },
    X86_64,
  ),
  linux: Object.assign(
    {
      // NOTE: the libc:armhf will need to be installed
      aarch64: ['aarch64', 'armv7a', 'armv7', 'armhf'],
    },
    X86_64,
  ),
  ANYOS: Object.assign({}, X86_64, {
    // arches
    armv7: ['armv7a', 'armv7', 'armhf', 'armv6', 'armel', 'armv5'],
    armv6: ['armv6', 'armel', 'armv5'],
    armv5: ['armv5', 'armel'],
    // libcs
    // prefer 'none' because dep can be crazy otherwise
    gnu: ['none', 'gnu'],
    libc: ['none', 'libc'],
    musl: ['none', 'musl'],
    // prefer 'msvc' because the install is automated
    // (TODO does this work for x86_64 on aarch64?)
    msvc: ['msvc', 'none', 'gnu'],
    // prefer 'bionic' because it's built-in
    // (TODO test to see if statically-compiled linux bins work)
    bionic: ['bionic', 'none'],
  }),
};

// The Terms
let T = {
  ANDROID: { android: true, vendor: 'unknown', libc: 'bionic' },
  LINUX: { os: 'linux', vendor: 'unknown' },
  WINDOWS: { os: 'windows', vendor: 'pc' },
  DARWIN: { os: 'darwin', vendor: 'apple' },
};

// OS, Arch, Libc
/** @type {Object.<String, import('./types.js').TargetMatcher>}  */
HostTargets.TERMS = {
  // agent
  webi: {},
  curl: {},
  Wget: {},
  wget: {},
  'wget+curl': {},
  'curl+wget': {},
  PowerShell: {},
  'PowerShell+curl': {},
  unknown: {},
  // OS
  Android: T.ANDROID,
  Linux: T.LINUX,
  MINGW: T.LINUX,
  CYGWIN: T.LINUX,
  Darwin: T.DARWIN,
  Windows: T.WINDOWS,
  DragonFly: { os: 'dragonfly', vendor: 'unknown' },
  NetBSD: { os: 'netbsd', vendor: 'unknown' },
  OpenBSD: { os: 'openbsd', vendor: 'unknown' },
  FreeBSD: { os: 'freebsd', vendor: 'unknown' },
  illumos: { os: 'illumos', vendor: 'unknown' },
  SunOS: {},
  MS: { os: 'windows' },
  // arch
  AMD64: { arch: 'x86_64' },
  amd64: { arch: 'x86_64' },
  x86_64: { arch: 'x86_64' },
  ARM64: { arch: 'aarch64' },
  arm64: { arch: 'aarch64' },
  aarch64: { arch: 'aarch64' },
  armv7l: { arch: 'armv7' },
  armv6l: { arch: 'armv6' },
  earmv6hf: { arch: 'armhf' },
  arm: {},
  evbarm: {},
  i86pc: { arch: 'x86' },
  i386: { arch: 'x86' },
  i686: { arch: 'x86' },
  // libc
  gnu: { libc: 'gnu' },
  GNU: { libc: 'gnu' },
  libc: { libc: 'libc' },
  msvc: { libc: 'msvc' },
  // See <https://android.googlesource.com/platform/bionic/>
  bionic: { libc: 'bionic' },
  musl: { libc: 'musl' },
  // meta, test, misc
  test: {},
};
{
  let keys = Object.keys(HostTargets.TERMS);
  for (let key of keys) {
    let lkey = key.toLowerCase();
    HostTargets.TERMS[lkey] = HostTargets.TERMS[key];
  }
}

HostTargets._MATCHERS = {
  // seems to be some sort of android-specific kernel build hash
  androidBuild: /^(ab)[0-9A-Z]+$/,
  // el = enterprise linux
  // fc = fedora core
  // amzn = amazon
  // ex: CYGWIN_NT-10.0-WOW/3.3.5(0.341/5/3)
  cygwin: /^CYGWIN(_NT)?/,
  distroRelease: /^(android|amzn|el|fc)\d+$/,
  // ex: MINGW64_NT-10.0-19045/3.3.6-341.x86_64
  mingw: /^MINGW(64_NT)?/,
};

/**
 * @param {Object.<"os"|"arch"|"libc", String>} targetIsh
 * @param {Array<String>} terms
 */
HostTargets.termsToTarget = function (targetIsh, terms) {
  let bogoTerms = [];

  let target = Object.assign(targetIsh, { errors: [] });

  for (let term of terms) {
    let lterm = term.toLowerCase();
    let hints = HostTargets.TERMS[lterm];
    if (hints) {
      let debugUa = terms.join(',');
      let debugTerms = [term];
      upsertHints(target, debugUa, debugTerms, hints);
      continue;
    }

    if (reVersionOnly.test(term)) {
      continue;
    }

    if (HostTargets._MATCHERS.androidBuild.test(term)) {
      Object.assign(target, { android: true });
      continue;
    }

    if (term.includes('MINGW')) {
      Object.assign(target, HostTargets.TERMS.MINGW);
      continue;
    }

    if (term.includes('CYGWIN')) {
      Object.assign(target, HostTargets.TERMS.CYGWIN);
      continue;
    }

    let m = term.match(HostTargets._MATCHERS.distroRelease);
    if (m) {
      // ex: android12 => android, fc39 => fc
      term = m[1];
    } else {
      // ex: 6.2.0-1014-aws => aws
      term = term.replace(reLeadingVer, '');
    }
    if (!term) {
      continue;
    }

    // ex: android12-qgki
    let isAndroid = term.startsWith('android');
    if (isAndroid) {
      Object.assign(target, { android: true });
      continue;
    }

    bogoTerms.push(term);
  }

  upsertAndroidTerms(target, terms);

  return bogoTerms;
};

/**
 * @param {TargetTriplet} target
 * @param {String} ua
 * @param {Array<String>} terms
 * @param {TargetMatcher} hints
 */
function upsertHints(target, ua, terms, hints) {
  if (!hints) {
    throw new Error("[SANITY FAIL] 'hints' not provided");
  }

  // TODO maybe use utility type 'keyof'
  /** @type {["os","arch","libc","vendor"]} */ //@ts-expect-error
  let keys = Object.keys(hints);
  for (let key of keys) {
    if (!target[key]) {
      if (hints[key]) {
        //@ts-expect-error TODO
        target[key] = hints[key];
      }
    }
    if (target[key] !== hints[key]) {
      let msg = `'${key}' already set to '${target[key]}', not updated to '${hints[key]}'`;
      let ignore = false;
      let targetIsLinuxy =
        target[key] === 'gnu' ||
        target[key] === 'bionic' ||
        target[key] === 'musl';
      if (targetIsLinuxy) {
        if (hints[key] === 'libc') {
          // likely an old webi script with bad generic categorization
          ignore = true;
        } else if (hints[key] === 'musl') {
          // musl can be installed on a GNU system
          //@ts-expect-error - TODO find out if we depend on this libs vs libcs typo (we probably do)
          target.libs = [target.libc, 'musl'];
          ignore = true;
        }
      }
      if (!ignore) {
        //@ts-expect-error
        target.errors.push({ [key]: hints[key], message: msg, terms: terms });
        throw new Error(`${msg} for '${ua}' / '${terms}'`);
      }
    }
  }
}

/**
 * @typedef HasErrors
 * @prop {Array<any>} errors
 */

/**
 * Workaround for current (2023-q4) Android misclassification
 * @param {TargetTriplet & HasErrors} target
 * @param {Array<String>} terms
 */
function upsertAndroidTerms(target, terms) {
  if (!target.android) {
    return;
  }

  if (!target.os) {
    target.os = 'android';
  } else if (target.os === 'linux') {
    target.os = 'android';
    if (target.libc === 'gnu') {
      target.libc = 'bionic';
    }
  } else if (target.os !== 'android') {
    let msg = `Android 'os' already set to '${target.os}', but should be 'android'`;
    target.errors.push({ os: 'android', message: msg, terms: terms });
    throw new Error(`${msg} for '${terms}'`);
  }

  if (!target.libc) {
    target.libc = 'bionic';
  }
  if (target.libc !== 'bionic') {
    if (target.libc === 'musl') {
      // musl can be installed on Android
      target.libcs = ['bionic', 'musl'];
      target.libc = 'musl';
    } else {
      let msg = `Android 'libc' already set to '${target.libc}', but should be 'bionic'`;
      target.errors.push({ libc: 'bionic', message: msg, terms: terms });
      throw new Error(`${msg} for '${terms}'`);
    }
  }
}

export let TERMS = HostTargets.TERMS;
export let WATERFALL = HostTargets.WATERFALL;
export let _MATCHERS = HostTargets._MATCHERS;
export let termsToTarget = HostTargets.termsToTarget;
export default HostTargets;
