import {IFS} from "../lib.js";

import * as _fs from "fs";

import utils from "./utils.js";


const readTextFileSync = (filePath: string): string => _fs.readFileSync(filePath, "utf8");

const writeTextFileSync = (path: string, text: string): void => _fs.writeFileSync(path, text);

const mkdirSync = (path: string): void => _fs.mkdirSync(path);

const existsSync = (filePath: string): boolean => _fs.existsSync(filePath);

const readdirSync = (dir: string): string[] => _fs.readdirSync(dir);

const isDirectory = (path: string): boolean => _fs.lstatSync(path).isDirectory();

const copyFileSync = (from: string, to: string): void => _fs.copyFileSync(from, to);

const watch = async (path: string, callback: () => void): Promise<void> => {
  _fs.watch(path, callback);
  utils.recurseDirectory(path, undefined, (dir) => {
    _fs.watch(dir, callback);
  });
};

export default {
  readTextFileSync,
  writeTextFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  isDirectory,
  copyFileSync,
  watch
} as IFS;
