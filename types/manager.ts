                   
export interface Manager {
  id: number;
  name: string;
  email: string;
  phone?: string;
  login: string;
  role: 'ADMIN' | 'MANAGER';
  permissions: {
    psychologists: { view: boolean; edit: boolean; delete: boolean };
    pages: { view: boolean; edit: boolean; delete: boolean };
    listdate: { view: boolean; edit: boolean; delete: boolean };
    managers: { view: boolean; edit: boolean; delete: boolean };
  };
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface ManagerFormData {
  name: string;
  email: string;
  phone?: string;
  login: string;
  role: 'ADMIN' | 'MANAGER';
  password?: string;
  confirmPassword?: string;
  permissions: Manager['permissions'];
  status?: 'ACTIVE' | 'INACTIVE';
}

export const defaultPermissions: Manager['permissions'] = {
  psychologists: { view: true, edit: false, delete: false },
  pages: { view: true, edit: false, delete: false },
  listdate: { view: true, edit: false, delete: false },
  managers: { view: false, edit: false, delete: false },
};

export const rolePermissions: Record<'ADMIN' | 'MANAGER', Manager['permissions']> = {
  ADMIN: {
    psychologists: { view: true, edit: true, delete: true },
    pages: { view: true, edit: true, delete: true },
    listdate: { view: true, edit: true, delete: true },
    managers: { view: true, edit: true, delete: true },
  },
  MANAGER: {
    psychologists: { view: true, edit: true, delete: false },
    pages: { view: true, edit: true, delete: false },
    listdate: { view: true, edit: true, delete: false },
    managers: { view: false, edit: false, delete: false },
  },
};

export const ROLE_LABELS: Record<'ADMIN' | 'MANAGER', string> = {
  ADMIN: 'Администратор',
  MANAGER: 'Менеджер',
};

export const STATUS_LABELS: Record<'ACTIVE' | 'INACTIVE', string> = {
  ACTIVE: 'Активен',
  INACTIVE: 'Неактивен',
};

export const MODULE_LABELS: Record<string, string> = {
  psychologists: 'Психологи',
  pages: 'Страницы',
  listdate: 'Листдаты',
  managers: 'Менеджеры',
};

export const ACTION_LABELS: Record<string, string> = {
  view: 'Просмотр',
  edit: 'Редактирование',
  delete: 'Удаление',
};

                                  
export const roleOptions = [
  { value: 'ADMIN' as const, label: 'Администратор' },
  { value: 'MANAGER' as const, label: 'Менеджер' },
];

export const statusOptions = [
  { value: 'ACTIVE' as const, label: 'Активен' },
  { value: 'INACTIVE' as const, label: 'Неактивен' },
];

                          
export function getRoleLabel(role: 'ADMIN' | 'MANAGER'): string {
  return ROLE_LABELS[role];
}

export function getStatusLabel(status: 'ACTIVE' | 'INACTIVE'): string {
  return STATUS_LABELS[status];
}

export function getModuleLabel(module: string): string {
  return MODULE_LABELS[module] || module;
}

export function getActionLabel(action: string): string {
  return ACTION_LABELS[action] || action;
}