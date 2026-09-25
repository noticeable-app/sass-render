#!/usr/bin/env node

import path from 'node:path';
import chokidar from 'chokidar';
import picomatch from 'picomatch';
import { glob } from 'tinyglobby';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import Renderer from '../sass-renderer.js';

const o = yargs(hideBin(process.argv))
    .command('$0 [input..]', 'Compile Sass to a template')
    .option('output', {
        alias: 'o',
        type: 'string',
        describe: 'Output file path'
    })
    .option('template', {
        alias: 't',
        type: 'string',
        describe: 'Template file to use, must use `<% content %>` as delimiter'
    })
    .option('watch', {
        alias: 'w',
        type: 'boolean',
        describe: 'Watch the file system for changes and render automatically'
    })
    .option('expanded', {
        alias: 'e',
        type: 'boolean',
        describe: 'Output CSS in expanded format (renders compressed by default).',
    })
    .option('help', {
        alias: 'h',
        type: 'boolean',
        describe: 'Print this message.',
    })
    .option('include', {
        alias: 'i',
        type: 'string',
        describe: 'Include directory for @imports (EG: node_modules)'
    })
    .option('suffix', {
        type: 'string',
        describe: 'Suffix for the rendered file',
    })
    .option('quiet', {
        alias: 'q',
        type: 'boolean',
        describe: 'No logs'
    })
    .parse();

let include = o.include;
if (include) include = include
    .split(',')
    .map(i => path.resolve(process.cwd(), i.trim()));

const converter = new Renderer({
    template: o.template,
    include,
    suffix: o.suffix,
    expandedOutput: o.expanded
});

function render(fp) {
    if (path.basename(fp).startsWith('_')) return false;
    if (!o.quiet) console.log(`Rendering ${fp}...`);

    converter.render(fp, o.output).catch((err) => {
        console.error(err);
        process.exit(-1);
    }).then(() => {
        if (!o.quiet) console.log(`Complete!`);
    });
}

(await glob(o.input, { expandDirectories: false })).forEach(render);

if (o.watch) {
    if (!o.quiet) console.log(`Watching ${o.input} for changes...`);

    // chokidar watches directories, not globs: watch the static base of each pattern and keep
    // the files the patterns match
    const patterns = o.input.map(p => p.replace(/^\.\//, ''));
    const matches = picomatch(patterns);
    const bases = [...new Set(patterns.map(p => picomatch.scan(p).base || '.'))];

    chokidar.watch(bases, {
        ignoreInitial: true,
        ignored: (fp, stats) => /(^|[\\/])(node_modules|\.git)([\\/]|$)/.test(fp)
            || (stats?.isFile() === true && !matches(path.relative(process.cwd(), fp))),
    })
        .on('change', render)
        .on('add', render)
        .on('error', err => console.error(err));
}
