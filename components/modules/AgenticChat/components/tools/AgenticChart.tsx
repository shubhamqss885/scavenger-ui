"use client";

import React, { memo, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Label,
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  computeNiceTicks,
  getCommonChartConfig,
  getCommonYAxisProps,
  getCommonXAxisLabelProps,
  getBarProps,
  getLegendConfig,
  truncateLegendLabel,
  calculateLegendWidth,
  getAgenticLabelLengths,
  getAgenticXAxisProps,
  getAgenticYAxisLabelProps,
} from "./agenticChartUtils";
import { usePieLegendConfig } from "@/components/modules/AgenticChat/hooks/usePieLegendConfig";
import type { AgenticChartSpec } from "../../types";
import { H4 } from "@/components/ui/typography";
import { resolveColor } from "./chartColors";
import { useIsMobile } from "@/hooks/use-mobile";

type AgenticChartProps = Readonly<{
  spec: AgenticChartSpec;
  isMaximized?: boolean;
  fillHeight?: boolean;
}>;

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

const isVisibleNumeric = (v: unknown): boolean => {
  if (typeof v === "number") return Number.isFinite(v) && v !== 0;
  if (typeof v === "string") {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) && n !== 0;
  }
  return false;
};

type StackedBarShapeProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  payload: Record<string, unknown>;
};

// Custom shape for stacked bars: rounds the visible tip per-row so that a
// single-segment column (e.g. only Aeroxon, no Profissimo) gets rounded top
// corners just like the top of a multi-segment stack.
const makeStackedBarShape = (barKey: string, yKeys: string[]) => {
  const StackedBarShape = (props: unknown): React.ReactElement => {
    const { x, y, width, height, fill, payload } =
      props as StackedBarShapeProps;

    if (!payload || height === 0) return <g />;

    const visible = yKeys.filter((k) => isVisibleNumeric(payload[k]));
    const isTop = visible.at(-1) === barKey;
    const isBottom = visible[0] === barKey;
    const barValue = payload[barKey];
    const isNeg = typeof barValue === "number" ? barValue < 0 : false;

    const absH = Math.abs(height);
    // Clamp radius so two corners can fit within the bar width and height.
    // Without this, narrow bars (e.g. 5px) get a 4px radius from each side and
    // the path crosses itself, producing a pinched top.
    let baseR = 4;
    if (absH < 1) baseR = 0;
    else if (absH < 4) baseR = 1;
    const R = Math.min(baseR, width / 2, absH / 2);

    let tl = 0,
      tr = 0,
      bl = 0,
      br = 0;
    if (isNeg) {
      if (isBottom) bl = br = R;
    } else if (isTop) {
      tl = tr = R;
    }

    const bottomY = height > 0 ? y + height : y;
    const topY = height > 0 ? y : y + height;

    return (
      <path
        d={`
          M ${x + bl} ${bottomY}
          ${bl ? `Q ${x} ${bottomY} ${x} ${bottomY - bl}` : `L ${x} ${bottomY}`}
          L ${x} ${topY + tl}
          ${tl ? `Q ${x} ${topY} ${x + tl} ${topY}` : `L ${x} ${topY}`}
          L ${x + width - tr} ${topY}
          ${tr ? `Q ${x + width} ${topY} ${x + width} ${topY + tr}` : `L ${x + width} ${topY}`}
          L ${x + width} ${bottomY - br}
          ${br ? `Q ${x + width} ${bottomY} ${x + width - br} ${bottomY}` : `L ${x + width} ${bottomY}`}
          Z
        `}
        fill={fill}
      />
    );
  };

  StackedBarShape.displayName = "StackedBarShape";
  return StackedBarShape;
};

// Chart-type aware inline height. Overrides ChartContainer's default 16:9
// aspect-video so horizontal bars get row-driven vertical room, pies stay
// compact, and cartesian charts don't stretch on wide viewports.
const getAgenticChartHeight = (
  chartType: AgenticChartSpec["chart_type"],
  rowCount: number,
  seriesCount: number,
  needsRotation: boolean,
  isMobile: boolean,
): number => {
  let height: number;
  switch (chartType) {
    case "horizontal_bar":
      height = clamp(28 * rowCount + 80, 260, 2000);
      break;
    case "bar":
    case "stackedBar":
    case "composed":
      height = clamp(320 + 4 * rowCount, 320, 800);
      break;
    case "pie":
    case "stackedPie":
    case "radar":
    case "radialBar":
      // On mobile the legend stacks under the chart, so reserve extra
      // vertical room for it.
      height = isMobile ? 420 : 340;
      break;
    default:
      height = 360;
      break;
  }

  if (needsRotation) {
    const isRoundChart =
      chartType === "pie" ||
      chartType === "stackedPie" ||
      chartType === "radar" ||
      chartType === "radialBar";
    height += isRoundChart ? 60 : 120;
  }
  if (seriesCount > 8) height += 30;
  return height;
};

