import type { ShortCodeProps } from './types';

/**
 * 默认的Shortcode组件，用于处理未知的shortcode类型
 * 显示一个带有警告样式的框，指示该shortcode类型尚未实现
 */
export default function DefaultShortcode({
  compName,
  attrs,
  children,
}: ShortCodeProps) {
  // console.log("DefaultShortcode: ", compName, attrs, children);
  return (
    <div className="p-4 my-4 border-l-4 border-yellow-400 rounded-r bg-yellow-50">
      <div className="mb-2 font-bold text-yellow-800">
        未实现的Shortcode: {compName}
      </div>
      {attrs && Object.keys(attrs).length > 0 && (
        <div className="mb-2 text-sm text-yellow-700">
          <div>属性:</div>
          <div className="p-2 bg-yellow-100 rounded">
            {JSON.stringify(attrs, null, 2)}
          </div>
        </div>
      )}
      {children && (
        <div className="prose-sm text-yellow-700">
          <div>内容:</div>
          <div className="p-2 bg-white border border-yellow-200 rounded">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
