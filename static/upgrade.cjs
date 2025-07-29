"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("node:path"));
const fs = __importStar(require("node:fs/promises"));
async function main(args) {
  const command = parse(args);
  const tag = typeof command.tag === "string" ? command.tag : "latest";
  const cwd = toAbsolute(command["cwd"], process.cwd());
  console.error(`Tag: ${tag}`);
  console.error(`Cwd: ${cwd}`);
  console.error(`Paths: (${argToArray(command.path).length})`);
  for (const p of argToArray(command.path)) {
    console.error(`. ${p}`);
  }
  console.error(`Patterns: (${argToArray(command.pattern).length})`);
  for (const p of argToArray(command.pattern)) {
    console.error(`. ${p}`);
  }
  console.error(
    `PatternsExclude: (${argToArray(command["pattern-exclude"]).length})`
  );
  for (const p of argToArray(command["pattern-exclude"])) {
    console.error(`. ${p}`);
  }
  console.error("Scanning...");
  const pkgs = Array.from(
    new Set([
      ...(await resolvePackages(argToArray(command.path), cwd)),
      ...(await resolveGlobs(
        argToArray(command.pattern),
        argToArray(command["pattern-exclude"]),
        cwd
      )),
    ])
  );
  pkgs.sort();
  console.error(`Resolved: (${pkgs.length})`);
  for (const p of pkgs) {
    console.error(`${p}`);
  }
  if (!pkgs.length) {
    console.error("No packages supplied");
    return 1;
  }
  console.error("Upgrading...");
  const packages = {};
  const targetPackagesPending = {};
  for (const pkg of pkgs) {
    const pkgPath = path.join(cwd, pkg);
    const pkgString = await fs.readFile(pkgPath, "utf8");
    const pkgJson = JSON.parse(pkgString);
    packages[pkgPath] = pkgString;
    const dependencies = {
      ...(pkgJson.resolutions || {}),
      ...(pkgJson.dependencies || {}),
      ...(pkgJson.devDependencies || {}),
      ...(pkgJson.optionalDependencies || {}),
    };
    for (const [key, _version] of Object.entries(dependencies)) {
      if (key.startsWith("@atlaspack/") || key === "atlaspack") {
        targetPackagesPending[key] = null;
      }
    }
  }
  for (const [key, version] of Object.entries(targetPackagesPending)) {
    if (version != null) continue;
    targetPackagesPending[key] = getVersionInfo(key, tag);
  }
  await Promise.all(Object.values(targetPackagesPending));
  const targetPackages = {};
  for (const [key, version] of Object.entries(targetPackagesPending)) {
    if (version == null) continue;
    targetPackages[key] = await version;
  }
  const toUpgrade = Object.entries(targetPackages);
  toUpgrade.sort((a, b) => a[0].localeCompare(b[0]));
  const largest = Math.max(...toUpgrade.map((a) => a[0].length));
  console.error(`Upgrading: (${toUpgrade.length})`);
  for (const [k, v] of toUpgrade) {
    console.error(`${k.padEnd(largest)} -> ${v}`);
  }
  const updated = new Set();
  for (const [key, version] of Object.entries(targetPackages)) {
    const reKey = key.replaceAll("/", "\\/");
    for (const [packagePath, jsonString] of Object.entries(packages)) {
      // Updates a key in place without affecting JSON formatting
      const update = jsonString.replace(
        new RegExp(`"${reKey}"(.*):(.*)"[^(root:\\*)](.*)"`, "g"),
        `"${key}"$1:$2"${version}"`
      );
      if (packages[packagePath] !== update) {
        updated.add(packagePath);
        packages[packagePath] = update;
      }
    }
  }
  console.error(`Updated: (${updated.size})`);
  for (const v of updated.values()) {
    console.log(`${v}`);
  }
  for (const [pkgPath, json] of Object.entries(packages)) {
    await fs.writeFile(pkgPath, json, "utf8");
  }
  return 0;
}
main(process.argv)
  .then((status) => process.exit(status))
  .catch((error) => {
    process.stderr.write(`${error}`);
    process.exit(1);
  });
