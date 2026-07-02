import { useMemo } from "react";
import { getLegendConfig } from "../components/tools/agenticChartUtils";

/**
 * Custom hook to memoize pie chart legend configuration.
 * Reduces code duplication across chart components while maintaining
 * memoization for performance.
 */
export const usePieLegendConfig = (data: any[], xKey: string) => {
  const labels = useMemo(() => data.map((d) => String(d[xKey])), [data, xKey]);

  return useMemo(
    () => getLegendConfig(data.length, true, labels),
    [data.length, labels],
  );
};
