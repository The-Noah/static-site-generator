const path = require("path");
const {staticSiteGenerator} = require("../dist");

// top level async
(async () => {

const data = await staticSiteGenerator.getData();
const ejsHtml = await staticSiteGenerator.renderPage(path.join(staticSiteGenerator.options.srcDir, "index.ejs"), {message: "Hello, World!"});
const moeHtml = await staticSiteGenerator.renderPage(path.join(staticSiteGenerator.options.srcDir, "moe.moe"), {message: "Hello, World!"});

staticSiteGenerator.logger.info("starting tests...");

if(data.css.style !== "h1{color:red}\n"){
  staticSiteGenerator.logger.error("SCSS failed");
  process.exit(-1);
}else{
  staticSiteGenerator.logger.success("SCSS passed");
}

if(data.js.app !== "var message=\"Hello, World!\";"){
  staticSiteGenerator.logger.error("TypeScript failed");
  process.exit(-1);
}else{
  staticSiteGenerator.logger.success("TypeScript passed");
}

if(data.blog[0].date !== "2020-5-6"){
  staticSiteGenerator.logger.error("JSON failed");
  process.exit(-1);
}else{
  staticSiteGenerator.logger.success("JSON passed");
}

if(data.test.test !== "hello"){
  staticSiteGenerator.logger.error("YAML Failed")
  process.exit(-1)
}else{
  staticSiteGenerator.logger.success("YAML passed")
}

if(ejsHtml !== "<h1>Hello, World!</h1>"){
  staticSiteGenerator.logger.error("EJS failed");
  process.exit(-1);
}else{
  staticSiteGenerator.logger.success("EJS passed");
}

if(moeHtml !== "<h1>Hello, World!</h1>"){
  staticSiteGenerator.logger.error("Moe failed");
  process.exit(-1);
}else{
  staticSiteGenerator.logger.success("Moe passed");
}

staticSiteGenerator.logger.info("all tests passed!");

})();
