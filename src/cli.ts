#!/usr/bin/env node
// Imports
import * as fs from "fs";
import * as path from "path";
import {createServer} from "http";

import WebSocket from "ws";
import {program} from "commander";

const {version} = require("../package.json");
import * as staticSiteGenerator from ".";


// Port Variables
const PORT = 3000;
const WS_PORT = 3001;


// Setup command-line arguments
program.version(version, "-v, --version");
program
  .option("--src-dir <path>", "source directory for files")
  .option("-d, --build-dir <path>", "build directory for files")
  .option("--static-dir <path>", "directory for static files")
  .option("--log-level <level>", "how much information to log", parseInt)
  .option("--compression-level <level>", "how much to compress files", parseInt)
  .option("--single-page", "redirect 404 to index.html")
  .parse(process.argv);

// configure staticSiteGenerator Options
if(program.srcDir){
  staticSiteGenerator.options.staticDir = path.join(path.resolve(program.srcDir), staticSiteGenerator.options.staticDir.split(staticSiteGenerator.options.srcDir)[1]);

  staticSiteGenerator.options.srcDir = path.resolve(program.srcDir);
}
if(program.buildDir){
  staticSiteGenerator.options.buildDir = path.resolve(program.buildDir);
}
if(program.staticDir){
  staticSiteGenerator.options.staticDir = path.join(staticSiteGenerator.options.srcDir, path.resolve(program.staticDir));
}
if(program.logLevel !== undefined && program.logLevel !== NaN){
  staticSiteGenerator.options.logLevel = program.logLevel;
}
if(program.compressionLevel !== undefined && program.compressionLevel !== NaN){
  staticSiteGenerator.options.compressionLevel = program.compressionLevel;
}

staticSiteGenerator.logger.level = staticSiteGenerator.options.logLevel;

/**
 * Configures the Environment
 * @returns Default - Setup command-line arguments and breaks
 * @returns build - Builds staticSiteGenerator and breaks
 * @returns watch - Builds staticSiteGenerator and watches for changes
 * @returns dev - Builds staticSiteGenerator and creates dev enviornment
 */
switch(process.argv[2]){
  case "watch": {
    staticSiteGenerator.build();
    staticSiteGenerator.logger.info("watching files for changes...");

    const changed = (event: any, file: string) => {
      try{
        staticSiteGenerator.build();
      }catch(err){
        staticSiteGenerator.logger.error(err);
      }
    };

    fs.watch(staticSiteGenerator.options.srcDir, changed);

    staticSiteGenerator.recurseDirectory(staticSiteGenerator.options.srcDir, undefined, (dir) => {
      fs.watch(dir, changed);
    });
  } break;
  case "dev": {
    staticSiteGenerator.logger.info("starting dev server...");

    const wss = new WebSocket.Server({port: WS_PORT});
    wss.on("connection", (ws) => {
      staticSiteGenerator.logger.success("new WS connection");
    });

    const changed = (event: any, file: string) => {
      wss.clients.forEach((client) => {
        client.send("reload");
      });
    };

    fs.watch(staticSiteGenerator.options.srcDir, changed);
    staticSiteGenerator.recurseDirectory(staticSiteGenerator.options.srcDir, undefined, (dir) => {
      fs.watch(dir, changed);
    });
    /**
     * Renders a HTML Page
     * @param url - URL of HTML page to render
     * @returns resolve - 404 Page not found
     * @returns resolve - html content
     */
    const renderHtmlPage = (url: string): Promise<string> => new Promise((resolve, reject) => {
      const filePath = path.join(staticSiteGenerator.options.srcDir, url);

      const filePaths = {
        ejs: `${filePath.substring(0, filePath.length - 4)}ejs`,
        moe: `${filePath.substring(0, filePath.length - 4)}moe`
      };

      const file = fs.existsSync(filePaths.ejs) ? filePaths.ejs : fs.existsSync(filePaths.moe) ? filePaths.moe : "404";
      if(file === "404"){
        staticSiteGenerator.logger.warn("404 page not found");

        resolve("404 not found");
      }

      staticSiteGenerator.renderPage(file, staticSiteGenerator.getData(), (html) => {
        let normalDoc = false;
        if(html.endsWith("</body></html>")){
          normalDoc = true;

          html = html.substring(0, html.length - "</body></html>".length);
        }

        html += `<script>var ssgs=new WebSocket("ws://localhost:${WS_PORT}");ssgs.onmessage=function(event){if(event.data==="reload"){window.location.reload()}}</script>`;

        if(normalDoc){
          html += "</body></html>";
        }

        resolve(html);
      });
    });
    /**
     * Creates a HTTP server
     */
    createServer(async (req, res) => {
      let url = `${req.url}`.slice(1);
      if(`${req.url}`.endsWith("/")){
        url += "index.html";
      }

      const staticPath = path.join(staticSiteGenerator.options.staticDir, url);

      if(fs.existsSync(staticPath) && !fs.lstatSync(staticPath).isDirectory()){
        staticSiteGenerator.logger.success(`serving static file ${url}`);

        res.write(fs.readFileSync(staticPath));

        res.end();
      }else if(url.endsWith(".html")){
        res.write(await renderHtmlPage(url));

        res.end();
      }else{
        if(program.singlePage){
          staticSiteGenerator.logger.info("serving 404 as index.html due to --single-page flag");

          res.write(await renderHtmlPage("index.html"));
        }else{
          res.write("404 not found");
        }

        res.end();
      }
    }).listen(PORT, () => {
      staticSiteGenerator.logger.success(`dev server running at http://localhost:${PORT}`);
    });
  }
  case "build": {
    staticSiteGenerator.build();
    break;
  } 
  default:
// Setup command-line arguments
  program.version(version, "-v, --version");
  program
    .option("--src-dir <path>", "source directory for files")
    .option("-d, --build-dir <path>", "build directory for files")
    .option("--static-dir <path>", "directory for static files")
    .option("--log-level <level>", "how much information to log", parseInt)
    .option("--compression-level <level>", "how much to compress files", parseInt)
    .option("--single-page", "redirect 404 to index.html")
    .parse(process.argv);
    break;
}
