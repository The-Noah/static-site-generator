const fs = require("fs");
const path = require("path");

const ejs = require("ejs");
const moe = require("@toptensoftware/moe-js");
const sass = require("node-sass");
const htmlMinify = require("html-minifier").minify;
const terser = require("terser");

const srcDir = path.join(process.cwd(), "src");
const buildDir = path.join(process.cwd(), "build");
const staticDir = path.join(srcDir, "static");

const RESET = "\x1b[0m";
const log = {
  info: (message) => console.log(`[\x1b[36mi${RESET}]`, message),
  success: (message) => console.log(`[\x1b[32m+${RESET}]`, message),
  error: (message) => console.error(`[\x1b[31m-${RESET}]`, message),
  warn: (message) => console.log(`[\x1b[33m!${RESET}]`, message)
};

const fileHandlers = [];
const addFileHandler = (extension, message, callback) => {
  fileHandlers.push({extension, message, callback});
};

const pageHandlers = [];
const addPageHandler = (extension, callback) => {
  pageHandlers.push({extension, callback});
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

const getData = () => {
  const data = {
    css: {},
    js: {}
  };

  recurseDirectory(srcDir, (filePath) => {
    const file = path.parse(filePath);

    for(const fileHandler of fileHandlers){
      if(file.ext === `.${fileHandler.extension}`){
        fileHandler.callback(data, file, filePath);
        log.success(`${fileHandler.message} ${file.base}`);
      }
    }
  });

  return data;
};

const renderPage = (pagePath, data, callback) => {
  const file = path.parse(pagePath);

  for(const pageHandler of pageHandlers){
    if(file.ext === `.${pageHandler.extension}`){
      pageHandler.callback(data, pagePath, (html) => {
        callback(htmlMinify(html, {
          html5: true,
          // collapseInlineTagWhitespace: true,
          minifyCSS: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeTagWhitespace: true,
          collapseWhitespace: true
        }));

        log.success(`rendered ${file.base}`);
      });
    }
  }
};

let pages = [];
const build = () => {
  log.info(`building ${path.parse(process.cwd()).base}...`);
  pages = [];

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

  const data = getData();

  for(const filePath of pages){
    const file = path.parse(filePath);
    const targetDir = path.parse(path.join(buildDir, filePath.split(srcDir)[1])).dir;

    if(!fs.existsSync(targetDir)){
      fs.mkdirSync(targetDir);
    }

    renderPage(filePath, data, (html) => {
      fs.writeFileSync(path.join(targetDir, `${file.name}.html`), html);
    });
  }

  log.info("done!");
};

addFileHandler("json", "parsed", (data, file, filePath) => {
  data[file.name] = JSON.parse(fs.readFileSync(filePath, "utf8"));
});

addFileHandler("css", "compressed", (data, file, filePath) => {
  data.css[file.name] = (sass.renderSync({
    file: filePath,
    outputStyle: "compressed"
  })).css.toString();
});

addFileHandler("scss", "compiled", (data, file, filePath) => {
  data.css[file.name] = (sass.renderSync({
    file: filePath,
    outputStyle: "compressed"
  })).css.toString();
});

addFileHandler("js", "compressed", (data, file, filePath) => {
  data.js[file.name] = terser.minify(fs.readFileSync(filePath, "utf8")).code;
});

addFileHandler("ejs", "read", (data, file, filePath) => {
  const page = fs.readFileSync(filePath, "utf8");
  if(!page.startsWith("<!DOCTYPE html>")){
    log.info(`${file.base} doesn't appear to be a page - skipping`);
    return;
  }

  pages.push(filePath);
});

addFileHandler("moe", "read", (data, file, filePath) => {
  const page = fs.readFileSync(filePath, "utf8");
  if(!page.startsWith("<!DOCTYPE html>")){
    log.info(`${file.base} doesn't appear to be a page - skipping`);
    return;
  }

  pages.push(filePath);
});

addPageHandler("ejs", (data, filePath, callback) => {
  ejs.renderFile(filePath, data, (err, html) => {
    if(err){
      return log.error(err);
    }

    callback(html);
  });
});

addPageHandler("moe", (data, filePath, callback) => {
  moe.compileFile(filePath, "UTF8", (err, template) => {
    if(err){
      return log.error(err);
    }

    callback(template(data));
  });
});

module.exports = {
  build,
  addFileHandler,
  addPageHandler,
  renderPage,
  getData
};
