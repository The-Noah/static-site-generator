import * as fs from "fs";
import * as path from "path";

import * as ejs from "ejs";
const moe = require("@toptensoftware/moe-js");

import * as sass from "node-sass";
import * as terser from "terser";
import * as htmlMinifer from "html-minifier";
import typescript from "typescript";
import marked from "marked";
const markdownParser = require("markdown-yaml-metadata-parser");

const htmlMinify = htmlMinifer.minify;

const configPath = path.join(process.cwd(), ".static-site-generator.config.json");
let options: {
  srcDir: string,
  buildDir: string,
  staticDir: string,
  logLevel: number,
  markdownTemplate: string | false,
  compressionLevel: number
} = {
  srcDir: "src",
  buildDir: "build",
  staticDir: "static",
  logLevel: 0,
  markdownTemplate: false,
  compressionLevel: 2
};

if(fs.existsSync(configPath)){
  options = {
    ...options,
    ...JSON.parse(fs.readFileSync(configPath, "utf8"))
  }
}

const RESET = "\x1b[0m";
const log = {
  info: (message: any) => {
    if(options.logLevel > 0){
      return;
    }

    console.log(`[\x1b[36mi${RESET}]`, message);
  },
  success: (message: any) => {
    if(options.logLevel > 1){
      return;
    }

    console.log(`[\x1b[32m+${RESET}]`, message);
  },
  error: (message: any) => {
    if(options.logLevel > 2){
      return;
    }

    console.error(`[\x1b[31m-${RESET}]`, message);
  },
  warn: (message: any) => {
    if(options.logLevel > 3){
      return;
    }

    console.log(`[\x1b[33m!${RESET}]`, message);
  }
};

console.log(`log level: ${options.logLevel}`);
log.info(`compression level: ${options.compressionLevel}`);

if(fs.existsSync(configPath)){
  log.info(`using config file ${configPath}`);
}

options.srcDir = path.join(process.cwd(), options.srcDir);
options.buildDir = path.join(process.cwd(), options.buildDir);
options.staticDir = path.join(options.srcDir, options.staticDir);

const fileHandlers: any[] = [];
const addFileHandler = (extension: string, message: string, callback: (data: any, file: any, filePath: string) => void) => {
  fileHandlers.push({extension, message, callback});
};

const pageHandlers: any[] = [];
const addPageHandler = (extension: string, callback: (data: any, filePath: string, callback: (html: string) => void) => void) => {
  pageHandlers.push({extension, callback});
};

const addPageFile = (extension: string) => {
  addFileHandler(extension, "found page", (data, file, filePath) => {
    const page = fs.readFileSync(filePath, "utf8");
    if(!page.startsWith("<!DOCTYPE html>")){
      log.info(`${file.base} doesn't appear to be a page - skipping`);
      return;
    }

    pages.push({
      filePath,
      data: {}
    });
  });
};

const recurseDirectory = (dir: string, fileCallback?: (filePath: string) => void, directoryCallback?: (dirPath: string) => void) => {
  fs.readdirSync(dir).forEach((file) => {
    const currentPath = path.join(dir, file);

    if(fs.lstatSync(currentPath).isDirectory()){
      if(directoryCallback){
        directoryCallback(currentPath);
      }

      recurseDirectory(currentPath, fileCallback, directoryCallback);
    }else if(fileCallback){
      if(fileCallback){
        fileCallback(currentPath);
      }
    }
  });
};

