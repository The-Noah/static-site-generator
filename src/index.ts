// main imports
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
// template engines
import * as ejs from "ejs";
const moe = require("@toptensoftware/moe-js");

// file support
import * as sass from "node-sass";
import typescript from "typescript";
import marked from "marked";
const markdownParser = require("markdown-yaml-metadata-parser");

// optimization
import * as terser from "terser";
import * as htmlMinifer from "html-minifier";

import {ILogger, default as defaultLogger} from "./log";
const logger: ILogger = defaultLogger;

const htmlMinify = htmlMinifer.minify;

// interfaces
interface IFileHandler{
  extension: string;
  message: string;
  callback: (data: any, file: any, filePath: string) => void;
}

interface IPageHandler{
  extension: string;
  callback: (data: any, filePath: string, callback: (html: string) => void) => void;
}

const configPath = path.join(process.cwd(), ".static-site-generator.config.json");
const yamlConfigPath = path.join(process.cwd(), ".static-site-generator.config.yaml");
/**
 * Create options Object with built-in defaults
 * @param srcDir - Path to look in for files.
 * @param buildDir - Path to save final files to.
 * @param staticDir - Path in srcDir to look for static files.
 * @param logLevel - 0 = all, 1 = no info, 2 = no sucess, 3 = no warning, 4 = no error - each level also inherits from the last
 * @param compressionLevel - How much to compress files - 0 = none, 3 = max
 */
let options: {
  srcDir: string;
  buildDir: string;
  staticDir: string;
  logLevel: number;
  markdownTemplate: string | false;
  compressionLevel: number;
} = {
  srcDir: "src",
  buildDir: "build",
  staticDir: "static",
  logLevel: 0,
  markdownTemplate: false,
  compressionLevel: 2
};

// Import options if found
if(fs.existsSync(configPath)){
  try {
    options = {
      ...options,
      ...JSON.parse(fs.readFileSync(configPath, "utf8"))
    };
    logger.info(`using config file ${configPath}`);
  } catch (e) {
   logger.error(`JSON Error: ${e}`) 
  }
} else if(fs.existsSync(yamlConfigPath)) {
  try {
    options = {
      ...options,
      ...yaml.load(fs.readFileSync(yamlConfigPath, "utf8"), { json: true})
    };
    logger.info(`using config file ${yamlConfigPath}`);
  } catch (e) {
    logger.error(`YAML Error: ${e}`);
  }
}

logger.info(`log level: ${options.logLevel}`);

logger.info(`compression level: ${options.compressionLevel}`);

logger.level = options.logLevel;

options.srcDir = path.join(process.cwd(), options.srcDir);

options.buildDir = path.join(process.cwd(), options.buildDir);

options.staticDir = path.join(options.srcDir, options.staticDir);

const fileHandlers: any[] = [];
/**
 * Method to add a new fileHandler
 * @param fileHandler - File Handler Options
 * @returns {void}
 */
const addFileHandler = (fileHandler: IFileHandler): void => {
  fileHandlers.push(fileHandler);
};

const pageHandlers: any[] = [];
/**
 * Method to add a new pageHandler
 * @param pageHandler - Page Handler Options
 * @returns {void}
 */
const addPageHandler = (pageHandler: IPageHandler): void => {
  pageHandlers.push(pageHandler);
};
/**
 * Method to add a new PageFile
 * @param extension - Extension of File
 * @returns {void}
 */
const addPageFile = (extension: string): void => {
  addFileHandler({extension, message: "found page", callback: (data, file, filePath) => {
    const page = fs.readFileSync(filePath, "utf8");

    if(!page.startsWith("<!DOCTYPE html>")){
      logger.info(`${file.base} doesn't appear to be a page - skipping`);
      return;
    }

    pages.push({
      filePath,
      data: {}
    });
  }
  });
};
/**
 * Calls fileCallback for each file in the directory and subdirectories, and directoryCallback for each directory.
 * @param dir - Path of Directory to recurse
 * @param fileCallback - File Path
 * @param directoryCallback - Directory Path
 * @returns {void}
 */
const recurseDirectory = (dir: string, fileCallback?: (filePath: string) => void, directoryCallback?: (dirPath: string) => void): void => {
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
/**
 * Method to Delete a Directory
 * @param dir - Path of Directory to Delete
 */
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
/**
 * Method to Copy a Directory
 * @param source - Path of Directory you wish to copy
 * @param target - Target Path for copied Directory
 */
const copyDirectory = (source: string, target: string) => {
  if(!fs.existsSync(target)){
    fs.mkdirSync(target);
  }

  recurseDirectory(source, (file) => {
    fs.copyFileSync(file, path.join(target, file.split(source)[1]));

    logger.success(`copied ${path.parse(file).base}`);

  }, (dir) => {
    const newDir = path.join(target, dir.split(source)[1]);

    if(!fs.existsSync(newDir)){
      fs.mkdirSync(newDir);
    }
  });
};
/**
 * Returns all data from files found in options.srcDir.
 * @returns {Object}
 */
const getData = (): any => {
  const data = {};

  recurseDirectory(options.srcDir, (filePath) => {
    const file = path.parse(filePath);

    for(const fileHandler of fileHandlers){
      if(file.ext === `.${fileHandler.extension}`){
        fileHandler.callback(data, file, filePath);
        logger.success(`${fileHandler.message} ${file.base}`);
      }
    }
  });

  return data;
};
/**
 * Renders the page found at `pagePath` with the data `data` and calls `callback` with the resulting minified HTML.
 * @param pagePath - Path of page to render
 * @param data - Data to render
 * @param callback - callback with html contents
 * @returns {void}
 */
const renderPage = (pagePath: string, data: Record<string, unknown>, callback: (html: string) => void): void => {
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

        logger.success(`rendered ${file.base}`);
      });
    }
  }
};
/**
 * Create list of pages
 * @param filePath - Path of page file
 * @param data - Data of page file
 * @param targetName - Name the file should be saved under
 */
