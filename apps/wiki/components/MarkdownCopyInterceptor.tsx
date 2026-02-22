'use client';

import { type ReactNode, useCallback, useRef } from 'react';
import { SUBSCRIPT_MAP, SUPERSCRIPT_MAP, toUnicode } from './supSubMaps';

interface MarkdownCopyInterceptorProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps article content and intercepts copy events.
 * Any <sup> / <sub> elements whose text content can be fully mapped to
 * Unicode superscript / subscript characters are transparently replaced
 * in the clipboard text, so copying "H₂O" gives "H₂O" instead of "H2O".
 *
 * If a sub/sup contains characters with no Unicode mapping (e.g. Chinese),
 * that element is left unchanged and the original text is used.
 */
export function MarkdownCopyInterceptor({
  children,
  className,
}: MarkdownCopyInterceptorProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0)
      return;

    const range = selection.getRangeAt(0);
    const fragment = range.cloneContents();

    // Transform <sup> and <sub> within the cloned fragment.
    // We process deepest-first so nested elements are handled correctly.
    for (const sup of Array.from(fragment.querySelectorAll('sup'))) {
      const converted = toUnicode(sup.textContent ?? '', SUPERSCRIPT_MAP);
      if (converted !== null) {
        sup.replaceWith(document.createTextNode(converted));
      }
    }
    for (const sub of Array.from(fragment.querySelectorAll('sub'))) {
      const converted = toUnicode(sub.textContent ?? '', SUBSCRIPT_MAP);
      if (converted !== null) {
        sub.replaceWith(document.createTextNode(converted));
      }
    }

    const div = document.createElement('div');
    div.appendChild(fragment);
    const text = div.textContent ?? '';

    // Only override if sub/sup conversion actually changed something.
    if (text !== selection.toString()) {
      e.clipboardData.setData('text/plain', text);
      e.preventDefault();
    }
  }, []);

  return (
    <div ref={ref} className={className} onCopy={handleCopy}>
      {children}
    </div>
  );
}
