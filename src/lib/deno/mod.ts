import {ILib} from "../lib.ts";

import utils from "./utils.ts";
import fs from "./fs.ts";
import path from "./path.ts";
import wss from "./wss.ts";
import yaml from "./yaml.ts";
import htmlMinifier from "./htmlMinifier.ts";

export default {
  utils,
  fs,
  path,
  wss,
  yaml,
  htmlMinifier
} as ILib;
