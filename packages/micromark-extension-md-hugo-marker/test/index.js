/* eslint-disable unicorn/prefer-structured-clone -- Casting to JSON drops instance stuff. */

/**
 * @import {Node, Program} from 'estree'
 * @import {CompileContext, Handle} from 'micromark-util-types'
 * @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { micromark } from 'micromark';
import { hugoShortcode } from '../dev/lib/syntax.js';

/** @type {HtmlExtension} */
const html = {
  enter: { hugoShortcodeFlow: start, hugoShortcodeText: start },
  exit: { hugoShortcodeFlow: end, hugoShortcodeText: end },
};

/**
 * @this {CompileContext}
 * @type {Handle}
 */
function start() {
  this.buffer();
}

/**
 * @this {CompileContext}
 * @type {Handle}
 */
function end() {
  this.resume();
  this.setData('slurpOneLineEnding', true);
}

test('core', async (t) => {
  await t.test('should support a self-closing element', async () => {
    assert.equal(
      micromark('a {{< b / >}} c.', {
        extensions: [hugoShortcode()],
        htmlExtensions: [html],
      }),
      '<p>a  c.</p>',
    );
  });

  await t.test('should support a closed element', async () => {
    assert.equal(
      micromark('a {{< b >}}{{< /b >}} c.', {
        extensions: [hugoShortcode()],
        htmlExtensions: [html],
      }),
      '<p>a  c.</p>',
    );
  });

  await t.test('should support markdown inside elements', async () => {
    assert.equal(
      micromark('a {{< b >}}*b*{{< /b >}} c.', {
        extensions: [hugoShortcode()],
        htmlExtensions: [html],
      }),
      '<p>a <em>b</em> c.</p>',
    );
  });
});

test('text (agnostic)', async (t) => {
  await t.test('should support a self-closing element', async () => {
    assert.equal(
      micromark('a {{< b / >}} c', {
        extensions: [hugoShortcode()],
        htmlExtensions: [html],
      }),
      '<p>a  c</p>',
    );
  });

  await t.test('should support a closed element', async () => {
    assert.equal(
      micromark('a {{< b >}} c {{< /b >}} d', {
        extensions: [hugoShortcode()],
        htmlExtensions: [html],
      }),
      '<p>a  c  d</p>',
    );
  });

  await t.test('should support an unclosed element', async () => {
    assert.equal(
      micromark('a {{< b >}} c', {
        extensions: [hugoShortcode()],
        htmlExtensions: [html],
      }),
      '<p>a  c</p>',
    );
  });

  await t.test('should support an attribute', async () => {
    assert.equal(
      micromark('a {{< b c="d" >}} d', {
        extensions: [hugoShortcode()],
        htmlExtensions: [html],
      }),
      '<p>a  d</p>',
    );
  });
});

test('flow (agnostic)', async (t) => {
  await t.test('should support a self-closing element', async () => {
    assert.equal(
      micromark('{{< b / >}}', {
        extensions: [hugoShortcode()],
        htmlExtensions: [html],
      }),
      '',
    );
  });

  await t.test('should support a closed element', async () => {
    assert.equal(
      micromark('{{< b >}}{{< /b >}}', {
        extensions: [hugoShortcode()],
        htmlExtensions: [html],
      }),
      '',
    );
  });

  await t.test('should support an element w/ content', async () => {
    assert.equal(
      micromark('{{< b >}}\nb\n{{< /b >}}', {
        extensions: [hugoShortcode()],
        htmlExtensions: [html],
      }),
      '<p>b</p>\n',
    );
  });

  await t.test('should support attributes', async () => {
    assert.equal(
      micromark('{{< b c="d" >}}', {
        extensions: [hugoShortcode()],
        htmlExtensions: [html],
      }),
      '',
    );
  });

  await t.test('should support unnamed attributes', async () => {
    assert.equal(
      micromark('{{< b c >}}', {
        extensions: [hugoShortcode()],
        htmlExtensions: [html],
      }),
      '',
    );
  });

  await t.test('should support unnamed attributes', async () => {
    assert.equal(
      micromark('{{< b "c" >}}', {
        extensions: [hugoShortcode()],
        htmlExtensions: [html],
      }),
      '',
    );
  });

  await t.test('should support multiline attributes', async () => {
    assert.equal(
      micromark('{{< b `c\nd` >}}', {
        extensions: [hugoShortcode()],
        htmlExtensions: [html],
      }),
      '',
    );
  });

  await t.test('should not support multiline attributes', async () => {
    assert.equal(
      micromark('{{< b "c\nd" >}}', {
        extensions: [hugoShortcode()],
        htmlExtensions: [html],
      }),
      '<p>{{&lt; b &quot;c\nd&quot; &gt;}}</p>',
    );
  });
});
