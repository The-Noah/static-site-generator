import {IPath} from "../lib.ts";

import {join, parse, resolve} from "https://deno.land/std@0.79.0/path/mod.ts";

export default {
  join,
  parse,
  resolve,
  cwd: (): string => Deno.cwd()
} as IPath;
