import {
  type DocItem,
  getLocalImagePath,
  getNavigationForOriginalSlug,
} from '@/service/directory-service';
import { transformFilesLink } from '@/service/path-utils';
import type {
  Code,
  Heading,
  Image,
  Link,
  Node,
  Nodes,
  Parent,
  PhrasingContent,
  Root,
  RootContent,
  Text,
} from 'mdast';
import type { HugoShortcodeElement } from 'mdast-util-md-hugo-marker';
import {
  hugoShortcodeFromMarkdown,
  hugoShortcodeToMarkdown,
} from 'mdast-util-md-hugo-marker';
import { hugoShortcode } from 'micromark-extension-md-hugo-marker';
import { SKIP, visit } from 'unist-util-visit';
import { getNonSelfClosingElements } from './utils';

// 定义MDX JSX节点类型
interface MdxJsxFlowElement extends Node {
  type: 'mdxJsxFlowElement';
  name: string | null;
  attributes: MdxJsxAttribute[];
  children: Node[];
}

interface MdxJsxTextElement extends Node {
  type: 'mdxJsxTextElement';
  name: string | null;
  attributes: MdxJsxAttribute[];
  children: Node[];
}

interface MdxJsxLiteral {
  type: 'Literal';
  value: string;
  raw: string;
}

interface MdxJsxLiteralArrayExpression {
  type: 'ArrayExpression';
  elements: MdxJsxLiteral[];
}

interface MdxJsxLiteralArrayExpressionStatement {
  type: 'ExpressionStatement';
  expression: MdxJsxLiteralArrayExpression;
}

interface MdxJsxFlowExpression {
  type: 'mdxFlowExpression';
  data?: {
    estree: {
      type: 'Program';
      body: unknown[];
      sourceType: 'module';
      comments: unknown[];
    };
  };
}

interface MdxJsxAttribute {
  type: 'mdxJsxAttribute';
  name: string;
  value: MdxJsxFlowExpression | string | null;
}

interface RemarkTextElement {
  type: 'text';
  value: string;
}

// 转换Hugo shortcode节点为MDX JSX节点
function convertHugoShortcodeToMdxJsx(
  node: HugoShortcodeElement,
  currentLanguage: string,
  navigationItems?: DocItem[],
): MdxJsxFlowElement | MdxJsxTextElement | RemarkTextElement {
  if (
    node.name === 'ref' &&
    currentLanguage &&
    navigationItems &&
    node.arguments.length > 0 &&
    node.arguments[0].value
  ) {
    const slug =
      getNavigationForOriginalSlug(
        currentLanguage,
        node.arguments[0].value,
        navigationItems,
      )?.displayPath || '';
    // console.log("node.arguments[0].value: ", node.arguments[0].value, currentLanguage, slug);
    return {
      type: 'text',
      value: slug || '',
    };
  }

  const isFlow =
    (node as unknown as HugoShortcodeElement).type ===
    'hugoShortcodeFlowElement';
  const targetType = isFlow ? 'mdxJsxFlowElement' : 'mdxJsxTextElement';

  return createMdxJsxElement(node, targetType);
}

