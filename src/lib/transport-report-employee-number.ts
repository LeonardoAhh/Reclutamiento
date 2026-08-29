export const TRANSPORT_REPORT_EMPLOYEE_NUMBER_MAX_LENGTH = 4;

const EMPLOYEE_NUMBER_PATTERN = /^\d+$/;

export function sanitizeTransportReportEmployeeNumber(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidTransportReportEmployeeNumber(value: string): boolean {
  const employeeNumber = value.trim();

  return (
    employeeNumber.length > 0 &&
    employeeNumber.length <= TRANSPORT_REPORT_EMPLOYEE_NUMBER_MAX_LENGTH &&
    EMPLOYEE_NUMBER_PATTERN.test(employeeNumber)
  );
}
