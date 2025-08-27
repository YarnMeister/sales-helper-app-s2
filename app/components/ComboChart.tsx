// Tremor ComboChart [v1.0.0]
"use client"
import React, { useState } from "react"
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react"
import {
  Bar,
  CartesianGrid,
  Dot,
  Label,
  Line,
  ComposedChart as RechartsComposedChart,
  Legend as RechartsLegend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { AxisDomain } from "recharts/types/util/types"

import {
  AvailableChartColors,
  constructCategoryColors,
  getColorClassName,
  getYAxisDomain,
  hasOnlyOneValueForKey,
  type AvailableChartColorsKeys,
} from "../lib/chartUtils"
import { useOnWindowResize } from "../hooks/useOnWindowResize"
import { cx } from "../lib/chartUtils"

//#region Shape
function deepEqual<T>(obj1: T, obj2: T): boolean {
  if (obj1 === obj2) return true

  if (
    typeof obj1 !== "object" ||
    typeof obj2 !== "object" ||
    obj1 === null ||
    obj2 === null
  ) {
    return false
  }

  const keys1 = Object.keys(obj1) as Array<keyof T>
  const keys2 = Object.keys(obj2) as Array<keyof T>

  if (keys1.length !== keys2.length) return false

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false
  }

  return true
}

const renderShape = (
  props: any,
  activeBar: any | undefined,
  activeLegend: string | undefined,
) => {
  const { fillOpacity, name, payload, value, width, x } = props
  let { y, height } = props

  if (height < 0) {
    y += height
    height = Math.abs(height) // height must be a positive number
  }

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      opacity={
        activeBar || (activeLegend && activeLegend !== name)
          ? deepEqual(activeBar, { ...payload, value })
            ? fillOpacity
            : 0.3
          : fillOpacity
      }
    />
  )
}

//#region Legend
interface LegendItemProps {
  name: string
  color: AvailableChartColorsKeys
  onClick?: (name: string, color: AvailableChartColorsKeys) => void
  activeLegend?: string
  chartType: "bar" | "line"
}

const LegendItem = ({
  name,
  color,
  onClick,
  activeLegend,
  chartType,
}: LegendItemProps) => {
  const hasOnValueChange = !!onClick
  const colorClass = getColorClassName(color, "bg")

  return (
    <li
      className={cx(
        // base
        "group inline-flex flex-nowrap items-center gap-1.5 rounded-sm px-2 py-1 whitespace-nowrap transition",
        hasOnValueChange
          ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
          : "cursor-default",
      )}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(name, color)
      }}
    >
      <span
        className={cx(
          { "size-2 rounded-xs": chartType === "bar" },
          {
            "h-[3px] w-3.5 shrink-0 rounded-full": chartType === "line",
          },
          "shrink-0",
          colorClass,
          activeLegend && activeLegend !== name ? "opacity-40" : "opacity-100",
        )}
        aria-hidden={true}
      />
      <p
        className={cx(
          // base
          "truncate text-xs whitespace-nowrap",
          // text color
          "text-gray-700 dark:text-gray-300",
          hasOnValueChange &&
            "group-hover:text-gray-900 dark:group-hover:text-gray-50",
          activeLegend && activeLegend !== name ? "opacity-40" : "opacity-100",
        )}
      >
        {name}
      </p>
    </li>
  )
}

interface ScrollButtonProps {
  icon: React.ElementType
  onClick?: () => void
  disabled?: boolean
}

const ScrollButton = ({ icon, onClick, disabled }: ScrollButtonProps) => {
  const Icon = icon
  const [isPressed, setIsPressed] = React.useState(false)
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    if (isPressed) {
      intervalRef.current = setInterval(() => {
        onClick?.()
      }, 300)
    } else {
      clearInterval(intervalRef.current as NodeJS.Timeout)
    }
    return () => clearInterval(intervalRef.current as NodeJS.Timeout)
  }, [isPressed, onClick])

  return (
    <button
      type="button"
      disabled={disabled}
      className={cx(
        // base
        "inline-flex size-6 items-center justify-center rounded-sm border border-gray-300 bg-white text-gray-500 transition-all duration-200",
        // hover
        "hover:bg-gray-50 hover:text-gray-700",
        // disabled
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-gray-500",
        // dark
        "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300",
      )}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  )
}

