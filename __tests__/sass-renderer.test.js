const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const Renderer = require('../sass-renderer');

const readFile = promisify(fs.readFile);
const deleteFile = promisify(fs.unlink);
const stat = promisify(fs.stat);

const DEFAULT_OPTIONS = require('../sass-renderer').DEFAULT_OPTIONS;

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
    afterAll(deleteRenders);

    describe('Setup class', () => {
        it('should create a SassRenderer class', () => {
            const r = new Renderer();
            expect(r).toBeInstanceOf(Renderer);
        });

        it('should have the right methods', () => {
            const r = new Renderer();
            expect(typeof r.css).toBe('function');
            expect(typeof r.render).toBe('function');
        });

        it('should have default options', () => {
            const r = new Renderer();
            Object.keys(DEFAULT_OPTIONS).forEach(o => {
                expect(r[o]).toBe(DEFAULT_OPTIONS[o]);
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
            expect(r.delim).toBe(customOptions.delim);
            expect(r.include).toBe(customOptions.include);
            expect(r.template).toBe(customOptions.template);
            expect(r.suffix).toBe(customOptions.suffix);
            expect(r.expandedOutput).toBe(customOptions.expandedOutput);
        });
    });

    describe('Rendering', () => {
        it('should compile sass to a string with css(src)', async () => {
            const r = new Renderer();
            const css = await r.css(path.resolve(__dirname, 'test.scss'));
            expect(css).toBe('a{color:red}');
        });

        it('should create a new file with render(src)', async () => {
            const r = new Renderer();
            await r.render(INPUT_FILE_DEFAULT);
            expect(await stat(OUTPUT_FILE_DEFAULT)).toBeTruthy();
        });

        it('should render SASS into a new file with render(src)', async () => {
            const r = new Renderer();
            await r.render(INPUT_FILE_DEFAULT);
            const cssModule = (await readFile(OUTPUT_FILE_DEFAULT)).toString();
            expect(cssModule).toBe(OUTPUT_EXPECTED_DEFAULT);
        });

        it('should render SASS into a custom file with render(src, output)', async () => {
            const r = new Renderer();
            await r.render(INPUT_FILE_DEFAULT, OUTPUT_FILE_CUSTOM);
            expect(await stat(OUTPUT_FILE_CUSTOM)).toBeTruthy();
        });

        it('should replace CSS single escape characters with double escapes', async () => {
            const r = new Renderer();
            await r.render(INPUT_FILE_ESCAPE, OUTPUT_FILE_ESCAPE);
            const cssModule = (await readFile(OUTPUT_FILE_ESCAPE)).toString();
            expect(cssModule).toBe(OUTPUT_EXPECTED_ESCAPE);
        });
    });

    describe('Configuration', () => {
        it('renders with a custom template', async () => {
            const r = new Renderer({ template: INPUT_FILE_TEMPLATE });
            await r.render(INPUT_FILE_DEFAULT);
            const cssModule = (await readFile(OUTPUT_FILE_DEFAULT)).toString();
            expect(cssModule).toBe(OUTPUT_EXPECTED_CUSTOM);
        });

        it('renders with a custom delimiter', async () => {
            const r = new Renderer({
                template: INPUT_FILE_DELIM,
                delim: new RegExp("{{styles}}"),
            });
            await r.render(INPUT_FILE_DEFAULT);
            const cssModule = (await readFile(OUTPUT_FILE_DEFAULT)).toString();
            expect(cssModule).toBe(OUTPUT_EXPECTED_CUSTOM);
        });

        it('throws error if no match found', async () => {
            const r = new Renderer({ template: INPUT_FILE_DELIM });
            await expect(r.render(INPUT_FILE_DEFAULT)).rejects.toThrow(/Template file .* did not contain template delimiters/);
        });

        it('renders with a custom suffix', async () => {
            const r = new Renderer({ suffix: '-styles.ts' });
            await r.render(INPUT_FILE_DEFAULT);
            const cssModule = (await readFile(OUTPUT_FILE_CUSTOM)).toString();
            expect(cssModule).toBe(OUTPUT_EXPECTED_DEFAULT);
        });

        it('renders with a custom SASS lib includes', async () => {
            const r = new Renderer({
                template: INPUT_FILE_TEMPLATE,
                include: [path.resolve(__dirname, '../test-templates')],
            });
            await r.render(path.resolve(__dirname, 'test-with-include.scss'), OUTPUT_FILE_DEFAULT);
            const cssModule = (await readFile(OUTPUT_FILE_DEFAULT)).toString();
            expect(cssModule).toBe(OUTPUT_EXPECTED_LIB);
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
            expect(cssModule).toBe(OUTPUT_EXPECTED_MULTI_LIB);
        });
    });
});
