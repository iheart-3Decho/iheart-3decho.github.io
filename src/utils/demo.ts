import type { DemoCase, Metric } from "../types";

export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}demo/${path}`;
export const formatMetric = (metric: Metric) => `${metric.value.toFixed(1)} ${metric.unit}`;
export const metricRoute = (item: DemoCase, metric?: Metric) =>
  `#/case/${encodeURIComponent(item.id)}${metric ? `?metric=${encodeURIComponent(metric.id)}` : ""}`;

export function metricMeaning(metric: Metric) {
  const cm = (metric.value / 10).toFixed(metric.id === "lvpwd" ? 2 : 1);
  const explanations: Record<string, string> = {
    ef: `每100毫升血液，泵出約${Math.round(metric.value)}毫升`,
    edv: `充盈時，心室內約有${Math.round(metric.value)}毫升血液`,
    esv: `收縮後，心室內仍有約${Math.round(metric.value)}毫升血液`,
    ivsd: `兩心室之間的心壁厚約${cm}公分`,
    lvidd: `充盈時，心室內部寬約${cm}公分`,
    lvids: `收縮後，心室內部寬約${cm}公分`,
    lvpwd: `心室後方的心壁厚約${cm}公分`,
  };
  return explanations[metric.id] ?? metric.description;
}

export interface MetricDemo {
  item: DemoCase;
  metric: Metric;
  question: string;
}

// Each entrance uses a different verified case and its own metric evidence.
export function metricDemos(cases: DemoCase[]): MetricDemo[] {
  const choices = [
    ["function", "ef", "一次心跳，泵出多少？"],
    ["function-27", "edv", "充盈時，裝了多少血？"],
    ["function-61", "esv", "收縮後，還剩多少血？"],
    ["dimension", "ivsd", "心室之間的壁有多厚？"],
    ["dimension-02", "lvidd", "充盈時，心室有多寬？"],
    ["dimension-03", "lvids", "收縮後，心室有多寬？"],
  ];
  return choices.flatMap(([caseId, metricId, question]) => {
    const item = cases.find((entry) => entry.id === caseId);
    const metric = item?.metrics.find((entry) => entry.id === metricId);
    return item && metric ? [{ item, metric, question }] : [];
  });
}
