'use client';

import { ManagerPermissions } from '@/lib/permissions';

interface PermissionsSelectorProps {
  permissions: ManagerPermissions;
  onChange: (permissions: ManagerPermissions) => void;
  disabled?: boolean;
}

export default function PermissionsSelector({ 
  permissions, 
  onChange, 
  disabled = false 
}: PermissionsSelectorProps) {
  
  const handlePermissionChange = (
    section: keyof ManagerPermissions,
    action: keyof ManagerPermissions[keyof ManagerPermissions],
    value: boolean
  ) => {
    onChange({
      ...permissions,
      [section]: {
        ...permissions[section],
        [action]: value,
      },
    });
  };

  const sections = [
    {
      key: 'psychologists' as const,
      label: 'Психологи',
      description: 'Управление списком психологов',
    },
    {
      key: 'pages' as const,
      label: 'Страницы',
      description: 'Управление страницами сайта',
    },
    {
      key: 'listdate' as const,
      label: 'Расписание',
      description: 'Управление расписанием',
    },
    {
      key: 'managers' as const,
      label: 'Менеджеры',
      description: 'Управление другими менеджерами',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Права доступа</h3>
        <p className="text-sm text-gray-600">
          Выберите, к каким разделам у менеджера будет доступ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div key={section.key} className="bg-gray-50 rounded-lg p-4">
            <div className="mb-3">
              <h4 className="font-medium text-gray-900">{section.label}</h4>
              <p className="text-sm text-gray-500">{section.description}</p>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={permissions[section.key].view}
                  onChange={(e) => handlePermissionChange(section.key, 'view', e.target.checked)}
                  disabled={disabled}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Просмотр</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={permissions[section.key].edit}
                  onChange={(e) => handlePermissionChange(section.key, 'edit', e.target.checked)}
                  disabled={disabled || !permissions[section.key].view}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Редактирование</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={permissions[section.key].delete}
                  onChange={(e) => handlePermissionChange(section.key, 'delete', e.target.checked)}
                  disabled={disabled || !permissions[section.key].view}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Удаление</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm text-blue-700">
              <strong>Важно:</strong> Для активации прав "Редактирование" и "Удаление" 
              необходимо сначала активировать право "Просмотр"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}