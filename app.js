#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const sass = require("node-sass");
const htmlMinify = require("html-minifier").minify;
const terser = require("terser");

const srcDir = path.join(process.cwd(), "src");
const buildDir = path.join(process.cwd(), "build");
const staticDir = path.join(srcDir, "static");
const stylePath = path.join(srcDir, "style.scss");
const jsPath = path.join(srcDir, "app.js");

let watch = false;
if(process.argv[2] === "watch"){
  watch = true;
}

const RESET = "\x1b[0m";
const log = {
  info: (message) => console.log(`[\x1b[36mi${RESET}]`, message),
  success: (message) => console.log(`[\x1b[32m+${RESET}]`, message),
  error: (message) => console.error(`[\x1b[31m-${RESET}]`, message),
  warning: (message) => console.log(`[\x1b[33m!${RESET}]`, message)
}

const deleteFolder = (dir) => {
  fs.readdirSync(dir).forEach((file) => {
    const currentPath = path.join(dir, file);

    if(fs.lstatSync(currentPath).isDirectory()){
      deleteFolder(currentPath);
    }else{
      fs.unlinkSync(currentPath);
    }
  });

  fs.rmdirSync(dir);
};

const copyFolder = (source, target) => {
  if(!fs.existsSync(target)){
    fs.mkdirSync(target);
  }

  fs.readdirSync(source).forEach((file) => {
    const currentSource = path.join(source, file);
    const currentTarget = path.join(target, file);

    if(fs.lstatSync(currentSource).isDirectory()){
      copyFolder(currentSource, currentTarget);
    }else{
      fs.copyFileSync(currentSource, currentTarget);
      log.success(`copied ${path.parse(file).base}`);
    }
  });
};

const build = () => {
  log.info(`building ${path.parse(process.cwd()).base}...`);

  if(fs.existsSync(buildDir)){
    deleteFolder(buildDir);
  }
  fs.mkdirSync(buildDir);

  if(fs.existsSync(staticDir)){
    log.info("copying static files...");
    copyFolder(staticDir, buildDir);
  }

  const data = {};

  fs.readdirSync(srcDir).forEach((fileName) => {
    const filePath = path.join(srcDir, fileName);
    const file = path.parse(filePath);

    if(file.ext === ".json"){
      data[file.name] = JSON.parse(fs.readFileSync(filePath, "utf8"));
      log.success(`parsed ${file.base}`);
    }
  });

  if(fs.existsSync(stylePath)){
    data.css = (sass.renderSync({
      file: stylePath,
      outputStyle: "compressed"
    })).css.toString();

    log.success("compiled stylesheet");
  }else{
    log.warning("no src/style.scss - this is NOT an error!");
  }

  if(fs.existsSync(jsPath)){
    data.js = terser.minify(fs.readFileSync(jsPath, "utf8")).code;

    log.success("compressed javascript");
  }else{
    log.warning("no src/app.js - this is NOT an error!");
  }

  ejs.renderFile(path.join(srcDir, "index.ejs"), data, (err, html) => {
    if(err){
      return log.error(err);
    }

    fs.writeFileSync(path.join(buildDir, "index.html"), htmlMinify(html, {
      html5: true,
      // collapseInlineTagWhitespace: true,
      minifyCSS: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeTagWhitespace: true,
      collapseWhitespace: true
    }));
  });

  log.info("done!");
};

if(watch){
  log.info("watching files for changes...");
  build();

  fs.watch(srcDir, (event, file) => {
    try{
      build();
    }catch(err){
      log.error(err);
    }
  });
}else{
  build();
}
