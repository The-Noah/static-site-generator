import lib from "./src/lib/deno/mod.ts";
import {StaticSiteGenerator} from "./dist/core.js";
import {cli} from "./dist/cli.js";

export const staticSiteGenerator = new StaticSiteGenerator(lib);

if(import.meta.main){
  cli(staticSiteGenerator);
}
