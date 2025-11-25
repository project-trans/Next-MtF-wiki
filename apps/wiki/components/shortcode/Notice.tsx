import type { ShortCodeCompProps } from './types';

export default function Notice({ attrs, children }: ShortCodeCompProps) {
  const type = attrs[0] || 'info';
  const title = attrs[1];

  // 根据类型设置不同的样式，使用DaisyUI颜色系统
  const getStyles = () => {
    switch (type) {
      case 'warning':
        return 'bg-warning/5 border-warning text-warning-content';
      case 'error':
        return 'bg-error/5 border-error text-error-content';
      case 'success':
        return 'bg-success/5 border-success text-success-content';
      default:
        return 'bg-info/5 border-info text-info-content';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-error';
      case 'success':
        return 'text-success';
      default:
        return 'text-info';
    }
  };

  // 获取图标，使用对应主题颜色
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return (
          <svg
            className={`w-5 h-5 flex-shrink-0 ${getIconColor()}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            className={`w-5 h-5 flex-shrink-0 ${getIconColor()}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'success':
        return (
          <svg
            className={`w-5 h-5 flex-shrink-0 ${getIconColor()}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L8.53 10.53a.75.75 0 00-1.06 1.061l1.5 1.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg
            className={`w-5 h-5 flex-shrink-0 ${getIconColor()}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <div
      className={`my-4 p-4 border-l-4 rounded-r-lg ${getStyles()} transition-colors duration-200`}
    >
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          {title && (
            <div
              className={`mb-2 font-semibold text-lg flex items-center ${getIconColor()}`}
            >
              {title}
            </div>
          )}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
