import {createServer as createHttpServer} from "http";
import * as yargs from "yargs";

import {StaticSiteGenerator} from "./core";

const PORT = 3000;
const WS_PORT = 3001;

// Setup command-line arguments and commands
export const cli = (staticSiteGenerator: StaticSiteGenerator): void => {
  staticSiteGenerator.loadConfig();

  const parseArgs = (options: any) => {
    if(options.srcDir){
      staticSiteGenerator.options.staticDir = staticSiteGenerator.lib.path.join(
        staticSiteGenerator.lib.path.resolve(options.srcDir),
        staticSiteGenerator.options.staticDir.split(staticSiteGenerator.options.srcDir)[1]
      );
      staticSiteGenerator.options.srcDir = staticSiteGenerator.lib.path.resolve(options.srcDir);
    }

    if(options.buildDir){
      staticSiteGenerator.options.buildDir = staticSiteGenerator.lib.path.resolve(options.buildDir);
    }

    if(options.staticDir){
      staticSiteGenerator.options.staticDir = staticSiteGenerator.lib.path.join(staticSiteGenerator.options.srcDir, staticSiteGenerator.lib.path.resolve(options.staticDir));
    }

    if(options.logLevel){
      staticSiteGenerator.options.logLevel = options.logLevel;
      staticSiteGenerator.logger.level = staticSiteGenerator.options.logLevel;
    }

    if(options.compressionLevel){
      staticSiteGenerator.options.compressionLevel = options.compressionLevel;
    }
  };

  yargs
    .usage("Usage: $0 <command> [options]")
    .example("$0 build --compressionLevel 0", "Builds with no compression")
    .middleware(parseArgs)
    .command("build", "Build into a production static website", () => {}, async () => {
      await staticSiteGenerator.build();
    })
    .command("watch", "Watches files and builds on change", () => {}, async () => {
      await staticSiteGenerator.build();
      staticSiteGenerator.logger.info("watching files for changes...");

      const changed = async () => {
        staticSiteGenerator.logger.info("rebuilding files...");
        await staticSiteGenerator.build();
      };

      staticSiteGenerator.lib.fs.watch(staticSiteGenerator.options.srcDir, changed);
    })
    .command("serve", "Creates a dev server and reloads on file change", () => {}, async (argv: any) => {
      staticSiteGenerator.logger.info("starting dev server...");

      staticSiteGenerator.lib.wss.start(WS_PORT);
      const changed = () => {
        staticSiteGenerator.lib.wss.send("reload");
      };

      staticSiteGenerator.lib.fs.watch(staticSiteGenerator.options.srcDir, changed);

      /**
       * Renders a HTML Page
       * @param url - URL of HTML page to render
       * @returns resolve - 404 Page not found
       * @returns resolve - html content
       */
      const renderHtmlPage = async (url: string): Promise<string> => {
        const filePath = staticSiteGenerator.lib.path.join(staticSiteGenerator.options.srcDir, url);

        const filePaths = {
          ejs: `${filePath.substring(0, filePath.length - 4)}ejs`,
          moe: `${filePath.substring(0, filePath.length - 4)}moe`
        };

        const file = staticSiteGenerator.lib.fs.existsSync(filePaths.ejs) ? filePaths.ejs : staticSiteGenerator.lib.fs.existsSync(filePaths.moe) ? filePaths.moe : "404";
        if(file === "404"){
          staticSiteGenerator.logger.warn("404: page not found");
          return "404: page not found";
        }

        let html = await staticSiteGenerator.renderPage(file, await staticSiteGenerator.getData());
        let normalDoc = false;
        if(html.endsWith("</body></html>")){
          normalDoc = true;
          html = html.substring(0, html.length - "</body></html>".length);
        }

        html += `<script>var ssgs=new WebSocket("ws://localhost:${WS_PORT}");ssgs.onmessage=function(event){if(event.data==="reload"){window.location.reload()}}</script>`;

        if(normalDoc){
          html += "</body></html>";
        }

        return html;
      };

      createHttpServer(async (req, res) => {
        let url = `${req.url}`.slice(1);
        if(`${req.url}`.endsWith("/")){
          url += "index.html";
        }

        const staticPath = staticSiteGenerator.lib.path.join(staticSiteGenerator.options.staticDir, url);

        if(staticSiteGenerator.lib.fs.existsSync(staticPath) && !staticSiteGenerator.lib.fs.isDirectory(staticPath)){
          staticSiteGenerator.logger.success(`serving static file ${url}`);

          res.write(staticSiteGenerator.lib.fs.readTextFileSync(staticPath));
          res.end();
        }else if(url.endsWith(".html")){
          res.write(await renderHtmlPage(url));
          res.end();
        }else{
          if(argv.singlePage){
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
    })
    .option("help", {alias: "h", describe: "Show help", type: "boolean", demandOption: false})
    .option("version", {alias: "v", describe: "Show bersion number", type: "boolean", demandOption: false})
    .option("srcDir", {describe: "Source directory for file", type: "string", demandOption: false})
    .option("buildDir", {describe: "Build directory for files", type: "string", demandOption: false})
    .option("staticDir", {describe: "Drirectory for static files", type: "string", demandOption: false})
    .option("logLevel", {alias: "log", describe: "0: all, 1: no info, 2: no sucess 3: no warning, 4: no error", type: "number", demandOption: false, default: 0})
    .option("compressionLevel", {describe: "0: none 1: basic 2: good 3: max", type: "number", demandOption: false, default: 2})
    .option("singlePage", {alias: "sp", describe: "Redirect 404 to index.html", type: "boolean", demandOption: false})
    .parse(process.argv.splice(2));
};
