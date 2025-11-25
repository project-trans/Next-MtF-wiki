// @ts-nocheck
/**
 * @import {CompileContext, Extension as FromMarkdownExtension, Handle as FromMarkdownHandle, OnEnterError, OnExitError, Token} from 'mdast-util-from-markdown'
 * @import {Handle as ToMarkdownHandle, Options as ToMarkdownExtension, State, Tracker} from 'mdast-util-to-markdown'
 * @import {Point} from 'unist'
 * @import {Nodes} from 'mdast'
 */

/**
 * @typedef HugoShortcodeArgument
 *   Hugo shortcode argument.
 * @property {string} type
 *   Type of argument.
 * @property {string} name
 *   Name of argument.
 * @property {string} value
 *   Value of argument.
 *
 * @typedef Shortcode
 *   Single shortcode.
 * @property {string | undefined} name
 *   Name of shortcode, or `undefined` for fragment.
 * @property {Array<HugoShortcodeArgument>} arguments
 *   Arguments.
 * @property {boolean} close
 *   Whether the shortcode is closing (`{{< /name >}}`).
 * @property {boolean} selfClosing
 *   Whether the shortcode is self-closing (`{{< name / >}}`).
 * @property {'standard' | 'markdown'} notation
 *   Notation type (< for standard, % for markdown).
 * @property {Token['start']} start
 *   Start point.
 * @property {Token['start']} end
 *   End point.
 *
 * @typedef ToMarkdownOptions
 *   Configuration.
 * @property {'"' | "'" | null | undefined} [quote='"']
 *   Preferred quote to use around argument values (default: `'"'`).
 * @property {boolean | null | undefined} [quoteSmart=false]
 *   Use the other quote if that results in less bytes (default: `false`).
 * @property {boolean | null | undefined} [tightSelfClosing=false]
 *   Do not use an extra space when closing self-closing elements: `{{< img/ >}}`
 *   instead of `{{< img / >}}` (default: `false`).
 * @property {number | null | undefined} [printWidth=Infinity]
 *   Try and wrap syntax at this width (default: `Infinity`).
 *
 *   When set to a finite number (say, `80`), the formatter will print
 *   arguments on separate lines when a shortcode doesn't fit on one line.
 *   The normal behavior is to print arguments with spaces between them
 *   instead of line endings.
 *
 * @typedef HugoShortcodeFromMarkdownOptions
 *   Configuration.
 * @property {string[] | null | undefined} [noSelfClosingElements]
 *   Elements that should not be self-closing.
 * @property {(node: Nodes) => Nodes | undefined} [hugoShortcodeElementOnEnterTransform | null | undefined]
 *   Transform the node on enter.
 * @property {(node: Nodes) => Nodes | undefined} [hugoShortcodeElementOnExitTransform | null | undefined]
 *
 * @typedef HugoShortcodeElement
 * @property {string} type
 *   Hugo shortcode flow element.
 * @property {string | null} name
 *   Name of the shortcode.
 * @property {Array<HugoShortcodeArgument>} arguments
 *   Arguments of the shortcode.
 * @property {'standard' | 'markdown'} notation
 *   Notation type (< for standard, % for markdown).
 * @property {Array<Nodes>} children
 *   Children of the shortcode.
 */

import { ccount } from 'ccount';
import { ok as assert } from 'devlop';
import { parseEntities } from 'parse-entities';
import { stringifyEntitiesLight } from 'stringify-entities';
import { stringifyPosition } from 'unist-util-stringify-position';
import { VFileMessage } from 'vfile-message';

const indent = '  ';

/**
 * Create an extension for `mdast-util-from-markdown` to enable Hugo shortcodes.
 * @param {HugoShortcodeFromMarkdownOptions | null | undefined} [options]
 *   Configuration (optional)
 * @returns {FromMarkdownExtension}
 *   Extension for `mdast-util-from-markdown` to enable Hugo shortcodes.
 *
 *   When using the syntax extension with `addResult`, nodes will have a
 *   `data.estree` field set to an ESTree `Program` node.
 */
