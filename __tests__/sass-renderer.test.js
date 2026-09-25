import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { after, afterEach, describe, it } from 'node:test';
import Renderer, { DEFAULT_OPTIONS } from '../sass-renderer.js';

const __dirname = import.meta.dirname;

const INPUT_FILE_DEFAULT = path.resolve(__dirname, './test.scss');
const INPUT_FILE_TEMPLATE = path.resolve(__dirname, '../test-templates/otherTemplate.js');
const INPUT_FILE_DELIM = path.resolve(__dirname, '../test-templates/otherDelim.js');
const INPUT_FILE_ESCAPE = path.resolve(__dirname, './test-escape-char.scss');

const OUTPUT_FILE_DEFAULT = path.resolve(__dirname, './test-css.ts');
const OUTPUT_FILE_CUSTOM = path.resolve(__dirname, './test-styles.ts');
const OUTPUT_FILE_ESCAPE = path.resolve(__dirname, './test-escape-char.ts');

const OUTPUT_EXPECTED_DEFAULT = `import {css} from 'lit';

export const styles = css\`a{color:red}\`;\n`;

const OUTPUT_EXPECTED_ESCAPE = `import {css} from 'lit';

export const styles = css\`.char-render{content:""}\`;
`;

const OUTPUT_EXPECTED_CUSTOM = `export default \`<style>a{color:red}</style>\`;\n`;

const OUTPUT_EXPECTED_LIB = `export default \`<style>a{background:blue}</style>\`;\n`;

const OUTPUT_EXPECTED_MULTI_LIB = `export default \`<style>a{background:blue}a{font-weight:bold}</style>\`;\n`;

const deleteRenders = async () => {
    const files = [OUTPUT_FILE_DEFAULT, OUTPUT_FILE_CUSTOM, OUTPUT_FILE_ESCAPE];
    for (const f of files) {
        try {
            if (fs.statSync(f).isFile()) fs.unlinkSync(f);
        } catch (e) {
            // Ignore errors
        }
    }
};

describe('SASS Renderer', () => {
    afterEach(deleteRenders);
    after(deleteRenders);

    describe('Setup class', () => {
        it('should create a SassRenderer class', () => {
            const r = new Renderer();
            assert.ok(r instanceof Renderer);
        });

        it('should have the right methods', () => {
            const r = new Renderer();
            assert.equal(typeof r.css, 'function');
            assert.equal(typeof r.render, 'function');
        });

        it('should have default options', () => {
            const r = new Renderer();
            Object.keys(DEFAULT_OPTIONS).forEach(o => {
                assert.equal(r[o], DEFAULT_OPTIONS[o]);
            });
        });

        it('should allow for and set custom options', () => {
            const customOptions = {
                delim: /{{css}}/,
                include: ['./any'],
                template: '/customTemplate.js',
                suffix: '-styles.js',
                expandedOutput: true,
            };
            const r = new Renderer(customOptions);
            assert.equal(r.delim, customOptions.delim);
            assert.equal(r.include, customOptions.include);
            assert.equal(r.template, customOptions.template);
            assert.equal(r.suffix, customOptions.suffix);
            assert.equal(r.expandedOutput, customOptions.expandedOutput);
        });
    });

    describe('Rendering', () => {
        it('should compile sass to a string with css(src)', async () => {
            const r = new Renderer();
            const css = await r.css(path.resolve(__dirname, 'test.scss'));
            assert.equal(css, 'a{color:red}');
        });

        it('should create a new file with render(src)', async () => {
            const r = new Renderer();
            await r.render(INPUT_FILE_DEFAULT);
            assert.ok(await stat(OUTPUT_FILE_DEFAULT));
        });

        it('should render SASS into a new file with render(src)', async () => {
            const r = new Renderer();
            await r.render(INPUT_FILE_DEFAULT);
            const cssModule = (await readFile(OUTPUT_FILE_DEFAULT)).toString();
            assert.equal(cssModule, OUTPUT_EXPECTED_DEFAULT);
        });

        it('should render SASS into a custom file with render(src, output)', async () => {
            const r = new Renderer();
            await r.render(INPUT_FILE_DEFAULT, OUTPUT_FILE_CUSTOM);
            assert.ok(await stat(OUTPUT_FILE_CUSTOM));
        });

        it('should replace CSS single escape characters with double escapes', async () => {
            const r = new Renderer();
            await r.render(INPUT_FILE_ESCAPE, OUTPUT_FILE_ESCAPE);
            const cssModule = (await readFile(OUTPUT_FILE_ESCAPE)).toString();
            assert.equal(cssModule, OUTPUT_EXPECTED_ESCAPE);
        });
    });

    describe('Configuration', () => {
        it('renders with a custom template', async () => {
            const r = new Renderer({ template: INPUT_FILE_TEMPLATE });
            await r.render(INPUT_FILE_DEFAULT);
            const cssModule = (await readFile(OUTPUT_FILE_DEFAULT)).toString();
            assert.equal(cssModule, OUTPUT_EXPECTED_CUSTOM);
        });

        it('renders with a custom delimiter', async () => {
            const r = new Renderer({
                template: INPUT_FILE_DELIM,
                delim: new RegExp("{{styles}}"),
            });
            await r.render(INPUT_FILE_DEFAULT);
            const cssModule = (await readFile(OUTPUT_FILE_DEFAULT)).toString();
            assert.equal(cssModule, OUTPUT_EXPECTED_CUSTOM);
        });

        it('throws error if no match found', async () => {
            const r = new Renderer({ template: INPUT_FILE_DELIM });
            await assert.rejects(r.render(INPUT_FILE_DEFAULT), /Template file .* did not contain template delimiters/);
        });

        it('renders with a custom suffix', async () => {
            const r = new Renderer({ suffix: '-styles.ts' });
            await r.render(INPUT_FILE_DEFAULT);
            const cssModule = (await readFile(OUTPUT_FILE_CUSTOM)).toString();
            assert.equal(cssModule, OUTPUT_EXPECTED_DEFAULT);
        });

        it('renders with a custom SASS lib includes', async () => {
            const r = new Renderer({
                template: INPUT_FILE_TEMPLATE,
                include: [path.resolve(__dirname, '../test-templates')],
            });
            await r.render(path.resolve(__dirname, 'test-with-include.scss'), OUTPUT_FILE_DEFAULT);
            const cssModule = (await readFile(OUTPUT_FILE_DEFAULT)).toString();
            assert.equal(cssModule, OUTPUT_EXPECTED_LIB);
        });

        it('renders with multiple custom SASS lib includes', async () => {
            const r = new Renderer({
                template: INPUT_FILE_TEMPLATE,
                include: [
                    path.resolve(__dirname, '../test-templates'),
                    path.resolve(__dirname, '../test-templates/nested-include'),
                ],
            });
            await r.render(path.resolve(__dirname, 'test-with-multi-include.scss'), OUTPUT_FILE_DEFAULT);
            const cssModule = (await readFile(OUTPUT_FILE_DEFAULT)).toString();
            assert.equal(cssModule, OUTPUT_EXPECTED_MULTI_LIB);
        });
    });
});
