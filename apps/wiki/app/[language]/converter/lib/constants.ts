import type { HormoneType, HormoneUnit } from './types';

function createStandardMassAndMolarUnits(molecularWeight: number, baseUnit: string): HormoneUnit[] {
  const units: HormoneUnit[] = [];
  const massPrefixes: Record<string, { name: string; factor: number }> = {
    'p': { name: '皮', factor: 1e-12 },
    'n': { name: '纳', factor: 1e-9 },
    'μ': { name: '微', factor: 1e-6 },
  };
  const molarPrefixes: Record<string, { name: string; factor: number }> = {
    'p': { name: '皮', factor: 1e-12 },
    'n': { name: '纳', factor: 1e-9 },
  };
  const volumes: Record<string, { name: string; factor: number }> = {
    'mL': { name: '毫升', factor: 1e-3 },
    'dL': { name: '分升', factor: 1e-1 },
    'L': { name: '升', factor: 1 },
  };

  const factorsToGL: Record<string, number> = {};

  for (const [p, pData] of Object.entries(massPrefixes)) {
    for (const [v, vData] of Object.entries(volumes)) {
      const symbol = `${p}g/${v}`;
      factorsToGL[symbol] = pData.factor / vData.factor;
    }
  }

  for (const [p, pData] of Object.entries(molarPrefixes)) {
    for (const [v, vData] of Object.entries(volumes)) {
      const symbol = `${p}mol/${v}`;
      factorsToGL[symbol] = (pData.factor * molecularWeight) / vData.factor;
    }
  }

  const baseUnitFactorToGL = factorsToGL[baseUnit];
  if (!baseUnitFactorToGL) {
    throw new Error(`Base unit ${baseUnit} is not a standard mass/molar unit.`);
  }

  for (const [mp, mpData] of Object.entries(massPrefixes)) {
    for (const [vp, vpData] of Object.entries(volumes)) {
      const symbol = `${mp}g/${vp}`;
      units.push({
        name: `${mpData.name}克/${vpData.name}`,
        symbol,
        multiplier: factorsToGL[symbol] / baseUnitFactorToGL,
      });
    }
  }

  for (const [mp, mpData] of Object.entries(molarPrefixes)) {
    for (const [vp, vpData] of Object.entries(volumes)) {
      const symbol = `${mp}mol/${vp}`;
      units.push({
        name: `${mpData.name}摩尔/${vpData.name}`,
        symbol,
        multiplier: factorsToGL[symbol] / baseUnitFactorToGL,
      });
    }
  }

  return units;
}

function createMassUnitsFromIU(pgPerBaseUnit: number): HormoneUnit[] {
  const units: HormoneUnit[] = [];
  const massPrefixes: Record<string, { name: string; factor: number }> = {
    'p': { name: '皮', factor: 1 },
    'n': { name: '纳', factor: 1e3 },
    'μ': { name: '微', factor: 1e6 },
  };
  const volumes: Record<string, { name: string; factor: number }> = {
    'mL': { name: '毫升', factor: 1 },
    'dL': { name: '分升', factor: 100 },
    'L': { name: '升', factor: 1000 },
  };

  const baseMultiplier = 1 / pgPerBaseUnit; // Multiplier to convert 1 pg/mL to 1 base unit

  for (const [mp, mpData] of Object.entries(massPrefixes)) {
    for (const [vp, vpData] of Object.entries(volumes)) {
      units.push({
        name: `${mpData.name}克/${vpData.name}`,
        symbol: `${mp}g/${vp}`,
        multiplier: (mpData.factor / vpData.factor) * baseMultiplier,
      });
    }
  }

  return units;
}

