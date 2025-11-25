/**
 * @import {Extension, Options} from 'micromark-util-types'
 */

import { codes } from 'micromark-util-symbol';
import { shortcodeFlow } from './shortcode-flow.js';
import { shortcodeText } from './shortcode-text.js';

// Also export the HTML extension
export { hugoShortcodeHtml } from './html.js';

/**
 * Create an extension for `micromark` to enable Hugo shortcode syntax.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {Extension}
 *   Extension for `micromark` that can be passed in `extensions` to enable Hugo
 *   shortcode syntax.
 */
export function hugoShortcode(options) {
  const settings = options || {};

  return {
    flow: {
      [codes.leftCurlyBrace]: shortcodeFlow(),
    },
    text: {
      [codes.leftCurlyBrace]: shortcodeText(),
    },
  };
}