interface LegendProps extends React.HTMLAttributes<HTMLDivElement> {
  categories: string[]
  colors?: AvailableChartColorsKeys[]
  onClickLegendItem?: (category: string, color: AvailableChartColorsKeys) => void
  activeLegend?: string
  enableLegendSlider?: boolean
  legendPosition?: "left" | "center" | "right"
  chartType: "bar" | "line"
}

const Legend = React.forwardRef<HTMLDivElement, LegendProps>(
  (
    {
      categories,
      colors = AvailableChartColors,
      onClickLegendItem,
      activeLegend,
      enableLegendSlider = false,
      legendPosition = "right",
      chartType,
      className,
      ...other
    },
    ref,
  ) => {
    const categoryColors = constructCategoryColors(categories, colors as AvailableChartColorsKeys[])
    const [scrollPosition, setScrollPosition] = React.useState(0)
    const [maxScroll, setMaxScroll] = React.useState(0)
    const containerRef = React.useRef<HTMLDivElement>(null)

    useOnWindowResize(() => {
      if (containerRef.current) {
        const scrollWidth = containerRef.current.scrollWidth
        const clientWidth = containerRef.current.clientWidth
        setMaxScroll(scrollWidth - clientWidth)
      }
    })

    const scroll = (direction: "left" | "right") => {
      if (!containerRef.current) return
      const container = containerRef.current
      const scrollAmount = 100
      const newScrollPosition =
        direction === "left"
          ? scrollPosition - scrollAmount
          : scrollPosition + scrollAmount
      container.scrollLeft = newScrollPosition
      setScrollPosition(newScrollPosition)
    }

    const legendItems = categories.map((category) => {
      const color = categoryColors.get(category) ?? "gray"
      return (
        <LegendItem
          key={category}
          name={category}
          color={color}
          onClick={onClickLegendItem}
          activeLegend={activeLegend}
          chartType={chartType}
        />
      )
    })

    return (
      <div
        ref={ref}
        className={cx(
          "flex items-center justify-end gap-2",
          legendPosition === "left" && "justify-start",
          legendPosition === "center" && "justify-center",
          className,
        )}
        {...other}
      >
        {enableLegendSlider && maxScroll > 0 && (
          <ScrollButton
            icon={RiArrowLeftSLine}
            onClick={() => scroll("left")}
            disabled={scrollPosition <= 0}
          />
        )}
        <div
          ref={containerRef}
          className={cx(
            "flex flex-wrap items-center gap-1",
            enableLegendSlider && "max-w-[200px] overflow-hidden",
          )}
        >
          {legendItems}
        </div>
        {enableLegendSlider && maxScroll > 0 && (
          <ScrollButton
            icon={RiArrowRightSLine}
            onClick={() => scroll("right")}
            disabled={scrollPosition >= maxScroll}
          />
        )}
      </div>
    )
  },
)

Legend.displayName = "Legend"

//#region Tooltip
export interface TooltipProps {
  active?: boolean
  payload?: any[]
  label?: string | number
}

const defaultTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-tremor-default bg-tremor-background-muted border-tremor-border border p-2 text-tremor-default shadow-tremor-dropdown">
      <div className="border-tremor-border border-b border-opacity-50 px-2 py-1">
        <p className="text-tremor-content-emphasis font-medium">{label}</p>
      </div>
      <div className="space-y-1 px-2 py-1">
        {payload.map((payloadItem: any, index: number) => {
          const category = payloadItem.dataKey
          const value = payloadItem.value
          const color = payloadItem.color
          const dataKey = payloadItem.dataKey

          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-tremor-content-subtle font-medium">
                  {category}:
                </span>
              </div>
              <span className="text-tremor-content-emphasis font-medium">
                {value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

//#region ComboChart
interface ChartSeries {
  categories: string[]
  colors?: AvailableChartColorsKeys[]
  valueFormatter?: (value: number) => string
  showYAxis?: boolean
  yAxisWidth?: number
  allowDecimals?: boolean
  yAxisLabel?: string
  autoMinValue?: boolean
  minValue?: number
  maxValue?: number
}

interface BarSeries extends ChartSeries {
  type?: "default" | "stacked"
}

interface LineSeries extends ChartSeries {
  connectNulls?: boolean
}

interface ComboChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Record<string, any>[]
  index: string
  barSeries: BarSeries
  lineSeries: LineSeries
  startEndOnly?: boolean
  showXAxis?: boolean
  xAxisLabel?: string
  showGridLines?: boolean
  intervalType?: "equidistantPreserveStart" | "preserveStartEnd"
  showLegend?: boolean
  showTooltip?: boolean
  onValueChange?: (value: any) => void
  enableLegendSlider?: boolean
  legendPosition?: "left" | "center" | "right"
  tickGap?: number
  enableBiaxial?: boolean
  tooltipCallback?: (tooltipContent: TooltipProps) => void
  customTooltip?: React.ComponentType<TooltipProps>
}

const ComboChart = React.forwardRef<HTMLDivElement, ComboChartProps>(
  (
    {
      data,
      index,
      barSeries,
      lineSeries,
      startEndOnly = false,
      showXAxis = true,
      xAxisLabel,
      showGridLines = true,
      intervalType = "equidistantPreserveStart",
      showLegend = true,
      showTooltip = true,
      onValueChange,
      enableLegendSlider = false,
      legendPosition = "right",
      tickGap = 5,
      enableBiaxial = false,
      tooltipCallback,
      customTooltip,
      className,
      ...other
    },
    ref,
  ) => {
    const CustomTooltip = customTooltip ?? defaultTooltip
    const [activeLegend, setActiveLegend] = useState<string | undefined>(undefined)
    const [activeBar, setActiveBar] = useState<any | undefined>(undefined)

    const categoryColors = constructCategoryColors(
      [...barSeries.categories, ...lineSeries.categories],
      [...(barSeries.colors ?? []), ...(lineSeries.colors ?? [])],
    )

    const barYAxisDomain = getYAxisDomain(
      barSeries.autoMinValue ?? false,
      barSeries.minValue,
      barSeries.maxValue,
    )

    const lineYAxisDomain = getYAxisDomain(
      lineSeries.autoMinValue ?? false,
      lineSeries.minValue,
      lineSeries.maxValue,
    )

    const handleLegendClick = (category: string, color: AvailableChartColorsKeys) => {
      if (activeLegend === category) {
        setActiveLegend(undefined)
      } else {
        setActiveLegend(category)
      }
    }

    const filteredData = activeLegend
      ? data.map((item) => {
          const newItem = { ...item }
          const allCategories = [...barSeries.categories, ...lineSeries.categories]
          allCategories.forEach((category) => {
            if (category !== activeLegend) {
              newItem[category] = undefined
            }
          })
          return newItem
        })
      : data

    return (
      <div ref={ref} className={cx("w-full", className)} {...other}>
        <ResponsiveContainer className="h-full w-full">
          <RechartsComposedChart
            data={filteredData}
            margin={{
              bottom: 5,
              left: 5,
              right: 5,
              top: 5,
            }}
            onClick={() => {
              onValueChange?.(filteredData)
            }}
          >
            {showGridLines ? (
              <CartesianGrid
                className="stroke-tremor-border stroke-1"
                vertical={false}
              />
            ) : null}
            <XAxis
              hide={!showXAxis}
              dataKey={index}
              tick={{ transform: "translate(0, 6)" }}
              ticks={
                startEndOnly
                  ? [data[0]?.[index], data[data.length - 1]?.[index]]
                  : undefined
              }
              fill=""
              stroke=""
              className="text-tremor-label stroke-tremor-content-subtle fill-tremor-content-subtle"
              tickLine={false}
              axisLine={false}
              minTickGap={tickGap}
              {...(xAxisLabel && {
                label: {
                  value: xAxisLabel,
                  position: "insideBottom",
                  offset: 0,
                  className: "fill-tremor-content-subtle text-tremor-label",
                },
              })}
            />
            <YAxis
              hide={!barSeries.showYAxis}
              axisLine={false}
              tickLine={false}
              tick={{ transform: "translate(-3, 0)" }}
              fill=""
              stroke=""
              className="text-tremor-label stroke-tremor-content-subtle fill-tremor-content-subtle"
              width={barSeries.yAxisWidth ?? 56}
              tickFormatter={barSeries.valueFormatter}
              domain={barYAxisDomain as AxisDomain}
              allowDecimals={barSeries.allowDecimals ?? true}
              {...(barSeries.yAxisLabel && {
                label: {
                  value: barSeries.yAxisLabel,
                  angle: -90,
                  position: "insideLeft",
                  className: "fill-tremor-content-subtle text-tremor-label",
                },
              })}
            />
            {enableBiaxial && (
              <YAxis
                yAxisId="right"
                orientation="right"
                hide={!lineSeries.showYAxis}
                axisLine={false}
                tickLine={false}
                tick={{ transform: "translate(3, 0)" }}
                fill=""
                stroke=""
                className="text-tremor-label stroke-tremor-content-subtle fill-tremor-content-subtle"
                width={lineSeries.yAxisWidth ?? 56}
                tickFormatter={lineSeries.valueFormatter}
                domain={lineYAxisDomain as AxisDomain}
                allowDecimals={lineSeries.allowDecimals ?? true}
                {...(lineSeries.yAxisLabel && {
                  label: {
                    value: lineSeries.yAxisLabel,
                    angle: 90,
                    position: "insideRight",
                    className: "fill-tremor-content-subtle text-tremor-label",
                  },
                })}
              />
            )}
            <Tooltip
              wrapperStyle={{ outline: "none" }}
              isAnimationActive={true}
              animationEasing="ease-out"
              animationDuration={500}
              cursor={false}
              content={({ active, payload, label }) => {
                const tooltipContent = { active, payload, label }
                tooltipCallback?.(tooltipContent)
                return <CustomTooltip {...tooltipContent} />
              }}
            />
            {barSeries.categories.map((category) => {
              const color = categoryColors.get(category) ?? "blue"
              return (
                <Bar
                  key={category}
                  dataKey={category}
                  fill={color}
                  radius={[4, 4, 0, 0]}
                  className="fill-tremor-background-muted"
                  stackId={barSeries.type === "stacked" ? "stack" : undefined}
                  isAnimationActive={true}
                  animationEasing="ease-out"
                  animationDuration={500}
                  onMouseOver={(data) => {
                    setActiveBar(data)
                  }}
                  onMouseLeave={() => {
                    setActiveBar(undefined)
                  }}
                />
              )
            })}
            {lineSeries.categories.map((category) => {
              const color = categoryColors.get(category) ?? "blue"
              return (
                <Line
                  key={category}
                  dataKey={category}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  type="monotone"
                  className="stroke-tremor-background-muted"
                  yAxisId={enableBiaxial ? "right" : undefined}
                  connectNulls={lineSeries.connectNulls ?? false}
                  isAnimationActive={true}
                  animationEasing="ease-out"
                  animationDuration={500}
                  onMouseOver={(data) => {
                    setActiveBar(data)
                  }}
                  onMouseLeave={() => {
                    setActiveBar(undefined)
                  }}
                />
              )
            })}
          </RechartsComposedChart>
        </ResponsiveContainer>
        {showLegend ? (
          <Legend
            categories={[...barSeries.categories, ...lineSeries.categories]}
            colors={[...(barSeries.colors ?? []), ...(lineSeries.colors ?? [])]}
            onClickLegendItem={handleLegendClick}
            activeLegend={activeLegend}
            enableLegendSlider={enableLegendSlider}
            legendPosition={legendPosition}
            chartType="bar"
          />
        ) : null}
      </div>
    )
  },
)

ComboChart.displayName = "ComboChart"

export { ComboChart }
