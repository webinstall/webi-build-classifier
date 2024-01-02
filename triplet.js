/**
 * @typedef Triplet
 * @prop {Array<String>} TERMS_CHANNEL
 * @prop {Array<String>} TERMS_CHECKSUM
 * @prop {Array<String>} TERMS_NON_BUILD
 * @prop {Array<String>} TERMS_EXTS_NON_BUILD
 * @prop {Array<String>} TERMS_EXTS_BUILD
 * @prop {Array<String>} TERMS_EXTS_NON_INFORMATIVE
 * @prop {Array<String>} TERMS_EXTS_SOURCE
 */

/** @typedef {import('./types.js').OsString} OsString */
/** @typedef {import('./types.js').LibcString} LibcString */
/** @typedef {import('./types.js').ArchString} ArchString */
/** @typedef {import('./types.js').TargetTriplet} TargetTriplet */

/** @type {Triplet} */
//@ts-ignore
var Triplet = ('object' === typeof module && exports) || {};
(function (window, Triplet) {
  /*jshint maxstatements: 2000 */
  'use strict';

  Triplet.TERMS_CHANNEL = ['master', 'nightly'];
  Triplet.TERMS_CHECKSUM = [
    'B3SUMS',
    'checksum',
    'MD5SUMS',
    'SHA1SUMS',
    'SHA256SUMS',
    'SHA512SUMS',
  ];
  Triplet.TERMS_NON_BUILD = [
    'bootstrap',
    'debug', // TODO dashd
    'setup',
    'source',
    'src',
    'symbols',
    // a build, but not one you'd use given the alternative
    'unsigned', // TODO dashd
    'vendor', // TODO rclone go vendor
  ];
  Triplet._RE_TERMS_NON_BUILD = [];
  for (let term of Triplet.TERMS_NON_BUILD) {
    let re = new RegExp(`(\\b|_)(${term})(\\b|_)`);
    Triplet._RE_TERMS_NON_BUILD.push(re);
  }
  Triplet.TERMS_EXTS_NON_BUILD = [
    '.1',
    '.asc',
    '.b3',
    '.json',
    '.md5',
    '.pem',
    '.sbom',
    '.sha256',
    '.sha256sum',
    '.sha512',
    '.sig',
    '.txt',
    // no android
    '.apk',
    // we can't use these yet
    '.deb',
    '.rpm',
    // windows something... not sure
    '.msixbundle',
  ];

  // many assets are bare - we'd have to check if any contain a '.'
  // in the name before using these as a whitelist
  // (ordered by OS for clarity, by length for matching)
  Triplet.TERMS_EXTS_PKG = [
    // Windows
    // '.exe.zip',
    // '.exe.xz',
    '.exe',
    '.msi',
    '.msixbundle',
    // macOS
    // '.app.zip',
    //'.dmg.zip', // because some systems only allow .zip
    '.app', // for classification (it'll be in a zip or dmg)
    '.dmg',
    '.pkg',
    // Enterprise Linux
    '.rpm',
    // Debian
    '.deb',
    // Android
    '.apk',
    // Nondescript
    '.tar',
    // '.tar.bz2', // ('.tbz2' is never used)
    // '.tar.gz', // ('.tgz' is never used)
    // '.tar.xz', // ('.txz' is never used)
    // '.tar.zst', // ('.tzst' is never used)
    // POSIX
    // (also, could be the runnable, installable thing, or an install script)
    '.sh',
    // Any (font, vim script)
    '.git',
  ];

  Triplet.TERMS_EXTS_ZIP = [
    '.bz2', // -j, --bzip2 (for completeness, not used)
    '.gz', // -z, --gzip
    '.xz', // -J, --xz
    '.zip', // (auto on BSD tar on Windows and macOS)
    // neither macos nor linux have zstd by default
    '.zst', // --zstd
    '.7z', // --lz4, --lzma, --lzop
  ];

  // these don't provide any clues as to which OS is used
  // (counter-examples: .exe (windows) .dmg (mac) .deb (linux)
  Triplet.TERMS_EXTS_NON_INFORMATIVE = [
    '.gz',
    '.xz',
    '.zst',
    '.zip',
    // .tar should come *after* extensions that use it
    '.tar',
    '.7z',
  ];
  Triplet.TERMS_EXTS_SOURCE = ['.zip', '.tar.gz', '.tar.xz', '.tar.zst'];

  Triplet.TERMS_PRIMARY_MAP = {};
  let T = {
    NONE: {},

    // Apple
    APPLE: { os: 'darwin', vendor: 'apple', libc: 'none' },
    APPLE_X86_64: {
      os: 'darwin',
      vendor: 'apple',
      arch: 'x86_64',
      libc: 'none',
    },
    APPLE_X86: {
      os: 'darwin',
      vendor: 'apple',
      arch: 'x86',
      libc: 'none',
    },
    APPLE_AARCH64: {
      os: 'darwin',
      vendor: 'apple',
      arch: 'aarch64',
    },

    // Linux
    LINUX: { os: 'linux', vendor: 'unknown' },
    LINUX_X86_64: { os: 'linux', arch: 'x86_64', vendor: 'unknown' },
    LINUX_X86: { os: 'linux', arch: 'x86', vendor: 'unknown' },
    LINUX_ARMHF_GNU: {
      arch: 'armhf',
      os: 'linux',
      libc: 'gnu',
      arches: ['armv7', 'armhf'],
    },
    LINUX_ARMHF_MUSL: {
      arch: 'armhf',
      os: 'linux',
      libc: 'none',
      libcs: ['none', 'musl'],
    },
    LINUX_ARMEL_MUSL: {
      arch: 'armel',
      os: 'linux',
      libc: 'none',
      libcs: ['none', 'musl'],
    },

    // Windows 10+
    WIN_PC: { os: 'windows', vendor: 'pc' },
    WIN_PC_X86: { os: 'windows', vendor: 'pc', arch: 'x86' },
    WIN_PC_X86_64: { os: 'windows', vendor: 'pc', arch: 'x86_64' },
    WIN_PC_MSVC: {
      os: 'windows',
      vendor: 'pc',
      libc: 'msvc',
    },

    // BSDs
    AIX: { os: 'aix' },
    DRAGONFLY: { os: 'dragonfly' },
    FREEBSD: { os: 'freebsd' },
    OPENBSD: { os: 'openbsd' },
    NETBSD: { os: 'netbsd' },
    PLAN9: { os: 'plan9' },
    ILLUMOS: { os: 'illumos' },
    SUNOS: { os: 'sunos' },
    SOLARIS: { os: 'solaris' },

    // Any
    POSIX: { os: 'posix_2017', arch: 'ANYARCH', vendor: 'unknown' },
    WASI: { os: 'wasi', vendor: 'unknown' },

    // Arches
    X86_64: { arch: 'x86_64' },
    X86_64_V2: { arch: 'x86_64_v2' },
    X86_64_V3: { arch: 'x86_64_v3' },
    AARCH64: { arch: 'aarch64' },
    X86: { arch: 'x86' },
    ARMV7A: { arch: 'armv7a' },
    ARMV7: { arch: 'armv7' },
    ARMHF: { arch: 'armhf' },
    ARMV6: { arch: 'armv6' },
    ARMEL: { arch: 'armel' },

    // LIBC
    ALPINE: {
      os: 'linux',
      vendor: 'unknown',
      libc: 'none',
      libcs: ['none', 'musl'],
    },
    MUSL: { libc: 'none', libcs: ['none', 'musl'] },
    LIBC_NONE: { libc: 'none' },
  };

  let tpm = Triplet.TERMS_PRIMARY_MAP;
  // meta replacements
  tpm['{NAME}'] = T.NONE;
  tpm['{OS}'] = T.NONE;
  tpm['{ARCH}'] = T.NONE;
  tpm['{LIBC}'] = T.NONE;
  tpm['{VENDOR}'] = T.NONE;
  tpm['{EXT}'] = T.NONE;
  tpm['ANYARCH'] = T.NONE;
  tpm['ANYOS'] = T.NONE;

  // just channels
  tpm['stable'] = { channel: 'stable' };
  tpm['preview'] = { channel: 'preview' };
  tpm['lts'] = { channel: 'lts' };
  tpm['beta'] = { channel: 'beta' };
  tpm['dev'] = { channel: 'dev' };
  tpm['debug'] = { channel: 'debug' };

  //
  // OS
  //
  tpm['apple'] = T.APPLE;
  tpm['darwin'] = T.APPLE;
  tpm['darwin_10_12'] = T.APPLE;
  tpm['macos'] = T.APPLE;
  tpm['osx'] = T.APPLE;
  tpm['osx_10_6'] = T.APPLE;
  tpm['osx_10_8'] = T.APPLE;
  tpm['mac'] = T.APPLE;
  tpm['macos_10_10'] = T.APPLE;
  // Windows
  tpm['windows'] = T.WIN_PC;
  // Linux
  tpm['linux'] = T.LINUX;
  // BSD + other Unixes
  tpm['aix'] = T.AIX;
  tpm['dragonfly'] = T.DRAGONFLY;
  tpm['freebsd'] = T.FREEBSD;
  tpm['freebsd_12'] = T.FREEBSD;
  tpm['openbsd'] = T.OPENBSD;
  tpm['netbsd'] = T.NETBSD;
  tpm['plan9'] = T.PLAN9;
  tpm['illumos'] = T.ILLUMOS;
  tpm['sunos'] = T.SUNOS;
  tpm['solaris'] = T.SOLARIS;
  tpm['solaris_11'] = T.SOLARIS;
  // System Interfaces (POSIX, WASI)
  tpm['posix'] = T.POSIX;
  tpm['posix_2017'] = T.POSIX;
  tpm['wasi'] = T.WASI;

  // OS + Arch
  tpm['windowsx86'] = T.WIN_PC_X86;
  tpm['linux64'] = T.LINUX_X86_64;
  tpm['linux32'] = T.LINUX_X86;
  tpm['win64'] = T.WIN_PC_X86_64;
  tpm['osx64'] = T.APPLE_X86_64;
  tpm['mac32'] = T.APPLE_X86;
  // ambiguous
  tpm['win32'] = T.WIN_PC;
  tpm['mac64'] = T.APPLE;

  //
  // Arch
  //
  tpm['x86_64'] = T.X86_64;
  tpm['x86_64_v1'] = T.X86_64;
  tpm['x86_64_v2'] = T.X86_64_V2;
  tpm['x86_64_v3'] = T.X86_64_V3;
  tpm['amd64'] = T.X86_64;
  tpm['amd64_v1'] = T.X86_64;
  tpm['amd64_v2'] = T.X86_64_V2;
  tpm['amd64_v3'] = T.X86_64_V3;
  tpm['x64'] = T.X86_64;
  tpm['aarch64'] = T.AARCH64;
  tpm['arm64'] = T.AARCH64;
  tpm['m1'] = T.AARCH64;
  // How to navigate the minefield of armv[567](e|l|a|hf|kz)
  // See <https://docs.balena.io/reference/base-images/base-images/>
  // - "hf" seems to standard now, but carried over from the v5/v6 days
  // - "kz" is a special architecture for security
  // - "e" / "el" seems to be old v5 stuff
  // - "a" seems to be the best of the v7 era
  // - "l" ??? seems to be standard
  // We could have some crazy fallback logic but... aarch64 is the future!
  tpm['armv7a'] = T.ARMV7A;
  tpm['armv7l'] = T.ARMV7; // Most Linuxes
  tpm['armv7h'] = T.ARMV7; // Arch
  tpm['armv7hl'] = T.ARMV7; // RedHat
  tpm['armv7'] = T.ARMV7;
  tpm['arm32'] = T.ARMV7;
  tpm['armhf'] = T.ARMHF;
  // armv6hf will always work on armv7, or armv6hf, but not armv6 or armv5
  // See also: <https://docs.balena.io/reference/base-images/base-images/>
  tpm['armv6hf'] = T.ARMHF;
  tpm['armv6l'] = T.ARMV6;
  tpm['armv6'] = T.ARMV6;
  tpm['armv5'] = T.ARMEL;
  tpm['armel'] = T.ARMEL;

  // Enter the minefield of x86
  tpm['i386'] = T.X86;
  tpm['386'] = T.X86;
  tpm['i686'] = T.X86;
  tpm['686'] = T.X86;
  tpm['x86'] = T.X86;
  tpm['ia32'] = T.X86;
  // the weird ones
  tpm['loong64'] = { arch: 'loong64' };
  tpm['mips'] = { arch: 'mips' };
  tpm['mipsel'] = { arch: 'mipsel' };
  tpm['mipsle'] = { arch: 'mipsel' };
  tpm['mips64'] = { arch: 'mips64' };
  tpm['mips64el'] = { arch: 'mips64el' };
  tpm['mips64le'] = { arch: 'mips64el' };
  tpm['mipsr6'] = { arch: 'mipsr6' };
  tpm['mipsr6el'] = { arch: 'mipsr6el' };
  tpm['mips64r6'] = { arch: 'mips64r6' };
  tpm['mips64r6el'] = { arch: 'mips64r6el' };
  tpm['mips64r6le'] = { arch: 'mips64r6el' };
  tpm['powerpc'] = { arch: 'ppc' };
  tpm['powerpc64'] = { arch: 'ppc64' };
  tpm['powerpc64el'] = { arch: 'ppc64le' };
  tpm['powerpc64le'] = { arch: 'ppc64le' };
  tpm['ppc'] = { arch: 'ppc' };
  tpm['ppc64'] = { arch: 'ppc64' };
  tpm['ppc64el'] = { arch: 'ppc64le' };
  tpm['ppc64le'] = { arch: 'ppc64le' };
  tpm['riscv64'] = { arch: 'riscv64' };
  tpm['s390x'] = { arch: 's390x' };
  // WASM
  tpm['wasm'] = { arch: 'wasm32' };
  tpm['wasm32'] = { arch: 'wasm32' };

  //
  // mostly libc
  //
  tpm['static'] = T.LIBC_NONE;
  tpm['bionic'] = T.NONE;
  // TODO how to determine when "musl" is NOT static (i.e. musl++)
  tpm['alpine'] = T.ALPINE;
  tpm['musl'] = T.MUSL;
  tpm['none'] = T.NONE;

  // saved for last due to ambiguity
  tpm['universal'] = T.APPLE_X86_64;
  tpm['gnueabihf'] = T.LINUX_ARMHF_GNU;
  tpm['musleabihf'] = T.MUSL;
  tpm['musleabi'] = T.MUSL;
  tpm['eabihf'] = { arch: 'armhf', os: 'linux' };
  tpm['gnu'] = {};
  tpm['win'] = T.WIN_PC;
  tpm['msvc'] = T.WIN_PC_MSVC;
  tpm['32'] = T.X86;
  tpm['64'] = T.X86_64;
  tpm['all'] = T.APPLE_X86_64;
  tpm['m1'] = T.APPLE_AARCH64;
  tpm['unknown'] = { vendor: 'unknown' };
  tpm['pc'] = { vendor: 'pc' };
  tpm['android'] = {
    os: 'linux',
    android: true,
    libc: 'bionic',
  };
  tpm['androideabi'] = {
    os: 'linux',
    android: true,
    arch: 'armv7',
    libc: 'bionic',
  };

  // Extensions - last resort
  tpm['exe'] = T.WIN_PC;
  tpm['msi'] = T.WIN_PC;
  tpm['app'] = T.APPLE;
  tpm['dmg'] = T.NONE;
  tpm['pkg'] = T.APPLE;
  tpm['git'] = { os: 'ANYOS', arch: 'ANYARCH' };
  //{ term: 'sh', os: '*', arch: 'POSIX' },
  tpm['sh'] = T.NONE;
  // for completeness
  tpm['arm'] = T.NONE;
  tpm['js'] = T.NONE;

  Triplet.TERMS_TIERED_MAPS = [
    {
      // these are sometimes ambiguous (i.e. "win32-x86", "mac64-arm64"),
      // so their arch identifiers should only be used as a last resort

      // win
      windows: T.WIN_PC_X86_64,
      win32: T.WIN_PC_X86,
      exe: T.WIN_PC_X86_64,
      msi: T.WIN_PC_X86_64,

      // mac
      macos: T.APPLE_X86_64,
      mac64: T.APPLE_X86_64,
      darwin: T.APPLE_X86_64,
      app: T.APPLE_X86_64,
      dmg: T.APPLE_X86_64,
      pkg: T.APPLE_X86_64,

      // linux
      linux: T.LINUX_X86_64,
      android: T.AARCH64,

      // arm
      arm: T.ARMHF,

      // libc
      gnu: { os: 'windows', libc: 'none', vendor: 'pc' },
      musleabihf: T.LINUX_ARMHF_MUSL,
      musleabi: T.LINUX_ARMEL_MUSL,

      // system interfaces
      js: { os: 'wasi', arch: 'wasm32', vendor: 'unknown' },
    },
  ];

  Triplet.maybeInstallable = function (proj, build) {
    for (let sumname of Triplet.TERMS_CHECKSUM) {
      if (build.download.includes(sumname)) {
        return false;
      }
    }

    for (let ext of Triplet.TERMS_EXTS_NON_BUILD) {
      if (build.download.endsWith(ext)) {
        return false;
      }
    }

    for (let re of Triplet._RE_TERMS_NON_BUILD) {
      if (re.test(build.download)) {
        return false;
      }
    }

    // don't count tip commits or debug channels as versions
    // (though a ${latest}-${date} could possibly be used as a substitute)
    let channels = Triplet.TERMS_CHANNEL;
    for (let ch of channels) {
      if (build.version === ch) {
        return false;
      }
    }

    // exclude source-only files
    let projNames = proj._names;
    if (!projNames) {
      projNames = [proj.name];
    }
    for (let projName of projNames) {
      if (!build.name) {
        break;
      }
      let filename = build.name;
      let version = build._version || build.version;

      let prefix = `${projName}-${version}.`;
      let match = filename.startsWith(prefix);
      if (match) {
        prefix = prefix.slice(0, -1);
        for (let ext of Triplet.TERMS_EXTS_SOURCE) {
          let srcname = `${prefix}${ext}`;
          if (filename === srcname) {
            //console.log('skip source', build.download);
            // TODO enum code
            return 0;
          }
        }
      }
    }

    // not that we can say for sure this is a good file,
    // but we can't say it's a bad one
    return true;
  };

  Triplet.toPattern = function (proj, build) {
    let { download, _filename, version, _version } = build;
    let projNames = proj._names;

    // for when the download URL is a uuid, for example
    if (_filename) {
      download = _filename;
    }

    // use the raw, non-semver version for file names
    if (_version) {
      version = _version;
    }
    if (!projNames) {
      projNames = [proj.name];
    }

    // for watchexec tags like cli-v1.20.3
    version = version.replace(/^cli-/, '');
    version = version.replace(/^v?/i, 'v?');
    let verEsc = version.replace(/\./g, '\\.').replace(/\+/g, '\\+');
    // maybe just once before and once after

    // generic sources that benefit most from dynamic matching
    {
      let ghReleaseRe =
        /https:..github.com.[^\/]+.[^\/]+.releases.download.[^\/]+.(.*)/;
      let ghrMatches = download.match(ghReleaseRe);
      if (ghrMatches) {
        download = ghrMatches[1];
      }

      let sfRe =
        /https:..sourceforge.net.projects.([^\/]+).files.([^\/]+).download/;
      let sfMatches = download.match(sfRe);
      if (sfMatches) {
        download = `${sfMatches[1]}_${sfMatches[2]}`;
      }
    }

    // sources that _don't_ benefit from matching
    {
      // ex: https://codeload.github.com/BeyondCodeBootcamp/DuckDNS.sh/legacy.zip/refs/tags/v1.0.2
      let ghSourceRe =
        /https:..codeload.github.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/refs\/tags\/([^\/]+)/;
      let ghsMatches = download.match(ghSourceRe);
      if (ghsMatches) {
        download = `${ghsMatches[2]}/${ghsMatches[4]}/${ghsMatches[3]}`;
      }

      let gitSourceRe = /(https|http|git):.*\/(.*).git$/;
      download = download.replace(gitSourceRe, '$2.git');
    }

    // trim the start of any url https://example.com/(whatever/thing)?query=
    download = download.replace(/https:\/\/[^\/]+\/([^\?]+)\??.*/, '$1');

    download = download.replace(
      new RegExp(`(\\b|\\D)v?${verEsc}`, 'ig'),
      '$1{VER}',
    );
    for (let projName of projNames) {
      let nameEsc = projName.replace(/[\._\-\+]/g, '.');
      let nameRe = new RegExp(`(\\b|_)${nameEsc}(\\b|_|\\d|[A-Z])`, 'gi');
      download = download.replace(nameRe, '{NAME}$2');
    }

    // trim URLs up to the first {FOO}
    // note (the closing \} is a benign fix for code editor matching / highlighting)
    download = download.replace(/^[^\{\}]+\//, '');

    for (let ext of Triplet.TERMS_EXTS_NON_INFORMATIVE) {
      let hasNonInformativeExt = download.endsWith(ext);
      if (hasNonInformativeExt) {
        download = download.slice(0, -ext.length);
      }
    }

    return download;
  };

  // This normalizes the triplet permutation:
  //   - lowercase all-the-things
  //   - hyphens (.) to separate terms
  //   - underscores (_) to join within a term
  //   - eliminate placeholders {VER} and {NAME}
  let _DOUBLE_NAME_RE = /{NAME}.*{NAME}/;

  Triplet.patternToTerms = function (filename) {
    // NIX {VER} and multiple occurences of {NAME}
    // {NAME}/{NAME}-{VER}-Windows-x86_64_v2-musl.exe =>
    //     {NAME}-Windows-x86-64-v2-musl-exe
    filename = filename.replace(/{VER}/g, '');
    for (;;) {
      let hasMany = _DOUBLE_NAME_RE.test(filename);
      if (!hasMany) {
        break;
      }
      filename = filename.replace('{NAME}', '.');
    }
    filename = filename.replace(/{VER}/g, '.');
    filename = filename.replace('{NAME}', '.{NAME}.');

    // Lossy approach (better for long term future)
    // Before we replace - and _ with .
    //   freebsd12 => freebsd
    //   solaris11-64 => solaris-64
    //   darwin-10.15 => darwin
    //   macos10 => macos
    //filename = filename.replace(/(\w|-)?1\d(\.\d+)?/g, '$1');

    // Lossless two-step approach (better for exact matches)
    //   freebsd12 => freebsd^12
    //   solaris11-64 => solaris^11-64
    //   darwin-10.15 => darwin^10^15
    //   macos10 => macos^10
    //   darwin-10.15 => darwin^10^15
    filename = filename.replace(/(macos|darwin|osx)-?(1\d)\.(\d+)/, '$1^$2^$3');
    filename = filename.replace(
      /(macos|darwin|osx|freebsd|solaris)-?(1\d)/,
      '$1^$2',
    );

    // /{NAME}--windows-x86_64_v2-musl.exe => windows.x86.64.v2.musl.exe
    filename = filename.replace(/[_\/\.\-]+/g, '.');

    // Part 2: put it back
    //   freebsd^12 => freebsd_12
    //   solaris^11.64 => solaris_11.64
    //   darwin^10^15 => darwin_10_15
    //   macos^10 => macos_10
    //   darwin^10^15 => darwin_10_15
    filename = filename.replace(/(\w)\^(\d+)\^(\d+)/, '$1_$2_$3');
    filename = filename.replace(/(\w)\^(\d+)/, '$1_$2');

    // x86.64 => x86_64
    filename = filename.replace('x86.64', 'x86_64');
    filename = filename.replace('32.bit', 'x86');
    filename = filename.replace('64.bit', 'x86_64');

    // armv7 => arm_v7
    // amd64.v1 => amd64_v1
    // arm.6 => arm_v6
    // arm5 => arm_v5
    filename = filename.replace(/(arm|x86_64|amd64)\.?v?(\d)/g, '$1_v$2');
    filename = filename.replace(/arm_/g, 'arm');
    filename = filename.replace(/armv32/g, 'arm32');
    filename = filename.replace(/armv64/g, 'arm64');

    // .{name}.Windows-X64. => {NAME}.windows-x64
    filename = filename.toLowerCase();
    filename = filename.replace('{name}', '{NAME}');

    // trim excess .s
    filename = filename.replace(/\.+$/g, '');
    filename = filename.replace(/^\.+/g, '');

    let terms = filename.split(/\.+/);
    // because '' => ['']
    if (terms[0] === '') {
      terms.shift();
    }

    return terms;
  };

  Triplet.termsToTarget = function (target, proj, build, terms) {
    /* jshint maxcomplexity:25 */

    Object.assign(target, {
      os: build.os || '',
      android: false,
      arch: build.arch || '',
      vendor: build.vendor || '',
      libc: build.libc || '',
      //ext: build.ext || '',
      unknownTerms: [],
    });

    for (let term of terms) {
      let knownMatch = Triplet.TERMS_PRIMARY_MAP[term];
      if (!knownMatch) {
        target.unknownTerms.push(term);
        continue;
      }

      //console.log('dbg-known:', term, knownMatch);
      let checkForMismatch = true;
      upsertTarget(
        proj.name,
        build,
        terms,
        target,
        knownMatch,
        checkForMismatch,
      );
    }

    if (target.android) {
      if (target.os !== 'linux') {
        throw new Error(
          `[SANITY FAIL] '${terms}' should detect as 'linux', not '${target.os}'`,
        );
      }
      target.os = 'android';
    }

    for (let termsMap of Triplet.TERMS_TIERED_MAPS) {
      for (let term of terms) {
        let knownMatch = termsMap[term];
        if (!knownMatch) {
          continue;
        }

        //console.log('dbg-known:', term, knownMatch);
        upsertTarget(proj.name, build, terms, target, knownMatch);
        let complete = target.os && target.arch && target.vendor && target.libc;
        if (complete) {
          break;
        }
      }
    }

    // for (let ext of Triplet.TERMS_EXTS_BUILD) {
    //   if (filename.endsWith(ext)) {
    //     if (!target.ext) {
    //       target.ext = ext;
    //     }
    //     break;
    //   }
    // }

    let os = target.os || 'E_MISSING_OS';
    let arch = target.arch || 'E_MISSING_ARCH';
    if (!target.vendor) {
      target.vendor = 'unknown';
    }
    if (!target.libc) {
      target.libc = 'none';
    }

    if (!target.os) {
      let err = new Error(
        `${os}: could not match ${proj.name} ${build.download} to os target`,
      );
      err._projName = proj.name;
      err._terms = terms;
      err._build = build;
      throw new Error(err);
    }
    if (!target.arch) {
      let err = new Error(
        `${arch}: could not match ${proj.name} ${build.download} to arch target`,
      );
      err._projName = proj.name;
      err._terms = terms;
      err._build = build;
      throw new Error(err);
    }

    return target;
  };

  function upsertTarget(
    name,
    build,
    terms,
    target,
    knownMatches,
    checkForMismatch,
  ) {
    upsertOs(name, build, terms, target, knownMatches, checkForMismatch);
    upsertArch(name, build, terms, target, knownMatches, checkForMismatch);
    upsertLibc(name, build, terms, target, knownMatches, checkForMismatch);
    upsertVendor(name, build, terms, target, knownMatches, checkForMismatch);
  }

  function upsertOs(
    name,
    build,
    terms,
    target,
    knownMatches,
    checkForMismatch,
  ) {
    if (knownMatches.android) {
      target.android = knownMatches.android;
    }

    if (!knownMatches.os) {
      return;
    }

    if (!target.os) {
      target.os = knownMatches.os;
      return;
    }

    let shouldMatch = target.os && checkForMismatch;
    if (!shouldMatch) {
      return;
    }

    if (knownMatches.os !== target.os) {
      let msg = `${name}: target detected wrong os for ${terms}`;
      let detail = `'${knownMatches.os}' != @'${target.os}'`;
      throw new Error(`${msg}: ${detail}`);
    }
  }

  function upsertArch(
    name,
    build,
    terms,
    target,
    knownMatches,
    checkForMismatch,
  ) {
    if (!knownMatches.arch) {
      return;
    }

    if (!target.arch) {
      target.arch = knownMatches.arch;
      return;
    }

    let shouldMatch = target.arch?.length && checkForMismatch;
    if (!shouldMatch) {
      return;
    }

    let arches = knownMatches.arches;
    if (!arches) {
      arches = [knownMatches.arch];
    }
    let isPossibleArch = arches.includes(target.arch);
    if (!isPossibleArch) {
      let msg = `${name}: target detected wrong arch for ${terms}: ${build.download}`;
      let detail = `${knownMatches.arch} != @'${target.arch}'`;
      throw new Error(`${msg}: ${detail}`);
    }
  }

  function upsertLibc(
    name,
    build,
    terms,
    target,
    knownMatches,
    checkForMismatch,
  ) {
    if (!knownMatches.libc) {
      return;
    }

    if (!target.libc) {
      target.libc = knownMatches.libc;
      return;
    }

    let shouldMatch = target.libc?.length && checkForMismatch;
    if (!shouldMatch) {
      return;
    }

    let libcs = knownMatches.libcs;
    if (!libcs) {
      libcs = [knownMatches.libc];
    }

    let isPossibleLibc = libcs.includes(target.libc);
    if (!isPossibleLibc) {
      let msg = `${name}: target detected wrong libc for ${terms}`;
      let detail = `${knownMatches.libc} != @'${target.libc}'`;
      throw new Error(`${msg}: ${detail}`);
    }
  }

  function upsertVendor(
    name,
    build,
    terms,
    target,
    knownMatches,
    checkForMismatch,
  ) {
    if (!knownMatches.vendor) {
      return;
    }

    if (!target.vendor) {
      target.vendor = knownMatches.vendor;
      return;
    }

    let shouldMatch = build.vendor && checkForMismatch;
    if (!shouldMatch) {
      return;
    }

    if (knownMatches.vendor !== target.vendor) {
      let msg = `${name}: target detected wrong vendor for ${terms}`;
      let detail = `'${knownMatches.vendor}' != @'${target.vendor}'`;
      throw new Error(`${msg}: ${detail}`);
    }
  }

  Triplet.buildToPackageType = function (build) {
    let filenames = [];
    if (build.name) {
      filenames.push(build.name);
    }
    if (build.download) {
      filenames.push(build.download);
    }

    let pkg = '';
    for (let filename of filenames) {
      pkg = Triplet.filenameToPackageType(filename);
      if (pkg) {
        break;
      }
    }

    return pkg;
  };

  /**
   * Determines the package type from the file name, accounting for ambiguous extensions.
   * @param {String} filename
   * @returns {String} - ex: '.zip', '.app.zip', '.tar.gz', '...'
   */
  Triplet.filenameToPackageType = function (filename) {
    let _filename = filename;
    let pkg = '';

    // find and remove the zip extension
    for (let ext of Triplet.TERMS_EXTS_ZIP) {
      if (_filename.endsWith(ext)) {
        _filename = _filename.slice(0, -ext.length);
        pkg = ext;
        break;
      }
    }

    // find the container extension
    for (let ext of Triplet.TERMS_EXTS_PKG) {
      if (_filename.endsWith(ext)) {
        _filename = _filename.slice(0, -ext.length);
        pkg = `${ext}${pkg}`;
        break;
      }
    }
    // twice because sometimes things are nested in silly ways
    // ex: goreleaser's .pkg.tar.gz for Arch
    for (let ext of Triplet.TERMS_EXTS_PKG) {
      if (_filename.endsWith(ext)) {
        _filename = _filename.slice(0, -ext.length);
        pkg = `${ext}${pkg}`;
        break;
      }
    }
    // thrice for sanity check!
    for (let ext of Triplet.TERMS_EXTS_PKG) {
      if (_filename.endsWith(ext)) {
        console.warn(`[Sanity Fail] max silliness of pkg type nesting:`);
        console.warn(`    ${filename}`);
        //_filename = _filename.slice(0, -ext.length);
        pkg = `${ext}${pkg}`;
        break;
      }
    }

    // ex:
    //   - '.zip'
    //   - '.app.zip'
    //   - '.tar.gz'
    //   - '.exe.xz'
    //   - '' (linux/bsd binary)
    return pkg;
  };

  // @ts-ignore
  window.Triplet = Triplet;
})(('object' === typeof window && window) || {}, Triplet);
if ('object' === typeof module) {
  module.exports = Triplet;
}
