import type { ObjectivesDictionary } from "@shared/schema";

export interface ProgressResult {
  progress: number;
  finalQualitativeResult: string | undefined;
  finalActualValue: number | undefined;
}

/**
 * Calculate progress and qualitative result for a dictionary objective
 * given actualValue and/or qualitativeResult input.
 */
export function calculateProgress(
  dictionary: ObjectivesDictionary,
  actualValue?: number,
  qualitativeResult?: string,
): ProgressResult {
  let calculatedProgress = 0;
  let finalActualValue: number | undefined = undefined;
  let finalQualitativeResult: string | undefined = undefined;

  if (actualValue !== undefined) {
    finalActualValue = actualValue;

    if (dictionary.objectiveType === "numeric" && dictionary.targetValue !== null && dictionary.targetValue !== undefined) {
      const target = parseFloat(String(dictionary.targetValue));
      const actual = parseFloat(String(actualValue));
      const threshold = dictionary.thresholdValue ? parseFloat(String(dictionary.thresholdValue)) : null;

      const allowOverperformance = dictionary.allowOverperformance === 1;
      const maxPayout = dictionary.maxPayout ?? 120;
      const thresholdPayout = dictionary.thresholdPayout ?? 50;

      if (threshold !== null) {
        if (actual < threshold) {
          finalQualitativeResult = "not_reached";
          calculatedProgress = 0;
        } else if (actual > target && allowOverperformance) {
          finalQualitativeResult = "reached";
          const overshoot = ((actual - target) / target) * 100;
          calculatedProgress = Math.min(Math.round(100 + overshoot), maxPayout);
        } else if (actual >= target) {
          finalQualitativeResult = "reached";
          calculatedProgress = 100;
        } else {
          finalQualitativeResult = "partial";
          const t = (actual - threshold) / (target - threshold);
          calculatedProgress = Math.round(thresholdPayout + t * (100 - thresholdPayout));
        }
      } else {
        if (actual > target && allowOverperformance) {
          finalQualitativeResult = "reached";
          const overshoot = ((actual - target) / target) * 100;
          calculatedProgress = Math.min(Math.round(100 + overshoot), maxPayout);
        } else if (actual >= target) {
          finalQualitativeResult = "reached";
          calculatedProgress = 100;
        } else {
          finalQualitativeResult = "not_reached";
          calculatedProgress = Math.round((actual / target) * 100);
        }
      }
    }
  }

  if (qualitativeResult && ["reached", "not_reached", "partial"].includes(qualitativeResult)) {
    if (dictionary.objectiveType === "qualitative") {
      finalQualitativeResult = qualitativeResult;
      if (qualitativeResult === "reached") {
        calculatedProgress = 100;
      } else if (qualitativeResult === "partial") {
        calculatedProgress = 50;
      } else {
        calculatedProgress = 0;
      }
    }
  }

  return { progress: calculatedProgress, finalQualitativeResult, finalActualValue };
}
