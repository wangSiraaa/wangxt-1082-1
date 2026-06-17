import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, User, Users, Settings, LogOut, Home, Truck, Wrench, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import RoleSelector from './RoleSelector';
import type { Role } from '@/types';

interface LayoutProps {
  children: React.ReactNode;
}

const roleMenus: Record<Role, { path: string; label: string; icon: React.ElementType }[]> = {
  librarian: [
    { path: '/librarian/books', label: '绘本管理', icon: BookOpen },
    { path: '/librarian/loans', label: '借阅管理', icon: Users },
    { path: '/librarian/settings', label: '借期设置', icon: Settings },
  ],
  parent: [
    { path: '/parent/browse', label: '绘本浏览', icon: Home },
    { path: '/parent/loans', label: '我的借阅', icon: BookOpen },
    { path: '/parent/checkins', label: '共读打卡', icon: Users },
  ],
  admin: [
    { path: '/admin/overdue', label: '逾期处理', icon: AlertTriangle },
    { path: '/admin/compensations', label: '赔付管理', icon: Settings },
    { path: '/admin/transfers', label: '跨馆调拨', icon: Truck },
    { path: '/admin/repairs', label: '修补记录', icon: Wrench },
  ],
};

const roleNames: Record<Role, string> = {
  librarian: '馆员',
  parent: '家长',
  admin: '管理员',
};

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentRole, currentUser, currentParent, setCurrentRole, updateOverdueStatus } = useAppStore();

  useEffect(() => {
    updateOverdueStatus();
  }, [updateOverdueStatus]);

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    const firstMenu = roleMenus[role][0];
    navigate(firstMenu.path);
  };

  const menus = roleMenus[currentRole];
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const displayName = currentRole === 'parent' && currentParent 
    ? currentParent.name 
    : currentUser?.name || roleNames[currentRole];

  const displayAvatar = currentRole === 'parent' && currentParent
    ? currentParent.avatar
    : currentUser?.avatar;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="flex h-screen">
        <aside className="w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">亲子绘本馆</h1>
                <p className="text-xs text-gray-500">陪伴孩子成长</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-200">
            <RoleSelector currentRole={currentRole} onRoleChange={handleRoleChange} />
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center overflow-hidden">
                {displayAvatar ? (
                  <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{displayName}</p>
                <p className="text-xs text-gray-500">{roleNames[currentRole]}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {menus.map((menu) => {
                const Icon = menu.icon;
                return (
                  <li key={menu.path}>
                    <button
                      onClick={() => navigate(menu.path)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive(menu.path)
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {menu.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200">
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
