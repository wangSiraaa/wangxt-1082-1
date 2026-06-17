import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, Users, Shield, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import RoleSelector from '@/components/RoleSelector';

const roleCards = [
  {
    role: 'librarian' as const,
    title: '馆员',
    description: '维护绘本信息和借期设置，管理借阅流程',
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-600',
    features: ['绘本管理', '借阅管理', '借期设置'],
  },
  {
    role: 'parent' as const,
    title: '家长',
    description: '浏览借阅绘本，记录亲子共读时光',
    icon: Users,
    color: 'from-pink-500 to-rose-600',
    features: ['绘本浏览', '我的借阅', '共读打卡'],
  },
  {
    role: 'admin' as const,
    title: '管理员',
    description: '处理逾期借阅，管理赔付流程',
    icon: Shield,
    color: 'from-purple-500 to-indigo-600',
    features: ['逾期处理', '赔付管理', '数据统计'],
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { currentRole, setCurrentRole, books, loans, checkins, compensations } = useAppStore();

  useEffect(() => {
    if (currentRole !== 'librarian') {
      setCurrentRole('librarian');
    }
  }, []);

  const handleRoleSelect = (role: 'librarian' | 'parent' | 'admin') => {
    setCurrentRole(role);
    const firstMenu: Record<string, string> = {
      librarian: '/librarian/books',
      parent: '/parent/browse',
      admin: '/admin/overdue',
    };
    navigate(firstMenu[role]);
  };

  return (
    <div className="min-h-full">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full mb-6">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-700">亲子绘本借阅系统</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          绘本陪伴成长
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          连接馆员、家长和管理员，共同打造美好的亲子阅读体验
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-indigo-600 mb-1">{books.length}</div>
          <div className="text-sm text-gray-500">绘本数量</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-1">{loans.length}</div>
          <div className="text-sm text-gray-500">借阅记录</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-pink-600 mb-1">{checkins.length}</div>
          <div className="text-sm text-gray-500">打卡次数</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-1">{compensations.length}</div>
          <div className="text-sm text-gray-500">赔付记录</div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">选择角色进入系统</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roleCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.role}
                onClick={() => handleRoleSelect(card.role)}
                className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-transparent transition-all duration-300 text-left"
              >
                <div className={cn(
                  'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 transition-transform group-hover:scale-110',
                  card.color
                )}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{card.title}</h3>
                <p className="text-gray-500 text-sm mb-4">{card.description}</p>
                <div className="space-y-2">
                  {card.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-2 text-indigo-600 font-medium text-sm group-hover:gap-3 transition-all">
                  进入系统
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-3">💝 坚持阅读，陪伴成长</h3>
        <p className="text-white/80 max-w-xl mx-auto">
          每一本绘本都是孩子认识世界的窗口，每一次共读都是亲子间美好的时光。
          让我们一起守护这份美好，陪伴孩子健康成长。
        </p>
      </div>
    </div>
  );
}