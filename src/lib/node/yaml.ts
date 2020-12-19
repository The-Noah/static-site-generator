import * as fs from "fs";

import * as yaml from "js-yaml";

export default (file: string): any => yaml.load(fs.readFileSync(file, "utf8"), {json: true});
