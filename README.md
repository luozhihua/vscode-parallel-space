# Parallel Editor

> Edit component’s parts(tamplate/script/style) use 3 columns view, It’s layout looks like CodePen/JSFiddle/JSBin, used for Angular components, Vue TypeScript components or other mvc/mvvm components which itself’s templates/scripts/styles parts each as single file wrappered with in the same folder.

---

## Features

1.  Automatically open scripts, templates, style files of the same component in multipe columns;
2.  Supported a variety of template, style, script extnames;

* _Scripts_: `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.es`, `.es6`, `.coffee`, `.dart`
* _Styles_: `.css`, `.scss`, `.sass`, `.less`, `.styl`, `.stylus`
* _Templates_: `.html`, `.htm`, `.xhtml`, `.ejs`, `.jade`, `.pug`, `.hbs`, `.handlebars`, `.haml`, `.tpl`, `.mustache`, `.def`, `.dot`, `.jst`, `.dust`, `.njk`

3.  Automatically identifies the component's constituent files.
4.  Support to adjust the order of `scripts`, `templates`, and `style` columns in `Extension Settings`.
5.  When we cannot identify which files belong to the same component, we will ask you to confirm the correct file that makes up the component and remember your choices.
6.  Remember component's part files status.
7.  (developing) Auto split `single-file component` parts into each column on editting, and merged they are together on save.

---

## Settings

### How to find `Parallel Editor Settings`?

1.  Open `VSCode Settings`
2.  Find `Parallel Editor` section or search for `parallel.` prefix.

### Parallel Editor Settings:

##### - `parallel.cacheDirectory`

* **type:** `string`
* **default:** `.parallel`
* **description:** A directory under the current VSCode Workspace use for saving Parallel Editor's cache files, temp files.

##### - `parallel.scriptExtnames`

* **type:** `array`
* **default:** `[]`
* **built-in:** `['.js', '.jsx', '.ts', '.tsx', '.mjs', '.es', '.es6', '.coffee', '.dart']`
* **description:** A set of extnames used for detect component's script file.
  > **Notes:**
  >
  > * The extnames you setted will be merged into the built-ins and deduplicated.
  >
  > * if you want to exclude built-in script extnames, please use `!` prefix symbol.
  >   <br/><br/> **For example:**
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

##### - `parallel.styleExtnames`

* **type:** `array`
* **default:** `[]`
* **built-in:** `['.css', '.scss', '.sass', '.less', '.styl', '.stylus' ]`
* **description:** A set of extnames used for detect component's style file.

  > **Notes:**
  >
  > * The extnames you setted will be merged into the built-ins and deduplicated.
  >
  > * if you want to exclude built-in style extnames, please use `!` prefix symbol.
  >   <br/><br/> **For example:**
  >
  >   ```javascript
  >   {
  >     // ...
  >     parallel.styleExtnames: [
  >       '!.sass', // excluded built-in extname
  >       '.component.sass', // includes
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

##### - `parallel.templateExtnames`

* **type:** `array`
* **default:** `[]`
* **built-in:** `['.css', '.scss', '.sass', '.less', '.styl', '.stylus' ]`
* **description:** A set of extnames used for detect component's template file.

  > **Notes:**
  >
  > * The extnames you setted will be merged into the built-ins and deduplicated.
  >
  > * if you want to exclude built-in template extnames, please use `!` prefix symbol.
  >   <br/><br/> **For example:**
  >
  >   ```javascript
  >   {
  >     // ...
  >     parallel.templateExtnames: [
  >       '!.html', // excluded built-in extname
  >       '.component.html', // includes
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

##### - `parallel.includeDirectories`

* **type:** `array`
* **default:** `[]`
* **built-in:** `['/components', '/views', '/pages', '/packages']`
* **description:** enable Parallel Editor for those paths and sub paths.

  > **Notes:**
  >
  > The dirs you setted will be merged into the built-ins and deduplicated.

##### - `parallel.columnsOrder`

* **type:** `array`
* **default:** `['script', 'template', 'style']`
* **description:** Set script, template, style panels layout order in the editor.

##### - `(TODO)parallel.splitSingleFileComponentOnEditing`

* **type:** `boolean`
* **default:** `true`
* **description:** whether auto split templates/scripts/style tags in multiple columns view for a single-file component when open it.

##### - `(TODO)parallel.singleFileComponentExtnames`

* **type:** `array`
* **default:** `[]`
* **built-in:** `['.vue', '.we', '.weex']`
* **description:** enable split mode for Single-file Component which with those file extnames.

## Todos

* [ ] Support Single-file Component split editing mode.
* [ ] Detect components parts cross multiple directories.
* [ ] Generate components.

---

### For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
