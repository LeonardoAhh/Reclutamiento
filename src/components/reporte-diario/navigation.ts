export const REPORTS_PATH = '/reports';
export const DEPARTURE_REASONS_PATH = '/departure-reasons';
export const REPORT_COMPARISON_PATH = `${REPORTS_PATH}/comparison`;
export const REPORT_DAY_ROUTE = 'day/:month/:day';
export const REPORT_DAY_PATTERN = `${REPORTS_PATH}/${REPORT_DAY_ROUTE}`;
export function getReportDayPath(month: string, day: string) {
  return `${REPORTS_PATH}/day/${encodeURIComponent(month)}/${encodeURIComponent(day)}`;
}

export function isDailyReportPath(pathname: string) {
  return pathname === REPORTS_PATH || pathname.startsWith(`${REPORTS_PATH}/`)
    || pathname === DEPARTURE_REASONS_PATH;
}
