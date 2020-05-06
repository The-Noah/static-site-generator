<div align="center">

# Static Site Generator

[![GitHub license](https://img.shields.io/github/license/The-Noah/static-site-generator.svg)](https://github.com/The-Noah/static-site-generator/blob/master/LICENSE)
![GitHub package.json version](https://img.shields.io/github/package-json/v/The-Noah/static-site-generator)

Generates an optimized static website.

</div>

## Features

1. Compiles and optimizes SCSS files.
2. Optimizes JavaScript.
3. Embed data from JSON.
4. HTML templated with EJS.
5. Automatically copies static files.
6. Can be used with a web server.

# Documentation

## Installation

### Global

Install with: `npm install -g @the-noah/static-site-generator`

### Project

Install with `npm install -s @the-noah/static-site-generator`.

Add `static-site-generator` as a script in your `package.json` to build your website.

## Configuration (optional)

The configuration file is must be named `.static-site-generator.config.json` and must be in the root of your project. Configuration is available in `options`.

| Property | Type   | Default | Description |
| -------- | ------ | ------- | ----------- |
| srcDir   | String | "src" | Path to look in for files. |

## Command-Line Interface (CLI)

Run `static-site-generator` in the root of your project to build your website.

## Library

static-site-generator can be used as a library, such as with a web server.

### Importing

**JavaScript**
```javascript
const staticSiteGenerator = require("@the-noah/static-site-generator");
```

**TypeScript**
```typescript
import * as staticSiteGenerator from "@the-noah/static-site-generator";
```

### renderPage(pagePath, data, callback)

Renders the page found at `pagePath` with the data `data` and calls `callback` with the resulting minified HTML.

**Returns** `void`

| Property | Type     | Description |
| -------- | -------- | ----------- |
| pagePath | String   | Path of the page to render. |
| data     | Object   | Data used to render the page. |
| callback | Function | Called when the page finishes rendering, with the paramater being the HTML as a string. |

**Example**
```TypeScript
staticSiteGenerator.renderPage("index.ejs",  {message: "Hello, World"}, (html: string) => {
  console.log(html);
});
```

### getData()

Returns all data from files found in `options.srcDir`.

**Returns** `Object`

**Example**
```TypeScript
console.log(staticSiteGenerator.getData());
```

## Understanding How Data is Collected and Used

The `getData()` function retrieves data from different files types and mashes it together.

### CSS & SASS

`.css` and compiled `.scss` files will be compressed and available as a string under their filename in the `css` object.

**Example**

`main.css` will be compressed then be available under `css.main`.

`style.scss` will be compiled and compressed then available under `css.style`.

```css
/* main.css */
h1{
  color: red;
}
```

```javascript
console.log(data.css.main === "h1{color:red}") // true
```

### JavaScript

`.js` files will be compressed and available as a string under their filename in the `js` object.

**Example**

`app.js` will be compressed and available under `js.app`.

```javascript
// app.js
alert("Hello, World!");
```

```javascript
console.log(data.js.app === "alert(\"Hello, World!\");") // true
```

### JSON

`.json` files will be available under their filename.

**Example**

`blog.json` will be available under `blog`.

```json
[
  {
    "title": "My New Blog",
    "date": "2020-5-6",
    "text": "This is my new blog where I talk about cats!"
  }
]
```

```javascript
console.log(blog[0].date === "2020-5-6"); // true
```

## Examples

**Express Server**
```javascript
const path = require("path");

const staticSiteGenerator = require("@the-noah/static-site-generator");
const express = require("express");

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  staticSiteGenerator.renderPage(path.join(staticSiteGenerator.options.srcDir, "index.ejs"), staticSiteGenerator.getData(), (html) => {
    res.send(html);
  });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
```
