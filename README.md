# SASS Render

This project makes your SASS modular, and importable by any Web Component libraries you want to use.

It compiles SASS files to JavaScript/TypeScript style templates.

## Motivation

> This project is inspired by [Google's Material Web Component Sass Render](https://github.com/material-components/material-components-web-components/tree/master/scripts/sass-render).
> It has been expanded to make the code reusable from other projects and to support recursive directory parsing.

The original code is a fork of https://github.com/tristanMatthias/wc-sass-render/tree/dc4a15718a7e23532807f45bb09e20edfd10cedd.

## Installation

```
yarn global add @noticeable-app/sass-render
```

This will install `sass-render` as a global CLI tool.

## Usage & options

For a list of complete options, run `sass-render --help`.

**Simple usage**
Renders a `./src/components/button-css.js` file
```
sass-render ./src/components/button.scss
```

**Compile directory**
Renders all scss files in recursively in directory with a custom template
```
sass-render ./src/**/*.scss -t css-template.js
```

**Compile multiple files or directories**
Renders all scss files in recursively in directory with a custom template
```
sass-render ./src/**/*.scss ./lib/component.scss -t css-template.js
```

**Watching**
Use `-w` to watch for changes
```
sass-render ./src/**/*.scss -w
```
Files will be outputted as `[name]-css.js`. EG: If file is `button.scss`, outputted file will be `button-css.js`.

**Custom template**
Use `-t` to specify the file you'd like to use as a template. `sass-render` will replace `<% content %>` in the file.
```
sass-render ./src/components/button-css.js -t css-template.js
```

**Expanded CSS**
Use `-e` to enable expanded rendering of output CSS. Render SASS outputs CSS as 'compressed' by default, which may cause parsing errors for some projects.
```
sass-render ./src/components/button-css.js -t -e css-template.js
```

**Custom suffix**
Files will be outputted as `[name]-css.js`. EG: If file is `button.scss`, outputted file will be `button-css.js`. This can be changed with the `--suffix` option.

**NOTE**: if you use a `-` (dash) in your suffix name, eg: `--suffix '-css.js'`, then quotation marks are needed around the suffix (to tell bash it's not another flag)

**Import custom libraries**
By default, wc-sass-render will include the `node_modules` relative to the current directory. Passing the `-i` allows you to include custom directories. You can include multiple directories by comma separating them.

```
sass-render ./src/**/*.scss -i '../sass-lib/'
sass-render ./src/**/*.scss -i '../sass-lib/, ../another-lib'
```


## Importing
Once your SASS files are converted into js/ts files, you can use them inside a library like `lit-element`:

```js
import {html, LitElement} from '@polymer/lit-element';
import CSS from './button-css.js';

export default class Button extends LitElement {
    _render() {
        return html`
            ${CSS}
            <button><slot>Submit</slot></button>
        `;
    }
}
window.customElements.define('my-button', Button);
```


## Custom template
By default, the template is:
```js
import {html} from 'lit-element';
export default html`<style><% content %></style>`;
```

This can be overridden with the `-t` option to your own file. EG:
```js
module.exports.CSS = '<% content %>';
```


## Contributions
All pull requests and contributions are most welcome. Let's make the internet better!


## Moving forward / TODO
- [x] Watch command
- [x] Add tests


## Issues
If you find a bug, please file an issue on the issue tracker on GitHub.


## Credits
The concept of `wc-sass-render` was originally created by Google.
This project is built and maintained by [Tristan Matthias](https://github.com/tristanMatthias).
