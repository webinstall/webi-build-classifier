# Webi's Host & Asset Target Triplet Classifier

Determine Host Target Triplet (Arch, Libc, OS, Vendor) from a filenames /
download URL and uname / User-Agent strings.

Also compares versions lexicographically.

```json
{
  "arch": "aarch64",
  "os": "linux",
  "libc": "none",
  "vendor": "unknown"
}
```

## Table of Contents

- All Targets
- Host to Target (`uname` to triplet)
- Lexicographical Versions
- Build to Target (_filename_ to triplet)

## All Target Options

```json
{
  "arches": [
    "",
    "ANYARCH",
    "POSIX",
    "aarch64",
    "armel",
    "armhf",
    "armv6",
    "armv7",
    "armv7a",
    "loong64",
    "mips",
    "mips64",
    "mips64el",
    "mips64r6",
    "mips64r6el",
    "mipsel",
    "mipsr6",
    "mipsr6el",
    "ppc",
    "ppc64",
    "ppc64le",
    "riscv64",
    "s390x",
    "wasm32",
    "x86",
    "x86_64",
    "x86_64_v2",
    "x86_64_v3"
  ],
  "oses": [
    "",
    "ANYOS",
    "posix_2017",
    "aix",
    "android",
    "darwin",
    "dragonfly",
    "freebsd",
    "illumos",
    "linux",
    "netbsd",
    "openbsd",
    "plan9",
    "solaris",
    "sunos",
    "wasi",
    "windows"
  ],
  "libcs": ["", "ANYLIBC", "none", "bionic", "gnu", "libc", "msvc", "musl"],
  "vendors": ["", "ANYVENDOR", "apple", "pc", "unknown"]
}
```

## `require('./build_classifier/host-targets.js')`

```text
HostTargets.termsToTarget(target, terms)
// Example:
// { arch: 'x86_64', os: 'linux', libc: 'musl' }
```

**Don't rely on these** as part of the API, but they're available to inspect.

(they're used for matching _uname_ and _User-Agent_ values to target triplets)

```text
HostTargets.WATERFALL // { darwin: { aarch64: ['aarch64', 'x86_64'] } }
HostTargets.TERMS     // { amd64: { arch: 'x86_64' } }
```

## `require('./build_classifier/lexver.js')`

Turns versions in just about any format into a Lexicographically Sorted version.

```text
Lexver.matchSorted(versions, prefix)  // v1 => v0001 matches v0001.0000.0000@
Lexver.toTags(lexvers)                // sorts and calls sortedToTags
Lexver.sortedToTags(descLexvers)      // gets { latest, stable, default }
Lexver.parseVersion(fullVersion)      // 'v1-beta1' => 'v0001.0000.0000-beta-0001'
Lexver.parsePrefix(version)           // v1 => v0001
```

## `require('./build_classifier/triplet.js')`

Turns a filename or URL, along with project and release info, into a target
triplet.

```text
Triplet.maybeInstallable(proj, build);    // exclude non-build assets
Triplet.toPattern(proj, build);           // foo-1.0.0-mac64 => {NAME}-{VER}-mac64
Triplet.patternToTerms(filename);         // {NAME}-mac-x86.64 => [ 'mac', 'x86_64' ]
Triplet.termsToTarget(
    target, proj, build, terms            // => 'x86_64_v2-pc-windows-msvc'
);
Triplet.buildToPackageType(build);        // uses 'build.name' or 'build.download'
Triplet.filenameToPackageType(filename);  // ex: '.zip', '.app.zip', '.tar.gz', ''
```

**Don't rely on these** as part of the API, but they're available to inspect.

(they're used for excluding and classifying release assets)

```text
Triplet.TERMS_CHANNEL              // [ 'master', 'nightly', '...' ]
Triplet.TERMS_CHECKSUM             // [ 'MD5SUMS', 'SHA1SUMS', '...' ]
Triplet.TERMS_EXTS_NON_BUILD       // [ '.asc', '.json', '.sha1', '...' ]
Triplet.TERMS_EXTS_NON_INFORMATIVE // [ '.gz', '.zip', '...', '.tar' ]
Triplet.TERMS_EXTS_PKG             // [ '.exe', '.tar', '.dmg', '...' ]
Triplet.TERMS_EXTS_SOURCE          // [ '.zip', '.tar.gz', '...' ]
Triplet.TERMS_EXTS_ZIP             // [ '.gz', '.xz', '.zip', '...' ]
Triplet.TERMS_NON_BUILD            // [ 'debug', 'src', 'vendor', '...' ]
Triplet.TERMS_PRIMARY_MAP          // { 'APPLE_AARCH64': { /* ... */ } }
Triplet.TERMS_TIERED_MAPS          // [ { 'gnu': { os: 'windows' } ]
```