export function hugoShortcodeFromMarkdown(options) {
  const options_ = options || {};
  const noSelfClosingElements = options_.noSelfClosingElements || [];
  const hugoShortcodeElementOnEnterTransform =
    options_.hugoShortcodeElementOnEnterTransform || null;
  const hugoShortcodeElementOnExitTransform =
    options_.hugoShortcodeElementOnExitTransform || null;
  let inBuffer = false;
  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function thisbuffer() {
    if (inBuffer) {
      // throw new Error('Nested buffer calls are not allowed')
      return;
    }
    inBuffer = true;
    // console.log('buffer', this.sliceSerialize(token))
    this.buffer();
  }

  function thisresume() {
    if (!inBuffer) {
      // throw new Error('resume() called without matching buffer()')
      return;
    }
    inBuffer = false;
    // console.log('resume', this.sliceSerialize(token))
    this.resume();
  }
  return {
    canContainEols: ['hugoShortcodeFlowElement'],
    enter: {
      hugoShortcodeFlow: enterHugoShortcode,
      hugoShortcodeFlowMarker: enterHugoShortcodeMarker,
      hugoShortcodeFlowClosingMarker: enterHugoShortcodeClosingMarker,
      hugoShortcodeFlowNotation: enterHugoShortcodeNotation,
      hugoShortcodeFlowName: enterHugoShortcodeName,
      hugoShortcodeFlowArgument: enterHugoShortcodeArgument,
      hugoShortcodeFlowArgumentNamedKey: thisbuffer,
      // hugoShortcodeFlowArgumentNamedValue: buffer,
      // hugoShortcodeFlowArgumentNamedValueQuoted: buffer,
      hugoShortcodeFlowArgumentNamedValueQuotedValue: thisbuffer,
      hugoShortcodeFlowArgumentNamedValueUnquoted: thisbuffer,
      hugoShortcodeFlowSelfClosingMarker: enterHugoShortcodeSelfClosingMarker,
      hugoShortcodeFlowContent: thisbuffer,

      hugoShortcodeText: enterHugoShortcode,
      hugoShortcodeTextMarker: enterHugoShortcodeMarker,
      hugoShortcodeTextClosingMarker: enterHugoShortcodeClosingMarker,
      hugoShortcodeTextNotation: enterHugoShortcodeNotation,
      hugoShortcodeTextName: enterHugoShortcodeName,
      hugoShortcodeTextArgument: enterHugoShortcodeArgument,
      // hugoShortcodeTextArgumentNamedKey: buffer,
      // // hugoShortcodeTextArgumentNamedValue: buffer,
      // // hugoShortcodeTextArgumentNamedValueQuoted: buffer,
      // hugoShortcodeTextArgumentNamedValueQuotedValue: buffer,
      // hugoShortcodeTextArgumentNamedValueUnquoted: buffer,
      hugoShortcodeTextSelfClosingMarker: enterHugoShortcodeSelfClosingMarker,
      hugoShortcodeTextContent: thisbuffer,
    },
    exit: {
      hugoShortcodeFlowClosingMarker: exitHugoShortcodeClosingMarker,
      hugoShortcodeFlowNotation: exitHugoShortcodeNotation,
      hugoShortcodeFlowName: exitHugoShortcodeName,
      hugoShortcodeFlowArgument: exitHugoShortcodeArgument,
      hugoShortcodeFlowArgumentNamedKey: exitHugoShortcodeArgumentNamedKey,
      // hugoShortcodeFlowArgumentNamedValueQuoted: data,
      hugoShortcodeFlowArgumentNamedValueQuotedValue:
        exitHugoShortcodeArgumentNamedValueQuotedValue,
      hugoShortcodeFlowArgumentNamedValueUnquoted:
        exitHugoShortcodeArgumentNamedValueUnquoted,
      hugoShortcodeFlowSelfClosingMarker: exitHugoShortcodeSelfClosingMarker,
      hugoShortcodeFlowContent: exitHugoShortcodeContent,
      hugoShortcodeFlow: exitHugoShortcode,

      hugoShortcodeTextClosingMarker: exitHugoShortcodeClosingMarker,
      hugoShortcodeTextNotation: exitHugoShortcodeNotation,
      hugoShortcodeTextName: exitHugoShortcodeName,
      hugoShortcodeTextArgument: exitHugoShortcodeArgument,
      hugoShortcodeTextArgumentNamedKey: exitHugoShortcodeArgumentNamedKey,
      // // hugoShortcodeTextArgumentNamedValueQuoted: data,
      hugoShortcodeTextArgumentNamedValueQuotedValue:
        exitHugoShortcodeArgumentNamedValueQuotedValue,
      hugoShortcodeTextArgumentNamedValueUnquoted:
        exitHugoShortcodeArgumentNamedValueUnquoted,
      hugoShortcodeTextSelfClosingMarker: exitHugoShortcodeSelfClosingMarker,
      hugoShortcodeTextContent: exitHugoShortcodeContent,
      hugoShortcodeText: exitHugoShortcode,
    },
  };

  /**
   * Copy a point-like value.
   *
   * @param {Point} d
   *   Point-like value.
   * @returns {Point}
   *   unist point.
   */
  function point(d) {
    return { line: d.line, column: d.column, offset: d.offset };
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function data(token) {
    this.config.enter.data.call(this, token);
    this.config.exit.data.call(this, token);
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function enterHugoShortcode(token) {
    /** @type {Shortcode} */
    const shortcode = {
      name: undefined,
      arguments: [],
      close: false,
      selfClosing: false,
      notation: 'standard',
      start: token.start,
      end: token.end,
    };
    if (!this.data.hugoShortcodeStack) this.data.hugoShortcodeStack = [];
    this.data.hugoShortcode = shortcode;
    //buffer.call(this)
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function enterHugoShortcodeMarker() {
    // Just a marker, no special handling needed
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function enterHugoShortcodeClosingMarker(token) {
    const stack = this.data.hugoShortcodeStack;
    assert(stack, 'expected `hugoShortcodeStack`');

    if (stack.length === 0) {
      throw new VFileMessage(
        'Unexpected closing slash `/` in shortcode, expected an open shortcode first',
        { start: token.start, end: token.end },
        'mdast-util-hugo-shortcode:unexpected-closing-slash',
      );
    }
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function enterHugoShortcodeNotation() {
    // Notation will be set in exit
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function enterHugoShortcodeName() {
    // Name will be set in exit
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function enterHugoShortcodeArgument(token) {
    // console.log('enterHugoShortcodeArgument', this.sliceSerialize(token))

    const shortcode = this.data.hugoShortcode;
    assert(shortcode, 'expected `hugoShortcode`');

    if (shortcode.close) {
      throw new VFileMessage(
        'Unexpected argument in closing shortcode, expected the end of the shortcode',
        { start: token.start, end: token.end },
        'mdast-util-hugo-shortcode:unexpected-argument',
      );
    }

    shortcode.arguments.push({
      type: 'hugoShortcodeArgument',
      name: '',
      value: undefined,
      position: {
        start: point(token.start),
        end: point(token.start),
      },
    });
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function enterHugoShortcodeSelfClosingMarker(token) {
    const shortcode = this.data.hugoShortcode;
    assert(shortcode, 'expected `hugoShortcode`');

    if (shortcode.close) {
      throw new VFileMessage(
        'Unexpected self-closing slash `/` in closing shortcode, expected the end of the shortcode',
        { start: token.start, end: token.end },
        'mdast-util-hugo-shortcode:unexpected-self-closing-slash',
      );
    }
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function exitHugoShortcodeClosingMarker() {
    const shortcode = this.data.hugoShortcode;
    assert(shortcode, 'expected `hugoShortcode`');
    shortcode.close = true;
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function exitHugoShortcodeNotation(token) {
    const shortcode = this.data.hugoShortcode;
    assert(shortcode, 'expected `hugoShortcode`');
    const notation = this.sliceSerialize(token);
    shortcode.notation = notation === '%' ? 'markdown' : 'standard';
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function exitHugoShortcodeName(token) {
    const shortcode = this.data.hugoShortcode;
    assert(shortcode, 'expected `hugoShortcode`');
    shortcode.name = this.sliceSerialize(token);
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function exitHugoShortcodeArgument(token) {
    const shortcode = this.data.hugoShortcode;
    assert(shortcode, 'expected `hugoShortcode`');
    const tail = shortcode.arguments[shortcode.arguments.length - 1];
    assert(tail.type === 'hugoShortcodeArgument');

    assert(tail.position !== undefined);
    tail.position.end = point(token.end);

    if (tail.name === '' || tail.name === undefined) {
      tail.type = 'hugoShortcodeArgumentPositional';
    } else {
      tail.type = 'hugoShortcodeArgumentNamed';
    }
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function exitHugoShortcodeArgumentNamedKey(token) {
    const shortcode = this.data.hugoShortcode;
    assert(shortcode, 'expected `hugoShortcode`');
    const node = shortcode.arguments[shortcode.arguments.length - 1];
    assert(
      node && node.type === 'hugoShortcodeArgument',
      'expected hugoShortcodeArgument',
    );
    // console.log('exitHugoShortcodeArgumentNamedKey', this.sliceSerialize(token))
    node.name = this.sliceSerialize(token);

    // Resume buffer to balance the buffer() call in enter
    thisresume.call(this);
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function exitHugoShortcodeArgumentNamedValueQuotedValue(token) {
    const shortcode = this.data.hugoShortcode;
    assert(shortcode, 'expected `hugoShortcode`');
    const node = shortcode.arguments[shortcode.arguments.length - 1];
    assert(node.type === 'hugoShortcodeArgument');
    node.value = this.sliceSerialize(token);

    // Resume buffer to balance the buffer() call in enter
    thisresume.call(this);
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function exitHugoShortcodeArgumentNamedValueUnquoted(token) {
    const shortcode = this.data.hugoShortcode;
    assert(shortcode, 'expected `hugoShortcode`');
    const node = shortcode.arguments[shortcode.arguments.length - 1];
    assert(node.type === 'hugoShortcodeArgument');
    node.value = this.sliceSerialize(token);

    // Resume buffer to balance the buffer() call in enter
    thisresume.call(this);
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function exitHugoShortcodeSelfClosingMarker() {
    const shortcode = this.data.hugoShortcode;
    assert(shortcode, 'expected `hugoShortcode`');
    shortcode.selfClosing = true;
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function exitHugoShortcodeContent(token) {
    const shortcode = this.data.hugoShortcode;
    assert(shortcode, 'expected `hugoShortcode`');
    // Content is handled by the children

    // Resume buffer to balance the buffer() call in enter
    // resume()
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function exitHugoShortcode(token) {
    const shortcode = this.data.hugoShortcode;
    assert(shortcode, 'expected `hugoShortcode`');
    const stack = this.data.hugoShortcodeStack;
    assert(stack, 'expected `hugoShortcodeStack`');
    const tail = stack[stack.length - 1];

    if (shortcode.close && tail && tail.name !== shortcode.name) {
      throw new VFileMessage(
        `Unexpected closing shortcode \`${serializeAbbreviatedShortcode(shortcode)}\`, expected corresponding closing shortcode for \`${serializeAbbreviatedShortcode(tail)}\` (${stringifyPosition(tail)})`,
        { start: token.start, end: token.end },
        'mdast-util-hugo-shortcode:end-shortcode-mismatch',
      );
    }

    // End of a shortcode, so drop the buffer.
    // resume.call(this)

    if (shortcode.close) {
      const node = stack.pop();
      if (hugoShortcodeElementOnExitTransform)
        hugoShortcodeElementOnExitTransform(node);
    } else {
      // console.log('exitHugoShortcode', JSON.stringify(shortcode, null, 2))

      // Create the shortcode element node with proper position information

      const node = {
        type:
          token.type === 'hugoShortcodeText'
            ? 'hugoShortcodeTextElement'
            : 'hugoShortcodeFlowElement',
        name: shortcode.name || null,
        arguments: shortcode.arguments,
        notation: shortcode.notation,
        children: [],
      };
      this.enter(
        hugoShortcodeElementOnEnterTransform
          ? hugoShortcodeElementOnEnterTransform(node)
          : node,
        token,
        onErrorRightIsShortcode,
      );
    }

    if (
      shortcode.selfClosing ||
      shortcode.close ||
      noSelfClosingElements.includes(shortcode.name)
    ) {
      this.exit(token, onErrorLeftIsShortcode);
    } else {
      stack.push(shortcode);
    }
  }

  /**
   * @this {CompileContext}
   * @type {OnEnterError}
   */
  function onErrorRightIsShortcode(closing, open) {
    const stack = this.data.hugoShortcodeStack;
    assert(stack, 'expected `hugoShortcodeStack`');
    const shortcode = stack[stack.length - 1];
    assert(shortcode, 'expected `hugoShortcode`');
    const place = closing ? ` before the end of \`${closing.type}\`` : '';
    const position = closing
      ? { start: closing.start, end: closing.end }
      : undefined;

    throw new VFileMessage(
      `Expected a closing shortcode for \`${serializeAbbreviatedShortcode(shortcode)}\` (${stringifyPosition({ start: open.start, end: open.end })})${place}`,
      position,
      'mdast-util-hugo-shortcode:end-shortcode-mismatch',
    );
  }

  /**
   * @this {CompileContext}
   * @type {OnExitError}
   */
  function onErrorLeftIsShortcode(a, b) {
    const shortcode = this.data.hugoShortcode;
    assert(shortcode, 'expected `hugoShortcode`');

    throw new VFileMessage(
      `Expected the closing shortcode \`${serializeAbbreviatedShortcode(shortcode)}\` either after the end of \`${b.type}\` (${stringifyPosition(b.end)}) or another opening shortcode after the start of \`${b.type}\` (${stringifyPosition(b.start)})`,
      { start: a.start, end: a.end },
      'mdast-util-hugo-shortcode:end-shortcode-mismatch',
    );
  }

  /**
   * Serialize a shortcode, excluding arguments.
   * `self-closing` is not supported, because we don't need it yet.
   *
   * @param {Shortcode} shortcode
   * @returns {string}
   */
  function serializeAbbreviatedShortcode(shortcode) {
    const notation = shortcode.notation === 'markdown' ? '%' : '<';
    const closingNotation = shortcode.notation === 'markdown' ? '%' : '>';
    return `{{${notation}${shortcode.close ? '/' : ''}${shortcode.name || ''}${closingNotation}}}`;
  }
}

/**
 * Create an extension for `mdast-util-to-markdown` to enable Hugo shortcodes.
 *
 * This extension configures `mdast-util-to-markdown` with
 * `options.fences: true` and `options.resourceLink: true` too, do not
 * overwrite them!
 *
 * @param {ToMarkdownOptions | null | undefined} [options]
 *   Configuration (optional).
 * @returns {ToMarkdownExtension}
 *   Extension for `mdast-util-to-markdown` to enable Hugo shortcodes.
 */
export function hugoShortcodeToMarkdown(options) {
  const options_ = options || {};
  const quote = options_.quote || '"';
  const quoteSmart = options_.quoteSmart || false;
  const tightSelfClosing = options_.tightSelfClosing || false;
  const printWidth = options_.printWidth || Number.POSITIVE_INFINITY;
  const alternative = quote === '"' ? "'" : '"';

  if (quote !== '"' && quote !== "'") {
    throw new Error(
      `Cannot serialize argument values with \`${quote}\` for \`options.quote\`, expected \`"\`, or \`'\``,
    );
  }

  hugoShortcodeElement.peek = peekElement;

  return {
    handlers: {
      hugoShortcodeFlowElement: hugoShortcodeElement,
      hugoShortcodeTextElement: hugoShortcodeElement,
    },
    unsafe: [
      { character: '{', inConstruct: ['phrasing'] },
      { atBreak: true, character: '{' },
    ],
    // Always generate fenced code (never indented code).
    fences: true,
    // Always generate links with resources (never autolinks).
    resourceLink: true,
  };

  /**
   * @type {ToMarkdownHandle}
   * @param {HugoShortcodeElement} node
   */
  // eslint-disable-next-line complexity
  function hugoShortcodeElement(node, _, state, info) {
    const flow = node.type === 'hugoShortcodeFlowElement';
    const selfClosing = node.name
      ? !node.children || node.children.length === 0
      : false;
    const depth = inferDepth(state);
    const currentIndent = createIndent(depth);
    const trackerOneLine = state.createTracker(info);
    const trackerMultiLine = state.createTracker(info);
    /** @type {Array<string>} */
    const serializedArguments = [];
    const notation = node.notation === 'markdown' ? '%' : '<';
    const closingNotation = node.notation === 'markdown' ? '%' : '>';
    const prefix = `${flow ? currentIndent : ''}{{${notation}${node.name || ''}`;
    const exit = state.enter(node.type);

    trackerOneLine.move(prefix);
    trackerMultiLine.move(prefix);

    // None.
    if (node.arguments && node.arguments.length > 0) {
      if (!node.name) {
        throw new Error('Cannot serialize fragment w/ arguments');
      }

      let index = -1;
      while (++index < node.arguments.length) {
        const argument = node.arguments[index];
        /** @type {string} */
        let result;

        if (argument.type === 'hugoShortcodeArgumentPositional') {
          result = argument.value || '';
        } else {
          if (!argument.name) {
            throw new Error('Cannot serialize argument w/o name');
          }

          const value = argument.value;
          const left = argument.name;
          /** @type {string} */
          let right = '';

          if (value === null || value === undefined) {
            // Empty.
          } else {
            // If the alternative is less common than `quote`, switch.
            const appliedQuote =
              quoteSmart && ccount(value, quote) > ccount(value, alternative)
                ? alternative
                : quote;
            right =
              appliedQuote +
              stringifyEntitiesLight(value, { subset: [appliedQuote] }) +
              appliedQuote;
          }

          result = left + (right ? '=' : '') + right;
        }

        serializedArguments.push(result);
      }
    }

    let argumentsOnTheirOwnLine = false;
    const argumentsOnOneLine = serializedArguments.join(' ');

    if (
      // Block:
      flow &&
      // Including a line ending (expressions).
      (/\r?\n|\r/.test(argumentsOnOneLine) ||
        // Current position (including `{{< shortcode`).
        trackerOneLine.current().now.column +
          // -1 because columns, +1 for ` ` before arguments.
          // Arguments joined by spaces.
          argumentsOnOneLine.length +
          // ` />`.
          (selfClosing ? (tightSelfClosing ? 2 : 3) : 1) >
          printWidth)
    ) {
      argumentsOnTheirOwnLine = true;
    }

    let tracker = trackerOneLine;
    let value = prefix;

    if (argumentsOnTheirOwnLine) {
      tracker = trackerMultiLine;

      let index = -1;

      while (++index < serializedArguments.length) {
        // Only indent first line of of arguments, we can't indent argument
        // values.
        serializedArguments[index] =
          currentIndent + indent + serializedArguments[index];
      }

      value += tracker.move(
        `\n${serializedArguments.join('\n')}\n${currentIndent}`,
      );
    } else if (argumentsOnOneLine) {
      value += tracker.move(` ${argumentsOnOneLine}`);
    }

    if (selfClosing) {
      value += tracker.move(
        `${tightSelfClosing || argumentsOnTheirOwnLine ? '' : ' '}/`,
      );
    }

    value += tracker.move(`${closingNotation}}}`);

    if (node.children && node.children.length > 0) {
      if (node.type === 'hugoShortcodeTextElement') {
        value += tracker.move(
          state.containerPhrasing(node, {
            ...tracker.current(),
            before: '}',
            after: '{',
          }),
        );
      } else {
        tracker.shift(2);
        value += tracker.move('\n');
        value += tracker.move(containerFlow(node, state, tracker.current()));
        value += tracker.move('\n');
      }
    }

    if (!selfClosing) {
      value += tracker.move(
        `${flow ? currentIndent : ''}{{${notation}/${node.name || ''}${closingNotation}}}`,
      );
    }

    exit();
    return value;
  }
}

// Modified copy of:
// <https://github.com/syntax-tree/mdast-util-to-markdown/blob/a381cbc/lib/util/container-flow.js>.
//
// To do: add `indent` support to `mdast-util-to-markdown`.
// As indents are only used for Hugo shortcodes, it's fine for now, but perhaps better
// there.
/**
 * @param {HugoShortcodeElement} parent
 *   Parent of flow nodes.
 * @param {State} state
 *   Info passed around about the current state.
 * @param {ReturnType<Tracker['current']>} info
 *   Info on where we are in the document we are generating.
 * @returns {string}
 *   Serialized children, joined by (blank) lines.
 */
function containerFlow(parent, state, info) {
  const indexStack = state.indexStack;
  const children = parent.children;
  const tracker = state.createTracker(info);
  const currentIndent = createIndent(inferDepth(state));
  /** @type {Array<string>} */
  const results = [];
  let index = -1;

  indexStack.push(-1);

  while (++index < children.length) {
    const child = children[index];

    indexStack[indexStack.length - 1] = index;

    const childInfo = { before: '\n', after: '\n', ...tracker.current() };

    const result = state.handle(child, parent, state, childInfo);

    const serializedChild =
      child.type === 'hugoShortcodeFlowElement'
        ? result
        : state.indentLines(result, (line, _, blank) => {
            return (blank ? '' : currentIndent) + line;
          });

    results.push(tracker.move(serializedChild));

    if (child.type !== 'list') {
      state.bulletLastUsed = undefined;
    }

    if (index < children.length - 1) {
      results.push(tracker.move('\n\n'));
    }
  }

  indexStack.pop();

  return results.join('');
}

/**
 * @param {State} state
 * @returns {number}
 */
function inferDepth(state) {
  let depth = 0;
  let index = state.stack.length;

  while (--index > -1) {
    const name = state.stack[index];

    if (name === 'blockquote' || name === 'listItem') break;
    if (name === 'hugoShortcodeFlowElement') depth++;
  }

  return depth;
}

/**
 * @param {number} depth
 * @returns {string}
 */
function createIndent(depth) {
  return indent.repeat(depth);
}

/**
 * @type {ToMarkdownHandle}
 */
function peekElement() {
  return '{';
}

/**
 * Parse markdown with Hugo shortcodes, treating unclosed shortcodes as self-closing.
 * This function attempts normal parsing first, and if it fails due to unclosed shortcodes,
 * it modifies the input to make them self-closing and reparses.
 *
 * @param {string} markdown - The markdown content to parse
 * @param {object} options - Parsing options
 * @returns {Promise<object>} The parsed AST
 */
export async function parseMarkdownWithLenientShortcodes(
  markdown,
  options = {},
) {
  try {
    // Try normal parsing first
    const { fromMarkdown } = await import('mdast-util-from-markdown');
    return fromMarkdown(markdown, {
      ...options,
      mdastExtensions: [
        hugoShortcodeFromMarkdown(),
        ...(options.mdastExtensions || []),
      ],
    });
  } catch (error) {
    // If parsing failed due to unclosed shortcodes, try to fix them
    if (error.message?.includes('Expected a closing shortcode')) {
      // Extract shortcode name from error message
      const match = error.message.match(
        /Expected a closing shortcode for `\{\{[<%]([^}]*)[>%]\}\}`/,
      );
      if (match) {
        // Try to make unclosed shortcodes self-closing
        let fixedMarkdown = markdown;

        // Simple regex to find unclosed shortcodes and make them self-closing
        // This is a basic implementation - a more sophisticated version would parse properly
        const shortcodePattern = /\{\{([<%])\s*([^}]*?)\s*([>%])\}\}/g;
        fixedMarkdown = fixedMarkdown.replace(
          shortcodePattern,
          (match, opener, content, closer) => {
            // If this shortcode doesn't have a corresponding closing tag, make it self-closing
            const name = content.split(/\s+/)[0];
            if (name) {
              const closingPattern = new RegExp(
                `\\{\\{${opener}\\s*/\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*${closer}\\}\\}`,
              );
              if (!closingPattern.test(markdown)) {
                // Make it self-closing
                return `{{${opener} ${content} /${closer}}}`;
              }
            }
            return match;
          },
        );

        // Try parsing again with fixed markdown
        try {
          const { fromMarkdown } = await import('mdast-util-from-markdown');
          return fromMarkdown(fixedMarkdown, {
            ...options,
            mdastExtensions: [
              hugoShortcodeFromMarkdown(),
              ...(options.mdastExtensions || []),
            ],
          });
        } catch (secondError) {
          // If it still fails, throw the original error
          throw error;
        }
      }
    }

    // If it's not a shortcode error or we couldn't fix it, rethrow
    throw error;
  }
}
