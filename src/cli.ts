#!/usr/bin/env node

import * as fs from "fs";

import staticSiteGenerator from ".";

let watch = false;
if(process.argv[2] === "watch"){
  watch = true;
}

staticSiteGenerator.build();

if(watch){
  staticSiteGenerator.log.info("watching files for changes...");

  const changed = (event: any, file: string) => {
    try{
      staticSiteGenerator.build();
    }catch(err){
      staticSiteGenerator.log.error(err);
    }
  };

  fs.watch(staticSiteGenerator.options.srcDir, changed);
  staticSiteGenerator.recurseDirectory(staticSiteGenerator.options.srcDir, undefined, (dir) => {
    fs.watch(dir, changed);
  });
}