function createMdxJsxElement(
  node: HugoShortcodeElement,
  targetType: 'mdxJsxFlowElement' | 'mdxJsxTextElement',
) {
  // 构建 attrs 数组：[["key","value"],["key","value"]]，位置参数的 key 为 null
  const attrsArray = node.arguments.map((arg) => {
    if (arg.type === 'hugoShortcodeArgumentPositional') {
      return [null, arg.value || ''];
    } else if (arg.type === 'hugoShortcodeArgumentNamed') {
      return [arg.name, arg.value || ''];
    }
    return [null, ''];
  });

  // console.log("attrsArray: ", JSON.stringify(attrsArray, null, 2));

  // 创建 mdxFlowExpression 节点作为 attrs 属性值
  const attrsExpression: MdxJsxFlowExpression = {
    type: 'mdxFlowExpression',
    data: {
      estree: {
        type: 'Program',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'ArrayExpression',
              elements: attrsArray.map(([key, value]) => ({
                type: 'ArrayExpression',
                elements: [
                  key === null
                    ? {
                        type: 'Literal',
                        value: null,
                        raw: 'null',
                      }
                    : {
                        type: 'Literal',
                        value: key,
                        raw: `"${key}"`,
                      },
                  {
                    type: 'Literal',
                    value: value,
                    raw: `"${value}"`,
                  },
                ],
              })),
            },
          },
        ],
        sourceType: 'module',
        comments: [],
      },
    },
  };

  // 添加 attrs 属性，使用 AST 节点
  const attrs = [
    {
      type: 'mdxJsxAttribute',
      name: 'compName',
      value: node.name || 'fragment',
    },
    {
      type: 'mdxJsxAttribute',
      name: 'attrs',
      value: attrsExpression,
    },
  ];

  // 创建新的MDX JSX节点
  const result = {
    type: targetType,
    name: 'ShortCodeComp',
    attributes: attrs,
    children: node.children || [],
  } as MdxJsxFlowElement | MdxJsxTextElement;

  return result;
}

/**
 * 配置选项
 */
export interface RemarkHugoShortcodeOptions {
  /**
   * 是否处理图片路径重定向
   */
  redirectImages?: boolean;

  currentLanguage?: string;

  navigationItems?: DocItem[];

  currentSlug?: string;

  realCurrentSlug?: string;

  isCurrentSlugIndex?: boolean;

  uniqueId?: boolean;

  reservedIds?: string[];
}

function transformNormalLink(
  tree: Root,
  currentSlug: string | undefined,
  language: string,
  isCurrentSlugIndex: boolean,
) {
  visit(tree, 'link', (node: Link, index, parent) => {
    node.url = transformFilesLink(
      node.url,
      currentSlug,
      language,
      isCurrentSlugIndex,
    );
    // console.log('node.url: ', node.url, currentSlug, language);
  });
}

export function transformHugoShortcodeLinks(tree: Root): void {
  visit(tree, (node: Node, index?: number, parent?: Parent) => {
    const hugoNode = node as any;
    if (
      hugoNode.type === 'hugoShortcode-Link-Href' &&
      parent &&
      typeof index === 'number'
    ) {
      const siblings = parent.children as unknown as Text[];
      const prevSibling = siblings[index - 1] as unknown as Text;
      const nextSibling = siblings[index + 1] as unknown as Text | undefined;

      const originalNextSiblingValue = nextSibling?.value;
      const endBrackIndex = nextSibling?.value?.indexOf(')') ?? -1;

      // 检查前后邻居是否为text节点且符合特定模式
      if (
        originalNextSiblingValue &&
        prevSibling?.type === 'text' &&
        nextSibling?.type === 'text' &&
        prevSibling.value?.endsWith('](') &&
        (endBrackIndex === 0 ||
          (nextSibling.value?.startsWith('#') && endBrackIndex > 0))
      ) {
        // 向前查找最近的包含"["的text节点
        let linkStartIndex = -1;
        for (let i = index - 1; i >= 0; i--) {
          const sibling = siblings[i];
          if (sibling.type === 'text' && sibling.value?.includes('[')) {
            linkStartIndex = i;
            break;
          }
        }
        // console.log("linkStartIndex: ", linkStartIndex, index, JSON.stringify(siblings, null, 2));
        if (linkStartIndex !== -1) {
          // 提取链接部分
          const linkParts = [];
          for (let i = linkStartIndex; i <= index - 1; i++) {
            const textValue = siblings[i].value || '';
            // console.log("textValue: ", textValue);
            if (i === linkStartIndex && i === index - 1) {
              const parenIndex = textValue.lastIndexOf('[');
              const bracketIndex = textValue.lastIndexOf('](');
              if (parenIndex !== -1) {
                siblings[i].value = textValue.substring(0, parenIndex);
                linkParts.push({
                  type: 'text',
                  value: textValue.substring(parenIndex + 1, bracketIndex),
                });
              }
            } else if (i === linkStartIndex) {
              const parenIndex = textValue.lastIndexOf('[');
              if (parenIndex !== -1) {
                siblings[i].value = textValue.substring(0, parenIndex);
                linkParts.push({
                  type: 'text',
                  value: textValue.substring(parenIndex + 1),
                });
              } else {
                linkParts.push(siblings[i]);
              }
            } else if (i === index - 1) {
              const bracketIndex = textValue.lastIndexOf('](');
              if (bracketIndex !== -1) {
                linkParts.push({
                  type: 'text',
                  value: textValue.substring(0, bracketIndex),
                });
              } else {
                linkParts.push(siblings[i]);
              }
            } else {
              linkParts.push(siblings[i]);
            }
          }

          nextSibling.value = nextSibling.value?.substring(endBrackIndex + 1);

          // 创建新的link节点
          const linkNode: MdxJsxTextElement = {
            type: 'mdxJsxTextElement',
            name: 'Link',
            attributes: [
              {
                type: 'mdxJsxAttribute',
                name: 'href',
                value:
                  (hugoNode.value || '') +
                  originalNextSiblingValue.substring(0, endBrackIndex),
              },
            ],
            children: [],
          };
          //console.log("linkParts: ", JSON.stringify(linkParts, null, 2));
          // 处理linkParts，提取链接文本内容
          for (const part of linkParts) {
            if (part.type === 'text') {
              const textNode = part as Text;
              const textValue = textNode.value || '';

              // 只有在有有效文本内容时才添加
              if (textValue.trim()) {
                linkNode.children.push({
                  type: 'text',
                  value: textValue,
                } as unknown as PhrasingContent);
              }
            } else {
              // 添加其他类型的内联元素
              linkNode.children.push(part as unknown as PhrasingContent);
            }
          }
          //console.log("linkNode: ", JSON.stringify(linkNode, null, 2));
          // 替换原始节点
          parent.children.splice(
            linkStartIndex + 1,
            linkParts.length,
            linkNode as unknown as RootContent,
          );
          return [SKIP, linkStartIndex];
        }
      }
    }
  });
}

