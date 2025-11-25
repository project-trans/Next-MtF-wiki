/**
 * @import {Options} from 'micromark-extension-md-hugo-marker'
 * @import {Construct, State, TokenizeContext, Tokenizer} from 'micromark-util-types'
 */

import { ok as assert } from 'devlop';
import { factorySpace } from 'micromark-factory-space';
import { markdownLineEnding, markdownSpace } from 'micromark-util-character';
import { codes, types } from 'micromark-util-symbol';
import { factoryShortcode } from './factory-shortcode.js';

/**
 * Parse Hugo shortcode (flow).
 * Shortcode is a construct that occurs in the flow content type.
 *
 * @returns {Construct}
 *   Construct.
 */
export function shortcodeFlow() {
  return {
    name: 'hugoShortcodeFlow',
    tokenize: tokenizeShortcodeFlow,
    concrete: true,
  };

  /**
   * Hugo shortcode (flow).
   *
   * ```markdown
   * > | {{< figure src="/images/test.jpg" >}}
   *     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   * ```
   *
   * @this {TokenizeContext}
   * @type {Tokenizer}
   */
  function tokenizeShortcodeFlow(effects, ok, nok) {
    const self = this;

    return start;

    /**
     * Start of shortcode (flow).
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
      return before(code);
    }

    /*
     * Before shortcode (flow).
     *
     * ```markdown
     * > | {{< figure src="/images/test.jpg" >}}
     *     ^
     * ```
     *
     * @type {State}
     */
    /**
     * @param {import("micromark-util-types").Code} code
     */
    function before(code) {
      return factoryShortcode.call(
        self,
        effects,
        afterFlow,
        nok,
        false,
        'hugoShortcodeFlow',
        'hugoShortcodeFlowMarker',
        'hugoShortcodeFlowClosingMarker',
        'hugoShortcodeFlowSelfClosingMarker',
        'hugoShortcodeFlowName',
        'hugoShortcodeFlowArgument',
        'hugoShortcodeFlowArgumentNamedKey',
        'hugoShortcodeFlowArgumentNamedValue',
        'hugoShortcodeFlowArgumentNamedValueQuoted',
        'hugoShortcodeFlowArgumentNamedValueQuotedMarker',
        'hugoShortcodeFlowArgumentNamedValueQuotedValue',
        'hugoShortcodeFlowArgumentNamedValueUnquoted',
        'hugoShortcodeFlowArgumentNamedAssignmentOperator',
        'hugoShortcodeFlowContent',
        'hugoShortcodeFlowNotation',
      )(code);
    }

    /**
     * After shortcode (flow).
     *
     * ```markdown
     * > | {{< figure src="/images/test.jpg" >}}
     *                                          ^
     * ```
     *
     * @type {State}
     */
    function afterFlow(code) {
      if (markdownSpace(code)) {
        return factorySpace(effects, end, types.whitespace)(code);
      }
      return end(code);
    }

    /**
     * End of shortcode (flow).
     *
     * @type {State}
     */
    function end(code) {
      // We want to allow expressions directly after tags.
      // See <https://github.com/micromark/micromark-extension-mdx-expression/blob/d5d92b9/packages/micromark-extension-mdx-expression/dev/lib/syntax.js#L183>
      // for more info.
      const leftBraceValue = self.parser.constructs.flow[codes.leftCurlyBrace];
      /* c8 ignore next 5 -- always a list when normalized. */
      const constructs = Array.isArray(leftBraceValue)
        ? leftBraceValue
        : leftBraceValue
          ? [leftBraceValue]
          : [];
      /** @type {Construct | undefined} */
      let expression;

      for (const construct of constructs) {
        if (construct.name === 'hugoShortcodeFlow') {
          expression = construct;
          break;
        }
      }

      // Another tag.
      return code === codes.lessThan
        ? // We can’t just say: fine. Lines of blocks have to be parsed until an eol/eof.
          start(code)
        : code === codes.leftCurlyBrace && expression
          ? effects.attempt(expression, end, nok)(code)
          : code === codes.eof || markdownLineEnding(code)
            ? ok(code)
            : nok(code);
    }
  }
}
