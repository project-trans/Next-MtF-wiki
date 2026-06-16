export interface MeasurementData {
  underBustRelaxed: number | null; // 胸下围放松时
  underBustExhale: number | null; // 胸下围呼气时
  bustRelaxed: number | null; // 胸围放松时
  bustBend45: number | null; // 胸围俯身45度
  bustBend90: number | null; // 胸围鞠躬90度
}

export interface CupResult {
  isValid: boolean;
  underBust: number | null;
  cupDifference: number | null;
  cupSize: string | null;
  bandSize: number | null;
  fullSize: string | null;
  messageKey: string;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  measurements: MeasurementData;
  result: CupResult;
}

export interface CalculatorState {
  measurements: MeasurementData;
  result: CupResult | null;
  isCalculating: boolean;
}

export interface CupSizeInfo {
  threshold: number;
  size: string;
  messageKey: string;
}

export interface InternationalBraSize {
  europe: string; // 欧洲标准
}
