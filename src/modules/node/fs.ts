import * as _fs from "fs";

import * as utils from "./utils";

/**
 * Reads file in as string
 * @param filePath Path of file to read
 */
export const readTextFileSync = (filePath: string): string => _fs.readFileSync(filePath, "utf8");

/**
 * Writes `text` to a file as a string
 * @param path Path of file to write
 * @param text String to write
 */
export const writeTextFileSync = (path: string, text: string): void => _fs.writeFileSync(path, text);

/**
 * Creates directory at `path`
 * @param path Path to directory to create
 */
export const mkdirSync = (path: string): void => _fs.mkdirSync(path);

/**
 * Checks if the specified path exists
 * @param filePath Path to check
 */
export const existsSync = (filePath: string): boolean => _fs.existsSync(filePath);

/**
 * Get all items in directory
 * @param dir Path to directory
 */
export const readdirSync = (dir: string): string[] => _fs.readdirSync(dir);

/**
 * Check if path is a directory
 * @param path Path to check
 */
export const isDirectory = (path: string): boolean => _fs.lstatSync(path).isDirectory();

/**
 * Copies file from `from` to `to`
 * @param from Path of file to copy
 * @param to Destination path
 */
export const copyFileSync = (from: string, to: string): void => _fs.copyFileSync(from, to);

/**
 * Watches `path` and all subdirectories, and calls `callback` on any event
 * @param path Path to watch
 * @param callback Callback on event
 */
export const watch = (path: string, callback: () => void): void => {
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
};
