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
import {minify as jsMinify} from "terser";

import {StaticSiteGenerator} from "./core";

const staticSiteGenerator = new StaticSiteGenerator();

/**
 * JSON file handler
 */
staticSiteGenerator.addFileHandler({extension: "json", message: "parsed", callback: async (data, file, filePath) => {
  data[file.name] = JSON.parse(fs.readFileSync(filePath, "utf8"));
}});

/**
 * YAML File Handler
 */
staticSiteGenerator.addFileHandler({extension: "yaml", message: "parsed", callback: async (data, file, filePath) => {
  data[file.name] = yaml.load(fs.readFileSync(filePath, "utf8"));
}});

/**
 * CSS file handler
 */
staticSiteGenerator.addFileHandler({extension: "css", message: "compressed", callback: async (data, file, filePath) => {
  if(!data.css){
    data.css = {};
  }

  data.css[file.name] = (sass.renderSync({
    file: filePath,
    outputStyle: staticSiteGenerator.options.compressionLevel >= 2 ? "compressed" : staticSiteGenerator.options.compressionLevel === 1 ? "compact" : "nested"
  })).css.toString();
}});

/**
 * SCSS file handler
 */
staticSiteGenerator.addFileHandler({extension: "scss", message: "compiled", callback: async (data, file, filePath) => {
  if(!data.css){
    data.css = {};
  }

  data.css[file.name] = (sass.renderSync({
    file: filePath,
    outputStyle: staticSiteGenerator.options.compressionLevel >= 2 ? "compressed" : staticSiteGenerator.options.compressionLevel === 1 ? "compact" : "nested"
  })).css.toString();
}});

/**
 * JS file handler
 */
staticSiteGenerator.addFileHandler({extension: "js", message: "compressed", callback: async (data, file, filePath) => {
  if(!data.js){
    data.js = {};
  }
  const code = fs.readFileSync(filePath, "utf8");

  data.js[file.name] = staticSiteGenerator.options.compressionLevel >= 1 ? (await jsMinify(code)).code : code;
}});

/**
 * TS file handler
 */
staticSiteGenerator.addFileHandler({extension: "ts", message: "compiled", callback: async (data, file, filePath) => {
  if(!data.js){
    data.js = {};
  }

  const jsCode = typescript.transpileModule(fs.readFileSync(filePath, "utf8"), {compilerOptions: {module: typescript.ModuleKind.CommonJS}}).outputText;
  data.js[file.name] = staticSiteGenerator.options.compressionLevel >= 1 ? (await jsMinify(jsCode)).code : jsCode;
}});

/**
 * Markdown file handler
 */
staticSiteGenerator.addFileHandler({extension: "md", message: "parsed", callback: async (data, file, filePath) => {
  if(!data.markdown){
    data.markdown = {};
  }

  if(!staticSiteGenerator.options.markdownTemplate){
    staticSiteGenerator.logger.warn("no markdown template for markdown files - this is NOT an error!");
  }

  const markdown = markdownParser(fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n"));

  const markdownData = {
    metadata: markdown.metadata,
    content: marked(markdown.content)
  };

  data.markdown[file.name] = markdownData;

  staticSiteGenerator.pages.push({
    filePath: path.join(staticSiteGenerator.options.srcDir, `${staticSiteGenerator.options.markdownTemplate}`),
    data: markdownData,
    targetName: file.name
  });
}});

// register template extensions
staticSiteGenerator.addPageFile("ejs");
staticSiteGenerator.addPageFile("moe");

/**
 * EJS template handler
 */
staticSiteGenerator.addPageHandler({extension: "ejs", callback: async (data, filePath): Promise<string> =>
  ejs.render(fs.readFileSync(filePath, "utf8"), data)
});

/**
 * MOE template handler
 */
staticSiteGenerator.addPageHandler({extension: "moe", callback: async (data, filePath): Promise<string> => {
  const template = moe.compile(fs.readFileSync(filePath, "utf8"));
  return await template(data);
}});

export {
  StaticSiteGenerator,
  staticSiteGenerator
};
export default staticSiteGenerator;
