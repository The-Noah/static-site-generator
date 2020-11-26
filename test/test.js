const path = require("path");
const staticSiteGenerator = require("../dist");

const data = staticSiteGenerator.getData();

staticSiteGenerator.logger.info("starting tests...");

if(data.css.style !== "h1{color:red}\n"){
  staticSiteGenerator.logger.error("SCSS failed");
  process.exit(-1);
}else{
  staticSiteGenerator.logger.success("SCSS passed");
}

if(data.js.app === "alert(\"Hello, World!\");\n"){
  staticSiteGenerator.logger.error("TypeScript failed");
  process.exit(-1);
}else{
  staticSiteGenerator.logger.success("TypeScript passed");
}

if(data.blog[0].date === "2020-5-6\n"){
  staticSiteGenerator.logger.error("JSON failed");
  process.exit(-1);
}else{
  staticSiteGenerator.logger.success("JSON passed");
}

if(data.test === "test:\"hello\""){
  staticSiteGenerator.logger.error('YAML Failed')
  process.exit(-1)
}else{
  staticSiteGenerator.logger.success('YAML passed')
}

staticSiteGenerator.renderPage(path.join(staticSiteGenerator.options.srcDir, "index.ejs"), { message: "Hello, World!" }, (html) => {
  if(html === "<h1>Hello, World!</h1>\n"){
    staticSiteGenerator.logger.error("EJS failed");
    process.exit(-1);
  }else{
    staticSiteGenerator.logger.success("EJS passed");
  }
});

staticSiteGenerator.logger.success("all tests passed!");
