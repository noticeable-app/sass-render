# SASS Render

This project makes your SASS modular, and importable by any Web Component libraries you want to use.

By default, this utility compiles SASS files to TypeScript style templates using 
the [lit](https://lit.dev) `css` tag function.
Although this is quite opinionated, you can easily change the output template and the generated file extension.

## Installation

You can install `sass-render` as a dev dependency in your current project:

```
npm install @noticeable/sass-render --save-dev
```

```
yarn add @noticeable/sass-render --dev
```

or as a global package to have the command `sass-render` available everywhere:

```
npm install --global @noticeable/sass-render
```

```
yarn global add @noticeable/sass-render
```


## Usage & options

For a list of complete options, run `sass-render --help`.

### Simple usage

Rendering a `./src/components/button-css.ts` file:

```
sass-render ./src/components/button.scss
```

### Compile directory

Rendering all scss files in a directory, recursively:

```
sass-render ./src/**/*.scss
```

### Compile multiple files or directories

Rendering multiple scss files and directories, recursively:

```
sass-render ./src/**/*.scss ./lib/component.scss
```

### Watching

Use `-w` to watch for changes:

```
sass-render ./src/**/*.scss -w
```

Files will be outputted as `[name]-css.ts`.

### Custom template

Use `-t` to specify the file you'd like to use as a template. `sass-render` will replace `<% content %>` in the file with the generated output:

```
sass-render ./src/components/button-css.js -t css-template.js
```

### Expanded CSS

Use `-e` to enable expanded rendering of output CSS. Render SASS outputs CSS as 'compressed' by default, which may cause parsing errors for some projects.

```
sass-render ./src/components/button-css.js -t -e css-template.js
```

### Custom suffix

Files will be outputted as `[name]-css.ts`. If file is `button.scss`, outputted file will be `button-css.ts`. This can be changed with the `--suffix` option.

If you use a `-` (dash) in your suffix name, eg: `--suffix '-css.js'`, then quotation marks are needed around the suffix (to tell bash it's not another flag).

### Import custom libraries

By default, sass-render will include the `node_modules` relative to the current directory. Passing the `-i` allows you to include custom directories. You can include multiple directories by separating them with a comma:

```
sass-render ./src/**/*.scss -i '../sass-lib/'
sass-render ./src/**/*.scss -i '../sass-lib/, ../another-lib'
```

### Importing

Once your SASS files are converted into TypeScript or JavaScript files, you can use them inside a library like 
`lit`. Here is a TypeScript example:

```typescript
import {CSSResult, LitElement, TemplateResult, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {styles} from './my-button-css';

@customElement('my-button')
export class MyButton extends LitElement {

    static get styles(): CSSResult {
        return styles;
    }

    protected render(): TemplateResult {
        return html`<button><slot>Submit</slot></button>`;
    }

}
```

## Credits

This project is inspired by [Google's Material Web Component Sass Render](https://github.com/material-components/material-components-web-components/tree/master/scripts/sass-render).
It has been expanded to make the code reusable for other projects and to support recursive directory parsing.

The original code is a fork of https://github.com/tristanMatthias/wc-sass-render/tree/dc4a15718a7e23532807f45bb09e20edfd10cedd.