const AgenticChart = ({
  spec,
  isMaximized = false,
  fillHeight = false,
}: AgenticChartProps) => {
  const legendMaxLen = isMaximized ? 38 : 19;
  const hBarLabelMaxLen = isMaximized ? 70 : 35;
  const {
    chart_type,
    title,
    x_key,
    y_keys,
    x_label,
    y_label,
    y_axis_config,
    data,
  } = spec;
  const isMultiSeries = y_keys.length > 1;
  const isDualAxis = y_axis_config?.dual_axis === true;

  const config: ChartConfig = useMemo(() => {
    const cfg: ChartConfig = {};
    y_keys.forEach((key, i) => {
      const fallback = `hsl(var(--chart-${(i % 24) + 1}))`;
      cfg[key] = { label: key, color: resolveColor(spec.colors, i, fallback) };
    });
    return cfg;
  }, [y_keys, spec.colors]);

  const { margin, containerClassName, needsRotation } = getCommonChartConfig(
    data,
    x_key,
  );
  const { maxXLabelLength, maxYTickLength } = getAgenticLabelLengths(
    data,
    x_key,
  );

  const legendConfig = useMemo(
    () => getLegendConfig(y_keys.length, false, y_keys),
    [y_keys],
  );

  const isMobile = useIsMobile();

  const basePieLegendConfig = usePieLegendConfig(data, x_key);
  const pieLegendConfig = useMemo(() => {
    if (isMobile) {
      // Mobile: stack the legend horizontally beneath the pie so the chart
      // can use the full width instead of being squeezed by a right-side
      // vertical legend.
      return {
        layout: "horizontal" as const,
        align: "center" as const,
        verticalAlign: "bottom" as const,
        wrapperStyle: {
          paddingTop: 8,
          paddingLeft: 0,
          width: "100%",
          maxHeight: 96,
          overflowY: "auto" as const,
        },
      };
    }
    if (data.length <= 10) {
      return {
        ...basePieLegendConfig,
        wrapperStyle: {
          ...basePieLegendConfig.wrapperStyle,
          transform: "translateY(-50%)",
        },
      };
    }
    // Long lists: anchor to top and cap height so scroll engages
    // before the legend overflows the chart container.
    return {
      ...basePieLegendConfig,
      verticalAlign: "top" as const,
      wrapperStyle: {
        ...basePieLegendConfig.wrapperStyle,
        maxHeight: "calc(100% - 2rem)",
        overflowY: "auto" as const,
      },
    };
  }, [basePieLegendConfig, data.length, isMobile]);

  const pieLegendWidth = useMemo(
    () => calculateLegendWidth(data.map((d) => String(d[x_key]))),
    [data, x_key],
  );

  const pieMargin = useMemo(
    () =>
      isMobile
        ? { ...margin, top: 0, left: 8, right: 8 }
        : { ...margin, top: 0, left: pieLegendWidth },
    [isMobile, margin, pieLegendWidth],
  );

  const { yTicks, yLeftTicks, yRightTicks } = useMemo(() => {
    const emptyTicks = { yTicks: [0], yLeftTicks: [0], yRightTicks: [0] };

    // Only cartesian charts with a numeric value axis need nice ticks.
    const chartsWithNumericAxis: AgenticChartSpec["chart_type"][] = [
      "bar",
      "horizontal_bar",
      "stackedBar",
      "line",
      "step",
      "area",
      "composed",
    ];

    if (!chartsWithNumericAxis.includes(chart_type)) return emptyTicks;

    const toNumber = (v: unknown) =>
      typeof v === "number" ? v : Number(v) || 0;

    if (isDualAxis) {
      const leftKeys = y_keys.filter(
        (k) => (y_axis_config.axis_map[k] ?? "left") === "left",
      );
      const rightKeys = y_keys.filter(
        (k) => y_axis_config.axis_map[k] === "right",
      );
      let leftMax = 0;
      let rightMax = 0;
      for (const row of data) {
        for (const k of leftKeys) {
          const v = toNumber(row[k]);

          if (v > leftMax) leftMax = v;
        }
        for (const k of rightKeys) {
          const v = toNumber(row[k]);

          if (v > rightMax) rightMax = v;
        }
      }
      return {
        yTicks: [0],
        yLeftTicks: computeNiceTicks(leftMax),
        yRightTicks: computeNiceTicks(rightMax),
      };
    }

    if (chart_type === "stackedBar") {
      let max = 0;
      for (const row of data) {
        const sum = y_keys.reduce((s, k) => s + toNumber(row[k]), 0);

        if (sum > max) max = sum;
      }
      return {
        yTicks: computeNiceTicks(max),
        yLeftTicks: [0],
        yRightTicks: [0],
      };
    }

    let max = 0;
    for (const row of data) {
      for (const k of y_keys) {
        const v = toNumber(row[k]);

        if (v > max) max = v;
      }
    }
    return {
      yTicks: computeNiceTicks(max),
      yLeftTicks: [0],
      yRightTicks: [0],
    };
  }, [isDualAxis, chart_type, data, y_keys, y_axis_config]);

  const numericAxisProps = (ticks: number[]) => ({
    ticks,
    domain: [0, ticks[ticks.length - 1]] as [number, number],
    allowDecimals: false,
  });

  const yAxisCategoryWidth = useMemo(() => {
    if (chart_type !== "horizontal_bar") return 100;
    const maxLen = data.reduce((max, d) => {
      const len = String(d[x_key] ?? "").length;
      return Math.max(max, Math.min(len, hBarLabelMaxLen));
    }, 0);
    return Math.min(Math.max(maxLen * 7.5 + 30, 80), isMaximized ? 500 : 340);
  }, [chart_type, data, x_key, hBarLabelMaxLen, isMaximized]);

  const getColor = (index: number) =>
    config[y_keys[index]]?.color ?? `hsl(var(--chart-${(index % 24) + 1}))`;

  const getAxisId = (key: string): string | undefined =>
    isDualAxis ? (y_axis_config.axis_map[key] ?? "left") : undefined;

  // ── Shared cartesian elements (axes, grid, tooltip, legend) ──────────

  const commonCartesianElements = (
    <>
      <CartesianGrid vertical={false} stroke="#f1f5f9" />
      <XAxis
        {...getAgenticXAxisProps({
          dataKey: x_key,
          needsRotation,
          maxLabelLength: maxXLabelLength,
        })}
      >
        {x_label && <Label {...getCommonXAxisLabelProps(x_label)} />}
      </XAxis>
      {isDualAxis ? (
        <>
          <YAxis
            yAxisId="left"
            {...getCommonYAxisProps()}
            {...numericAxisProps(yLeftTicks)}
          >
            <Label
              style={{ textAnchor: "middle", alignItems: "center" }}
              {...getAgenticYAxisLabelProps(
                y_axis_config.left_label,
                "left",
                maxYTickLength,
              )}
            />
          </YAxis>
          <YAxis
            yAxisId="right"
            orientation="right"
            {...getCommonYAxisProps()}
            {...numericAxisProps(yRightTicks)}
          >
            <Label
              style={{ textAnchor: "middle", alignItems: "center" }}
              {...getAgenticYAxisLabelProps(
                y_axis_config.right_label,
                "right",
                maxYTickLength,
              )}
            />
          </YAxis>
        </>
      ) : (
        <YAxis {...getCommonYAxisProps()} {...numericAxisProps(yTicks)}>
          {y_label && (
            <Label
              style={{ textAnchor: "middle", alignItems: "center" }}
              {...getAgenticYAxisLabelProps(y_label, "left", maxYTickLength)}
            />
          )}
        </YAxis>
      )}
      <Tooltip content={<ChartTooltipContent />} />
      <ChartLegend
        {...legendConfig}
        formatter={(value) => truncateLegendLabel(value, legendMaxLen)}
      />
    </>
  );

  // ── Renderers ────────────────────────────────────────────────────────

  const renderBar = () => {
    if (chart_type === "horizontal_bar") {
      return (
        <BarChart data={data} layout="vertical" margin={margin}>
          <CartesianGrid horizontal={false} stroke="#f1f5f9" />
          <XAxis
            type="number"
            {...getCommonYAxisProps()}
            {...numericAxisProps(yTicks)}
          >
            <Label {...getCommonXAxisLabelProps(y_label ?? y_keys[0])} />
          </XAxis>
          <YAxis
            dataKey={x_key}
            type="category"
            tickLine={false}
            axisLine={false}
            width={yAxisCategoryWidth}
            interval={0}
            tick={({ x, y, payload }) => {
              const raw = String(payload.value ?? "");
              const display =
                raw.length > hBarLabelMaxLen
                  ? `${raw.slice(0, hBarLabelMaxLen)}...`
                  : raw;
              return (
                <text
                  x={x}
                  y={y}
                  dy={4}
                  textAnchor="end"
                  fontSize={12}
                  fill="#666"
                >
                  {display}
                </text>
              );
            }}
          >
            <Label
              {...getAgenticYAxisLabelProps(
                x_label ?? x_key,
                "left",
                maxXLabelLength,
              )}
            />
          </YAxis>
          <Tooltip content={<ChartTooltipContent />} />
          <ChartLegend
            {...legendConfig}
            formatter={(value) => truncateLegendLabel(value, legendMaxLen)}
          />
          {y_keys.map((key, i) => (
            <Bar
              key={key}
              {...getBarProps(key, config, i)}
              radius={[0, 4, 4, 0]}
            />
          ))}
        </BarChart>
      );
    }

    return (
      <BarChart data={data} margin={margin}>
        {commonCartesianElements}
        {y_keys.map((key, i) => (
          <Bar
            key={key}
            {...getBarProps(key, config, i)}
            yAxisId={getAxisId(key)}
          />
        ))}
      </BarChart>
    );
  };

  const renderStackedBar = () => (
    <BarChart data={data} margin={margin}>
      {commonCartesianElements}
      {y_keys.map((key, i) => (
        <Bar
          key={key}
          dataKey={key}
          stackId="stack"
          fill={getColor(i)}
          name={key}
          shape={makeStackedBarShape(key, y_keys)}
        />
      ))}
    </BarChart>
  );

  const renderLine = () => (
    <LineChart data={data} margin={margin}>
      {commonCartesianElements}
      {y_keys.map((key, i) => (
        <Line
          key={key}
          type="monotone"
          dataKey={key}
          stroke={getColor(i)}
          strokeWidth={2}
          dot={isMultiSeries ? false : { r: 3 }}
          connectNulls
          name={key}
          yAxisId={getAxisId(key)}
        />
      ))}
    </LineChart>
  );

  const renderStep = () => (
    <LineChart data={data} margin={margin}>
      {commonCartesianElements}
      {y_keys.map((key, i) => (
        <Line
          key={key}
          type="stepAfter"
          dataKey={key}
          stroke={getColor(i)}
          strokeWidth={2}
          dot={false}
          connectNulls
          name={key}
          yAxisId={getAxisId(key)}
        />
      ))}
    </LineChart>
  );

  const renderArea = () => (
    <AreaChart data={data} margin={margin}>
      {commonCartesianElements}
      {y_keys.map((key, i) => (
        <Area
          key={key}
          type="monotone"
          dataKey={key}
          fill={getColor(i)}
          stroke={getColor(i)}
          strokeWidth={2}
          fillOpacity={0.3}
          dot={false}
          connectNulls
          name={key}
          yAxisId={getAxisId(key)}
        />
      ))}
    </AreaChart>
  );

  const renderComposed = () => {
    // First y_key as bar (left axis), remaining as lines (right axis or same)
    const barKey = y_keys[0];
    const lineKeys = y_keys.slice(1);

    return (
      <ComposedChart data={data} margin={margin}>
        {commonCartesianElements}
        <Bar
          key={barKey}
          {...getBarProps(barKey, config, 0)}
          yAxisId={getAxisId(barKey)}
        />
        {lineKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={getColor(i + 1)}
            strokeWidth={2}
            dot={false}
            connectNulls
            name={key}
            yAxisId={getAxisId(key)}
          />
        ))}
      </ComposedChart>
    );
  };

  const renderScatter = () => (
    <ScatterChart margin={margin}>
      <CartesianGrid stroke="#f1f5f9" />
      <XAxis
        {...getAgenticXAxisProps({
          dataKey: x_key,
          needsRotation,
          maxLabelLength: maxXLabelLength,
        })}
      >
        {x_label && <Label {...getCommonXAxisLabelProps(x_label)} />}
      </XAxis>
      <YAxis {...getCommonYAxisProps()}>
        {y_label && (
          <Label
            style={{ textAnchor: "middle", alignItems: "center" }}
            {...getAgenticYAxisLabelProps(y_label, "left", maxYTickLength)}
          />
        )}
      </YAxis>
      <Tooltip content={<ChartTooltipContent />} />
      <ChartLegend
        {...legendConfig}
        formatter={(value) => truncateLegendLabel(value, legendMaxLen)}
      />
      {y_keys.map((key, i) => (
        <Scatter
          key={key}
          name={key}
          data={data}
          dataKey={key}
          fill={getColor(i)}
        />
      ))}
    </ScatterChart>
  );

  const piePercentLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    outerRadius: number;
    percent: number;
  }) => {
    if (percent < 0.02) return null;
    const RADIAN = Math.PI / 180;
    const cos = Math.cos(-midAngle * RADIAN);
    const sin = Math.sin(-midAngle * RADIAN);
    const x1 = cx + (outerRadius + 3) * cos;
    const y1 = cy + (outerRadius + 3) * sin;
    const x2 = cx + (outerRadius + 10) * cos;
    const y2 = cy + (outerRadius + 10) * sin;
    const tx = cx + (outerRadius + 16) * cos;
    const ty = cy + (outerRadius + 16) * sin;
    return (
      <g>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#94a3b8"
          strokeWidth={1}
        />
        <text
          x={tx}
          y={ty}
          fill="#475569"
          textAnchor={cos >= 0 ? "start" : "end"}
          dominantBaseline="central"
          fontSize={11}
        >
          {`${(percent * 100).toFixed(1)}%`}
        </text>
      </g>
    );
  };

  const renderPie = () => {
    const yKey = y_keys[0];
    const sliceColors = data.map((_, i) =>
      resolveColor(spec.colors, i, `hsl(var(--chart-${(i % 24) + 1}))`),
    );

    return (
      <PieChart margin={pieMargin} className="mx-auto aspect-square">
        <Pie
          data={data}
          nameKey={x_key}
          dataKey={yKey}
          cx="50%"
          cy="50%"
          outerRadius={isMobile ? "65%" : "80%"}
          innerRadius={0}
          paddingAngle={0}
          labelLine={false}
          label={piePercentLabel}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={sliceColors[index]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltipContent />} />
        <ChartLegend
          {...pieLegendConfig}
          payload={data.map((item, i) => ({
            value: String(item[x_key]),
            color: sliceColors[i],
            type: "circle" as const,
            dataKey: x_key,
          }))}
          formatter={(value) => (
            <span className="text-slate-900" title={value}>
              {truncateLegendLabel(value, legendMaxLen)}
            </span>
          )}
        />
      </PieChart>
    );
  };

  const renderStackedPie = () => {
    // Concentric pies: first y_key inner, second y_key outer
    const innerKey = y_keys[0];
    const outerKey = y_keys[1] ?? y_keys[0];
    const sliceColors = data.map((_, i) =>
      resolveColor(spec.colors, i, `hsl(var(--chart-${(i % 24) + 1}))`),
    );

    return (
      <PieChart margin={pieMargin} className="mx-auto aspect-square">
        <Pie
          data={data}
          nameKey={x_key}
          dataKey={innerKey}
          cx="50%"
          cy="50%"
          outerRadius={isMobile ? "37%" : "45%"}
          innerRadius={0}
          paddingAngle={0}
          labelLine={false}
          label={piePercentLabel}
        >
          {data.map((_, index) => (
            <Cell key={`inner-${index}`} fill={sliceColors[index]} />
          ))}
        </Pie>
        <Pie
          data={data}
          nameKey={x_key}
          dataKey={outerKey}
          cx="50%"
          cy="50%"
          innerRadius={isMobile ? "53%" : "65%"}
          outerRadius={isMobile ? "65%" : "80%"}
          paddingAngle={0}
          labelLine={false}
          label={piePercentLabel}
        >
          {data.map((_, index) => (
            <Cell
              key={`outer-${index}`}
              fill={sliceColors[index]}
              fillOpacity={0.6}
            />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltipContent />} />
        <ChartLegend
          {...pieLegendConfig}
          payload={data.map((item, index) => ({
            value: String(item[x_key]),
            color: sliceColors[index],
            type: "circle" as const,
            dataKey: x_key,
          }))}
          formatter={(value) => (
            <span className="text-slate-900" title={value}>
              {truncateLegendLabel(value, legendMaxLen)}
            </span>
          )}
        />
      </PieChart>
    );
  };

  const renderRadar = () => {
    const yKey = y_keys[0];
    return (
      <RadarChart data={data} margin={margin} className="mx-auto aspect-square">
        <PolarGrid stroke="#f1f5f9" />
        <PolarAngleAxis dataKey={x_key} />
        <Radar
          name={yKey}
          dataKey={yKey}
          stroke={getColor(0)}
          fill={getColor(0)}
          fillOpacity={0.6}
          connectNulls
        />
        <Tooltip content={<ChartTooltipContent />} />
        <ChartLegend
          {...legendConfig}
          formatter={(value) => truncateLegendLabel(value, legendMaxLen)}
        />
      </RadarChart>
    );
  };

  const renderRadialBar = () => {
    const yKey = y_keys[0];
    const coloredData = data.map((item, i) => ({
      ...item,
      fill: resolveColor(spec.colors, i, `hsl(var(--chart-${(i % 24) + 1}))`),
    }));

    return (
      <RadialBarChart
        data={coloredData}
        margin={isMobile ? pieMargin : margin}
        innerRadius="20%"
        outerRadius="90%"
        barGap={0}
        className="mx-auto aspect-square"
      >
        <PolarGrid gridType="circle" stroke="#e2e8f0" radialLines={false} />
        <RadialBar
          dataKey={yKey}
          label={{
            position: "insideStart",
            fill: "#1e293b",
            fontSize: 10,
            fontWeight: 600,
            style: { textShadow: "0 0 4px rgba(255,255,255,1)" },
          }}
        />
        <Tooltip content={<ChartTooltipContent />} />
        <ChartLegend
          {...pieLegendConfig}
          payload={data.map((item, i) => ({
            value: String(item[x_key]),
            color: resolveColor(
              spec.colors,
              i,
              `hsl(var(--chart-${(i % 24) + 1}))`,
            ),
            type: "circle" as const,
            dataKey: x_key,
          }))}
          formatter={(value) => (
            <span className="text-slate-900" title={value}>
              {truncateLegendLabel(value, legendMaxLen)}
            </span>
          )}
        />
      </RadialBarChart>
    );
  };

  // ── Chart type dispatch ──────────────────────────────────────────────

  const renderChart = () => {
    switch (chart_type) {
      case "pie":
        return renderPie();
      case "stackedPie":
        return renderStackedPie();
      case "line":
        return renderLine();
      case "step":
        return renderStep();
      case "area":
        return renderArea();
      case "scatter":
        return renderScatter();
      case "radar":
        return renderRadar();
      case "radialBar":
        return renderRadialBar();
      case "stackedBar":
        return renderStackedBar();
      case "composed":
        return renderComposed();
      case "bar":
      case "horizontal_bar":
        return renderBar();
      default:
        return renderBar();
    }
  };

  const chartHeight = getAgenticChartHeight(
    chart_type,
    data.length,
    y_keys.length,
    needsRotation,
    isMobile,
  );

  return (
    <div className="flex h-full w-full flex-col">
      {title && (
        <H4 data-chart-title className="text-center text-lg text-foreground">
          {title}
        </H4>
      )}
      <div className="min-h-0 flex-1">
        <ChartContainer
          config={config}
          className={containerClassName}
          style={
            isMaximized
              ? undefined
              : fillHeight
                ? {
                    aspectRatio: "auto",
                    minHeight: `${chartHeight}px`,
                    height: "100%",
                  }
                : { aspectRatio: "auto", height: `${chartHeight}px` }
          }
        >
          {renderChart()}
        </ChartContainer>
      </div>
    </div>
  );
};

export default memo(AgenticChart);