export const HORMONES: HormoneType[] = [
  {
    id: 'estradiol',
    name: '雌二醇 (E2)',
    baseUnit: 'pg/mL',
    molecularWeight: 272.38,
    units: createStandardMassAndMolarUnits(272.38, 'pg/mL'),
    ranges: [
      {
        label: '男性参考范围',
        min: 14,
        max: 55,
        unit: 'pg/mL',
        description: '',
        color: 'info',
        iconType: 'male',
        source: {
          name: '雌二醇 - 维基百科，自由的百科全书',
          url: 'https://zh.wikipedia.org/wiki/%E9%9B%8C%E4%BA%8C%E9%86%87#%E8%8C%83%E5%9B%B4'
        }
      },
      {
        label: '非针剂女性向 GAHT 目标范围',
        min: 100,
        max: 200,
        unit: 'pg/mL',
        description: '',
        color: 'success',
        iconType: 'target',
        source: {
          name: '治疗期间的监测 - MtF.wiki',
          url: '/zh-cn/docs/medicine/monitoring'
        }
      },
      {
        label: '女性卵泡期',
        min: 30,
        max: 100,
        unit: 'pg/mL',
        description: '',
        color: 'info',
        iconType: 'female',
        source: {
          name: '治疗期间的监测 - MtF.wiki',
          url: '/zh-cn/docs/medicine/monitoring'
        }
      },
      {
        label: '女性黄体期',
        min: 70,
        max: 300,
        unit: 'pg/mL',
        description: '',
        color: 'info',
        iconType: 'female',
        source: {
          name: '治疗期间的监测 - MtF.wiki',
          url: '/zh-cn/docs/medicine/monitoring'
        }
      }
    ]
  },
  {
    id: 'testosterone',
    name: '睾酮 (T)',
    baseUnit: 'ng/dL',
    molecularWeight: 288.43,
    units: createStandardMassAndMolarUnits(288.43, 'ng/dL'),
    ranges: [
      {
        label: '男性参考范围',
        min: 264,
        max: 916,
        unit: 'ng/dL',
        description: '',
        color: 'info',
        iconType: 'male',
        source: {
          name: '治疗期间的监测 - MtF.wiki',
          url: '/zh-cn/docs/medicine/monitoring'
        }
      },
      {
        label: '女性参考范围',
        min: 1,
        max: 55,
        unit: 'ng/dL',
        description: '',
        color: 'info',
        iconType: 'female',
        source: {
          name: '治疗期间的监测 - MtF.wiki',
          url: '/zh-cn/docs/medicine/monitoring'
        }
      },
      {
        label: '女性向 GAHT 目标范围',
        min: 0,
        max: 55,
        unit: 'ng/dL',
        description: '',
        color: 'success',
        iconType: 'target',
        source: {
          name: '治疗期间的监测 - MtF.wiki',
          url: '/zh-cn/docs/medicine/hrt'
        }
      }
    ]
  },
  {
    id: 'prolactin',
    name: '泌乳素 (PRL)',
    baseUnit: 'ng/mL',
    molecularWeight: 23000,
    units: [
      ...createStandardMassAndMolarUnits(23000, 'ng/mL'),
      { name: '毫国际单位/毫升', symbol: 'mIU/mL', multiplier: 47.17 },
      { name: '毫国际单位/升', symbol: 'mIU/L', multiplier: 0.04717 },
      { name: '微国际单位/毫升', symbol: 'μIU/mL', multiplier: 0.04717 },
      { name: '微国际单位/升', symbol: 'μIU/L', multiplier: 0.00004717 },
    ],
    ranges: [
      {
        label: '女性参考范围',
        min: 4.79,
        max: 23.3,
        unit: 'ng/mL',
        description: '',
        color: 'info',
        iconType: 'female',
        source: {
          name: '治疗期间的监测 - MtF.wiki',
          url: '/zh-cn/docs/medicine/monitoring'
        }
      },
      {
        label: '显著升高',
        min: 69.9,
        max: Infinity,
        unit: 'ng/mL',
        description: '需要注意',
        color: 'error',
        iconType: 'error',
        source: {
          name: '治疗期间的监测 - MtF.wiki',
          url: '/zh-cn/docs/medicine/monitoring'
        }
      }
    ]
  },
  {
    id: 'progesterone',
    name: '孕酮 (P4)',
    baseUnit: 'ng/mL',
    molecularWeight: 314.46,
    units: createStandardMassAndMolarUnits(314.46, 'ng/mL'),
    ranges: [
    ]
  },
  {
    id: 'fsh',
    name: '卵泡刺激素 (FSH)',
    baseUnit: 'mIU/mL',
    units: [
      { name: '毫国际单位/毫升', symbol: 'mIU/mL', multiplier: 1 },
      { name: '国际单位/升', symbol: 'IU/L', multiplier: 1 },
      { name: '毫国际单位/升', symbol: 'mIU/L', multiplier: 0.001 },
      ...createMassUnitsFromIU(113880),
    ],
    ranges: [
      {
        label: '女性卵泡期',
        min: 1.8,
        max: 11.2,
        unit: 'mIU/mL',
        description: '',
        color: 'info',
        iconType: 'female',
        source: {
          name: '治疗期间的监测 - MtF.wiki',
          url: '/zh-cn/docs/medicine/monitoring'
        }
      },
      {
        label: '绝经后女性',
        min: 30,
        max: 120,
        unit: 'mIU/mL',
        description: '',
        color: 'info',
        iconType: 'female',
        source: {
          name: '治疗期间的监测 - MtF.wiki',
          url: '/zh-cn/docs/medicine/monitoring'
        }
      }
    ]
  },
  {
    id: 'lh',
    name: '促黄体素 (LH)',
    baseUnit: 'mIU/mL',
    units: [
      { name: '毫国际单位/毫升', symbol: 'mIU/mL', multiplier: 1 },
      { name: '国际单位/升', symbol: 'IU/L', multiplier: 1 },
      { name: '毫国际单位/升', symbol: 'mIU/L', multiplier: 0.001 },
      ...createMassUnitsFromIU(46.56),
    ],
    ranges: [
      {
        label: '女性卵泡期',
        min: 2.0,
        max: 9.0,
        unit: 'mIU/mL',
        description: '',
        color: 'info',
        iconType: 'female',
        source: {
          name: '治疗期间的监测 - MtF.wiki',
          url: '/zh-cn/docs/medicine/monitoring'
        }
      },
      {
        label: '女性黄体期',
        min: 2.0,
        max: 11.0,
        unit: 'mIU/mL',
        description: '',
        color: 'info',
        iconType: 'female',
        source: {
          name: '治疗期间的监测 - MtF.wiki',
          url: '/zh-cn/docs/medicine/monitoring'
        }
      },
      {
        label: '绝经后女性',
        min: 20.0,
        max: 70.0,
        unit: 'mIU/mL',
        description: '',
        color: 'info',
        iconType: 'female',
        source: {
          name: '治疗期间的监测 - MtF.wiki',
          url: '/zh-cn/docs/medicine/monitoring'
        }
      }
    ]
  }
];

export const DEFAULT_HORMONE = 'estradiol';
