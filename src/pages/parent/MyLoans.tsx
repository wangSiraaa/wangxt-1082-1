import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  BookOpen, Clock, CheckCircle, XCircle, AlertCircle,
  Users, Trophy, Calendar, RefreshCw, Award,
  CircleUser, BookMarked, Star, HandHeart,
  AlertTriangle, Send, X
} from 'lucide-react';
import { today } from '../../utils/date';
import type { FamilyMember, Loan } from '../../types';
import Modal from '../../components/Modal';

const DAMAGE_OPTIONS: { level: 'minor' | 'moderate' | 'severe' | 'lost'; label: string; desc: string; color: string }[] = [
  { level: 'minor', label: '轻微破损', desc: '封面折痕、页角轻微卷曲等不影响阅读的损伤', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { level: 'moderate', label: '中度破损', desc: '页面有涂鸦、污渍、书脊轻微松动', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { level: 'severe', label: '严重破损', desc: '书页撕裂、书脊脱落、无法正常阅读', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { level: 'lost', label: '遗失', desc: '图书丢失、无法归还', color: 'bg-red-50 text-red-700 border-red-200' },
];

export default function MyLoans() {
  const { 
    currentFamily, currentParent,
    families, familyMembers, 
    books, loans, compensations, settings,
    renewLoan, reportDamage
  } = useAppStore();

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingLoan, setReportingLoan] = useState<Loan | null>(null);
  const [reportLevel, setReportLevel] = useState<'minor' | 'moderate' | 'severe' | 'lost'>('minor');
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportResult, setReportResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
    const familyCheckins = compensations.length > 0 ? [] : [];
    return [];
  }, [family]);

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

  const openReportDamage = (loan: Loan) => {
    setReportingLoan(loan);
    setReportLevel('minor');
    setReportReason('');
    setReportResult(null);
    setReportModalOpen(true);
  };

  const closeReportModal = () => {
    if (reportSubmitting) return;
    setReportModalOpen(false);
    setReportingLoan(null);
    setReportResult(null);
  };

  const handleSubmitReport = async () => {
    if (!reportingLoan) return;
    if (!reportReason.trim()) {
      setReportResult({ type: 'error', message: '请描述破损情况' });
      return;
    }
    setReportSubmitting(true);
    setReportResult(null);

    const result = reportDamage(
      reportingLoan.id,
      reportLevel,
      reportReason.trim(),
      'tiered'
    );

    setTimeout(() => {
      setReportSubmitting(false);
      if (result.success) {
        setReportResult({
          type: 'success',
          message: `${result.message}（赔付金额约 ¥${result.compensation?.amount.toFixed(2) || '0.00'}）`
        });
        setTimeout(() => {
          closeReportModal();
        }, 2000);
      } else {
        setReportResult({ type: 'error', message: result.message });
      }
    }, 300);
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

        {/* 待处理赔付明细 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            我的待处理赔付
            <span className="text-sm font-normal text-gray-500">（{pendingCompensations.length}笔）</span>
          </h2>

          {pendingCompensations.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">暂无待处理赔付，继续保持 👍</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCompensations.map(cp => {
                const book = getBookById(cp.bookId);
                return (
                  <div key={cp.id} className="flex items-center gap-4 p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                    <div className="w-10 h-12 rounded bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg flex-shrink-0">
                      📖
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{book?.title || '未知绘本'}</div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">{cp.damageReason}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-amber-700">¥{cp.amount.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">待处理</div>
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
                  const hasPendingDamage = loan.hasDamage && pendingCompensations.some(c => c.loanId === loan.id);
                  
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
                            {loan.hasDamage && (
                              <div className="text-xs text-orange-600 mt-0.5 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {hasPendingDamage ? '已上报破损，等待处理' : '已标记破损'}
                              </div>
                            )}
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
                        <div className="inline-flex items-center gap-2">
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
                          <button
                            onClick={() => openReportDamage(loan)}
                            disabled={hasPendingDamage}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              hasPendingDamage
                                ? 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100'
                                : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                            }`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            破损上报
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 破损上报弹窗 */}
      <Modal
        isOpen={reportModalOpen}
        onClose={closeReportModal}
        title="绘本破损上报"
        size="md"
      >
        {reportingLoan && (
          <div className="space-y-5">
            {/* 绘本信息 */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
              <div className="w-14 h-18 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-2xl flex-shrink-0">
                📖
              </div>
              <div className="min-w-0">
                <div className="font-bold text-gray-900 text-base">
                  {getBookById(reportingLoan.bookId)?.title || '未知绘本'}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  借阅人：{getMemberById(reportingLoan.memberId)?.name || '家庭成员'}
                  · 借阅日：{reportingLoan.loanDate}
                </div>
                <div className="text-sm text-gray-500">
                  定价：¥{getBookById(reportingLoan.bookId)?.price.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>

            {/* 破损程度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                破损程度 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DAMAGE_OPTIONS.map(opt => (
                  <button
                    key={opt.level}
                    onClick={() => setReportLevel(opt.level)}
                    disabled={reportSubmitting}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      reportLevel === opt.level
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100'
                        : opt.color + ' hover:border-gray-300 border-gray-100'
                    } ${reportSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <div className="font-semibold text-sm">{opt.label}</div>
                    <div className="text-xs mt-1 opacity-75">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 赔付预估 */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">预估赔付金额</span>
                <span className="text-2xl font-bold text-amber-700">
                  ¥{(
                    (getBookById(reportingLoan.bookId)?.price || 0) *
                    (reportLevel === 'minor' ? 0.2 : reportLevel === 'moderate' ? 0.4 : reportLevel === 'severe' ? 0.6 : 1.0)
                  ).toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {reportLevel === 'minor' && '轻微破损：书价 × 20%（按馆员设置的阶梯赔付比例）'}
                {reportLevel === 'moderate' && '中度破损：书价 × 40%（按馆员设置的阶梯赔付比例）'}
                {reportLevel === 'severe' && '严重破损：书价 × 60%（按馆员设置的阶梯赔付比例）'}
                {reportLevel === 'lost' && '遗失：按书价全额赔付'}
                <br />最终金额以管理员审核为准
              </div>
            </div>

            {/* 破损描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                破损情况描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                disabled={reportSubmitting}
                placeholder="请详细描述破损情况，例如：封面角有折痕、第12页有孩子涂鸦、书脊脱胶等"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none disabled:bg-gray-50 disabled:text-gray-400"
              />
              <div className="text-xs text-gray-400 mt-1 text-right">{reportReason.length} 字</div>
            </div>

            {/* 提交结果 */}
            {reportResult && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                reportResult.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {reportResult.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                )}
                {reportResult.message}
              </div>
            )}

            {/* 底部按钮 */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={closeReportModal}
                disabled={reportSubmitting}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={reportSubmitting || reportResult?.type === 'success'}
                className="px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg hover:shadow-orange-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {reportSubmitting ? '提交中...' : '确认上报'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
