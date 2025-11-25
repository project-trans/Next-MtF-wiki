/**
 * @import {AcornOptions, Acorn} from 'micromark-util-events-to-acorn'
 * @import {Code, Effects, State, TokenType, TokenizeContext} from 'micromark-util-types'
 */

import { ok as assert } from 'devlop';
import {
  markdownLineEnding,
  markdownLineEndingOrSpace,
  markdownSpace,
} from 'micromark-util-character';
import { codes, types } from 'micromark-util-symbol';
import { VFileMessage } from 'vfile-message';

const trouble = 'https://gohugo.io/content-management/shortcodes/';

/**
 * @this {TokenizeContext}
 * @param {Effects} effects
 * @param {State} ok
 * @param {State} nok
 * @param {boolean | undefined} allowLazy
 * @param {TokenType} shortcodeType
 * @param {TokenType} markerType
 * @param {TokenType} closingMarkerType
 * @param {TokenType} selfClosingMarkerType
 * @param {TokenType} nameType
 * @param {TokenType} argumentType
 * @param {TokenType} argumentNamedKeyType
 * @param {TokenType} argumentNamedValueType
 * @param {TokenType} argumentNamedValueQuotedType
 * @param {TokenType} argumentNamedValueQuotedMarkerType
 * @param {TokenType} argumentNamedValueQuotedValueType
 * @param {TokenType} argumentNamedValueUnquotedType
 * @param {TokenType} argumentNamedAssignmentOperatorType
 * @param {TokenType} contentType
 * @param {TokenType} notationType
 */
