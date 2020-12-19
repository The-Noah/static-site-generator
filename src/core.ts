import {ILogger, default as defaultLogger} from "./log.js";
import {ILib} from "./lib/lib.js";

/**
  * Configuration options
  */
export interface IStaticSiteGeneratorOptions{
  /**
   * @property Path to look in for files
   */
  srcDir: string;
  /**
   * @property Path to save final files to
   */
  buildDir: string;
  /**
   * @property Path in srcDir to look for static files
   */
  staticDir: string;
  /**
   * @property 0 = all, 1 = no info, 2 = no sucess, 3 = no warning, 4 = no error - each level also inherits from the last
   */
  logLevel: number;
  /**
   * @property Template for markdown files
   */
  markdownTemplate: string | false;
  /**
   * @property How much to compress files - 0 = none, 3 = max
   */
  compressionLevel: number;
}

export interface IFileHandler{
  extension: string;
  message: string;
  callback: (data: any, file: any, filePath: string) => Promise<void>;
}

export interface IPageHandler{
  extension: string;
  callback: (data: any, filePath: string) => Promise<string>;
}

export interface IPage{
  /**
   * @property Path of page file
   */
  filePath: string;
  /**
   * @property Data of page file
   */
  data: Record<string, unknown>;
  /**
   * @property Name the file should be saved under
   */
  targetName?: string;
}

export class StaticSiteGenerator{
  readonly lib: ILib;

  options: IStaticSiteGeneratorOptions = {
    srcDir: "src",
    buildDir: "build",
    staticDir: "static",
    logLevel: 0,
    markdownTemplate: false,
    compressionLevel: 2
  };

  logger: ILogger;
  pages: IPage[] = [];

  private fileHandlers: IFileHandler[] = [];
  private pageHandlers: IPageHandler[] = [];

  constructor(lib: ILib, options?: IStaticSiteGeneratorOptions, logger?: ILogger){
    this.lib = lib;

    if(options){
      this.options = {...this.options, ...options};
    }

    this.logger = logger ?? defaultLogger;

    this.logger.info(`log level: ${this.options.logLevel}`);
    this.logger.info(`compression level: ${this.options.compressionLevel}`);

    this.configChanged();

    // register file handlers

    this.addFileHandler({extension: "json", message: "parsed", callback: async (data, file, filePath) => {
      data[file.name] = JSON.parse(this.lib.fs.readTextFileSync(filePath));
    }});

    this.addFileHandler({extension: "yaml", message: "parsed", callback: async (data, file, filePath) => {
      data[file.name] = this.lib.yaml(filePath);
    }});

    this.addFileHandler({extension: "yml", message: "parsed", callback: async (data, file, filePath) => {
      data[file.name] = this.lib.yaml(filePath);
    }});
  }

  loadConfig(name?: string): void{
    const configName = name ?? ".static-site-generator.config";

    const jsonConfigPath = this.lib.path.join(this.lib.path.cwd(), `${configName}.json`);
    const yamlConfigPath = this.lib.path.join(this.lib.path.cwd(), `${configName}.yaml`);

    // Import options file if found
    if(this.lib.fs.existsSync(jsonConfigPath)){
      try{
        this.options = {
          ...this.options,
          ...JSON.parse(this.lib.fs.readTextFileSync(jsonConfigPath))
        };
        this.configChanged();

        this.logger.info(`using config file ${jsonConfigPath}`);
      }catch(e){
        this.logger.error(`unable to load json config: ${e}`);
      }
    }else if(this.lib.fs.existsSync(yamlConfigPath)){
      try{
        this.options = {
          ...this.options,
          ...this.lib.yaml(yamlConfigPath)
        };
        this.configChanged();

        this.logger.info(`using config file ${yamlConfigPath}`);
      }catch(e){
        this.logger.error(`unable to load yaml config: ${e}`);
      }
    }else{
      this.logger.warn("no config files found");
    }
  }

  /**
   * Add new file handler
   * @param fileHandler - File handler options
   */
  addFileHandler(fileHandler: IFileHandler): void {
    this.fileHandlers.push(fileHandler);
  }

