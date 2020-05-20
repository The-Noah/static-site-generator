const path = require("path");
const staticSiteGenerator = require("../dist");

const data = staticSiteGenerator.getData();

staticSiteGenerator.log.info("starting tests...");

if(data.css.style !== "h1{color:red}\n"){
  staticSiteGenerator.log.error("SCSS failed");
  process.exit(-1);
}else{
  staticSiteGenerator.log.success("SCSS passed");
}

if(data.js.app === "alert(\"Hello, World!\");\n"){
  staticSiteGenerator.log.error("TypeScript failed");
  process.exit(-1);
}else{
  staticSiteGenerator.log.success("TypeScript passed");
}

if(data.blog[0].date === "2020-5-6\n"){
  staticSiteGenerator.log.error("JSON failed");
  process.exit(-1);
}else{
  staticSiteGenerator.log.success("JSON passed");
}

staticSiteGenerator.renderPage(path.join(staticSiteGenerator.options.srcDir, "index.ejs"), {message: "Hello, World!"}, (html) => {
  if(html === "<h1>Hello, World!</h1>\n"){
    staticSiteGenerator.log.error("EJS failed");
    process.exit(-1);
  }else{
    staticSiteGenerator.log.success("EJS passed");
  }
});

staticSiteGenerator.log.success("all tests passed!");
