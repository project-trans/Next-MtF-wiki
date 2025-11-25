'use client';

import { useAtom } from 'jotai';
import { Check, Clock, Copy, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { clearHistoryAtom, historyAtom, showHistoryAtom } from '../lib/atoms';
import type { HistoryRecord } from '../lib/types';
import { formatTimestamp } from '../lib/utils';

export function HistoryPanel() {
  const [history] = useAtom(historyAtom);
  const [, clearHistory] = useAtom(clearHistoryAtom);
  const [showHistory, setShowHistory] = useAtom(showHistoryAtom);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (record: HistoryRecord) => {
    if (!record.result.fullSize) return;

    try {
      await navigator.clipboard.writeText(record.result.fullSize);
      setCopiedId(record.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleClearHistory = () => {
    if (confirm('确定要清除所有历史记录吗？此操作不可撤销。')) {
      clearHistory();
    }
  };

  if (!showHistory) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowHistory(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-base-100 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 p-6 border-b border-base-300/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-pink-500" />
                <div>
                  <h2 className="text-xl font-semibold text-base-content">
                    测量历史
                  </h2>
                  <p className="text-sm text-base-content/60">
                    共 {history.length} 条记录，数据仅存储在浏览器本地
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="btn btn-ghost btn-sm gap-2 text-error hover:bg-error/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    清空
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="w-16 h-16 text-base-content/30 mb-4" />
                <h3 className="text-lg font-medium text-base-content/60 mb-2">
                  暂无历史记录
                </h3>
                <p className="text-sm text-base-content/40">
                  完成测量后，结果会自动保存到这里
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {history.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="bg-base-50 dark:bg-base-800/50 rounded-lg p-4 border border-base-300/30 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm text-base-content/60">
                          {formatTimestamp(record.timestamp)}
                        </div>
                        {record.result.isValid && record.result.fullSize && (
                          <div className="text-lg font-semibold text-base-content mt-1">
                            {record.result.fullSize}
                          </div>
                        )}
                      </div>
                      {record.result.fullSize && (
                        <button
                          type="button"
                          onClick={() => handleCopy(record)}
                          className="btn btn-ghost btn-sm gap-2"
                        >
                          {copiedId === record.id ? (
                            <>
                              <Check className="w-3 h-3" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              复制
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* 测量数据 */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                      <div className="bg-white/50 dark:bg-black/20 rounded p-2">
                        <div className="text-base-content/60">胸下围(放松)</div>
                        <div className="font-mono">
                          {record.measurements.underBustRelaxed?.toFixed(1) ||
                            '—'}{' '}
                          cm
                        </div>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded p-2">
                        <div className="text-base-content/60">胸下围(呼气)</div>
                        <div className="font-mono">
                          {record.measurements.underBustExhale?.toFixed(1) ||
                            '—'}{' '}
                          cm
                        </div>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded p-2">
                        <div className="text-base-content/60">胸围(放松)</div>
                        <div className="font-mono">
                          {record.measurements.bustRelaxed?.toFixed(1) || '—'}{' '}
                          cm
                        </div>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded p-2">
                        <div className="text-base-content/60">胸围(45°)</div>
                        <div className="font-mono">
                          {record.measurements.bustBend45?.toFixed(1) || '—'} cm
                        </div>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded p-2">
                        <div className="text-base-content/60">胸围(90°)</div>
                        <div className="font-mono">
                          {record.measurements.bustBend90?.toFixed(1) || '—'} cm
                        </div>
                      </div>
                    </div>

                    {/* 计算结果 */}
                    {record.result.isValid && (
                      <div className="mt-3 pt-3 border-t border-base-300/30">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-base-content/60">
                              胸下围：
                            </span>
                            <span className="font-mono">
                              {record.result.underBust?.toFixed(1)} cm
                            </span>
                          </div>
                          <div>
                            <span className="text-base-content/60">
                              罩杯差值：
                            </span>
                            <span className="font-mono">
                              {record.result.cupDifference?.toFixed(1)} cm
                            </span>
                          </div>
                          <div>
                            <span className="text-base-content/60">罩杯：</span>
                            <span className="font-mono">
                              {record.result.cupSize}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 特殊消息 */}
                    {!record.result.fullSize && record.result.message && (
                      <div className="mt-3 text-sm text-base-content/70 italic">
                        {record.result.message}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