const deleteDirectory = (dir: string) => {
  const dirsToRemove: string[] = [];

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

const copyDirectory = (source: string, target: string) => {
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

const getData = (): any => {
  const data = {};

  recurseDirectory(options.srcDir, (filePath) => {
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

const renderPage = (pagePath: string, data: Object, callback: (html: string) => void) => {
  const file = path.parse(pagePath);

  for(const pageHandler of pageHandlers){
    if(file.ext === `.${pageHandler.extension}`){
      pageHandler.callback(data, pagePath, (html: string) => {
        callback(htmlMinify(html, {
          html5: true,
          collapseInlineTagWhitespace: options.compressionLevel >= 3,
          removeComments: options.compressionLevel >= 1,
          removeRedundantAttributes: options.compressionLevel >= 1,
          removeTagWhitespace: options.compressionLevel >= 3,
          collapseWhitespace: options.compressionLevel >= 2
        }));

        log.success(`rendered ${file.base}`);
      });
    }
  }
};

let pages: {
  filePath: string,
  data: Object,
  targetName?: string
}[] = [];
const build = () => {
  log.info(`building ${path.parse(process.cwd()).base} to ${path.parse(options.buildDir).base}...`);
  pages = [];

  if(!fs.existsSync(options.srcDir)){
    return log.error("no src in current directory");
  }

  if(!fs.existsSync(path.join(options.srcDir, "index.ejs"))){
    log.warn("no index.ejs in src directory - this is NOT an error!");
  }

  if(fs.existsSync(options.buildDir)){
    deleteDirectory(options.buildDir);
  }
  fs.mkdirSync(options.buildDir);

  if(fs.existsSync(options.staticDir)){
    log.info("copying static files...");
    copyDirectory(options.staticDir, options.buildDir);
  }

  const data = getData();

  for(const page of pages){
    const file = path.parse(page.filePath);
    const targetDir = path.parse(path.join(options.buildDir, page.filePath.split(options.srcDir)[1])).dir;

    if(!fs.existsSync(targetDir)){
      fs.mkdirSync(targetDir);
    }

    renderPage(page.filePath, {
      ...data,
      ...page.data
    }, (html) => {
      fs.writeFileSync(path.join(targetDir, `${page.targetName ?? file.name}.html`), html);
    });
  }

  log.info("done!");
};

addFileHandler("json", "parsed", (data, file, filePath) => {
  data[file.name] = JSON.parse(fs.readFileSync(filePath, "utf8"));
});

addFileHandler("css", "compressed", (data, file, filePath) => {
  if(!data.css){
    data.css = {};
  }

  data.css[file.name] = (sass.renderSync({
    file: filePath,
    outputStyle: options.compressionLevel >= 2 ? "compressed" : options.compressionLevel === 1 ? "compact" : "nested"
  })).css.toString();
});

addFileHandler("scss", "compiled", (data, file, filePath) => {
  if(!data.css){
    data.css = {};
  }

  data.css[file.name] = (sass.renderSync({
    file: filePath,
    outputStyle: options.compressionLevel >= 2 ? "compressed" : options.compressionLevel === 1 ? "compact" : "nested"
  })).css.toString();
});

addFileHandler("js", "compressed", (data, file, filePath) => {
  if(!data.js){
    data.js = {};
  }
  const code = fs.readFileSync(filePath, "utf8");

  data.js[file.name] = options.compressionLevel >= 1 ? terser.minify(code).code : code;
});

addFileHandler("ts", "compiled", (data, file, filePath) => {
  if(!data.js){
    data.js = {};
  }

  data.js[file.name] = terser.minify(typescript.transpileModule(fs.readFileSync(filePath, "utf8"), {}).outputText).code;
});

addFileHandler("md", "parsed", (data, file, filePath) => {
  if(!data.markdown){
    data.markdown = {};
  }

  if(!options.markdownTemplate){
    log.warn("no markdown template for markdown files - this is NOT an error!");
  }

  const markdown = markdownParser(fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n"));
  const markdownData = {
    metadata: markdown.metadata,
    content: marked(markdown.content)
  };

  data.markdown[file.name] = markdownData;

  pages.push({
    filePath: path.join(options.srcDir, `${options.markdownTemplate}`),
    data: markdownData,
    targetName: file.name
  });
});

addPageFile("ejs");
addPageFile("moe");

addPageHandler("ejs", (data, filePath, callback) => {
  ejs.renderFile(filePath, data, (err, html) => {
    if(err){
      return log.error(err);
    }

    callback(html);
  });
});

addPageHandler("moe", (data, filePath, callback) => {
  moe.compileFile(filePath, "UTF8", (err: any, template: any) => {
    if(err){
      return log.error(err);
    }

    callback(template(data));
  });
});

export {
  log,
  recurseDirectory,
  build,
  addFileHandler,
  addPageHandler,
  addPageFile,
  renderPage,
  getData,
  options
};