export function transformHugoShortcode(
  tree: Root,
  options: RemarkHugoShortcodeOptions = {},
): void {
  const {
    redirectImages = true,
    currentLanguage = 'zh',
    navigationItems,
    isCurrentSlugIndex = false,
    realCurrentSlug,
    uniqueId = true,
    reservedIds = [
      'sidebar-scroll-container',
      'markdown-content',
      'theme-color',
    ],
  } = options;
  // 1. 转换Hugo shortcodes为MDX JSX
  visit(tree, (node: Node, index?: number, parent?: Parent) => {
    if (
      node.type === 'hugoShortcodeFlowElement' ||
      node.type === 'hugoShortcodeTextElement'
    ) {
      const transformed = convertHugoShortcodeToMdxJsx(
        node as unknown as HugoShortcodeElement,
        currentLanguage,
        navigationItems,
      );

      if (parent && typeof index === 'number') {
        (parent.children as Node[])[index] = transformed;
      }
    }
  });

  transformNormalLink(
    tree,
    realCurrentSlug,
    currentLanguage,
    isCurrentSlugIndex,
  );

  // 处理Hugo短代码链接
  transformHugoShortcodeLinks(tree);

  //2. 处理图片路径重定向
  if (redirectImages) {
    visit(tree, 'image', (node: Image) => {
      node.url =
        getLocalImagePath(
          currentLanguage,
          realCurrentSlug,
          node.url as string,
          isCurrentSlugIndex,
        ) || node.url;
    });
  }

  if (uniqueId) {
    const idSet = new Set<string>();
    for (const id of reservedIds) {
      idSet.add(id);
    }
    function getHeadingId(node: Heading) {
      if ((node as any).data.hProperties.id) {
        return (node as any).data.hProperties.id;
      }
      return null;
    }
    visit(tree, 'heading', (node: Heading) => {
      const id = getHeadingId(node);
      if (id) {
        if (idSet.has(id)) {
          let newId = id;
          while (true) {
            newId = `${newId}_1`;
            if (!idSet.has(newId)) {
              break;
            }
          }
          (node as any).data.id = newId;
          (node as any).data.hProperties.id = newId;
          // console.log('newId: ', newId);
        } else {
          idSet.add(id);
        }
      }
    });
  }
}

