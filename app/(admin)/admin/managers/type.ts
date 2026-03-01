                              
export interface Manager {
  id: number;
  name: string;
  email: string;
  phone: string;
  login: string;
  role: 'manager' | 'moderator' | 'supervisor';
  permissions: {
    psychologists: { view: boolean; edit: boolean; delete: boolean };
    pages: { view: boolean; edit: boolean; delete: boolean };
    listdate: { view: boolean; edit: boolean; delete: boolean };
    managers: { view: boolean; edit: boolean; delete: boolean };
  };
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

export interface ManagerFormData {
  name: string;
  email: string;
  phone: string;
  login: string;
  role: 'manager' | 'moderator' | 'supervisor';
  password: string;
  confirmPassword: string;
  permissions: Manager['permissions'];
  status?: 'active' | 'inactive';
}

export const defaultPermissions: Manager['permissions'] = {
  psychologists: { view: true, edit: false, delete: false },
  pages: { view: true, edit: false, delete: false },
  listdate: { view: true, edit: false, delete: false },
  managers: { view: false, edit: false, delete: false },
};

export const rolePermissions: Record<'manager' | 'moderator' | 'supervisor', Manager['permissions']> = {
  manager: {
    psychologists: { view: true, edit: true, delete: false },
    pages: { view: true, edit: false, delete: false },
    listdate: { view: true, edit: true, delete: false },
    managers: { view: false, edit: false, delete: false },
  },
  moderator: {
    psychologists: { view: true, edit: false, delete: false },
    pages: { view: true, edit: true, delete: false },
    listdate: { view: false, edit: false, delete: false },
    managers: { view: false, edit: false, delete: false },
  },
  supervisor: {
    psychologists: { view: true, edit: true, delete: true },
    pages: { view: true, edit: true, delete: true },
    listdate: { view: true, edit: true, delete: false },
    managers: { view: false, edit: false, delete: false },
  },
};

                                                    
export function setPermissionsByRole(role: Manager['role']): Manager['permissions'] {
  return rolePermissions[role];
}

export function hasPermission(
  permissions: Manager['permissions'],
  module: keyof Manager['permissions'],
  action: 'view' | 'edit' | 'delete'
): boolean {
  return permissions[module][action];
}

                   
export const ROLE_LABELS: Record<Manager['role'], string> = {
  manager: 'Менеджер',
  moderator: 'Модератор',
  supervisor: 'Супервайзер',
};

export const STATUS_LABELS: Record<Manager['status'], string> = {
  active: 'Активен',
  inactive: 'Неактивен',
};

export const MODULE_LABELS: Record<keyof Manager['permissions'], string> = {
  psychologists: 'Психологи',
  pages: 'Страницы',
  listdate: 'Листдаты',
  managers: 'Менеджеры',
};

export const ACTION_LABELS: Record<'view' | 'edit' | 'delete', string> = {
  view: 'Просмотр',
  edit: 'Редактирование',
  delete: 'Удаление',
};

                     
export const roleOptions = [
  { value: 'manager', label: 'Менеджер' },
  { value: 'moderator', label: 'Модератор' },
  { value: 'supervisor', label: 'Супервайзер' },
] as const;

export const statusOptions = [
  { value: 'active', label: 'Активен' },
  { value: 'inactive', label: 'Неактивен' },
] as const;