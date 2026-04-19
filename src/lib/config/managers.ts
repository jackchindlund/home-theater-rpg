export const APPROVED_MANAGER_EMPLOYEE_NUMBERS = [
  "100001",
  "100002",
  "100003",
];

export function isApprovedManager(employeeNumber: string): boolean {
  return APPROVED_MANAGER_EMPLOYEE_NUMBERS.includes(employeeNumber.trim());
}
