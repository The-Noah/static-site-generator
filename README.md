<div align="center">

# Static Site Generator

[![GitHub license](https://img.shields.io/github/license/The-Noah/static-site-generator.svg)](https://github.com/The-Noah/static-site-generator/blob/master/LICENSE)
![GitHub package.json version](https://img.shields.io/github/package-json/v/The-Noah/static-site-generator)
[![npm (scoped)](https://img.shields.io/npm/v/@the-noah/static-site-generator)](https://www.npmjs.com/package/@the-noah/static-site-generator)

Generate an optimized static website, or use at run-time with a custom server.

</div>

> ⚠ The project is currently under a rewrite. The new v2.0 documentation is below. If you wish to see v1.3.5 docs, they are available [here](https://github.com/The-Noah/static-site-generator/blob/95dd6bde2ed25b1730b90f9f4b369764d8b420cb/README.md).

## Table of Contents

- [Static Site Generator](#static-site-generator)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
- [Documentation](#documentation)
  - [Installation](#installation)
    - [Global](#global)
    - [Project](#project)
  - [Configuration (optional)](#configuration-optional)
  - [Command-Line Interface (CLI)](#command-line-interface-cli)
  - [Library](#library)
    - [Importing](#importing)
    - [`build()`](#build)
    - [`renderPage(pagePath, data)`](#renderpagepagepath-data)
    - [`getData()`](#getdata)
  - [Page Templates](#page-templates)
  - [Understanding How Data is Collected and Used](#understanding-how-data-is-collected-and-used)
    - [CSS & SASS](#css--sass)
    - [JavaScript & TypeScript](#javascript--typescript)
    - [JSON](#json)
    - [YAML](#yaml)
  - [Examples](#examples)
    - [Express Server](#express-server)

## Features

1. Compiles and optimizes SCSS files.
2. Optimizes JavaScript.
3. Compiles TypeScript to JavaScript.
4. Embed data from JSON and YAML files.
5. HTML templates with ejs and moe.
6. Automatically copies static files.
7. Can be used with a custom web server.

# Documentation

## Installation

### Global

Install with: `npm install -g @the-noah/static-site-generator`

### Project

Install with `npm install -s @the-noah/static-site-generator`.

Add `static-site-generator` as a script in your `package.json` to build your website.

## Configuration (optional)

The configuration file must be named `.static-site-generator.config.json` and must be in the root of your project. Configuration is available in `options`.

| Property  | Type     | Default  | Description |
| --------- | -------- | -------- | ----------- |
| srcDir    | `string` | "src"    | Path to look in for files. |
| buildDir  | `string` | "build"  | Path to save final files to. |
| staticDir | `string` | "static" | Path in `srcDir` to look for static files. |
| logLevel  | `number` | 0        | `0` = all, `1` = no info, `2` = no sucess, `3` = no warning, `4` = no error - each level also inherits from the last |
| compressionLevel | Number | 2 | How much to compress files - `0` = none, `3` = max |

## Command-Line Interface (CLI)

Run `static-site-generator` in the root of your project to build your website.

## Library

static-site-generator can be used as a library, such as with a web server.

### Importing

**JavaScript**
```javascript
const {staticSiteGenerator} = require("@the-noah/static-site-generator");
```

**TypeScript**
```typescript
import staticSiteGenerator from "@the-noah/static-site-generator";
```

### `build()`

Renders all pages in `options.srcDir` and saves them in `options.buildDir`, as well as copies all files from `options.srcDir`/`options.staticDir` to `options.buildDir`.

**Returns** `Promise<Record<string, unknown>>`

**Example**
```javascript
await staticSiteGenerator.build();
```

### `renderPage(pagePath, data)`

Renders the page found at `pagePath` with the data `data` and returns a `Promise<string>` containing the minified HTML.

**Returns** `Promise<string>`

| Property | Type                      | Description |
| -------- | ------------------------- | ----------- |
| pagePath | `string`                  | Path of the page to render. |
| data     | `Record<string, unknown>` | Data used to render the page. |

**Example**
```javascript
const html = await staticSiteGenerator.renderPage("index.ejs", {message: "Hello, World!"});
```

### `getData()`

Returns all data from files found in `options.srcDir`.

**Returns** `Promise<Record<string, unknown>>`

**Example**
```javascript
console.log(await staticSiteGenerator.getData());
```

## Page Templates

The following template engines are built-in.

- [ejs](https://www.npmjs.com/package/ejs)
- [moe](https://www.npmjs.com/package/@toptensoftware/moe-js)

You can easily add your own using the `addPageFile` and `addPageHandler` methods.

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
console.log(data.css.main === "h1{color:red}"); // true
```

### JavaScript & TypeScript

`.js` and compiled `.ts` files will be compressed and available as a string under their filename in the `js` object.

**Example**

`app.js` will be compressed then available under `js.app`.

`script.ts` will be compiled and compressed then available under `js.script`.

```javascript
// app.js
alert("Hello, World!");
```

```javascript
console.log(data.js.app === "alert(\"Hello, World!\");"); // true
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
console.log(data.blog[0].date !== "2020-5-6") // true
```

### YAML

`.yaml` and `.yml` files will be available under their filename.

**Example**

`test.yml` will be available under `yml`.

```yaml
message: "hello"
```

```javascript
console.log(data.test.message === "hello"); // true
```

## Examples

### Express Server

```javascript
const path = require("path");

const staticSiteGenerator = require("@the-noah/static-site-generator");
const express = require("express");

const app = express();
const PORT = 3000;

app.get("/", async (req, res) => {
  res.send(staticSiteGenerator.renderPage(path.join(staticSiteGenerator.options.srcDir, "index.ejs"), await staticSiteGenerator.getData());
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
```
