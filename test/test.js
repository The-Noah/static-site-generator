const path = require("path");
const {staticSiteGenerator} = require("../dist");

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  cyan: "\x1b[36m"
};

const tests = [];
const assert = (name, a, b) => {
  process.stdout.write(`test ${name} ... `);

  const passed = a === b;

  if(passed){
    process.stdout.write(`${COLORS.green}passed`);
  }else{
    process.stdout.write(`${COLORS.red}failed`);
  }
  console.log(COLORS.reset);

  if(!passed){
    console.log(`got '${COLORS.cyan}${a}${COLORS.reset}' expected '${COLORS.cyan}${b}${COLORS.reset}'`);
  }

  tests.push({name, passed});
};

staticSiteGenerator.logger.level = 4; // supress all output except errors
console.log(); // seperates ssg's info output

// top level async
(async () => {

const data = await staticSiteGenerator.getData();
const ejsHtml = await staticSiteGenerator.renderPage(path.join(staticSiteGenerator.options.srcDir, "index.ejs"), {message: "Hello, World!"});
const moeHtml = await staticSiteGenerator.renderPage(path.join(staticSiteGenerator.options.srcDir, "moe.moe"), {message: "Hello, World!"});

assert("SCSS", data.css.style, "h1{color:red}\n");

assert("TypeScript", data.js.app, "let message=\"Hello, World!\";");

assert("JSON", data.blog[0].date, "2020-5-6");

assert("YAML", data.test.test, "hello")

assert("EJS", ejsHtml, "<h1>Hello, World!</h1>");

assert("MOE", moeHtml, "<h1>Hello, World!</h1>");

assert("SVG", data.svg.test, "<svg width=\"10\" height=\"20\">test</svg>")

const failedCount = tests.filter((test) => !test.passed).length;

console.log();
console.log(`${tests.length} tests complete`);
console.log(`  ${COLORS.green}✔${COLORS.reset} ${tests.length - failedCount} passed`);
console.log(`  ${COLORS.red}✘${COLORS.reset} ${failedCount} failed`);

})();
