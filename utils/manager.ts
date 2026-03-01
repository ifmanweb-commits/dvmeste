                   
import { Manager, ManagerFormData } from '@/types/manager';

                                                             
export function parsePermissions(permissions: any): Manager['permissions'] {
  if (!permissions) {
    return {
      psychologists: { view: true, edit: false, delete: false },
      pages: { view: true, edit: false, delete: false },
      listdate: { view: true, edit: false, delete: false },
      managers: { view: false, edit: false, delete: false },
    };
  }

                                                         
  if (typeof permissions === 'object') {
    return {
      psychologists: permissions.psychologists || { view: true, edit: false, delete: false },
      pages: permissions.pages || { view: true, edit: false, delete: false },
      listdate: permissions.listdate || { view: true, edit: false, delete: false },
      managers: permissions.managers || { view: false, edit: false, delete: false },
    };
  }

                                         
  if (typeof permissions === 'string') {
    try {
      const parsed = JSON.parse(permissions);
      return parsePermissions(parsed);
    } catch {
      return {
        psychologists: { view: true, edit: false, delete: false },
        pages: { view: true, edit: false, delete: false },
        listdate: { view: true, edit: false, delete: false },
        managers: { view: false, edit: false, delete: false },
      };
    }
  }

                                  
  return {
    psychologists: { view: true, edit: false, delete: false },
    pages: { view: true, edit: false, delete: false },
    listdate: { view: true, edit: false, delete: false },
    managers: { view: false, edit: false, delete: false },
  };
}

                                                    
export function prepareManagerForForm(manager: any): ManagerFormData {
  return {
    name: manager.name || '',
    email: manager.email || '',
    phone: manager.phone || '',
    login: manager.login || '',
    role: (manager.role === 'ADMIN' || manager.role === 'MANAGER' ? manager.role : 'MANAGER') as 'ADMIN' | 'MANAGER',
    password: '',
    confirmPassword: '',
    permissions: parsePermissions(manager.permissions),
    status: (manager.status === 'ACTIVE' || manager.status === 'INACTIVE' ? manager.status : 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
  };
}