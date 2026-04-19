const EMPLOYEE_NUMBER_KEY = "home-theater-rpg.employee-number";

export function setActiveEmployeeNumber(employeeNumber: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(EMPLOYEE_NUMBER_KEY, employeeNumber);
}

export function getActiveEmployeeNumber(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(EMPLOYEE_NUMBER_KEY);
}
