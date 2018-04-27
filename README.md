# Parallel Editor

[![Licence](https://img.shields.io/github/license/luozhihua/vscode-parallel-components-editor.svg)](https://github.com/HookyQR/VSCodeBeautify)  [![VS Code Marketplace](https://vsmarketplacebadge.apphb.com/version-short/ColinLuo.parallel-editor.svg) ![Rating](https://vsmarketplacebadge.apphb.com/rating/ColinLuo.parallel-editor.svg) ![Installs](https://vsmarketplacebadge.apphb.com/installs/ColinLuo.parallel-editor.svg)](https://marketplace.visualstudio.com/items?itemName=ColinLuo.parallel-editor)

---
An VSCode Extension for editing Vue SFC(Single-file Component), MFC(Multi-file Component) parts(tamplate/script/style) with multi columns layout, It’s layout looks like CodePen/JSFiddle/JSBin.

---

## Issues

Any issues please send to here:

[![Licence](https://img.shields.io/github/issues/luozhihua/vscode-parallel-components-editor.svg)](https://github.com/luozhihua/vscode-parallel-components-editor/issues)

## Features

1. Automatically open scripts, templates, style files of the same component in multipe columns;
1. Supported Vue SFC, Vue MFC, Angular MFC and other components with a specific structured files;
1. Supported a variety of built-in template, style, script extNames and you can extends it simply with `VSCode Settings`;

    > * _Scripts_: `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.es`, `.es6`, `.coffee`, `.dart`
    > * _Styles_: `.css`, `.scss`, `.sass`, `.less`, `.styl`, `.stylus`
    > * _Templates_: `.html`, `.htm`, `.xhtml`, `.ejs`, `.jade`, `.pug`, `.hbs`, `.handlebars`, `.haml`, `.tpl`, `.mustache`, `.def`, `.dot`, `.jst`, `.dust`, `.njk`

1. Automatically identifies the component's constituent files.
1. Support to adjust the columns order of `scripts`, `templates`, and `style` in `VSCode Settings`.
1. Automatically split `VUE SFC (Single-file Component)` blocks (like `<template/>`, `<script/>`, `<style/>`) into standalone temp file on editting, and merged back they are together on saved.
1. Supported to matching component’s part files in the same directory, also cross multiple directories.

---

## How Parallel to matching the part files of components

1. Same named files will be treated as a set of files for the same component.

  ```text
  ┣━ Components
    ├┈ index.ts
    ├┈ common.ts
    ├┈ ...
    ├┈ base-button.ts       ↘
    ├┈ base-button.scss     → BaseButtom component
    ├┈ base-button.html     ↗
    ├┈ ...
    ├┈ Tab.ts               ↘
    ├┈ tab.scss             → Tab component (Case insensitive)
    └┈ tab.html             ↗
  ```

1. In the folder only contains one script file, one style file and one template file will be treated as a component.

  ```text
  ┣━ Components
    ├┈ index.ts
    └┈ Icon
      ├┈ index.ts     ↘
      ├┈ icon.html    → Icon component
      └┈ icon.scss    ↗
    └┈ Avatar
      ├┈ index.tsx    ↘
      └┈ style.scss   → Icon component (no standalone template file, includes in .tsx.)
    └┈ Foo
      └┈ ...
    └┈ Bar
      └┈ ...
  ```

1. Cross directories which you specficed by `parallel.scriptFoldersForCrossMode`, `parallel.styleFoldersForCrossMode`, `parallel.templateFoldersForCrossMode` with in `VS Code Settings`, The files which has the same file name (excludes extName) and a consistent relative path that relatived to the directories specified in the previous Settings are matched for a same component's part files.

  ```text
  ┣━ App
    ├┈ app.coffee
    └┈ views                           ★ (`views` is specificed in Settings)
      └┈ product
        ├┈ product-list.pug     ▔╲
        ├┈ product-item.pug       ╲
        └┈ product-editor.pug      ╲     ▔╲
      └┈ user                       ╲      ╲
        ├┈ list.html                 ╲      ╲
        ├┈ item.html                   +-»...╲... Product List
        └┈ editor.html               ╱        ╲
    ├┈ ...                          ╱          +-»... Product Editor
    └┈ ctrls                       ╱          ╱   ★ (`ctrls` is specificed in Settings)
      └┈ product                  ╱          ╱
        ├┈ product-list.js     __╱          ╱
        ├┈ product-item.js                 ╱
        └┈ product-editor.js            __╱
      └┈ user
        ├┈ list.ts
        ├┈ item.ts
        └┈ editor.ts
    └┈ Foo
      └┈ ...
    └┈ Bar
      └┈ ...
  ```

1. `SFC` like `*.vue` files will splited into multi standalone script/style/template files on editing, and merge they are together after every standalone file saved automatically, Splited standalone files are storing in temp folder with named rules `.vscodeparallel/components/${path_hash}/` under your `project root`.

  ```text
  ┣━ App
    ├┈ main.ts
    ├┈ app.vue
    └┈ Components
      └┈ product
        ├┈ product-list.vue
        ├┈ product-item.vue
        └┈ product-editor.vue
      └┈ user
        ├┈ list.vue                 ↗  item.ts    ↘
        ├┈ item.vue   .....[open]...→  item.less  → ...[saved]...» item.vue
        └┈ editor.vue               ↘  item.html  ↗
    ├┈ store
    ├┈ router
    ├┈ directives
    ├┈ utils
    └┈ mixins
  ```

---

## Settings

1. Open `VSCode Settings`, press `⌘ + ,` key on Mac and `Ctrl + ,` will open `User settings` page.
2. Find `Parallel Editor` section or search for `parallel` prefix.

> ⚠️ NOTE:
> VS Code provided `User Settings` and  `Workspace Settings`, `User Settings` will applyed to all
> Projects, but `Workspace Settings` only apply to current project

## Parallel Editor Settings

### - parallel.componentFolders

* **type:** `array`
* **default:** `[]`
* **built-in:** `['component{s}', 'view{s}', 'page{s}']`
* **description:** [Case insensitive] A set of folder-names or short-paths using for locate components.

### - parallel.scriptFolders

* **type:** `array`
* **default:** `[]`
* **built-in:** `['script{s}', 'controller{s}', 'ctrl{s}',  'javascript{s}', 'typescript{s}', 'coffeescript{s}', ...scriptsExtNames]`
* **description:** [Case insensitive] A set of folder-names or short-paths using for locate script files.

### - parallel.styleFolders

* **type:** `array`
* **default:** `[]`
* **built-in:** `['style{s}', ...styleExtNames]`
* **description:** [Case insensitive] A set of folder-names or short-paths using for locate style files.

### - parallel.templateFolders

* **type:** `array`
* **default:** `[]`
* **built-in:** `['template{s}', 'tpl{s}', 'view{s}', 'page{s}', 'html{s}', ...tempalteExtNames]`
* **description:** [Case insensitive] A set of folder-names or short-paths using for locate template files.

### - `parallel.scriptExtnames`

* **type:** `array`
* **default:** `[]`
* **built-in:** `['.js', '.jsx', '.ts', '.tsx', '.mjs', '.es', '.es6', '.coffee', '.dart']`
* **description:** A set of extnames used for detect component's script file.
  > **Notes:**
  >
  > * The extnames you setted will be merged into the built-ins and deduplicated.
  >
  > * if you want to exclude built-in script extnames, please use `!` prefix symbol.
  >   **For example:**
  >
  >   ```javascript
  >   {
  >     // ...
  >     parallel.scriptExtnames: [
  >       '!.ts', // excluded built-in .ts extname
  >       '!.tsx', // excluded built-in .tsx extname
  >       '.component.ts', // includes
  >     ],
  >     // ...
  >   }
  >   ```
  >
  >   **matched results:**
  >
  >   * [x] `app.component.ts` **(matched)**
  >   * [ ] `app.module.ts`
  >   * [ ] `app.ts`

### - `parallel.styleExtnames`

* **type:** `array`
* **default:** `[]`
* **built-in:** `['.css', '.scss', '.sass', '.less', '.styl', '.stylus' ]`
* **description:** A set of extnames used for detect component's style file.

  > **Notes:**
  >
  > * The extnames you setted will be merged into the built-ins and deduplicated.
  >
  > * if you want to exclude built-in style extnames, please use `!` prefix symbol.
  >   **For example:**
  >
  >   ```javascript
  >   {
  >     // ...
  >     parallel.styleExtnames: [
  >       '!.sass', // excluded built-in .sass extname
  >       '.component.sass', // includes `*.component.sass`
  >     ],
  >     // ...
  >   }
  >   ```
  >
  >   **matched results:**
  >
  >   * [x] `app.component.sass` **(matched)**
  >   * [ ] `app.module.sass`
  >   * [ ] `app.sass`

### - `parallel.templateExtnames`

* **type:** `array`
* **default:** `[]`
* **built-in:** `['.css', '.scss', '.sass', '.less', '.styl', '.stylus' ]`
* **description:** A set of extnames used for detect component's template file.

  > **Notes:**
  >
  > * The extnames you setted will be merged into the built-ins and deduplicated.
  >
  > * if you want to exclude built-in template extnames, please use `!` prefix symbol.
  >   **For example:**
  >
  >   ```javascript
  >   {
  >     // ...
  >     parallel.templateExtnames: [
  >       '!.html', // excluded built-in .html extname
  >       '.component.html', // includes `*.component.html`
  >     ],
  >     // ...
  >   }
  >   ```
  >
  >   **matched results:**
  >
  >   * [x] `app.component.html` **(matched)**
  >   * [ ] `app.module.html`
  >   * [ ] `app.html`

### - `parallel.columnsOrder`

* **type:** `array`
* **default:** `['script', 'template', 'style']`
* **description:** Set script, template, style panels layout order in the editor.

### - `parallel.splitSingleFileComponentOnEditing`

* **type:** `boolean`
* **default:** `true`
* **description:** whether auto split templates/scripts/style tags in multiple columns view for a single-file component when open it.

### - `parallel.singleFileComponentExtnames`

* **type:** `array`
* **default:** `[]`
* **built-in:** `['.vue', '.we', '.weex']`
* **description:** enable split mode for Single-file Component which with those file extnames.

---

## Know Bugs
