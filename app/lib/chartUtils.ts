// Tremor chartUtils [v1.0.0]
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const cx = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

export const AvailableChartColors = [
  "blue",
  "emerald", 
  "violet",
  "amber",
  "gray",
  "cyan",
  "pink",
  "lime",
  "fuchsia",
] as const

export type AvailableChartColorsKeys = (typeof AvailableChartColors)[number]

export const constructCategoryColors = (
  categories: string[],
  colors: AvailableChartColorsKeys[],
): Map<string, AvailableChartColorsKeys> => {
  const categoryColors = new Map<string, AvailableChartColorsKeys>()
  categories.forEach((category, index) => {
    categoryColors.set(category, colors[index % colors.length])
  })
  return categoryColors
}

export const getColorClassName = (
  color: AvailableChartColorsKeys,
  type: "bg" | "text" | "border",
): string => {
  const colors = {
    bg: {
      blue: "bg-blue-500",
      emerald: "bg-emerald-500",
      violet: "bg-violet-500",
      amber: "bg-amber-500",
      gray: "bg-gray-500",
      cyan: "bg-cyan-500",
      pink: "bg-pink-500",
      lime: "bg-lime-500",
      fuchsia: "bg-fuchsia-500",
    },
    text: {
      blue: "text-blue-500",
      emerald: "text-emerald-500",
      violet: "text-violet-500",
      amber: "text-amber-500",
      gray: "text-gray-500",
      cyan: "text-cyan-500",
      pink: "text-pink-500",
      lime: "text-lime-500",
      fuchsia: "text-fuchsia-500",
    },
    border: {
      blue: "border-blue-500",
      emerald: "border-emerald-500",
      violet: "border-violet-500",
      amber: "border-amber-500",
      gray: "border-gray-500",
      cyan: "border-cyan-500",
      pink: "border-pink-500",
      lime: "border-lime-500",
      fuchsia: "border-fuchsia-500",
    },
  }
  return colors[type][color]
}

export const getYAxisDomain = (
  autoMinValue: boolean,
  minValue: number | undefined,
  maxValue: number | undefined,
) => {
  const minDomain = autoMinValue ? "auto" : minValue ?? "auto"
  const maxDomain = maxValue ?? "auto"
  return [minDomain, maxDomain]
}

export const hasOnlyOneValueForKey = (data: any[], key: string): boolean => {
  return new Set(data.map((item) => item[key])).size <= 1
}