let pages: {
  filePath: string;
  data: Record<string, unknown>;
  targetName?: string;
}[] = [];
/**
 * Renders all pages in options.srcDir and saves them in options.buildDir, as well as copies all files from options.srcDir/options.staticDir to options.buildDir.
 * @returns {void}
 */
const build = (): void => {
  logger.info(`building ${path.parse(process.cwd()).base} to ${path.parse(options.buildDir).base}...`);
  pages = [];

  if(!fs.existsSync(options.srcDir)){
    return logger.error("no src in current directory");
  }

  if(!fs.existsSync(path.join(options.srcDir, "index.ejs"))){
    logger.warn("no index.ejs in src directory - this is NOT an error!");
  }

  if(fs.existsSync(options.buildDir)){
    deleteDirectory(options.buildDir);
  }

  fs.mkdirSync(options.buildDir);

  if(fs.existsSync(options.staticDir)){
    logger.info("copying static files...");
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

  logger.info("done!");
};
/**
 * Default JSON File Handler
 */
addFileHandler({extension: "json", message: "parsed", callback: (data, file, filePath) => {
  data[file.name] = JSON.parse(fs.readFileSync(filePath, "utf8"));
}
});
/**
 * Default YAML File Handler
 */
addFileHandler({extension: "yaml", message: "parsed", callback: (data, file, filePath) => {
  data[file.name] = yaml.load(fs.readFileSync(filePath, 'utf8'))
}})
/**
 * Default CSS File Handler
 */
addFileHandler({extension: "css", message: "compressed", callback: (data, file, filePath) => {
  if(!data.css){
    data.css = {};
  }

  data.css[file.name] = (sass.renderSync({
    file: filePath,
    outputStyle: options.compressionLevel >= 2 ? "compressed" : options.compressionLevel === 1 ? "compact" : "nested"
  })).css.toString();
}
});
/**
 * Default SCSS File Handler
 */
addFileHandler({extension: "scss", message: "compiled", callback: (data, file, filePath) => {
  if(!data.css){
    data.css = {};
  }

  data.css[file.name] = (sass.renderSync({
    file: filePath,
    outputStyle: options.compressionLevel >= 2 ? "compressed" : options.compressionLevel === 1 ? "compact" : "nested"
  })).css.toString();
}
});
/**
 * Default JS File Handler
 */
addFileHandler({extension: "js", message: "compressed", callback: async (data, file, filePath) => {
  if(!data.js){
    data.js = {};
  }
  const code = fs.readFileSync(filePath, "utf8");

  data.js[file.name] = options.compressionLevel >= 1 ? (await terser.minify(code)).code : code;
}
});
/**
 * Default TS File Handler
 */
addFileHandler({extension: "ts", message: "compiled", callback: async (data, file, filePath) => {
  if(!data.js){
    data.js = {};
  }

  data.js[file.name] = (await terser.minify(typescript.transpileModule(fs.readFileSync(filePath, "utf8"), {}).outputText)).code;
}
});
/**
 * Default MD File Handler
 */
addFileHandler({extension: "md", message: "parsed", callback: (data, file, filePath) => {
  if(!data.markdown){
    data.markdown = {};
  }

  if(!options.markdownTemplate){
    logger.warn("no markdown template for markdown files - this is NOT an error!");
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
}
});
// ejs and moe page files
addPageFile("ejs");

addPageFile("moe");

/**
 * Default EJS Page Handler
 */
addPageHandler({extension: "ejs", callback: (data, filePath, callback) => {
  ejs.renderFile(filePath, data, (err, html) => {
    if(err){
      return logger.error(err);
    }

    callback(html);
  });
}
});
/**
 * Default MOE Page Handler
 */
addPageHandler({extension: "moe", callback: (data, filePath, callback) => {
  moe.compileFile(filePath, "UTF8", (err: any, template: any) => {
    if(err){
      return logger.error(err);
    }

    callback(template(data));
  });
}
});

export {
  ILogger,
  defaultLogger,
  logger,
  recurseDirectory,
  build,
  addFileHandler,
  addPageHandler,
  addPageFile,
  renderPage,
  getData,
  options
};
