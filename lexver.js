'use strict';

var Lexver = module.exports;

// hotfix is post-stable
let channels = ['alpha', 'beta', 'dev', 'pre', 'preview', 'rc', 'hotfix'];
let channelsRePre;
let channelsRePost;
{
  let channelsOr = channels.join('|');
  channelsRePre = new RegExp(`(\\d)[\\.\\-\\+]?(${channelsOr})`);
  channelsRePost = new RegExp(`(${channelsOr})([\\.\\-\\+]?)(\\d+)`);
}
let channelsPrePlacer = '$1-$2';
let channelsPostPlacer = function (_, chan, sep, ver) {
  ver = ver.padStart(2, '0');

  let channelVersion = `${chan}${sep}${ver}`;
  return channelVersion;
};
let digitsOnlyRe = /^\d+$/;

// this is a special case, but if it gets complicated in the future, we'll drop it
// and just treat it like a build hash and open an issue for to the maintainer
let channelsReB = /(\.\d+b)(\d+)$/;
let channelsBPlacer = function (_, sep, ver) {
  ver = ver.padStart(2, '0');
  let rel = `${sep}${ver}`;

  return rel;
};

// these must be chosen to sort lexicographically
var sortSuffixPre = '-'; // or #, !
var sortSuffixStable = '@'; // or *, @
var sortSuffixBuild = '@'; // or +, ~
var buildSuffixRe = new RegExp(`\\${sortSuffixPre}?\\${sortSuffixBuild}`);
var stableSuffixRe = new RegExp(`\\${sortSuffixPre}?\\${sortSuffixStable}`);
let stablePrefixRe = new RegExp(
  `^\\d+\\.\\d+\\.\\d+\\.\\d+\\${sortSuffixStable}`,
);

/**
 * Get the most useful recent version tags from unsorted lexical versions
 * @param {Array<String>} lexvers - sorted from greatest to least
 */
Lexver.toTags = function (lexvers) {
  lexvers.sort();
  lexvers.reverse();

  return Lexver.sortedToTags(lexvers);
};

/**
 * Get the most useful recent version tags from presorted lexical versions
 * @param {Array<String>} descVersions - sorted from greatest to least
 */
Lexver.sortedToTags = function (descVersions) {
  let stable;
  for (let version of descVersions) {
    // ex: '0001.0000.0000.0000+'
    if (stablePrefixRe.test(version)) {
      stable = version;
      break;
    }
  }

  return {
    latest: descVersions[0],
    stable: stable,
    default: stable || descVersions[0],
  };
};

/**
 * Parse a semver or non-standard version and return a lexical version
 * Ex: 1.2beta-3 =>  0001.0002.0000.0000-beta-03
 * @param {String} version - a semver or other version
 * @param {Object} _opts - no public options
 * @param {Boolean} _opts._asPrefix - don't expand 1.0 to 1.0.0, etc
 * @returns {String}
 */
Lexver.parseVersion = function (fullVersion, _opts) {
  if (fullVersion.startsWith('v')) {
    fullVersion = fullVersion.slice(1);
  }

  // 1.0-beta-3 =>  1.0, beta, 3
  // 1.2beta1 => 1.2beta1
  let rels = fullVersion.split('-');

  let version = rels.shift();
  if (version.includes('+')) {
    let parts = version.split('+');
    version = parts.shift();
    let build = parts.join(`${sortSuffixBuild}`);
    rels.unshift(`${sortSuffixBuild}${build}`);
  }

  // 1.2beta1 => 1.2-beta1
  version = version.replace(channelsRePre, channelsPrePlacer);
  // special case of 'b' for 'beta'
  // 1.2b1 => 1.2-b1
  version = version.replace(channelsReB, channelsBPlacer);

  // 1.2-beta1-a => 1.2, beta1, a
  let subparts = version.split('-');
  version = subparts.shift();

  // beta1, a => beta1-a
  let subrel = subparts.join();
  if (subrel) {
    rels.unshift(subrel);
  }

  // 1.0.xxxx => 1, 0, xxxx
  let levels = version.split('.');
  let digits = [];
  for (; levels.length; ) {
    let level = levels.shift();
    if (!digitsOnlyRe.test(level)) {
      levels.unshift(level);
      break;
    }
    digits.push(level);
  }

  // 1, 0 => 1, 0, 0, 0
  if (!_opts?._asPrefix) {
    for (; digits.length < 4; ) {
      digits.push('0');
    }
  }
  // 1, 0, 0, 0 => 0001, 0000, 0000, 0000
  for (let i = 0; i < digits.length; i += 1) {
    digits[i] = digits[i].padStart(4, '0');
  }
  // 0001, 0000, 0000, 0000 => 0001.0000.0000.0000
  version = digits.join('.');

  let level = levels.join('.');
  if (level) {
    rels.unshift(level);
  }

  for (let i = 0; i < rels.length; i += 1) {
    // 1.2-beta1 => 1.2-beta01
    rels[i] = rels[i].replace(channelsRePost, channelsPostPlacer);
    rels[i] = rels[i].replace(/\b(\d+)\b/g, function (_, ver) {
      ver = ver.padStart(2, '0');
      return ver;
    });
  }
  if (!rels.length) {
    // stable
    if (!_opts?._asPrefix) {
      rels.push(sortSuffixStable);
    }
  }

  let rel = rels.join('-');
  if (rel) {
    version = `${version}${sortSuffixPre}${rel}`;
  }
  version = version.replace(
    `${sortSuffixPre}hotfix`,
    `${sortSuffixBuild}hotfix`,
  );
  version = version.replace(buildSuffixRe, sortSuffixBuild);
  version = version.replace(stableSuffixRe, sortSuffixStable);

  return version;
};

/**
 * Parse a version prefix into a lexical prefix
 * Ex: v1.3 => 0001.0003
 * @param {String} version
 * @returns {String}
 */
Lexver.parsePrefix = function (version) {
  return Lexver.parseVersion(version, { _asPrefix: true });
};

/**
 * Match a lexical prefix to the most useful available lexical versions
 * Ex: use '0001.0003' to find previous, stable, default, beta, and next
 * @param {Array<String>} versions - sorted lexical versions
 * @param {String} prefix - the string to match
 * @returns {String}
 */
Lexver.matchSorted = function (versions, prefix) {
  let matches = [];
  let prev;
  let prevStep;
  let latest;
  let defacto;
  let stable;
  let nextStep;
  let next;
  let hasMatched;

  for (let version of versions) {
    let isMatch = version.startsWith(prefix);
    if (!isMatch) {
      if (hasMatched) {
        prev = version;
        break;
      }
      next = version;
      continue;
    }

    matches.push(version);

    if (!latest) {
      latest = version;
      hasMatched = true;
    }

    if (stable) {
      if (!prevStep) {
        prevStep = version;
      }
      continue;
    } else {
      let isStable = stablePrefixRe.test(version);
      if (isStable) {
        stable = version;
      } else {
        nextStep = version;
      }
    }
  }

  defacto = stable || latest;

  let matchInfo = {
    default: defacto,
    matches: matches,
    previous: prev,
    previousStep: prevStep,
    stable: stable,
    nextStep: nextStep,
    latest: latest,
    next: next,
  };
  return matchInfo;
};
