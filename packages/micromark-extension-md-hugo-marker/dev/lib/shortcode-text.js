/**
 * @import {Options} from 'micromark-extension-mdx-hugo-marker'
 * @import {Acorn} from 'micromark-util-events-to-acorn'
 * @import {Construct, TokenizeContext, Tokenizer} from 'micromark-util-types'
 */

import { factoryShortcode } from './factory-shortcode.js';

/**
 * Parse Hugo shortcode (text).
 *
 * @returns {Construct}
 *   Construct.
 */
export function shortcodeText() {
  return { name: 'hugoShortcodeText', tokenize: tokenizeShortcodeText };

  /**
   * Hugo shortcode (text).
   *
   * ```markdown
   * > | a {{< figure src="/images/test.jpg" >}}.
   *       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   * ```
   *
   * @this {TokenizeContext}
   * @type {Tokenizer}
   */
  function tokenizeShortcodeText(effects, ok, nok) {
    return factoryShortcode.call(
      this,
      effects,
      ok,
      nok,
      true,
      'hugoShortcodeText',
      'hugoShortcodeTextMarker',
      'hugoShortcodeTextClosingMarker',
      'hugoShortcodeTextSelfClosingMarker',
      'hugoShortcodeTextName',
      'hugoShortcodeTextArgument',
      'hugoShortcodeTextArgumentNamedKey',
      'hugoShortcodeTextArgumentNamedValue',
      'hugoShortcodeTextArgumentNamedValueQuoted',
      'hugoShortcodeTextArgumentNamedValueQuotedMarker',
      'hugoShortcodeTextArgumentNamedValueQuotedValue',
      'hugoShortcodeTextArgumentNamedValueUnquoted',
      'hugoShortcodeTextArgumentNamedAssignmentOperator',
      'hugoShortcodeTextContent',
      'hugoShortcodeTextNotation',
    );
  }
}
