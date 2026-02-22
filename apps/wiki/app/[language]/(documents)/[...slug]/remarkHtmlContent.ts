import type {
  Element,
  Node as HastNode,
  Root as HastRoot,
  Text as HastText,
} from 'hast';
import { fromHtml } from 'hast-util-from-html';
import type {
  Break,
  Delete,
  Emphasis,
  Html,
  Node as MdastNode,
  Parent,
  PhrasingContent,
  Root,
  RootContent,
  Strong,
  Text,
} from 'mdast';
import { SKIP, visit } from 'unist-util-visit';

interface MdxJsxAttribute {
  type: 'mdxJsxAttribute';
  name: string;
  value: string | null;
}

interface MdxJsxTextElement {
  type: 'mdxJsxTextElement';
  name: string;
  attributes: MdxJsxAttribute[];
  children: MdastNode[];
}

interface MdxJsxFlowElement {
  type: 'mdxJsxFlowElement';
  name: string;
  attributes: MdxJsxAttribute[];
  children: MdastNode[];
}

interface RemarkHtmlContentConfig {
  tags: {
    strong: boolean; // <b>, <strong>
    emphasis: boolean; // <i>, <em>
    delete: boolean; // <s>, <del>
    link: boolean; // <a>
    image: boolean; // <img>
    break: boolean; // <br>
    sup_or_sub: boolean; // <sup>, <sub>
    details_or_summary: boolean; // <details>, <summary>
  };
}

const defaultConfig: RemarkHtmlContentConfig = {
  tags: {
    strong: true,
    emphasis: true,
    delete: true,
    link: true,
    image: true,
    break: true,
    sup_or_sub: true,
    details_or_summary: true,
  },
};

type TagsConfig = RemarkHtmlContentConfig['tags'];

function createMdxJsxElement(
  tagName: string,
  properties: Element['properties'],
  children: MdastNode[],
  isInline: boolean,
): MdxJsxTextElement | MdxJsxFlowElement {
  const attrs: MdxJsxAttribute[] = Object.entries(properties ?? {}).map(
    ([name, value]) => ({
      type: 'mdxJsxAttribute' as const,
      name,
      value: Array.isArray(value)
        ? value.join(' ')
        : value != null
          ? String(value)
          : null,
    }),
  );
  return {
    type: isInline ? 'mdxJsxTextElement' : 'mdxJsxFlowElement',
    name: tagName,
    attributes: attrs,
    children,
  } as MdxJsxTextElement | MdxJsxFlowElement;
}

// Helper to convert a HAST (HTML AST) to MDAST (Markdown AST)
function hastToMdast(
  node: HastNode,
  config: TagsConfig,
  isInline: boolean,
): MdastNode | MdastNode[] | null {
  if (node.type === 'root') {
    return (node as HastRoot).children
      .flatMap((child) => hastToMdast(child, config, isInline))
      .filter(Boolean) as MdastNode[];
  }

  if (node.type === 'text') {
    return { type: 'text', value: (node as HastText).value } as Text;
  }

  if (node.type === 'element') {
    const element = node as Element;
    const children = element.children
      .flatMap((child) => hastToMdast(child, config, isInline))
      .filter(Boolean) as PhrasingContent[];

    const tagName = element.tagName.toLowerCase();

    if (config.strong && (tagName === 'b' || tagName === 'strong')) {
      return { type: 'strong', children } as Strong;
    }
    if (config.emphasis && (tagName === 'i' || tagName === 'em')) {
      return { type: 'emphasis', children } as Emphasis;
    }
    if (config.delete && (tagName === 's' || tagName === 'del')) {
      return { type: 'delete', children } as Delete;
    }
    if (config.link && tagName === 'a') {
      return createMdxJsxElement(
        tagName,
        element.properties,
        children,
        isInline,
      );
    }
    if (config.image && tagName === 'img') {
      return createMdxJsxElement(tagName, element.properties, [], isInline);
    }
    if (config.break && tagName === 'br') {
      return { type: 'break' } as Break;
    }
    if (config.sup_or_sub && (tagName === 'sup' || tagName === 'sub')) {
      return createMdxJsxElement(
        tagName,
        element.properties,
        children,
        isInline,
      );
    }
    if (
      config.details_or_summary &&
      (tagName === 'details' || tagName === 'summary')
    ) {
      return createMdxJsxElement(
        tagName,
        element.properties,
        children,
        isInline,
      );
    }

    // console.warn("unknown tagname or tag not enabled in config:", tagName);

    return children.length > 0 ? children : null;
  }

  return null;
}

