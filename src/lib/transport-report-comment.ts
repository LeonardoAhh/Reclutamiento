export const TRANSPORT_REPORT_COMMENT_MAX_LENGTH = 500;

export function normalizeTransportReportComment(value: string): string {
  return value.trim();
}

export function isValidTransportReportComment(value: string): boolean {
  const comment = normalizeTransportReportComment(value);

  return (
    comment.length > 0 &&
    comment.length <= TRANSPORT_REPORT_COMMENT_MAX_LENGTH
  );
}
