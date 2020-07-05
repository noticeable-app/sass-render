const fs = require('fs');
const path = require('path');
const util = require('util');
const sass = require('node-sass');

const renderSass = util.promisify(sass.render);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const DEFAULT_OPTIONS = {
    delim: /<%\s*content\s*%>/,
    include: [path.resolve(process.cwd(), 'node_modules')],
    template: path.resolve(__dirname, 'sass-template.tmpl'),
    suffix: '-css.ts',
    expandedOutput: false
};

module.exports = class SassRenderer {
    constructor(options = {}) {
        const settings = {...DEFAULT_OPTIONS};

        if (options.delim !== undefined) settings.delim = options.delim;
        if (options.include !== undefined) settings.include = options.include;
        if (options.template !== undefined) settings.template = options.template;
        if (options.suffix !== undefined) settings.suffix = options.suffix;
        if (options.expandedOutput !== undefined) settings.expandedOutput = options.expandedOutput;

        Object.assign(this, settings);
    }

    async css(sassFile) {
        let result = (await renderSass({
            file: sassFile,
            includePaths: this.include,
            outputStyle: this.expandedOutput ? 'expanded' : 'compressed',
        })).css.toString();

        return result.trim().replace(/\\/g, "\\\\");
    }

    async render(source, output) {
        const {
            delim,
            template,
            suffix
        } = this;
        const tmp = await readFile(template, 'utf-8');
        const match = delim.exec(tmp);

        if (!match) {
            throw new Error(`Template file ${template} did not contain template delimiters`);
        }

        const newContent = tmp.replace(delim, await this.css(source));

        if (!output) {
            output = `${source.split('.').slice(0, -1).join('.')}${suffix}`;
        }
        return writeFile(output, newContent, 'utf-8');
    }
}

module.exports.DEFAULT_OPTIONS = DEFAULT_OPTIONS;
