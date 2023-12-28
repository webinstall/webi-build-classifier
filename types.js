'use strict';

module.exports._types = true;

/**
 * @typedef {""|"ANYOS"|"posix_2017"|"aix"|"android"|"darwin"|"dragonfly"|"freebsd"|"illumos"|"linux"|"netbsd"|"openbsd"|"plan9"|"solaris"|"sunos"|"wasi"|"windows"} OsString
 */

/**
 * @typedef {""|"ANYLIBC"|"none"|"bionic"|"gnu"|"libc"|"msvc"|"musl"} LibcString
 */

/**
 * @typedef {""|"ANYARCH"|"POSIX"|"aarch64"|"armel"|"armhf"|"armv6"|"armv7"|"armv7a"|"loong64"|"mips"|"mips64"|"mips64el"|"mips64r6"|"mips64r6el"|"mipsel"|"mipsr6"|"mipsr6el"|"ppc"|"ppc64"|"ppc64le"|"riscv64"|"s390x"|"wasm32"|"x86"|"x86_64"|"x86_64_v2"|"x86_64_v3"} ArchString
 */

/**
 * @typedef {""|"ANYVENDOR"|"apple"|"pc"|"unknown"} VendorString
 */

/**
 * @typedef TargetTriplet
 * @prop {OsString} os
 * @prop {ArchString} arch
 * @prop {LibcString} libc
 * @prop {VendorString} [vendor]
 * @prop {Boolean} [android] - for intermediary representation
 */
