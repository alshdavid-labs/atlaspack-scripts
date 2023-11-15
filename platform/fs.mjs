import * as fs from "node:fs";
import * as path from "node:path";

export function mkPath(/** @type {string} */ target) {
  let split = target.split("/");
  if (target.startsWith("/")) {
    return path.join("/", ...split);
  }
  return path.join(...split);
}

export function mkdir(/** @type {string} */ target) {
  return fs.mkdirSync(mkPath(/** @type {string} */ target), { recursive: true });
}

export function ls(/** @type {string} */ target) {
  return fs.readdirSync(mkPath(/** @type {string} */ target));
}

export function rm(/** @type {string} */ target) {
  return fs.rmSync(mkPath(/** @type {string} */ target), { recursive: true });
}

export function cat(/** @type {string} */ target) {
  return fs.readFileSync(mkPath(/** @type {string} */ target), "utf8");
}

export function json(/** @type {string} */ target) {
  return JSON.parse(cat(/** @type {string} */ target));
}

export function dirname(/** @type {string} */ target) {
  return path.dirname(mkPath(/** @type {string} */ target));
}

export function cp(/** @type {string} */ from, /** @type {string} */ to) {
  return fs.cpSync(mkPath(from), mkPath(to), { recursive: true });
}

export function mv(/** @type {string} */ from, /** @type {string} */ to) {
  fs.cpSync(mkPath(from), mkPath(to), { recursive: true });
  fs.rmSync(mkPath(from), { recursive: true });
}

export function ln(/** @type {string} */ from, /** @type {string} */ to) {
  fs.symlinkSync(mkPath(from), mkPath(to));
}

export function lnInner(/** @type {string} */ from, /** @type {string} */ to) {
  mkdir(to);
  for (const dirName of ls(from)) {
    ln(`${from}/${dirName}`, `${to}/${dirName}`);
  }
}

export function stat(/** @type {string} */ target) {
  return fs.statSync(mkPath(target));
}

export function exists(/** @type {string} */ target) {
  return fs.existsSync(mkPath(target));
}
