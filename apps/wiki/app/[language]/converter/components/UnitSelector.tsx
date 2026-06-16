'use client';

import { useMemo } from 'react';
import { t } from '@/lib/i18n/client';
import type { HormoneUnit } from '../lib/types';

interface CombinedHormoneUnit extends HormoneUnit {
  displayName: string | null;
  equivalentUnits: HormoneUnit[];
}

interface UnitGroup {
  label: string;
  units: CombinedHormoneUnit[];
}

interface UnitSelectorProps {
  value: string;
  onChange: (value: string) => void;
  units: HormoneUnit[];
  language: string;
  className?: string;
}

function processUnits(units: HormoneUnit[], language: string): UnitGroup[] {
  // 按 multiplier 分组，找出等价单位
  const multiplierGroups = new Map<string, HormoneUnit[]>();

  for (const unit of units) {
    // 使用固定精度来处理浮点数比较
    const key = unit.multiplier.toExponential(10);
    if (!multiplierGroups.has(key)) {
      multiplierGroups.set(key, []);
    }
    multiplierGroups.get(key)!.push(unit);
  }

  const processedUnits: CombinedHormoneUnit[] = [];

  // 处理每个 multiplier 组
  for (const [, equivalentUnits] of multiplierGroups) {
    if (equivalentUnits.length > 1) {
      // 有多个等价单位，需要合并
      // 选择最简洁的符号作为主要符号，优先选择常用单位
      const primaryUnit =
        equivalentUnits.find((u) => u.category === 'common') ||
        equivalentUnits[0];

      // 创建合并后的单位
      const mergedUnit = {
        ...primaryUnit,
        displayName: equivalentUnits
          .map((u) => u.symbol)
          .sort((a, b) => {
            // 按容积单位大小排序：mL < dL < L
            const getVolumeOrder = (symbol: string) => {
              if (symbol.includes('/mL')) return 1;
              if (symbol.includes('/dL')) return 2;
              if (symbol.includes('/L')) return 3;
              return 4; // 其他单位
            };
            return getVolumeOrder(a) - getVolumeOrder(b);
          })
          .join(' = '),
        equivalentUnits,
      };

      processedUnits.push(mergedUnit);
    } else {
      // 只有一个单位，直接添加
      processedUnits.push({
        ...equivalentUnits[0],
        displayName: null,
        equivalentUnits: equivalentUnits,
      });
    }
  }

  // 按分类分组
  const commonUnits = processedUnits.filter(
    (unit) => unit.category === 'common',
  );
  const uncommonUnits = processedUnits.filter(
    (unit) => unit.category !== 'common',
  );

  const groups: UnitGroup[] = [];

  if (commonUnits.length > 0) {
    groups.push({
      label: t('conv-common-units', language) as string,
      units: commonUnits,
    });
  }

  if (uncommonUnits.length > 0) {
    groups.push({
      label: t('conv-other-units', language) as string,
      units: uncommonUnits,
    });
  }

  return groups;
}

export function UnitSelector({
  value,
  onChange,
  units,
  language,
  className = '',
}: UnitSelectorProps) {
  const groups = useMemo(
    () => processUnits(units, language),
    [units, language],
  );

  const realValue = useMemo(() => {
    for (const group of groups) {
      for (const unit of group.units) {
        if (unit.equivalentUnits.some((u) => u.symbol === value)) {
          return unit.symbol;
        }
      }
    }
    return value;
  }, [groups, value]);

  return (
    <select
      value={realValue}
      onChange={(e) => onChange(e.target.value)}
      className={`select select-bordered ${className}`}
    >
      {groups.length > 1
        ? groups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.units.map((unit) => (
                <option key={unit.symbol} value={unit.symbol}>
                  {unit.displayName || unit.symbol}
                </option>
              ))}
            </optgroup>
          ))
        : groups.map((group) =>
            group.units.map((unit) => (
              <option key={unit.symbol} value={unit.symbol}>
                {unit.displayName || unit.symbol}
              </option>
            )),
          )}
    </select>
  );
}
