import {IPath} from "../lib.js";

import {join, parse, resolve} from "path";

export default {
  join,
  parse,
  resolve,
  cwd: (): string => process.cwd()
} as IPath;
