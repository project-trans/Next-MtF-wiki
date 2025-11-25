import type { ShortCodeCompProps } from './types';

/**
 * ProjectTrans组件用于显示Project Trans的链接和图标
 * 对应Hugo shortcode: {{< project-trans >}}
 */
export default function ProjectTrans({ attrs, children }: ShortCodeCompProps) {
  return (
    <a
      href="https://project-trans.org/"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        src="/hugo-static/new/project-trans-inline.svg"
        style={{
          height: '0.75em',
          display: 'inline',
          verticalAlign: 'baseline',
          backgroundColor: 'none',
          border: 'none',
          borderRadius: 0,
          margin: 0,
          padding: 0,
        }}
        alt="Project Trans"
      />
    </a>
  );
}
