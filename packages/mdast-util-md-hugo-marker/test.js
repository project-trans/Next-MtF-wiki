import assert from 'node:assert/strict';
import test from 'node:test';
import * as acorn from 'acorn';
import { fromMarkdown } from 'mdast-util-from-markdown';
import {
  hugoShortcodeFromMarkdown,
  hugoShortcodeToMarkdown,
} from 'mdast-util-md-hugo-marker';
import { toMarkdown } from 'mdast-util-to-markdown';
import { hugoShortcode } from 'micromark-extension-md-hugo-marker';
import { removePosition } from 'unist-util-remove-position';

test('core', async (t) => {
  await t.test('should expose the public api', async () => {
    assert.deepEqual(
      Object.keys(await import('mdast-util-md-hugo-marker')).sort(),
      ['hugoShortcodeFromMarkdown', 'hugoShortcodeToMarkdown'],
    );
  });
});

test('hugoShortcodeFromMarkdown', async (t) => {
  await t.test('should support flow hugo shortcode (agnostic)', async () => {
    const tree = fromMarkdown('{{< figure / >}}', {
      extensions: [hugoShortcode()],
      mdastExtensions: [hugoShortcodeFromMarkdown()],
    });
    assert.deepEqual(tree, {
      type: 'root',
      children: [
        {
          type: 'hugoShortcodeFlowElement',
          name: 'figure',
          arguments: [],
          notation: 'standard',
          children: [],
          position: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 15, offset: 14 },
          },
        },
      ],
      position: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 15, offset: 14 },
      },
    });
  });

  await t.test(
    'should support flow hugo shortcode (agnostic) w/ just whitespace',
    async () => {
      const tree = fromMarkdown('{{< x >}}\t \n{{< /x >}}', {
        extensions: [hugoShortcode()],
        mdastExtensions: [hugoShortcodeFromMarkdown()],
      });

      removePosition(tree, { force: true });

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {
            type: 'hugoShortcodeFlowElement',
            name: 'x',
            arguments: [],
            notation: 'standard',
            children: [],
          },
        ],
      });
    },
  );

  await t.test(
    'should support self-closing text hugo shortcode (agnostic)',
    async () => {
      const tree = fromMarkdown('a {{< figure / >}} c.', {
        extensions: [hugoShortcode()],
        mdastExtensions: [hugoShortcodeFromMarkdown()],
      });

      removePosition(tree, { force: true });

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', value: 'a ' },
              {
                type: 'hugoShortcodeTextElement',
                name: 'figure',
                arguments: [],
                notation: 'standard',
                children: [],
              },
              { type: 'text', value: ' c.' },
            ],
          },
        ],
      });
    },
  );

  await t.test(
    'should support a closed text hugo shortcode (agnostic)',
    async () => {
      const tree = fromMarkdown('a {{< figure >}}{{< /figure >}} c.', {
        extensions: [hugoShortcode()],
        mdastExtensions: [hugoShortcodeFromMarkdown()],
      });

      removePosition(tree, { force: true });

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', value: 'a ' },
              {
                type: 'hugoShortcodeTextElement',
                name: 'figure',
                arguments: [],
                notation: 'standard',
                children: [],
              },
              { type: 'text', value: ' c.' },
            ],
          },
        ],
      });
    },
  );

  await t.test(
    'should support text hugo shortcode (agnostic) w/ content',
    async () => {
      const tree = fromMarkdown('a {{< figure >}}content{{< /figure >}} d.', {
        extensions: [hugoShortcode()],
        mdastExtensions: [hugoShortcodeFromMarkdown()],
      });

      removePosition(tree, { force: true });

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', value: 'a ' },
              {
                type: 'hugoShortcodeTextElement',
                name: 'figure',
                arguments: [],
                notation: 'standard',
                children: [{ type: 'text', value: 'content' }],
              },
              { type: 'text', value: ' d.' },
            ],
          },
        ],
      });
    },
  );

  await t.test(
    'should support text hugo shortcode (agnostic) w/ markdown content',
    async () => {
      const tree = fromMarkdown('a {{< figure >}}*content*{{< /figure >}} d.', {
        extensions: [hugoShortcode()],
        mdastExtensions: [hugoShortcodeFromMarkdown()],
      });

      removePosition(tree, { force: true });

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', value: 'a ' },
              {
                type: 'hugoShortcodeTextElement',
                name: 'figure',
                arguments: [],
                notation: 'standard',
                children: [
                  {
                    type: 'emphasis',
                    children: [{ type: 'text', value: 'content' }],
                  },
                ],
              },
              { type: 'text', value: ' d.' },
            ],
          },
        ],
      });
    },
  );

  await t.test(
    'should support positional arguments in text hugo shortcode (agnostic)',
    async () => {
      const tree = fromMarkdown('a {{< figure "image.jpg" "alt text" />}} c', {
        extensions: [hugoShortcode()],
        mdastExtensions: [hugoShortcodeFromMarkdown()],
      });

      removePosition(tree, { force: true });

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', value: 'a ' },
              {
                type: 'hugoShortcodeTextElement',
                name: 'figure',
                arguments: [
                  {
                    type: 'hugoShortcodeArgumentPositional',
                    value: 'image.jpg',
                    position: {
                      start: { line: 1, column: 13, offset: 12 },
                      end: { line: 1, column: 24, offset: 23 },
                    },
                  },
                  {
                    type: 'hugoShortcodeArgumentPositional',
                    value: 'alt text',
                    position: {
                      start: { line: 1, column: 25, offset: 24 },
                      end: { line: 1, column: 35, offset: 34 },
                    },
                  },
                ],
                notation: 'standard',
                children: [],
              },
              { type: 'text', value: ' c' },
            ],
          },
        ],
      });
    },
  );

  await t.test(
    'should support named arguments in text hugo shortcode (agnostic)',
    async () => {
      const tree = fromMarkdown(
        'a {{< figure src="image.jpg" alt="alt text" >}} d',
        {
          extensions: [hugoShortcode()],
          mdastExtensions: [hugoShortcodeFromMarkdown()],
        },
      );

      removePosition(tree, { force: true });

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', value: 'a ' },
              {
                type: 'hugoShortcodeTextElement',
                name: 'figure',
                arguments: [
                  {
                    type: 'hugoShortcodeArgumentNamed',
                    name: 'src',
                    value: 'image.jpg',
                    position: {
                      start: { line: 1, column: 13, offset: 12 },
                      end: { line: 1, column: 29, offset: 28 },
                    },
                  },
                  {
                    type: 'hugoShortcodeArgumentNamed',
                    name: 'alt',
                    value: 'alt text',
                    position: {
                      start: { line: 1, column: 30, offset: 29 },
                      end: { line: 1, column: 44, offset: 43 },
                    },
                  },
                ],
                notation: 'standard',
                children: [],
              },
              { type: 'text', value: ' d' },
            ],
          },
        ],
      });
    },
  );

  await t.test(
    'should support markdown notation hugo shortcode (agnostic)',
    async () => {
      const tree = fromMarkdown('a {{% figure src="image.jpg" %}} d', {
        extensions: [hugoShortcode()],
        mdastExtensions: [hugoShortcodeFromMarkdown()],
      });

      removePosition(tree, { force: true });

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', value: 'a ' },
              {
                type: 'hugoShortcodeTextElement',
                name: 'figure',
                arguments: [
                  {
                    type: 'hugoShortcodeArgumentNamed',
                    name: 'src',
                    value: 'image.jpg',
                    position: {
                      start: { line: 1, column: 13, offset: 12 },
                      end: { line: 1, column: 29, offset: 28 },
                    },
                  },
                ],
                notation: 'markdown',
                children: [],
              },
              { type: 'text', value: ' d' },
            ],
          },
        ],
      });
    },
  );

  await t.test(
    'should support whitespace in the opening shortcode (named)',
    async () => {
      const tree = fromMarkdown('a {{< figure\t>}}content{{< /figure >}}', {
        extensions: [hugoShortcode()],
        mdastExtensions: [hugoShortcodeFromMarkdown()],
      });

      removePosition(tree, { force: true });

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', value: 'a ' },
              {
                type: 'hugoShortcodeTextElement',
                name: 'figure',
                arguments: [],
                notation: 'standard',
                children: [{ type: 'text', value: 'content' }],
              },
            ],
          },
        ],
      });
    },
  );

  // await t.test(
  //   'should support non-ascii identifier start characters',
  //   async () => {
  //     const tree = fromMarkdown('{{< π >}}', {
  //       extensions: [hugoShortcode()],
  //       mdastExtensions: [hugoShortcodeFromMarkdown()]
  //     })

  //     removePosition(tree, {force: true})

  //     assert.deepEqual(tree, {
  //       type: 'root',
  //       children: [
  //         {
  //           type: 'hugoShortcodeFlowElement',
  //           name: 'π',
  //           arguments: [],
  //           notation: 'standard',
  //                   children: []
  //         }
  //       ]
  //     })
  //   }
  // )

  // await t.test(
  //   'should support non-ascii identifier continuation characters',
  //   async () => {
  //     const tree = fromMarkdown('{{< a\u200Cb >}}', {
  //       extensions: [hugoShortcode()],
  //       mdastExtensions: [hugoShortcodeFromMarkdown()]
  //     })

  //     removePosition(tree, {force: true})

  //     assert.deepEqual(tree, {
  //       type: 'root',
  //       children: [
  //         {
  //           type: 'hugoShortcodeFlowElement',
  //           name: 'a‌b',
  //           arguments: [],
  //           notation: 'standard',
  //         children: []
  //         }
  //       ]
  //     })
  //   }
  // )
});