// eslint-disable-next-line max-params
export function factoryShortcode(
  effects,
  ok,
  nok,
  allowLazy,
  shortcodeType,
  markerType,
  closingMarkerType,
  selfClosingMarkerType,
  nameType,
  argumentType,
  argumentNamedKeyType,
  argumentNamedValueType,
  argumentNamedValueQuotedType,
  argumentNamedValueQuotedMarkerType,
  argumentNamedValueQuotedValueType,
  argumentNamedValueUnquotedType,
  argumentNamedAssignmentOperatorType,
  contentType,
  notationType,
) {
  /** @type {State} */
  let returnState;
  /** @type {'standard' | 'markdown'} */
  let notation;
  /** @type {NonNullable<Code> | undefined} */
  let marker;
  /** @type {string | undefined} */
  let shortcodeName;

  return start;

  /**
   * Start of Hugo shortcode.
   *
   * ```markdown
   * > | {{< figure src="/images/test.jpg" >}}
   *     ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    assert(code === codes.leftCurlyBrace, 'expected `{`');
    effects.enter(shortcodeType);
    effects.enter(markerType);
    effects.consume(code);
    return afterFirstBrace;
  }

  /**
   * After first `{`.
   *
   * ```markdown
   * > | {{< figure src="/images/test.jpg" >}}
   *      ^
   * ```
   *
   * @type {State}
   */
  function afterFirstBrace(code) {
    if (code === codes.leftCurlyBrace) {
      effects.consume(code);
      return afterSecondBrace;
    }
    return nok(code);
  }

  /**
   * After second `{`.
   *
   * ```markdown
   * > | {{< figure src="/images/test.jpg" >}}
   *       ^
   * ```
   *
   * @type {State}
   */
  function afterSecondBrace(code) {
    if (code === codes.lessThan) {
      notation = 'standard';
      effects.exit(markerType);
      effects.enter(notationType);
      effects.consume(code);
      effects.exit(notationType);
      return beforeName;
    }

    if (code === codes.percentSign) {
      notation = 'markdown';
      effects.exit(markerType);
      effects.enter(notationType);
      effects.consume(code);
      effects.exit(notationType);
      return beforeName;
    }

    return nok(code);
  }

  /**
   * Before shortcode name.
   *
   * ```markdown
   * > | {{< figure src="/images/test.jpg" >}}
   *         ^
   * ```
   *
   * @type {State}
   */
  function beforeName(code) {
    if (markdownSpace(code)) {
      effects.enter(types.whitespace);
      return beforeNameSpace(code);
    }

    if (code === codes.slash) {
      effects.enter(closingMarkerType);
      effects.consume(code);
      effects.exit(closingMarkerType);
      return beforeClosingName;
    }

    return name(code);
  }

  /**
   * In space before name.
   *
   * ```markdown
   * > | {{< figure src="/images/test.jpg" >}}
   *         ^
   * ```
   *
   * @type {State}
   */
  function beforeNameSpace(code) {
    if (markdownSpace(code)) {
      effects.consume(code);
      return beforeNameSpace;
    }
    effects.exit(types.whitespace);
    return beforeName(code);
  }

  /**
   * Before closing shortcode name.
   *
   * ```markdown
   * > | {{< /figure >}}
   *          ^
   * ```
   *
   * @type {State}
   */
  function beforeClosingName(code) {
    if (markdownSpace(code)) {
      effects.enter(types.whitespace);
      return beforeClosingNameSpace(code);
    }
    return name(code);
  }

  /**
   * In space before closing name.
   *
   * ```markdown
   * > | {{< /figure >}}
   *          ^
   * ```
   *
   * @type {State}
   */
  function beforeClosingNameSpace(code) {
    if (markdownSpace(code)) {
      effects.consume(code);
      return beforeClosingNameSpace;
    }
    effects.exit(types.whitespace);
    return name(code);
  }

  /**
   * In shortcode name.
   *
   * ```markdown
   * > | {{< figure src="/images/test.jpg" >}}
   *         ^^^^^^
   * ```
   *
   * @type {State}
   */
  function name(code) {
    if (code !== codes.eof && code >= 0 && isValidShortcodeNameChar(code)) {
      if (!shortcodeName) {
        effects.enter(nameType);
        shortcodeName = '';
      }
      shortcodeName += String.fromCharCode(code);
      effects.consume(code);
      return name;
    }

    if (shortcodeName) {
      effects.exit(nameType);
    }

    return afterName(code);
  }

  /**
   * After name.
   *
   * ```markdown
   * > | {{< figure src="/images/test.jpg" >}}
   *                ^
   * ```
   *
   * @type {State}
   */
  function afterName(code) {
    if (markdownSpace(code)) {
      effects.enter(types.whitespace);
      return afterNameSpace(code);
    }

    if (code === codes.slash) {
      effects.enter(selfClosingMarkerType);
      effects.consume(code);
      effects.exit(selfClosingMarkerType);
      return afterSelfClosing;
    }

    return beforeEndMarker(code);
  }

  /**
   * In space after name.
   *
   * ```markdown
   * > | {{< figure src="/images/test.jpg" >}}
   *                ^
   * ```
   *
   * @type {State}
   */
  function afterNameSpace(code) {
    if (markdownSpace(code)) {
      effects.consume(code);
      return afterNameSpace;
    }
    effects.exit(types.whitespace);
    return parseArguments(code);
  }

  /**
   * Parse arguments.
   *
   * ```markdown
   * > | {{< figure src="/images/test.jpg" alt="Test" >}}
   *                ^^^
   * ```
   *
   * @type {State}
   */
  function parseArguments(code) {
    // Check for end of shortcode
    if (code === codes.slash) {
      effects.enter(selfClosingMarkerType);
      effects.consume(code);
      effects.exit(selfClosingMarkerType);
      return afterSelfClosing;
    }

    if (
      (notation === 'standard' && code === codes.greaterThan) ||
      (notation === 'markdown' && code === codes.percentSign)
    ) {
      return beforeEndMarker(code);
    }

    // Start of an argument
    if (code !== codes.eof && code >= 0 && !markdownSpace(code)) {
      effects.enter(argumentType);
      return argumentValue(code);
    }

    // Skip spaces
    if (markdownSpace(code)) {
      effects.enter(types.whitespace);
      return argumentSpace(code);
    }

    return nok(code);
  }

  /**
   * In space between arguments.
   *
   * ```markdown
   * > | {{< figure src="/images/test.jpg" alt="Test" >}}
   *                                       ^
   * ```
   *
   * @type {State}
   */
  function argumentSpace(code) {
    if (markdownSpace(code)) {
      effects.consume(code);
      return argumentSpace;
    }
    effects.exit(types.whitespace);
    return parseArguments(code);
  }

  /**
   * In argument value.
   *
   * ```markdown
   * > | {{< figure src="/images/test.jpg" >}}
   *                ^^^
   * ```
   *
   * @type {State}
   */
  function argumentValue(code) {
    // Check if this is a quoted value
    if (
      code === codes.quotationMark ||
      code === codes.apostrophe ||
      code === codes.graveAccent
    ) {
      marker = code;
      effects.enter(argumentNamedValueType);
      effects.enter(argumentNamedValueQuotedType);
      effects.enter(argumentNamedValueQuotedMarkerType);
      effects.consume(code);
      effects.exit(argumentNamedValueQuotedMarkerType);
      effects.enter(argumentNamedValueQuotedValueType);
      return quotedValue;
    }

    // Start reading key/value
    if (
      code !== codes.eof &&
      code !== codes.space &&
      code !== codes.slash &&
      !(notation === 'standard' && code === codes.greaterThan) &&
      !(notation === 'markdown' && code === codes.percentSign)
    ) {
      effects.enter(argumentNamedKeyType);
      effects.consume(code);
      return argumentKeyOrValue;
    }

    // End of argument
    effects.exit(argumentType);
    return parseArguments(code);
  }

  /**
   * In argument key or continuing with value.
   *
   * ```markdown
   * > | {{< figure src="/images/test.jpg" >}}
   *                ^^^^
   * ```
   *
   * @type {State}
   */
  function argumentKeyOrValue(code) {
    // Check for assignment operator (this was a key)
    if (code === codes.equalsTo) {
      effects.exit(argumentNamedKeyType);
      effects.enter(argumentNamedAssignmentOperatorType);
      effects.consume(code);
      effects.exit(argumentNamedAssignmentOperatorType);
      effects.enter(argumentNamedValueType);
      return afterAssignment;
    }

    // Continue with key/value characters
    if (
      code !== codes.eof &&
      code !== codes.space &&
      code !== codes.slash &&
      !(notation === 'standard' && code === codes.greaterThan) &&
      !(notation === 'markdown' && code === codes.percentSign)
    ) {
      effects.consume(code);
      return argumentKeyOrValue;
    }

    // End of positional argument (no assignment operator found)
    effects.exit(argumentNamedKeyType);
    effects.exit(argumentType);
    return parseArguments(code);
  }

  /**
   * After assignment operator.
   *
   * ```markdown
   * > | {{< figure src="/images/test.jpg" >}}
   *                    ^
   * ```
   *
   * @type {State}
   */
  function afterAssignment(code) {
    // Check if value is quoted
    if (
      code === codes.quotationMark ||
      code === codes.apostrophe ||
      code === codes.graveAccent
    ) {
      marker = code;
      effects.enter(argumentNamedValueQuotedType);
      effects.enter(argumentNamedValueQuotedMarkerType);
      effects.consume(code);
      effects.exit(argumentNamedValueQuotedMarkerType);
      effects.enter(argumentNamedValueQuotedValueType);
      return quotedValue;
    }

    // Unquoted value
    effects.enter(argumentNamedValueUnquotedType);
    return unquotedValue(code);
  }

  /**
   * In quoted value.
   *
   * ```markdown
   * > | {{< figure src="/images/test.jpg" >}}
   *                     ^^^^^^^^^^^^^^^^^^
   * ```
   *
   * @type {State}
   */
  function quotedValue(code) {
    if (code === marker) {
      effects.exit(argumentNamedValueQuotedValueType);
      effects.enter(argumentNamedValueQuotedMarkerType);
      effects.consume(code);
      effects.exit(argumentNamedValueQuotedMarkerType);
      effects.exit(argumentNamedValueQuotedType);
      effects.exit(argumentNamedValueType);
      effects.exit(argumentType);
      return afterArgument;
    }

    if (code === codes.eof) {
      return nok(code);
    }

    if (markdownLineEnding(code) && marker !== codes.graveAccent) {
      return nok(code);
    }

    effects.consume(code);
    return quotedValue;
  }

  /**
   * In unquoted value.
   *
   * ```markdown
   * > | {{< figure class=my-figure >}}
   *                      ^^^^^^^^^
   * ```
   *
   * @type {State}
   */
  function unquotedValue(code) {
    if (
      code === codes.space ||
      code === codes.slash ||
      (notation === 'standard' && code === codes.greaterThan) ||
      (notation === 'markdown' && code === codes.percentSign) ||
      code === codes.eof
    ) {
      effects.exit(argumentNamedValueUnquotedType);
      effects.exit(argumentNamedValueType);
      effects.exit(argumentType);
      return parseArguments(code);
    }

    effects.consume(code);
    return unquotedValue;
  }

  /**
   * After an argument.
   *
   * ```markdown
   * > | {{< figure src="/images/test.jpg" >}}
   *                                      ^
   * ```
   *
   * @type {State}
   */
  function afterArgument(code) {
    if (markdownSpace(code)) {
      effects.enter(types.whitespace);
      effects.consume(code);
      return afterArgumentSpace;
    }
    return parseArguments(code);
  }

  /**
   * In space after argument.
   *
   * ```markdown
   * > | {{< figure src="/images/test.jpg" alt="Test" >}}
   *                                       ^
   * ```
   *
   * @type {State}
   */
  function afterArgumentSpace(code) {
    if (markdownSpace(code)) {
      effects.consume(code);
      return afterArgumentSpace;
    }
    effects.exit(types.whitespace);
    return parseArguments(code);
  }

  /**
   * After self-closing marker.
   *
   * ```markdown
   * > | {{< figure / >}}
   *                  ^
   * ```
   *
   * @type {State}
   */
  function afterSelfClosing(code) {
    if (markdownSpace(code)) {
      effects.enter(types.whitespace);
      return afterSelfClosingSpace(code);
    }
    return beforeEndMarker(code);
  }

  /**
   * In space after self-closing marker.
   *
   * ```markdown
   * > | {{< figure / >}}
   *                  ^
   * ```
   *
   * @type {State}
   */
  function afterSelfClosingSpace(code) {
    if (markdownSpace(code)) {
      effects.consume(code);
      return afterSelfClosingSpace;
    }
    effects.exit(types.whitespace);
    return beforeEndMarker(code);
  }

  /**
   * Before end marker.
   *
   * ```markdown
   * > | {{< figure >}}
   *                ^
   * ```
   *
   * @type {State}
   */
  function beforeEndMarker(code) {
    if (notation === 'standard' && code === codes.greaterThan) {
      effects.enter(notationType);
      effects.consume(code);
      effects.exit(notationType);
      effects.enter(markerType);
      return endFirstBrace;
    }

    if (notation === 'markdown' && code === codes.percentSign) {
      effects.enter(notationType);
      effects.consume(code);
      effects.exit(notationType);
      effects.enter(markerType);
      return endFirstBrace;
    }

    return nok(code);
  }

  /**
   * After first end marker character.
   *
   * ```markdown
   * > | {{< figure >}}
   *                 ^
   * ```
   *
   * @type {State}
   */
  function endFirstBrace(code) {
    if (code === codes.rightCurlyBrace) {
      effects.consume(code);
      return endSecondBrace;
    }
    return nok(code);
  }

  /**
   * After second end brace.
   *
   * ```markdown
   * > | {{< figure >}}
   *                  ^
   * ```
   *
   * @type {State}
   */
  function endSecondBrace(code) {
    if (code === codes.rightCurlyBrace) {
      effects.consume(code);
      effects.exit(markerType);
      effects.exit(shortcodeType);
      return ok;
    }
    return nok(code);
  }

  /**
   * Check if a character is valid for shortcode names.
   *
   * @param {Code} code
   * @returns {boolean}
   */
  function isValidShortcodeNameChar(code) {
    return (
      code !== null &&
      ((code >= codes.digit0 && code <= codes.digit9) ||
        (code >= codes.uppercaseA && code <= codes.uppercaseZ) ||
        (code >= codes.lowercaseA && code <= codes.lowercaseZ) ||
        code === codes.dash ||
        code === codes.underscore ||
        code === codes.dot ||
        code === codes.slash)
    );
  }
}