function processHugoRefShortCodeValue(
  value: string,
  currentLanguage: string,
  navigationItems: DocItem[],
) {
  const index = value.indexOf('#');
  if (index === 0) {
    return value;
  } else if (index > 0) {
    const slug = value.substring(0, index);
    const anchor = value.substring(index + 1);
    return `/${currentLanguage}/${
      getNavigationForOriginalSlug(currentLanguage, slug, navigationItems)
        ?.displayPath
    }#${anchor}`;
  }
  return `/${currentLanguage}/${
    getNavigationForOriginalSlug(currentLanguage, value, navigationItems)
      ?.displayPath
  }`;
}

export function getRemarkHugoShortcodeOptions(
  options: RemarkHugoShortcodeOptions = {},
) {
  const options1 = {
    noSelfClosingElements: getNonSelfClosingElements(),
    hugoShortcodeElementOnEnterTransform:
      options.currentLanguage && options.navigationItems
        ? (node: any) => {
            //console.log("node: ", JSON.stringify(node, null, 2));
            if (
              node.type === 'hugoShortcodeTextElement' ||
              node.type === 'hugoShortcodeFlowElement'
            ) {
              const element = node as HugoShortcodeElement;
              if (element.name === 'ref') {
                const href =
                  (element.arguments[0].value as string) ||
                  element.arguments[0].name;
                // console.log("href: ", href, JSON.stringify(element.arguments));
                const hrefDisplayPath = processHugoRefShortCodeValue(
                  href,
                  options.currentLanguage!,
                  options.navigationItems!,
                );
                return {
                  type: 'hugoShortcode-Link-Href',
                  value: hrefDisplayPath,
                } as unknown as Nodes;
              }
            }
            return node;
          }
        : undefined,
  };
  return options1;
}

/**
 * Remark插件：处理Hugo shortcodes和相关转换
 */

export function remarkHugoShortcode(
  this: unknown,
  options: RemarkHugoShortcodeOptions = {},
) {
  const self: unknown = this as unknown;
  const settings = options || {};
  const data = (
    self as {
      data(): {
        micromarkExtensions?: unknown[];
        fromMarkdownExtensions?: unknown[];
        toMarkdownExtensions?: unknown[];
      };
    }
  ).data();

  const micromarkExtensions =
    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    data.micromarkExtensions || (data.micromarkExtensions = []);
  const fromMarkdownExtensions =
    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    data.fromMarkdownExtensions || (data.fromMarkdownExtensions = []);
  const toMarkdownExtensions =
    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    data.toMarkdownExtensions || (data.toMarkdownExtensions = []);

  micromarkExtensions.push(hugoShortcode());
  fromMarkdownExtensions.push(
    hugoShortcodeFromMarkdown(getRemarkHugoShortcodeOptions(options)),
  );
  toMarkdownExtensions.push(hugoShortcodeToMarkdown());

  return (tree: Root) => {
    // console.log('tree: ', JSON.stringify(tree, null, 2));
    transformHugoShortcode(tree, settings);
    // console.log('tree: ', JSON.stringify(tree, null, 2));
  };
}

// 导出默认配置的插件函数
export function remarkHugoShortcodeDefault() {
  return remarkHugoShortcode();
}

export default function remarkQrCode() {
  return (tree: Root) => {
    visit(tree, 'code', (node: Code, index, parent) => {
      if (node.lang === 'qrcode') {
        const hugoShortcodeNode = {
          type: 'hugoShortcodeFlowElement',
          name: 'qrcode',
          arguments: [
            {
              type: 'hugoShortcodeArgumentPositional',
              value: node.value,
            },
          ],
          notation: 'standard',
          children: [],
        } as unknown as HugoShortcodeElement;
        const mdxJsxElement = createMdxJsxElement(
          hugoShortcodeNode,
          'mdxJsxFlowElement',
        );
        if (parent && typeof index === 'number' && 'children' in parent) {
          (parent as Parent).children[index] =
            mdxJsxElement as unknown as RootContent;
        }
      }
    });
  };
}
