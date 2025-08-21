export interface Employee {
  id: number;
  name: string;
  cpf: string;
  position: string;
  phone: string;
  salary: number;
  admissionDate: Date;
  dismissalDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeSearchParams {
  name?: string;
  cpf?: string;
  position?: string;
  isActive?: boolean;
}

export interface EmployeeReport {
  activeEmployees: Employee[];
  inactiveEmployees: Employee[];
  totalActive: number;
  totalInactive: number;
}
