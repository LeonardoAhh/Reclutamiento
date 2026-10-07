export const REPORT_COMPARISON_PATH = '/reports/comparison';
export const REPORT_DAY_ROUTE = 'day/:month/:day';
export const REPORT_DAY_PATTERN = '/reports/' + REPORT_DAY_ROUTE;
export function getReportDayPath(month: string, day: string) {
  return '/reports/day/' + encodeURIComponent(month) + '/' + encodeURIComponent(day);
}
