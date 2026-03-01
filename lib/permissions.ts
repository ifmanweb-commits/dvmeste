export type Permission = 
  | 'psychologists.view'
  | 'psychologists.edit'
  | 'psychologists.delete'
  | 'pages.view'
  | 'pages.edit'
  | 'pages.delete'
  | 'listdate.view'
  | 'listdate.edit'
  | 'listdate.delete'
  | 'managers.view'
  | 'managers.edit'
  | 'managers.delete';

export interface ManagerPermissions {
  psychologists: {
    view: boolean;
    edit: boolean;
    delete: boolean;
  };
  pages: {
    view: boolean;
    edit: boolean;
    delete: boolean;
  };
  listdate: {
    view: boolean;
    edit: boolean;
    delete: boolean;
  };
  managers: {
    view: boolean;
    edit: boolean;
    delete: boolean;
  };
}

export const defaultPermissions: ManagerPermissions = {
  psychologists: { view: false, edit: false, delete: false },
  pages: { view: false, edit: false, delete: false },
  listdate: { view: false, edit: false, delete: false },
  managers: { view: false, edit: false, delete: false },
};

export const rolePermissions = {
  admin: {
    psychologists: { view: true, edit: true, delete: true },
    pages: { view: true, edit: true, delete: true },
    listdate: { view: true, edit: true, delete: true },
    managers: { view: true, edit: true, delete: true },
  },
  manager: {
    psychologists: { view: true, edit: true, delete: false },
    pages: { view: true, edit: true, delete: false },
    listdate: { view: true, edit: true, delete: false },
    managers: { view: false, edit: false, delete: false },
  },
  moderator: {
    psychologists: { view: true, edit: false, delete: false },
    pages: { view: true, edit: false, delete: false },
    listdate: { view: true, edit: false, delete: false },
    managers: { view: false, edit: false, delete: false },
  },
};

export function checkPermission(
  permissions: ManagerPermissions,
  permission: Permission
): boolean {
  const [section, action] = permission.split('.') as [keyof ManagerPermissions, string];
  return permissions[section]?.[action as keyof ManagerPermissions[keyof ManagerPermissions]] || false;
}