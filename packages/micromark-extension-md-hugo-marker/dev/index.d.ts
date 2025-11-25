import type { Program } from 'estree';
import type { Acorn, AcornOptions } from 'micromark-util-events-to-acorn';

export { hugoShortcode } from './lib/syntax.js';

/**
 * Configuration (optional).
 */
export interface Options {
  /**
   * Configuration for acorn (default: `{ecmaVersion: 2024, locations: true,
   * sourceType: 'module'}`); all fields except `locations` can be set.
   */
  acornOptions?: AcornOptions | null | undefined;
  /**
   * Acorn parser to use (optional).
   */
  acorn?: Acorn | null | undefined;
  /**
   * Whether to add `estree` fields to tokens with results from acorn
   * (default: `false`).
   */
  addResult?: boolean | null | undefined;
}

/**
 * Augment types.
 */
declare module 'micromark-util-types' {
  /**
   * Token types.
   */
  interface TokenTypeMap {
    esWhitespace: 'esWhitespace';

    // Hugo Shortcode Types
    hugoShortcodeFlow: 'hugoShortcodeFlow';
    hugoShortcodeFlowMarker: 'hugoShortcodeFlowMarker';
    hugoShortcodeFlowClosingMarker: 'hugoShortcodeFlowClosingMarker';
    hugoShortcodeFlowSelfClosingMarker: 'hugoShortcodeFlowSelfClosingMarker';
    hugoShortcodeFlowName: 'hugoShortcodeFlowName';
    hugoShortcodeFlowArgument: 'hugoShortcodeFlowArgument';
    hugoShortcodeFlowArgumentPositional: 'hugoShortcodeFlowArgumentPositional';
    hugoShortcodeFlowArgumentNamed: 'hugoShortcodeFlowArgumentNamed';
    hugoShortcodeFlowArgumentNamedKey: 'hugoShortcodeFlowArgumentNamedKey';
    hugoShortcodeFlowArgumentNamedValue: 'hugoShortcodeFlowArgumentNamedValue';
    hugoShortcodeFlowArgumentNamedValueQuoted: 'hugoShortcodeFlowArgumentNamedValueQuoted';
    hugoShortcodeFlowArgumentNamedValueQuotedMarker: 'hugoShortcodeFlowArgumentNamedValueQuotedMarker';
    hugoShortcodeFlowArgumentNamedValueQuotedValue: 'hugoShortcodeFlowArgumentNamedValueQuotedValue';
    hugoShortcodeFlowArgumentNamedValueUnquoted: 'hugoShortcodeFlowArgumentNamedValueUnquoted';
    hugoShortcodeFlowArgumentNamedAssignmentOperator: 'hugoShortcodeFlowArgumentNamedAssignmentOperator';
    hugoShortcodeFlowContent: 'hugoShortcodeFlowContent';
    hugoShortcodeFlowNotation: 'hugoShortcodeFlowNotation';

    hugoShortcodeText: 'hugoShortcodeText';
    hugoShortcodeTextMarker: 'hugoShortcodeTextMarker';
    hugoShortcodeTextClosingMarker: 'hugoShortcodeTextClosingMarker';
    hugoShortcodeTextSelfClosingMarker: 'hugoShortcodeTextSelfClosingMarker';
    hugoShortcodeTextName: 'hugoShortcodeTextName';
    hugoShortcodeTextArgument: 'hugoShortcodeTextArgument';
    hugoShortcodeTextArgumentPositional: 'hugoShortcodeTextArgumentPositional';
    hugoShortcodeTextArgumentNamed: 'hugoShortcodeTextArgumentNamed';
    hugoShortcodeTextArgumentNamedKey: 'hugoShortcodeTextArgumentNamedKey';
    hugoShortcodeTextArgumentNamedValue: 'hugoShortcodeTextArgumentNamedValue';
    hugoShortcodeTextArgumentNamedValueQuoted: 'hugoShortcodeTextArgumentNamedValueQuoted';
    hugoShortcodeTextArgumentNamedValueQuotedMarker: 'hugoShortcodeTextArgumentNamedValueQuotedMarker';
    hugoShortcodeTextArgumentNamedValueQuotedValue: 'hugoShortcodeTextArgumentNamedValueQuotedValue';
    hugoShortcodeTextArgumentNamedValueUnquoted: 'hugoShortcodeTextArgumentNamedValueUnquoted';
    hugoShortcodeTextArgumentNamedAssignmentOperator: 'hugoShortcodeTextArgumentNamedAssignmentOperator';
    hugoShortcodeTextContent: 'hugoShortcodeTextContent';
    hugoShortcodeTextNotation: 'hugoShortcodeTextNotation';
  }

  /**
   * Token fields.
   */
  interface Token {
    estree?: Program;
  }
}