// Main transformer function that can be called recursively
function transform(tree: Parent | Root, config: TagsConfig): void {
  visit(tree, 'html', (node: Html, index?: number, parent?: Parent) => {
    if (index === undefined || parent === undefined) {
      return;
    }

    // --- Case 1: Handle split tag pairs like `<s>...</s>` or `<a href="...">...</a>` ---
    const startTagMatch = node.value
      .trim()
      .match(/^<([a-zA-Z0-9]+)(\s[^>]*)?>$/i);
    if (startTagMatch) {
      const tagName = startTagMatch[1].toLowerCase();

      let endIndex = -1;
      for (let j = index + 1; j < parent.children.length; j++) {
        const potentialEndNode = parent.children[j];
        if (potentialEndNode.type === 'html') {
          const endValue = potentialEndNode.value.trim();
          const endTagMatch = endValue.match(/^<\/([a-zA-Z0-9]+)\s*>$/i);
          const selfClosingMatch = endValue.match(/^<([a-zA-Z0-9]+)\s*\/>$/i);

          if (
            (endTagMatch && endTagMatch[1].toLowerCase() === tagName) ||
            (selfClosingMatch && selfClosingMatch[1].toLowerCase() === tagName)
          ) {
            endIndex = j;
            break;
          }
        }
      }

      if (endIndex !== -1) {
        const innerContent = parent.children.slice(
          index + 1,
          endIndex,
        ) as RootContent[];

        // Recursively transform the content *between* the tags
        const tempRoot: Root = { type: 'root', children: innerContent };
        transform(tempRoot, config);

        let newNode:
          | Strong
          | Delete
          | Emphasis
          | MdxJsxTextElement
          | MdxJsxFlowElement
          | undefined;
        const processedChildren = tempRoot.children as PhrasingContent[];
        const isInline = parent.type === 'paragraph';

        // Extract properties from the opening tag by parsing it as a self-closing element
        const openTagHtml = node.value.trim().replace(/>$/, '/>');
        const openTagHast = fromHtml(openTagHtml, { fragment: true });
        const openTagElement = (openTagHast as HastRoot).children.find(
          (c) => c.type === 'element',
        ) as Element | undefined;
        const openTagProperties = openTagElement?.properties ?? {};

        if (config.strong && ['b', 'strong'].includes(tagName)) {
          newNode = { type: 'strong', children: processedChildren };
        } else if (config.delete && ['s', 'del'].includes(tagName)) {
          newNode = { type: 'delete', children: processedChildren };
        } else if (config.emphasis && ['i', 'em'].includes(tagName)) {
          newNode = { type: 'emphasis', children: processedChildren };
        } else if (config.link && tagName === 'a') {
          newNode = createMdxJsxElement(
            tagName,
            openTagProperties,
            processedChildren,
            isInline,
          );
        } else if (config.sup_or_sub && ['sup', 'sub'].includes(tagName)) {
          newNode = createMdxJsxElement(
            tagName,
            openTagProperties,
            processedChildren,
            isInline,
          );
        } else if (
          config.details_or_summary &&
          ['details', 'summary'].includes(tagName)
        ) {
          newNode = createMdxJsxElement(
            tagName,
            openTagProperties,
            processedChildren,
            isInline,
          );
        } else {
          // console.warn("unknown tagname or tag not enabled in config:", tagName);
        }

        if (newNode) {
          parent.children.splice(
            index,
            endIndex - index + 1,
            newNode as RootContent,
          );
          return [SKIP, index];
        }
      }
    }

    // --- Case 2: Handle self-contained HTML like `<img>` or `<b>text</b>` ---
    const isInline = parent.type === 'paragraph';
    const hastTree = fromHtml(node.value, { fragment: true });
    const mdastNodes = hastToMdast(hastTree, config, isInline);

    if (mdastNodes) {
      const nodesToInsert = (
        Array.isArray(mdastNodes) ? mdastNodes : [mdastNodes]
      ) as RootContent[];
      if (nodesToInsert.length > 0) {
        parent.children.splice(index, 1, ...nodesToInsert);
        return [SKIP, index];
      }
    }

    parent.children.splice(index, 1); // If nothing was produced, remove the original html node.
    return [SKIP, index];
  });
}

export default function remarkHtmlContent(
  options?: Partial<RemarkHtmlContentConfig>,
) {
  const config = {
    ...defaultConfig,
    ...options,
    tags: {
      ...defaultConfig.tags,
      ...options?.tags,
    },
  };
  return (tree: Root) => {
    transform(tree, config.tags);
  };
}
