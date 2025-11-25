'use client';

import { Link } from '@/components/progress/next';
import { useAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import {
  bannerHeightAtom,
  bannerVisibilityAtom,
  closeBannerAtom,
} from '../lib/banner-atoms';

interface BottomBannerProps {
  language: string;
  text: string;
  buttonText: string | null;
  buttonLink: string | null;
  closeButtonText: string | null;
  enableCloseButton?: boolean;
}
export default function BottomBanner({
  text,
  buttonText,
  buttonLink,
  closeButtonText,
}: BottomBannerProps) {
  const [isVisible] = useAtom(bannerVisibilityAtom);
  const [, closeBanner] = useAtom(closeBannerAtom);
  const [, setBannerHeight] = useAtom(bannerHeightAtom);
  const bannerRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    if (closeButtonText) {
      closeBanner();
    }
  };

  // 监听 banner 高度变化
  useEffect(() => {
    const updateHeight = () => {
      if (bannerRef.current && isVisible) {
        setBannerHeight(bannerRef.current.offsetHeight);
      } else {
        setBannerHeight(0);
      }
    };

    updateHeight();

    // 监听窗口大小变化，可能会影响 banner 高度
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      setBannerHeight(0);
    };
  }, [isVisible, setBannerHeight]);

  //console.log("BottomBanner", isVisible, enableCloseButton);
  return (
    <div
      ref={bannerRef}
      className={`
        ${isVisible ? 'sticky' : 'block'}
          bottom-0 left-0 right-0 z-40 
        bg-[#444] text-white shadow-lg
      `}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* 文字内容 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm md:text-base font-medium">{text}</p>
          </div>

          {/* 按钮组 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 主按钮 */}
            {buttonText && buttonLink && (
              <Link
                type="button"
                href={buttonLink}
                className="
                  px-3 py-1.5 text-xs md:text-sm font-medium
                  bg-white text-blue-600 hover:bg-gray-100
                  rounded-md transition-all duration-200
                  whitespace-nowrap
                "
              >
                {buttonText}
              </Link>
            )}

            {/* 关闭按钮 */}
            {closeButtonText && isVisible && (
              <button
                type="button"
                onClick={handleClose}
                className="
                  px-3 py-1.5 text-xs md:text-sm font-medium
                  bg-white/20 hover:bg-white/30 
                  border border-white/30 hover:border-white/50
                  rounded-md transition-all duration-200
                  whitespace-nowrap
                "
              >
                {closeButtonText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
