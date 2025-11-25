'use client';

import {
  AlertTriangle,
  CheckCircle,
  Info,
  Mars,
  Target,
  Venus,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { HormoneRange } from '../lib/types';

interface RangeIndicatorProps {
  ranges?: HormoneRange[];
  isVisible: boolean;
}

// MtF 主题色配置
const getBackgroundStyle = (iconType?: string, color?: string) => {
  switch (iconType) {
    case 'male':
      return {
        backgroundColor: '#5bcefa20', // MtF 淡蓝色，20% 透明度
        borderColor: '#5bcefa',
        color: 'inherit',
      };
    case 'female':
      return {
        backgroundColor: '#f6a8b820', // MtF 粉色，20% 透明度
        borderColor: '#f6a8b8',
        color: 'inherit',
      };
    default: {
      // 为其他类型提供浅色背景和深色边框
      const colorMap = {
        success: {
          backgroundColor: 'rgb(34 197 94 / 0.1)', // success 浅色背景
          borderColor: 'rgb(34 197 94)',
          color: 'rgb(34 197 94)',
        },
        warning: {
          backgroundColor: 'rgb(251 146 60 / 0.1)', // warning 浅色背景
          borderColor: 'rgb(251 146 60)',
          color: 'rgb(251 146 60)',
        },
        error: {
          backgroundColor: 'rgb(239 68 68 / 0.1)', // error 浅色背景
          borderColor: 'rgb(239 68 68)',
          color: 'rgb(239 68 68)',
        },
        info: {
          backgroundColor: 'rgb(59 130 246 / 0.1)', // info 浅色背景
          borderColor: 'rgb(59 130 246)',
          color: 'rgb(59 130 246)',
        },
      };
      return colorMap[color as keyof typeof colorMap] || colorMap.info;
    }
  }
};

// 根据图标类型返回对应的图标组件
function getIconComponent(iconType?: string) {
  switch (iconType) {
    case 'male':
      return Mars;
    case 'female':
      return Venus;
    case 'target':
      return Target;
    case 'success':
      return CheckCircle;
    case 'warning':
      return AlertTriangle;
    case 'error':
      return XCircle;
    case 'info':
    default:
      return Info;
  }
}

export function RangeIndicator({ ranges, isVisible }: RangeIndicatorProps) {
  if (!isVisible || !ranges || ranges.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {ranges.map((range, index) => {
        const IconComponent = getIconComponent(range.iconType);
        const customStyle = getBackgroundStyle(range.iconType, range.color);

        return (
          <motion.div
            key={`${range.label}-${index}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.3,
              delay: index * 0.1, // 交错动画效果
            }}
            className="p-3 rounded-lg shadow-sm border-2 bg-base-100"
            style={{
              backgroundColor: customStyle.backgroundColor,
              borderColor: customStyle.borderColor,
            }}
          >
            <div className="flex items-center gap-2">
              <IconComponent
                className="w-5 h-5 flex-shrink-0"
                style={{ color: customStyle.borderColor }}
              />
              <div>
                <div className="font-medium text-base-content">
                  {range.label}
                </div>
                <div className="text-sm text-base-content/70">
                  {range.description}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
