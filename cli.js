#!/usr/bin/env node
const staticSiteGenerator = require("./app");

let watch = false;
if(process.argv[2] === "watch"){
  watch = true;
}

staticSiteGenerator();

if(watch){
  log.info("watching files for changes...");

  const changed = (event, file) => {
    try{
      staticSiteGenerator();
    }catch(err){
      log.error(err);
    }
  };

  fs.watch(srcDir, changed);
  recurseDirectory(srcDir, undefined, (dir) => {
    fs.watch(dir, changed);
  });
}
