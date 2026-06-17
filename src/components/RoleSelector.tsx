import { BookOpen, UserCog, Shield } from 'lucide-react';
import type { Role } from '@/types';
import { cn } from '@/lib/utils';

interface RoleSelectorProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
}

const roles: { value: Role; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'librarian', label: '馆员', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
  { value: 'parent', label: '家长', icon: UserCog, color: 'from-pink-500 to-rose-500' },
  { value: 'admin', label: '管理员', icon: Shield, color: 'from-amber-500 to-orange-500' },
];

export default function RoleSelector({ currentRole, onRoleChange }: RoleSelectorProps) {
  return (
    <div className="flex gap-2">
      {roles.map((role) => {
        const Icon = role.icon;
        const isActive = currentRole === role.value;
        return (
          <button
            key={role.value}
            onClick={() => onRoleChange(role.value)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200',
              isActive
                ? `bg-gradient-to-br ${role.color} text-white shadow-lg`
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="text-xs font-medium">{role.label}</span>
          </button>
        );
      })}
    </div>
  );
}
