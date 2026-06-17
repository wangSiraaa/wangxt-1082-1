import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  BookOpen, Clock, CheckCircle, XCircle, AlertCircle,
  Users, Trophy, Calendar, RefreshCw, Award,
  CircleUser, BookMarked, Star, HandHeart
} from 'lucide-react';
import type { FamilyMember } from '../../types';

export default function MyLoans() {
  const { 
    currentFamily, currentParent,
    families, familyMembers, 
    books, loans, checkins, compensations, settings, holidays,
    renewLoan
  } = useAppStore();

  const family = currentFamily || families[0];
  const parent = currentParent;

  const members = useMemo(() => {
    if (!family) return [];
    return familyMembers.filter(m => m.familyId === family.id);
  }, [family, familyMembers]);

  const familyLoans = useMemo(() => {
    if (!family) return [];
    return loans.filter(l => l.familyId === family.id && l.status !== 'returned');
  }, [family, loans]);

  const returnedLoans = useMemo(() => {
    if (!family) return [];
    return loans.filter(l => l.familyId === family.id && l.status === 'returned');
  }, [family, loans]);

  const checkinStats = useMemo(() => {
    if (!family) return [];
    const familyCheckins = checkins.filter(c => c.familyId === family.id);
    const stats = members.map(member => ({
      member,
      count: familyCheckins.filter(c => c.memberId === member.id).length,
      totalPages: familyCheckins
        .filter(c => c.memberId === member.id)
        .reduce((sum, c) => sum + (c.pageRead || 0), 0),
      lastDate: familyCheckins
        .filter(c => c.memberId === member.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date
    })).sort((a, b) => b.count - a.count);
    return stats;
  }, [family, members, checkins]);

  const lastRenewResult = useMemo(() => {
    if (!family) return null;
    const familyLoansWithRenew = [...loans]
      .filter(l => l.familyId === family.id && l.lastRenewResult)
      .sort((a, b) => {
        const aIdx = a.dueDate;
        const bIdx = b.dueDate;
        return new Date(bIdx).getTime() - new Date(aIdx).getTime();
      });
    return familyLoansWithRenew[0] || null;
  }, [family, loans]);

  const pendingCompensations = useMemo(() => {
    if (!family) return [];
    return compensations.filter(c => c.familyId === family.id && c.status === 'pending');
  }, [family, compensations]);

  const memberLevelLabel = (level: string) => {
    const map: Record<string, { label: string; color: string }> = {
      normal: { label: '普通会员', color: 'bg-gray-100 text-gray-700' },
      silver: { label: '银卡会员', color: 'bg-blue-50 text-blue-700 border border-blue-200' },
      gold:   { label: '金卡会员', color: 'bg-amber-50 text-amber-700 border border-amber-200' }
    };
    return map[level] || map.normal;
  };

  const getMemberById = (id?: string): FamilyMember | undefined => {
    return members.find(m => m.id === id);
  };

  const getBookById = (id: string) => books.find(b => b.id === id);

  const handleRenew = (loanId: string) => {
    const result = renewLoan(loanId);
    alert(result.message);
  };

  if (!family || !parent) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        未找到家庭信息，请先登录
      </div>
    );
  }

  const remainingQuota = Math.max(0, family.borrowQuota - family.currentBorrowed);
  const quotaPercent = Math.min(100, Math.round((family.currentBorrowed / family.borrowQuota) * 100));
  const totalCheckins = checkinStats.reduce((s, c) => s + c.count, 0);
  const totalPages = checkinStats.reduce((s, c) => s + c.totalPages, 0);
  const levelBadge = memberLevelLabel(family.memberLevel);

  return (
    <div className="space-y-6">
      {/* 头部家庭信息 */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{family.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${levelBadge.color}`}>
                {levelBadge.label}
              </span>
            </div>
            <p className="text-indigo-100 text-sm mb-4">
              家长联系人：{parent.name} · {parent.phone} · 加入时间 {family.joinDate}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{members.length}位成员</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HandHeart className="w-4 h-4" />
                <span>{family.address}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {members.slice(0, 4).map(m => (
              <div key={m.id} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 border-white ${
                  m.isPrimary ? 'bg-amber-400' : 'bg-white/20 backdrop-blur'
                }`}>
                  {m.avatar || m.name[0]}
                </div>
                <span className="text-xs mt-1 text-indigo-100">{m.relationship}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 最近续借结果提示 */}
      {lastRenewResult?.lastRenewResult && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          lastRenewResult.lastRenewResult === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {lastRenewResult.lastRenewResult === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <div className="flex-1 text-sm">
            <span className="font-medium">
              《{getBookById(lastRenewResult.bookId)?.title}》
            </span>
            <span className="mx-2">续借结果：</span>
            <span>{lastRenewResult.lastRenewMessage}</span>
          </div>
        </div>
      )}

      {/* 待处理赔付提示 */}
      {pendingCompensations.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 text-sm">
            您有 <span className="font-bold">{pendingCompensations.length}</span> 笔待处理赔付，
            合计 <span className="font-bold">¥{pendingCompensations.reduce((s, c) => s + c.amount, 0).toFixed(2)}</span>，
            请尽快到馆处理
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 家庭借阅额度 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-indigo-600" />
              家庭借阅额度
            </h2>
            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
              {settings.loanPeriod}天借阅期
            </span>
          </div>

          <div className="mb-5">
            <div className="flex items-end justify-between mb-2">
              <span className="text-sm text-gray-600">已用额度</span>
              <div className="text-right">
                <span className="text-3xl font-bold text-gray-900">{family.currentBorrowed}</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-lg text-gray-500">{family.borrowQuota}</span>
              </div>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  quotaPercent >= 90 ? 'bg-red-500' : quotaPercent >= 70 ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                }`}
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-sm font-medium ${
                remainingQuota === 0 ? 'text-red-600' : remainingQuota <= 2 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                剩余 {remainingQuota} 册
              </span>
              <span className="text-xs text-gray-400">
                续借最多 {settings.allowRenewalTimes} 次
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{familyLoans.length}</div>
              <div className="text-xs text-gray-500 mt-1">在借中</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{returnedLoans.length}</div>
              <div className="text-xs text-gray-500 mt-1">已归还</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {familyLoans.filter(l => l.isOverdue).length}
              </div>
              <div className="text-xs text-gray-500 mt-1">已逾期</div>
            </div>
          </div>
        </div>

        {/* 成员共读打卡 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              成员共读打卡排行
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                总打卡 {totalCheckins} 次
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                共读 {totalPages} 页
              </span>
            </div>
          </div>

          {checkinStats.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <CircleUser className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm">暂无打卡记录，开始第一次亲子共读吧～</p>
            </div>
          ) : (
            <div className="space-y-3">
              {checkinStats.map((stat, idx) => {
                const maxCount = checkinStats[0]?.count || 1;
                const percent = Math.round((stat.count / maxCount) * 100);
                const medals = ['🥇', '🥈', '🥉'];
                
                return (
                  <div key={stat.member.id} className="group">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-lg w-7 text-center">{medals[idx] || `${idx + 1}`}</span>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        stat.member.isPrimary ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {stat.member.avatar || stat.member.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">
                            {stat.member.name}
                            <span className="text-xs text-gray-400 ml-2 font-normal">
                              {stat.member.relationship} · {stat.member.age}岁
                            </span>
                          </span>
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold text-indigo-600">{stat.count}</span>
                            <span className="text-gray-400 mx-1">次</span>
                            <span className="text-gray-400">·</span>
                            <span className="font-semibold text-violet-600 ml-1">{stat.totalPages}</span>
                            <span className="text-gray-400 mx-1">页</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pl-10">
                      <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-400">
                        {stat.lastDate && (
                          <span>最近打卡：{stat.lastDate}</span>
                        )}
                        {!stat.lastDate && <span>尚未打卡</span>}
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          连续阅读
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 在借图书 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          家庭在借图书
          <span className="ml-2 text-sm font-normal text-gray-500">
            （{familyLoans.length}册）
          </span>
        </h2>

        {familyLoans.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <BookOpen className="w-14 h-14 mx-auto mb-3 opacity-30" />
            <p>当前没有在借图书，快去挑选心仪的绘本吧～</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">绘本</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">借阅人</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">借阅日</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">应还日</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">续借</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {familyLoans.map(loan => {
                  const book = getBookById(loan.bookId);
                  const member = getMemberById(loan.memberId);
                  const isOverdue = loan.isOverdue || (new Date(loan.dueDate) < new Date(today()));
                  const canRenew = loan.renewCount < settings.allowRenewalTimes && !isOverdue;
                  
                  return (
                    <tr key={loan.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 rounded bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-lg flex-shrink-0">
                            📖
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate max-w-[200px]">
                              {book?.title || '未知'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {book?.theme && <span className="mr-2">{book.theme}</span>}
                              ¥{book?.price?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                            member?.isPrimary ? 'bg-amber-100 text-amber-700' : 'bg-indigo-50 text-indigo-600'
                          }`}>
                            {member?.avatar || member?.name[0] || '家'}
                          </div>
                          <div className="text-sm">
                            <div className="text-gray-900">{member?.name || '家庭'}</div>
                            <div className="text-xs text-gray-400">{member?.relationship || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-600">{loan.loanDate}</td>
                      <td className={`py-3 px-3 text-sm ${
                        isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          {isOverdue && <AlertCircle className="w-3.5 h-3.5" />}
                          {loan.dueDate}
                          {loan.originalDueDate !== loan.dueDate && (
                            <span className="text-xs text-gray-400">（含节假日顺延）</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-sm">
                        <span className="text-gray-600">{loan.renewCount}</span>
                        <span className="text-gray-400 mx-0.5">/</span>
                        <span className="text-gray-400">{settings.allowRenewalTimes}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          isOverdue
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : loan.status === 'renewed'
                            ? 'bg-violet-50 text-violet-700 border border-violet-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {isOverdue ? <Clock className="w-3 h-3" /> : null}
                          {isOverdue ? '已逾期' : loan.status === 'renewed' ? '已续借' : '借阅中'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleRenew(loan.id)}
                          disabled={!canRenew}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            canRenew
                              ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                              : 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100'
                          }`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          续借
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