async function getVersionInfo(pkgName, tag = "latest") {
  const response = await globalThis.fetch(
    `https://registry.npmjs.org/${pkgName}/${tag}`
  );
  if (!response.ok) {
    console.log(response.status)
    console.log(response.statusText)
    console.log(await response.text())
    throw new Error(`Failed to fetch: ${pkgName}`);
  }
  const body = await response.json();
  return body.version;
}
async function resolvePackages(inputs, cwd) {
  const pkgs = [];
  for (const pkg of inputs.map((v) => toAbsolute(v, cwd))) {
    if (path.basename(pkg) !== "package.json") {
      pkgs.push(path.join(pkg, "package.json"));
    }
    pkgs.push(pkg);
  }
  return pkgs;
}
async function resolveGlobs(inputs, exclude = [], cwd = process.cwd()) {
  const pkgs = [];
  for (const [i, pkg] of inputs.entries()) {
    for await (const found of fs.glob(pkg, {
      cwd,
      exclude: [
        'node_modules',
        '**/node_modules/**',
        '**/.git/**',
        '.git',
        ...exclude,
      ],
    })) {
      pkgs.push(found);
    }
  }
  return pkgs;
}
function argToArray(inputs) {
  const pkgsBase = [];
  if (typeof inputs === "string") {
    pkgsBase.push(inputs);
  } else if (Array.isArray(inputs)) {
    pkgsBase.push(...inputs);
  } else {
    return [];
  }
  return pkgsBase;
}
function toAbsolute(input, cwd) {
  if (!input) {
    return cwd;
  }
  return path.isAbsolute(input) ? input : path.normalize(path.join(cwd, input));
}
// Inlining this to make the script portable
function parse(args, opts = {}) {
  function hasKey(obj, keys) {
    var o = obj;
    keys.slice(0, -1).forEach(function (key) {
      o = o[key] || {};
    });
    var key = keys[keys.length - 1];
    return key in o;
  }
  function isNumber(x) {
    if (typeof x === "number") {
      return true;
    }
    if (/^0x[0-9a-f]+$/i.test(x)) {
      return true;
    }
    return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
  }
  function isConstructorOrProto(obj, key) {
    return (
      (key === "constructor" && typeof obj[key] === "function") ||
      key === "__proto__"
    );
  }
  return (function parse(args, opts = {}) {
    var flags = {
      bools: {},
      strings: {},
      unknownFn: null,
      allBools: false,
    };
    if (typeof opts.unknown === "function") {
      flags.unknownFn = opts.unknown;
    }
    if (typeof opts.boolean === "boolean" && opts.boolean) {
      flags.allBools = true;
    } else {
      []
        .concat(opts.boolean)
        .filter(Boolean)
        .forEach(function (key) {
          flags.bools[key] = true;
        });
    }
    var aliases = {};
    function isBooleanKey(key) {
      if (flags.bools[key]) {
        return true;
      }
      if (!aliases[key]) {
        return false;
      }
      return aliases[key].some(function (x) {
        return flags.bools[x];
      });
    }
    Object.keys(opts.alias || {}).forEach(function (key) {
      aliases[key] = [].concat(opts.alias[key]);
      aliases[key].forEach(function (x) {
        aliases[x] = [key].concat(
          aliases[key].filter(function (y) {
            return x !== y;
          })
        );
      });
    });
    []
      .concat(opts.string)
      .filter(Boolean)
      .forEach(function (key) {
        flags.strings[key] = true;
        if (aliases[key]) {
          [].concat(aliases[key]).forEach(function (k) {
            flags.strings[k] = true;
          });
        }
      });
    var defaults = opts.default || {};
    var argv = { _: [] };
    function argDefined(key, arg) {
      return (
        (flags.allBools && /^--[^=]+$/.test(arg)) ||
        flags.strings[key] ||
        flags.bools[key] ||
        aliases[key]
      );
    }
    function setKey(obj, keys, value) {
      var o = obj;
      for (var i = 0; i < keys.length - 1; i++) {
        var key = keys[i];
        if (isConstructorOrProto(o, key)) {
          return;
        }
        if (o[key] === undefined) {
          o[key] = {};
        }
        if (
          o[key] === Object.prototype ||
          o[key] === Number.prototype ||
          o[key] === String.prototype
        ) {
          o[key] = {};
        }
        if (o[key] === Array.prototype) {
          o[key] = [];
        }
        o = o[key];
      }
      var lastKey = keys[keys.length - 1];
      if (isConstructorOrProto(o, lastKey)) {
        return;
      }
      if (
        o === Object.prototype ||
        o === Number.prototype ||
        o === String.prototype
      ) {
        o = {};
      }
      if (o === Array.prototype) {
        o = [];
      }
      if (
        o[lastKey] === undefined ||
        isBooleanKey(lastKey) ||
        typeof o[lastKey] === "boolean"
      ) {
        o[lastKey] = value;
      } else if (Array.isArray(o[lastKey])) {
        o[lastKey].push(value);
      } else {
        o[lastKey] = [o[lastKey], value];
      }
    }
    function setArg(key, val, arg) {
      if (arg && flags.unknownFn && !argDefined(key, arg)) {
        if (flags.unknownFn(arg) === false) {
          return;
        }
      }
      var value = !flags.strings[key] && isNumber(val) ? Number(val) : val;
      setKey(argv, key.split("."), value);
      (aliases[key] || []).forEach(function (x) {
        setKey(argv, x.split("."), value);
      });
    }
    // Set booleans to false by default.
    Object.keys(flags.bools).forEach(function (key) {
      setArg(key, false);
    });
    // Set booleans to user defined default if supplied.
    Object.keys(defaults)
      .filter(isBooleanKey)
      .forEach(function (key) {
        setArg(key, defaults[key]);
      });
    var notFlags = [];
    if (args.indexOf("--") !== -1) {
      notFlags = args.slice(args.indexOf("--") + 1);
      args = args.slice(0, args.indexOf("--"));
    }
    for (var i = 0; i < args.length; i++) {
      var arg = args[i];
      var key;
      var next;
      if (/^--.+=/.test(arg)) {
        // Using [\s\S] instead of . because js doesn't support the
        // 'dotall' regex modifier. See:
        // http://stackoverflow.com/a/1068308/13216
        var m = arg.match(/^--([^=]+)=([\s\S]*)$/);
        key = m[1];
        var value = m[2];
        if (isBooleanKey(key)) {
          value = value !== "false";
        }
        setArg(key, value, arg);
      } else if (/^--no-.+/.test(arg)) {
        key = arg.match(/^--no-(.+)/)[1];
        setArg(key, false, arg);
      } else if (/^--.+/.test(arg)) {
        key = arg.match(/^--(.+)/)[1];
        next = args[i + 1];
        if (
          next !== undefined &&
          !/^(-|--)[^-]/.test(next) &&
          !isBooleanKey(key) &&
          !flags.allBools
        ) {
          setArg(key, next, arg);
          i += 1;
        } else if (/^(true|false)$/.test(next)) {
          setArg(key, next === "true", arg);
          i += 1;
        } else {
          setArg(key, flags.strings[key] ? "" : true, arg);
        }
      } else if (/^-[^-]+/.test(arg)) {
        var letters = arg.slice(1, -1).split("");
        var broken = false;
        for (var j = 0; j < letters.length; j++) {
          next = arg.slice(j + 2);
          if (next === "-") {
            setArg(letters[j], next, arg);
            continue;
          }
          if (/[A-Za-z]/.test(letters[j]) && next[0] === "=") {
            setArg(letters[j], next.slice(1), arg);
            broken = true;
            break;
          }
          if (
            /[A-Za-z]/.test(letters[j]) &&
            /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)
          ) {
            setArg(letters[j], next, arg);
            broken = true;
            break;
          }
          if (letters[j + 1] && letters[j + 1].match(/\W/)) {
            setArg(letters[j], arg.slice(j + 2), arg);
            broken = true;
            break;
          } else {
            setArg(letters[j], flags.strings[letters[j]] ? "" : true, arg);
          }
        }
        key = arg.slice(-1)[0];
        if (!broken && key !== "-") {
          if (
            args[i + 1] &&
            !/^(-|--)[^-]/.test(args[i + 1]) &&
            !isBooleanKey(key)
          ) {
            setArg(key, args[i + 1], arg);
            i += 1;
          } else if (args[i + 1] && /^(true|false)$/.test(args[i + 1])) {
            setArg(key, args[i + 1] === "true", arg);
            i += 1;
          } else {
            setArg(key, flags.strings[key] ? "" : true, arg);
          }
        }
      } else {
        if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
          argv._.push(flags.strings._ || !isNumber(arg) ? arg : Number(arg));
        }
        if (opts.stopEarly) {
          argv._.push.apply(argv._, args.slice(i + 1));
          break;
        }
      }
    }
    Object.keys(defaults).forEach(function (k) {
      if (!hasKey(argv, k.split("."))) {
        setKey(argv, k.split("."), defaults[k]);
        (aliases[k] || []).forEach(function (x) {
          setKey(argv, x.split("."), defaults[k]);
        });
      }
    });
    if (opts["--"]) {
      argv["--"] = notFlags.slice();
    } else {
      notFlags.forEach(function (k) {
        argv._.push(k);
      });
    }
    return argv;
  })(args, opts);
}
