import type { Node, Root } from 'mdast';
import { visit } from 'unist-util-visit';

interface MdxJsxAttribute {
  type: 'mdxJsxAttribute';
  name: string;
  value: string | null;
}

interface MdxJsxFlowElement extends Node {
  type: 'mdxJsxFlowElement';
  name: string;
  attributes: MdxJsxAttribute[];
  children: Node[];
}

interface Options {
  language: string;
  data: string;
}

/**
 * Remark plugin: replaces {{< terminology-glossary >}} shortcode nodes
 * (already converted to ShortCodeComp by remarkHugoShortcode) with a
 * SearchableTerminologyTable MDX element carrying pre-loaded TSV data.
 */
export default function remarkTerminologyGlossary({ language, data }: Options) {
  return (tree: Root) => {
    visit(tree, 'mdxJsxFlowElement', (node, index, parent) => {
      const el = node as unknown as MdxJsxFlowElement;
      if (el.name !== 'ShortCodeComp') return;

      const compNameAttr = el.attributes?.find((a) => a.name === 'compName');
      if (compNameAttr?.value !== 'terminology-glossary') return;

      const replacement: MdxJsxFlowElement = {
        type: 'mdxJsxFlowElement',
        name: 'SearchableTerminologyTable',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'data', value: data },
          { type: 'mdxJsxAttribute', name: 'lang', value: language },
        ],
        children: [],
      };

      if (parent && typeof index === 'number' && 'children' in parent) {
        (parent.children as unknown[])[index] = replacement;
      }
    });
  };
}