  /**
   * Add a new pageHandler
   * @param pageHandler - Page handler options
   */
  addPageHandler(pageHandler: IPageHandler): void{
    this.pageHandlers.push(pageHandler);
  }

  /**
   * Add file handler for page
   * @param extension - Extension of file
   */
  addPageFile(extension: string): void{
    this.addFileHandler({extension, message: "found page", callback: async (data, file, filePath) => {
      const page = this.lib.fs.readTextFileSync(filePath);

      if(!page.startsWith("<!DOCTYPE html>")){
        this.logger.info(`${file.base} doesn't appear to be a page - skipping`);
        return;
      }

      this.pages.push({
        filePath,
        data: {}
      });
    }});
  }

  /**
   * Returns all data from files found in `options.srcDir`
   * @returns All data
   */
  async getData(): Promise<Record<string, unknown>>{
    const data = {};

    await this.lib.utils.recurseDirectory(this.options.srcDir, async (filePath: string) => {
      const file = this.lib.path.parse(filePath);

      for(const fileHandler of this.fileHandlers){
        if(file.ext === `.${fileHandler.extension}`){
          await fileHandler.callback(data, file, filePath);
          this.logger.success(`${fileHandler.message} ${file.base}`);
        }
      }
    });

    return data;
  }

  /**
   * Renders the page found at `pagePath` with the data `data` and calls `callback` with the resulting minified HTML.
   * @param pagePath - Path of page to render
   * @param data - Data to render with
   * @returns Promise that will resolve with html
   */
  async renderPage(pagePath: string, data: Record<string, unknown>): Promise<string>{
    const file = this.lib.path.parse(pagePath);

    for(const pageHandler of this.pageHandlers){
      if(file.ext === `.${pageHandler.extension}`){
        const html = await pageHandler.callback(data, pagePath);
        const minHtml = this.lib.htmlMinifier(html, this.options.compressionLevel);

        this.logger.success(`rendered ${file.base}`);
        return minHtml;
      }
    }

    return "";
  }

  /**
   * Renders all pages in `options.srcDir` and saves them in `options.buildDir`, as well as copies all files from `options.srcDir`/`options.staticDir` to `options.buildDir`
   */
  async build(): Promise<void>{
    this.logger.info(`building ${this.lib.path.parse(this.lib.path.cwd()).base} to ${this.lib.path.parse(this.options.buildDir).base}...`);
    this.pages = [];

    if(!this.lib.fs.existsSync(this.options.srcDir)){
      return this.logger.error("no src in current directory");
    }

    if(!this.lib.fs.existsSync(this.lib.path.join(this.options.srcDir, "index.ejs"))){
      this.logger.warn("no index.ejs in src directory - this is NOT an error!");
    }

    if(this.lib.fs.existsSync(this.options.buildDir)){
      this.lib.utils.deleteDirectory(this.options.buildDir);
    }

    this.lib.fs.mkdirSync(this.options.buildDir);

    if(this.lib.fs.existsSync(this.options.staticDir)){
      this.logger.info("copying static files...");
      this.lib.utils.copyDirectory(this.options.staticDir, this.options.buildDir);
    }

    const data = await this.getData();

    for(const page of this.pages){
      const file = this.lib.path.parse(page.filePath);

      const targetDir = this.lib.path.parse(this.lib.path.join(this.options.buildDir, page.filePath.split(this.options.srcDir)[1])).dir;

      if(!this.lib.fs.existsSync(targetDir)){
        this.lib.fs.mkdirSync(targetDir);
      }

      this.lib.fs.writeTextFileSync(this.lib.path.join(targetDir, `${page.targetName ?? file.name}.html`), await this.renderPage(page.filePath, {...data, ...page.data}));
    }

    this.logger.info("done!");
  }

  private configChanged(): void{
    this.logger.level = this.options.logLevel;

    this.options.srcDir = this.lib.path.join(this.lib.path.cwd(), this.options.srcDir);
    this.options.buildDir = this.lib.path.join(this.lib.path.cwd(), this.options.buildDir);
    this.options.staticDir = this.lib.path.join(this.options.srcDir, this.options.staticDir);
  }
}
