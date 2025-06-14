'use client';
import {
  LazyMotion,
  domAnimation,
  m,
  useMotionTemplate,
  useSpring,
} from 'motion/react';
import { usePathname } from 'next/navigation';
import React, { startTransition, useCallback } from 'react';
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';

/**
 * Internal context for the progress bar.
 */
const ProgressContext = createContext<ReturnType<
  typeof useProgressInternal
> | null>(null);

/**
 * Reads the progress bar context.
 */
function useProgressBarContext() {
  const progress = useContext(ProgressContext);

  if (progress === null) {
    throw new Error(
      'Make sure to use `ProgressBarProvider` before using the progress bar.',
    );
  }

  return progress;
}

function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * This function calculates a difference (`diff`) based on the input number (`current`).
 *
 * - If `current` is exactly 0, `diff` is set to 15.
 * - If `current` is less than 50 (but not 0), `diff` is set to a random number between 1 and 10.
 * - If `current` is 50 or more, `diff` is set to a random number between 1 and 5.
 */
function getDiff(
  /** The current number used to calculate the difference. */
  current: number,
): number {
  let diff: number;
  if (current === 0) {
    diff = 15;
  } else if (current < 50) {
    diff = random(1, 10);
  } else {
    diff = random(1, 5);
  }

  return diff;
}

/**
 * Custom hook for managing progress state and animation.
 * @returns An object containing the current state, spring animation, and functions to start and complete the progress.
 */
export function useProgressInternal() {
  const prevPathname = useRef<string | null>(null);
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  // 使用 ref 来存储定时器和状态
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimerRef = useRef<NodeJS.Timeout | null>(null);
  const completeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(false);

  const spring = useSpring(0, {
    damping: 25,
    mass: 0.5,
    stiffness: 300,
    restDelta: 0.1,
  });

  // 路径变化的监听
  useEffect(() => {
    // console.log("useEffect() 路径变化: ", prevPathname.current, pathname);
    if (prevPathname.current && pathname !== prevPathname.current) {
      complete();
    }
    prevPathname.current = pathname;
  }, [pathname]);

  // 清理所有定时器的函数
  const clearAllTimers = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
    if (completeTimerRef.current) {
      clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
  };

  // 开始进度动画的函数
  const startProgressAnimation = () => {
    // 清除已有的动画定时器
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const updateProgress = () => {
      flushSync(() => {
        // If we start progress but the bar is currently complete, reset it first.
        if (spring.get() === 1) {
          spring.jump(0);
        }

        const current = spring.get();
        spring.set(Math.min(current + getDiff(current * 100) * 0.01, 0.99));
      });
    };

    updateProgress();

    intervalRef.current = setInterval(() => {
      updateProgress();
    }, 750);
  };

  // 停止进度动画的函数
  const stopProgressAnimation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Start the progress.
   */
  const start = (path: string) => {
    // console.log("start() 开始进度条", prevPathname.current, pathname);
    if (path === pathname) {
      return;
    }

    // 清除所有现有定时器
    clearAllTimers();

    // 重置spring到0
    spring.jump(0);

    // 标记为加载中
    isLoadingRef.current = true;

    // 等待700毫秒后显示进度条并开始动画
    startTimerRef.current = setTimeout(() => {
      if (isLoadingRef.current) {
        // 检查是否还在加载中
        // console.log("700ms后显示进度条并开始动画");

        flushSync(() => {
          setVisible(true);
          startProgressAnimation();
        });
      }
      startTimerRef.current = null;
    }, 700);

    prevPathname.current = pathname;
  };

  /**
   * Complete the progress by animating to 100% then hiding.
   */
  const complete = useCallback(() => {
    // console.log("=== complete() 被调用 ===");

    // 停止加载状态
    isLoadingRef.current = false;

    // 停止进度动画
    stopProgressAnimation();

    // 清除启动定时器（如果还在等待中）
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }

    // 如果进度条是可见的，执行完成动画
    if (visible) {
      // 快速动画到 100%
      spring.set(1);

      // 短暂延迟后隐藏进度条并重置
      completeTimerRef.current = setTimeout(() => {
        setVisible(false);
        spring.jump(0);
        completeTimerRef.current = null;
      }, 300);
    } else {
      // 如果进度条不可见，直接重置
      spring.jump(0);
    }
  }, [visible, spring, stopProgressAnimation]);

  useEffect(() => {
    const callback = (pageShowEvent: PageTransitionEvent) => {
      if (pageShowEvent.persisted) {
        console.log('pageshow callback');
        complete();
      }
    };
    window?.addEventListener('pageshow', callback);
    return () => {
      window?.removeEventListener('pageshow', callback);
    };
  }, [complete]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  });

  return {
    visible,
    spring,
    start,
    complete,
  };
}

/**
 * Provides the progress value to the child components.
 *
 * @param children - The child components to render.
 * @returns The rendered ProgressBarContext.Provider component.
 */
export function ProgressBarProvider({ children }: { children: ReactNode }) {
  const progress = useProgressInternal();
  return <ProgressContext value={progress}>{children}</ProgressContext>;
}

/**
 * Renders a progress bar component.
 *
 * @param className - The CSS class name for the progress bar.
 * @returns The rendered progress bar component.
 */
export function ProgressBar({ className }: { className?: string }) {
  const progress = useProgressBarContext();
  const transform = useMotionTemplate`scaleX(${progress.spring})`;

  return (
    <LazyMotion features={domAnimation}>
      {progress.visible && (
        <m.div
          style={{
            width: '100%',
            transformOrigin: 'left',
            transition: 'transform 100ms',
            transform,
          }}
          className={className}
        />
      )}
    </LazyMotion>
  );
}

type StartProgress = (pathname: string) => void;
type CompleteProgress = () => void;

/**
 * A custom hook that returns functions to start and complete the progress.
 *
 * @returns An object with start and complete functions for the progress bar.
 */
export function useProgress(): {
  start: StartProgress;
  complete: CompleteProgress;
  visible: boolean;
} {
  const progress = useProgressBarContext();

  const startProgress: StartProgress = (pathname: string) => {
    progress.start(pathname);
  };

  const completeProgress: CompleteProgress = () => {
    progress.complete();
  };

  return {
    start: startProgress,
    complete: completeProgress,
    visible: progress.visible,
  };
}
