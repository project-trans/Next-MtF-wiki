import { formatWithOptions } from 'node:util';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { hugoShortcode } from 'micromark-extension-md-hugo-marker';
import { hugoShortcodeFromMarkdown } from './lib/index.js';

const options = {
  noSelfClosingElements: ['ref', 'mtf-wiki', 'telephone'],
};

const ast = fromMarkdown(
  '{{< shields/qq 717099350 "https://jq.qq.com/?_wv=1027&k=byC0cbS4" />}}',
  {
    extensions: [hugoShortcode()],
    mdastExtensions: [hugoShortcodeFromMarkdown(options)],
  },
);

console.log(formatWithOptions({ colors: true, depth: null }, ast));
