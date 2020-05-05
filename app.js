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

let watch = false;
if(process.argv[2] === "watch"){
  watch = true;
}

const RESET = "\x1b[0m";
const log = {
  info: (message) => console.log(`[\x1b[36mi${RESET}]`, message),
  success: (message) => console.log(`[\x1b[32m+${RESET}]`, message),
  error: (message) => console.error(`[\x1b[31m-${RESET}]`, message),
  warn: (message) => console.log(`[\x1b[33m!${RESET}]`, message)
};

const recurseDirectory = (dir, fileCallback, directoryCallback) => {
  fs.readdirSync(dir).forEach((file) => {
    const currentPath = path.join(dir, file);

    if(fs.lstatSync(currentPath).isDirectory()){
      if(directoryCallback){
        directoryCallback(currentPath);
      }

      recurseDirectory(currentPath, fileCallback, directoryCallback);
    }else if(fileCallback){
      fileCallback(currentPath);
    }
  });
};

const deleteDirectory = (dir) => {
  const dirsToRemove = [];

  recurseDirectory(dir, (file) => {
    fs.unlinkSync(file);
  }, (dir) => {
    dirsToRemove.push(dir);
  });

  for(const dirToRemove of dirsToRemove){
    fs.rmdirSync(dirToRemove);
  }

  fs.rmdirSync(dir);
};

const copyDirectory = (source, target) => {
  if(!fs.existsSync(target)){
    fs.mkdirSync(target);
  }

  recurseDirectory(source, (file) => {
    fs.copyFileSync(file, path.join(target, file.split(source)[1]));
    log.success(`copied ${path.parse(file).base}`);
  }, (dir) => {
    const newDir = path.join(target, dir.split(source)[1]);

    if(!fs.existsSync(newDir)){
      fs.mkdirSync(newDir);
    }
  });
};

const build = () => {
  log.info(`building ${path.parse(process.cwd()).base}...`);

  if(!fs.existsSync(srcDir)){
    return log.error("no src in current directory");
  }

  if(!fs.existsSync(path.join(srcDir, "index.ejs"))){
    log.warn("no index.ejs in src directory - this is NOT an error!");
  }

  if(fs.existsSync(buildDir)){
    deleteDirectory(buildDir);
  }
  fs.mkdirSync(buildDir);

  if(fs.existsSync(staticDir)){
    log.info("copying static files...");
    copyDirectory(staticDir, buildDir);
  }

  const data = {
    css: {},
    js: {}
  };

  const pages = [];

  recurseDirectory(srcDir, (filePath) => {
    const file = path.parse(filePath);

    switch(file.ext){
      case ".json":
        data[file.name] = JSON.parse(fs.readFileSync(filePath, "utf8"));

        log.success(`parsed ${file.base}`);
        break;
      case ".css":
        data.css[file.name] = (sass.renderSync({
          file: filePath,
          outputStyle: "compressed"
        })).css.toString();

        log.success(`compressed ${file.base}`);
        break;
      case ".scss":
        data.css[file.name] = (sass.renderSync({
          file: filePath,
          outputStyle: "compressed"
        })).css.toString();

        log.success(`compiled ${file.base}`);
        break;
      case ".js":
        data.js[file.name] = terser.minify(fs.readFileSync(filePath, "utf8")).code;

        log.success(`compressed ${file.base}`);
        break;
      case ".ejs":
        const page = fs.readFileSync(filePath, "utf8");
        if(!page.startsWith("<!DOCTYPE html>")){
          log.info(`${file.base} doesn't appear to be a page - skipping`);
          break;
        }

        pages.push(filePath);
        break;
      default:
        break;
    }
  });

  for(const filePath of pages){
    const file = path.parse(filePath);
    const targetDir = path.parse(path.join(buildDir, filePath.split(srcDir)[1])).dir;

    if(!fs.existsSync(targetDir)){
      fs.mkdirSync(targetDir);
    }

    ejs.renderFile(filePath, data, (err, html) => {
      if(err){
        return log.error(err);
      }

      fs.writeFileSync(path.join(targetDir, `${file.name}.html`), htmlMinify(html, {
        html5: true,
        // collapseInlineTagWhitespace: true,
        minifyCSS: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeTagWhitespace: true,
        collapseWhitespace: true
      }));
    });

    log.success(`rendered ${file.base}`);
  }

  log.info("done!");
};

if(watch){
  log.info("watching files for changes...");
  build();

  recurseDirectory(srcDir, undefined, (dir) => {
    fs.watch(dir, (event, file) => {
      try{
        build();
      }catch(err){
        log.error(err);
      }
    });
  });
}else{
  build();
}
