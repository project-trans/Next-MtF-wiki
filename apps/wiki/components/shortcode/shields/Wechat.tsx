import type { ShortCodeCompProps } from '../types';
import ShieldsBase from './Base';

export default function Wechat({ attrs, mdContext }: ShortCodeCompProps) {
  const message = attrs[0] || '';
  const label = mdContext?.currentLanguage === 'zh-cn' ? '微信' : 'WeChat';

  return (
    <ShieldsBase
      label={label}
      logo="WeChat"
      message={message}
      color="07C160"
      alt={`${label} ${message}`}
    />
  );
}
