/**
 * @import {CompileContext, Handle, HtmlExtension} from 'micromark-util-types'
 */

/**
 * Create an HTML extension for Hugo shortcodes.
 *
 * @returns {HtmlExtension}
 *   Extension for `micromark` that can be passed in `htmlExtensions` to
 *   support Hugo shortcodes when serializing to HTML.
 */
export function hugoShortcodeHtml() {
  return {
    enter: {},
    exit: {
      hugoShortcodeFlow: exitShortcodeFlow,
      hugoShortcodeText: exitShortcodeText,
    },
  };
}

/**
 * @this {CompileContext}
 * @type {Handle}
 */
function exitShortcodeFlow() {
  // Render flow shortcode as a block comment
  this.tag('<!-- Hugo shortcode (flow) -->');
}

/**
 * @this {CompileContext}
 * @type {Handle}
 */
function exitShortcodeText() {
  // Render text shortcode as an inline comment
  this.tag('<!-- Hugo shortcode (text) -->');
}
