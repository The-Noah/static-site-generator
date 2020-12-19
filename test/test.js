const path = require("path");
const {staticSiteGenerator} = require("../dist");

// top level async
(async () => {

const data = await staticSiteGenerator.getData();
const ejsHtml = await staticSiteGenerator.renderPage(path.join(staticSiteGenerator.options.srcDir, "index.ejs"), {message: "Hello, World!"});
const moeHtml = await staticSiteGenerator.renderPage(path.join(staticSiteGenerator.options.srcDir, "moe.moe"), {message: "Hello, World!"});

staticSiteGenerator.logger.info("starting tests...");
// Test CSS
if(data.css.style !== "h1{color:red}\n"){
  staticSiteGenerator.logger.error("SCSS failed");
  process.exit(-1);
}else{
  staticSiteGenerator.logger.success("SCSS passed");
}

// Test JS
if(data.js.app !== "var message=\"Hello, World!\";"){
  staticSiteGenerator.logger.error("TypeScript failed");
  process.exit(-1);
}else{
  staticSiteGenerator.logger.success("TypeScript passed");
}

// Test JSON
if(data.blog[0].date !== "2020-5-6"){
  staticSiteGenerator.logger.error("JSON failed");
  process.exit(-1);
}else{
  staticSiteGenerator.logger.success("JSON passed");
}

// Test YAML
if(data.test.test !== "hello"){
  staticSiteGenerator.logger.error("YAML Failed")
  process.exit(-1)
}else{
  staticSiteGenerator.logger.success("YAML passed")
}

// Test TOML
if(!data.tomltest.test.passed) {
  staticSiteGenerator.logger.error("TOML Failed")
  process.exit(-1)
} else {
  staticSiteGenerator.logger.success("TOML passed")
}

// Test Rendering EJS
if(ejsHtml !== "<h1>Hello, World!</h1>"){
  staticSiteGenerator.logger.error("EJS failed");
  process.exit(-1);
}else{
  staticSiteGenerator.logger.success("EJS passed");
}

//  Test Rendering MOE
if(moeHtml !== "<h1>Hello, World!</h1>"){
  staticSiteGenerator.logger.error("Moe failed");
  process.exit(-1);
}else{
  staticSiteGenerator.logger.success("Moe passed");
}

// All Tests Passed
staticSiteGenerator.logger.info("all tests passed!");
})();
