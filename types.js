let types = {};

/**
 * @typedef {""|"ANYOS"|"posix_2024"|"posix_2017"|"aix"|"android"|"darwin"|"dragonfly"|"freebsd"|"illumos"|"linux"|"netbsd"|"openbsd"|"plan9"|"solaris"|"sunos"|"wasi"|"windows"} OsString
 */

/**
 * @typedef {""|"ANYLIBC"|"none"|"bionic"|"gnu"|"libc"|"msvc"|"musl"} LibcString
 */

/**
 * @typedef {""|"ANYARCH"|"POSIX"|"aarch64"|"armel"|"armhf"|"armv6"|"armv7"|"armv7a"|"loong64"|"mips"|"mips64"|"mips64el"|"mips64r6"|"mips64r6el"|"mipsel"|"mipsr6"|"mipsr6el"|"ppc"|"ppc64"|"ppc64le"|"riscv64"|"s390x"|"wasm32"|"x86"|"x86_64"|"x86_64_v2"|"x86_64_v3"|"x86_64_v4"|"x86_64_rocm"} ArchString
 */

/**
 * @typedef {""|"ANYVENDOR"|"apple"|"pc"|"unknown"} VendorString
 */

/**
 * @typedef TargetMatcher
 * @prop {OsString} [os]
 * @prop {VendorString} [vendor]
 * @prop {ArchString} [arch]
 * @prop {Array<ArchString>} [arches]
 * @prop {LibcString} [libc]
 * @prop {Array<LibcString>} [libcs]
 * @prop {Boolean} [android]
 */

/**
 * @typedef ErrorDetails
 * @prop {String} message
 * @prop {String} os
 * @prop {String} arch
 * @prop {String} libc
 * @prop {String} vendor
 * @prop {Array<String>} terms
 */

/**
 * @typedef TargetTriplet
 * @prop {OsString} os
 * @prop {ArchString} arch
 * @prop {LibcString} libc
 * @prop {VendorString} [vendor]
 * @prop {Array<String>} [unknownTerms]
 * @prop {Array<LibcString>} [libcs]
 * @prop {Array<ErrorDetails>} [errors]
 * @prop {Boolean} [android] - for intermediary representation
 */

export let _types = types;
export default types;
