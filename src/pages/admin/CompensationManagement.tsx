import { useState, useMemo } from 'react';
import { 
  Shield, Search, AlertTriangle, Check, X, Edit, Lock, 
  FileText, DollarSign, Users, Calendar, Layers,
  Ban, Eye, Info, TrendingUp, Sparkles, Hammer,
  Clock, ShieldCheck, ChevronDown, ChevronUp, Package
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { 
  canEditCompensation, computeTieredCompensation, 
  getDamageLevelText, formatMoney
} from '../../utils/businessRules';
import { cn } from '../../lib/utils';
import type { Compensation, CompensationTier, Book, Family, Loan } from '../../types';

const typeConfig: Record<string, { label: string; color: string; icon: any }> = {
  overdue: { label: '逾期', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: Clock },
  damage: { label: '破损', color: 'text-rose-700 bg-rose-50 border-rose-200', icon: Hammer },
  lost: { label: '遗失', color: 'text-gray-800 bg-gray-100 border-gray-300', icon: Ban },
};

const modeConfig: Record<string, { label: string; color: string }> = {
  tiered: { label: '阶梯赔付', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  full: { label: '全价报损', color: 'text-red-700 bg-red-50 border-red-200' },
};

const statusConfig: Record<string, { label: string; color: string; badgeType: string }> = {
  pending: { label: '待处理', color: 'text-amber-700 bg-amber-50 border-amber-200', badgeType: 'warning' },
  paid: { label: '已赔付', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', badgeType: 'paid' },
  waived: { label: '已免除', color: 'text-gray-600 bg-gray-100 border-gray-200', badgeType: 'waived' },
};

export default function CompensationManagement() {
  const { 
    compensations, books, parents, users, loans, settings, families,
    getCompensationsByStatus, processCompensation, updateCompensationAmount,
    createCompensation
  } = useAppStore();
  
  const [tab, setTab] = useState<'list' | 'tiers'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'paid' | 'waived'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'overdue' | 'damage' | 'lost'>('all');
  const [expandDetails, setExpandDetails] = useState<Record<string, boolean>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedCompensation, setSelectedCompensation] = useState<Compensation | null>(null);
  const [processAction, setProcessAction] = useState<'paid' | 'waived'>('paid');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [editForm, setEditForm] = useState({
    amount: 0,
    compensationMode: 'tiered' as 'tiered' | 'full',
    damageLevel: 'moderate' as CompensationTier['level'],
    notes: ''
  });

  const tiers = settings.compensationTiers || [
    { level: 'minor', name: '轻微', ratio: 0.20, description: '可擦除污渍、小折角、轻微磨损' },
    { level: 'moderate', name: '中度', ratio: 0.40, description: '页面撕裂、脱页、污渍较多但可阅读' },
    { level: 'severe', name: '严重', ratio: 0.60, description: '散页、大面积水渍、封面严重破损' },
    { level: 'lost', name: '遗失', ratio: 1.00, description: '图书遗失或无法修复' },
  ];

  const filteredCompensations = useMemo(() => {
    return (selectedStatus === 'all' 
      ? compensations 
      : getCompensationsByStatus(selectedStatus)
    ).filter(c => {
      if (selectedType !== 'all' && c.type !== selectedType) return false;
      if (!searchQuery) return true;
      const book = books.find(b => b.id === c.bookId);
      const parent = parents.find(p => p.id === c.parentId);
      const family = families.find(f => f.id === c.familyId);
      return book?.title.includes(searchQuery) || 
             parent?.name.includes(searchQuery) ||
             parent?.childName?.includes(searchQuery) ||
             family?.name.includes(searchQuery) ||
             c.notes?.includes(searchQuery);
    }).sort((a, b) => new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime());
  }, [compensations, selectedStatus, selectedType, searchQuery, books, parents, families, getCompensationsByStatus]);

  const stats = useMemo(() => {
    const paid = compensations.filter(c => c.status === 'paid');
    const tieredCount = paid.filter(c => c.compensationMode === 'tiered').length;
    const fullCount = paid.filter(c => c.compensationMode === 'full').length;
    return {
      total: compensations.length,
      pending: getCompensationsByStatus('pending').length,
      paidCount: paid.length,
      waived: getCompensationsByStatus('waived').length,
      totalAmount: paid.reduce((sum, c) => sum + c.amount, 0),
      tieredCount,
      fullCount,
      overdueCount: compensations.filter(c => c.type === 'overdue').length,
      damageCount: compensations.filter(c => c.type === 'damage').length,
      lostCount: compensations.filter(c => c.type === 'lost').length,
    };
  }, [compensations, getCompensationsByStatus]);

  const getBook = (id: string): Book | undefined => books.find(b => b.id === id);
  const getFamily = (id?: string): Family | undefined => id ? families.find(f => f.id === id) : undefined;
  const getLoan = (id?: string): Loan | undefined => id ? loans.find(l => l.id === id) : undefined;

  const handleOpenEdit = (c: Compensation) => {
    if (!canEditCompensation(c)) {
      alert('已赔付记录不可修改');
      return;
    }
    setSelectedCompensation(c);
    setEditForm({
      amount: c.amount,
      compensationMode: c.compensationMode,
      damageLevel: c.damageLevel || 'moderate',
      notes: c.notes || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!selectedCompensation) return;
    const result = updateCompensationAmount(
      selectedCompensation.id,
      editForm.amount,
      editForm.compensationMode,
      tiers.find(t => t.level === editForm.damageLevel)?.ratio || 0.4
    );
    if (result.success) {
      setShowEditModal(false);
      setSuccessMessage(result.message);
      setShowSuccess(true);
    } else {
      alert(result.message);
    }
  };

  const handleProcess = (c: Compensation, action: 'paid' | 'waived') => {
    if (!canEditCompensation(c)) {
      alert('已赔付记录不可再处理');
      return;
    }
    setSelectedCompensation(c);
    setProcessAction(action);
    setShowProcessModal(true);
  };

  const handleConfirmProcess = () => {
    if (!selectedCompensation) return;
    const result = processCompensation(selectedCompensation.id, processAction);
    if (result.success) {
      setShowProcessModal(false);
      setSuccessMessage(processAction === 'paid' ? '赔付已确认到账，记录已锁定' : '赔付已免除，记录已锁定');
      setShowSuccess(true);
    } else {
      alert(result.message);
    }
  };

  const tierColors = ['emerald', 'amber', 'orange', 'red'];

  return (
    <div>
      <PageHeader
        title="赔付管理中心"
        subtitle="阶梯赔付规则、赔付全流程管理、已处理记录只读锁定"
        icon={<Shield className="w-6 h-6" />}
      />

      {/* Tab切换 */}
      <div className="flex gap-2 mb-6 p-1.5 bg-gray-100 rounded-2xl w-fit">
        <button
          onClick={() => setTab('list')}
          className={`px-5 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
            tab === 'list' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          赔付记录
          {stats.pending > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-red-500 text-white">
              {stats.pending}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('tiers')}
          className={`px-5 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
            tab === 'tiers' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          阶梯赔付规则
        </button>
      </div>

      {tab === 'tiers' && (
        <div className="space-y-6">
          {/* 赔付规则说明 */}
          <div className="bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-2">阶梯赔付体系</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  按照<span className="font-medium text-indigo-700">人性化</span>原则，赔付金额根据实际破损程度按<span className="font-medium text-indigo-700">阶梯比例</span>计算，
                  而非一律全额赔偿。如读者确认为「遗失」或图书「无法修复」，则按<span className="font-medium text-red-700">全价报损</span>处理。
                  已赔付记录将<span className="font-medium text-emerald-700">自动锁定</span>，任何人不得修改，保证财务数据不可篡改。
                </p>
              </div>
            </div>
          </div>

          {/* 阶梯赔付卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {tiers.map((tier, idx) => {
              const percent = Math.round(tier.ratio * 100);
              return (
                <div 
                  key={tier.level}
                  className={`relative overflow-hidden bg-white rounded-2xl shadow-sm border-2 p-6 ${
                    idx === 0 ? 'border-emerald-200' :
                    idx === 1 ? 'border-amber-200' :
                    idx === 2 ? 'border-orange-200' :
                    'border-red-200'
                  }`}
                >
                  <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-10 ${
                    idx === 0 ? 'bg-emerald-500' :
                    idx === 1 ? 'bg-amber-500' :
                    idx === 2 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        idx === 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        idx === 1 ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        idx === 2 ? 'bg-orange-100 text-orange-800 border-orange-200' :
                        'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        等级 {idx + 1}
                      </span>
                      {idx === tiers.length - 1 && (
                        <Package className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-1">{tier.name}</h4>
                    <p className="text-xs text-gray-500 mb-4 h-8">{tier.description}</p>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className={`text-4xl font-black ${
                        idx === 0 ? 'text-emerald-600' :
                        idx === 1 ? 'text-amber-600' :
                        idx === 2 ? 'text-orange-600' :
                        'text-red-600'
                      }`}>{percent}</span>
                      <span className="text-xl font-bold text-gray-500">%</span>
                      <span className="text-sm text-gray-400 ml-1">× 图书原价</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full rounded-full ${
                          idx === 0 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                          idx === 1 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                          idx === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                          'bg-gradient-to-r from-red-400 to-red-500'
                        }`}
                        style={{ width: `${tier.ratio * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">
                      示例：¥50的图书 = {formatMoney(50 * tier.ratio)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 赔付模式对比 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl shadow-sm border-2 border-indigo-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Layers className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">阶梯赔付</h4>
                  <p className="text-xs text-gray-500">默认 · 按实际损坏程度</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  适合读者无心造成的常规磨损
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  4级损坏自动对应20%/40%/60%/100%
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  馆员可在区间内手动微调金额
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border-2 border-red-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">全价报损</h4>
                  <p className="text-xs text-gray-500">特殊 · 按图书原价100%</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  适用于确认遗失、故意损毁
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  图书不再归馆，读者直接购买赔偿
                </li>
                <li className="flex items-start gap-2">
                  <Ban className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  需主管审批，登记备注原因
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === 'list' && (
        <div className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 font-medium">总记录</span>
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-gray-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-400 mt-1">
                逾期{stats.overdueCount} · 破损{stats.damageCount} · 遗失{stats.lostCount}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-amber-600 font-medium">待处理</span>
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-emerald-600 font-medium">已赔付</span>
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-emerald-600">{stats.paidCount}</p>
              <p className="text-xs text-emerald-500 mt-1">
                阶梯{stats.tieredCount} · 全价{stats.fullCount}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 font-medium">已免除</span>
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-600">{stats.waived}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/80 text-xs font-medium">赔付总额</span>
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold">{formatMoney(stats.totalAmount)}</p>
              <p className="text-xs text-white/60 mt-1">
                含阶梯赔付 {formatMoney(stats.totalAmount * 0.6)} (预估)
              </p>
            </div>
          </div>

          {/* 筛选栏 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索书名、家长、家庭名称、备注..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="all">全部类型</option>
                  <option value="overdue">逾期罚款</option>
                  <option value="damage">破损赔付</option>
                  <option value="lost">遗失赔付</option>
                </select>
                {(['all', 'pending', 'paid', 'waived'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={cn(
                      'px-4 py-3 rounded-xl font-medium text-sm transition-all',
                      selectedStatus === status
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {status === 'all' ? '全部' : statusConfig[status].label}
                    {status === 'pending' && stats.pending > 0 && (
                      <span className="ml-1 bg-white/20 px-1.5 rounded-full text-xs">{stats.pending}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 记录列表 */}
          <div className="space-y-3">
            {filteredCompensations.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-20">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">暂无赔付记录</p>
              </div>
            ) : (
              filteredCompensations.map(c => {
                const book = getBook(c.bookId);
                const parent = parents.find(p => p.id === c.parentId);
                const family = getFamily(c.familyId);
                const loan = getLoan(c.loanId);
                const type = typeConfig[c.type] || typeConfig.damage;
                const mode = modeConfig[c.compensationMode] || modeConfig.tiered;
                const scfg = statusConfig[c.status];
                const TypeIcon = type.icon;
                const isLocked = c.isLocked || c.status !== 'pending';
                const isExpanded = expandDetails[c.id] || false;
                
                const tieredInfo = c.damageLevel ? tiers.find(t => t.level === c.damageLevel) : null;

                return (
                  <div key={c.id} className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${
                    isLocked ? 'border-gray-100' : 'border-amber-100'
                  }`}>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0 flex gap-4">
                          <div className={`w-14 h-18 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm ${
                            c.type === 'lost' 
                              ? 'bg-gradient-to-br from-gray-100 to-gray-200' 
                              : c.type === 'overdue'
                                ? 'bg-gradient-to-br from-amber-100 to-orange-100'
                                : 'bg-gradient-to-br from-rose-100 to-red-100'
                          }`}>
                            📖
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 flex-wrap">
                              <h4 className="font-bold text-gray-900 truncate">《{book?.title || '未知图书'}》</h4>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${type.color}`}>
                                <TypeIcon className="w-3 h-3" />
                                {type.label}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${mode.color}`}>
                                {mode.label}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${scfg.color}`}>
                                {scfg.label}
                              </span>
                              {isLocked && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-gray-500 bg-gray-100 border border-gray-200">
                                  <Lock className="w-3 h-3" />
                                  已锁定
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-500">
                              {family && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {family.name}（{family.memberLevel}）
                                </span>
                              )}
                              {parent && (
                                <span>申请人：{parent.name}</span>
                              )}
                              {loan && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  借阅：{loan.loanDate}
                                </span>
                              )}
                            </div>
                            {c.notes && c.status !== 'pending' && (
                              <p className="mt-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
                                {c.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <p className="text-xs text-gray-400 mb-1">赔付金额</p>
                            <p className="text-2xl font-black text-gray-900">{formatMoney(c.amount)}</p>
                            {book && tieredInfo && c.compensationMode === 'tiered' && c.status === 'pending' && (
                              <p className="text-[11px] text-indigo-600 mt-0.5">
                                ¥{book.price} × {Math.round(tieredInfo.ratio * 100)}% = {formatMoney(book.price * tieredInfo.ratio)}
                              </p>
                            )}
                            {book && c.compensationMode === 'full' && (
                              <p className="text-[11px] text-red-600 mt-0.5">
                                全价 ¥{book.price}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setExpandDetails(prev => ({ ...prev, [c.id]: !isExpanded }))}
                              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                              title="查看详情"
                            >
                              {isExpanded 
                                ? <ChevronUp className="w-4 h-4" /> 
                                : <Eye className="w-4 h-4" />
                              }
                            </button>
                            {!isLocked && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(c)}
                                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="调整赔付"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleProcess(c, 'paid')}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="确认赔付"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleProcess(c, 'waived')}
                                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                  title="免除赔付"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {isLocked && c.status === 'paid' && (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-emerald-700 bg-emerald-50 border border-emerald-200">
                                <Check className="w-3 h-3" />
                                {c.paidDate || '已到账'}
                              </span>
                            )}
                            {isLocked && c.status === 'waived' && (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-600 bg-gray-50 border border-gray-200">
                                <Lock className="w-3 h-3" />
                                已免除
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-xl">
                              <p className="text-xs text-gray-500 font-medium mb-2">赔付明细</p>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">图书原价</span>
                                  <span className="font-medium">{formatMoney(book?.price || 0)}</span>
                                </div>
                                {c.compensationMode === 'tiered' && (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">
                                        破损等级：{tieredInfo?.name || c.damageLevel}
                                      </span>
                                      <span className="font-medium text-indigo-600">
                                        × {Math.round((c.tierRatio || tieredInfo?.ratio || 0.4) * 100)}%
                                      </span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t border-gray-200">
                                      <span className="font-bold">阶梯赔付金额</span>
                                      <span className="font-bold text-indigo-700">
                                        {formatMoney((book?.price || 0) * (c.tierRatio || tieredInfo?.ratio || 0.4))}
                                      </span>
                                    </div>
                                  </>
                                )}
                                {c.compensationMode === 'full' && (
                                  <div className="flex justify-between pt-1 border-t border-gray-200">
                                    <span className="font-bold text-red-700">全价报损金额</span>
                                    <span className="font-bold text-red-700">{formatMoney(book?.price || 0)}</span>
                                  </div>
                                )}
                                {c.type === 'overdue' && loan && (
                                  <>
                                    <div className="flex justify-between pt-1 border-t border-gray-100">
                                      <span className="text-gray-600">含逾期天数</span>
                                      <span className="font-medium">{c.notes || '详见借阅单'}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                              <p className="text-xs text-gray-500 font-medium mb-2">借阅与记录信息</p>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">报告日期</span>
                                  <span>{c.reportedDate}</span>
                                </div>
                                {c.paidDate && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      {c.status === 'paid' ? '到账日期' : '处理日期'}
                                    </span>
                                    <span className="text-emerald-600">{c.paidDate}</span>
                                  </div>
                                )}
                                {c.processedBy && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">处理人</span>
                                    <span>{c.processedBy}</span>
                                  </div>
                                )}
                                {loan && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">关联借阅</span>
                                    <span className="text-indigo-600">#{loan.id.slice(-6)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-gray-600">赔付编号</span>
                                  <span className="text-xs text-gray-400">#{c.id}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {isLocked && (
                            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                              <p className="text-xs text-emerald-800">
                                此赔付记录已完成财务处理并<span className="font-bold">锁定</span>，
                                包括赔付金额、赔付方式、等级在内的所有字段均已<span className="font-bold">只读</span>，
                                任何人无法修改。
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 编辑/调整赔付弹窗 */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="调整赔付信息"
      >
        {selectedCompensation && (() => {
          const book = getBook(selectedCompensation.bookId);
          const price = book?.price || 0;
          const currentTier = tiers.find(t => t.level === editForm.damageLevel);
          const suggestedAmount = editForm.compensationMode === 'full' 
            ? price 
            : price * (currentTier?.ratio || 0.4);

          return (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
                <Info className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <div className="text-sm text-indigo-800">
                  <p className="font-medium">《{book?.title}》</p>
                  <p className="text-xs text-indigo-600 mt-0.5">原价 {formatMoney(price)}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">赔付方式</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setEditForm({ ...editForm, compensationMode: 'tiered' })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      editForm.compensationMode === 'tiered'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className={`w-4 h-4 ${editForm.compensationMode === 'tiered' ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <p className={`font-bold text-sm ${editForm.compensationMode === 'tiered' ? 'text-indigo-700' : 'text-gray-700'}`}>
                        阶梯赔付
                      </p>
                    </div>
                    <p className="text-[11px] text-gray-500">按实际破损等级按比例</p>
                  </button>
                  <button
                    onClick={() => setEditForm({ ...editForm, compensationMode: 'full' })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      editForm.compensationMode === 'full'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className={`w-4 h-4 ${editForm.compensationMode === 'full' ? 'text-red-600' : 'text-gray-400'}`} />
                      <p className={`font-bold text-sm ${editForm.compensationMode === 'full' ? 'text-red-700' : 'text-gray-700'}`}>
                        全价报损
                      </p>
                    </div>
                    <p className="text-[11px] text-gray-500">遗失或故意损坏按原价</p>
                  </button>
                </div>
              </div>

              {editForm.compensationMode === 'tiered' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">破损等级</label>
                  <div className="grid grid-cols-4 gap-2">
                    {tiers.map(tier => (
                      <button
                        key={tier.level}
                        onClick={() => setEditForm({ ...editForm, damageLevel: tier.level })}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          editForm.damageLevel === tier.level
                            ? tier.level === 'minor' ? 'border-emerald-500 bg-emerald-50'
                            : tier.level === 'moderate' ? 'border-amber-500 bg-amber-50'
                            : tier.level === 'severe' ? 'border-orange-500 bg-orange-50'
                            : 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className={`text-xs font-bold ${
                          tier.level === 'minor' ? 'text-emerald-700'
                          : tier.level === 'moderate' ? 'text-amber-700'
                          : tier.level === 'severe' ? 'text-orange-700'
                          : 'text-red-700'
                        }`}>{tier.name}</p>
                        <p className={`text-[11px] mt-1 ${
                          editForm.damageLevel === tier.level ? 'font-bold' : 'text-gray-500'
                        }`}>×{Math.round(tier.ratio * 100)}%</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">系统建议金额</span>
                  <button
                    onClick={() => setEditForm({ ...editForm, amount: suggestedAmount })}
                    className="text-xs px-2 py-1 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 text-indigo-600"
                  >
                    使用建议
                  </button>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-900">{formatMoney(suggestedAmount)}</span>
                  <span className="text-xs text-gray-400">
                    （{editForm.compensationMode === 'full' ? '原价100%' : `${currentTier?.name}×${Math.round((currentTier?.ratio || 0.4) * 100)}%`}）
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  实际赔付金额（元）
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="调整原因、协商情况、补充说明..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editForm.amount < 0}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  保存调整
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* 确认处理弹窗 */}
      <Modal
        isOpen={showProcessModal}
        onClose={() => setShowProcessModal(false)}
        title={processAction === 'paid' ? '确认赔付到账' : '确认免除赔付'}
      >
        {selectedCompensation && (() => {
          const book = getBook(selectedCompensation.bookId);
          const parent = parents.find(p => p.id === selectedCompensation.parentId);
          const family = getFamily(selectedCompensation.familyId);

          return (
            <div className="space-y-4">
              <div className={cn(
                'p-5 rounded-xl',
                processAction === 'paid' 
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200' 
                  : 'bg-gray-50 border border-gray-200'
              )}>
                <p className={cn(
                  'font-bold text-lg',
                  processAction === 'paid' ? 'text-emerald-800' : 'text-gray-800'
                )}>
                  {processAction === 'paid' 
                    ? `确认收到 ${formatMoney(selectedCompensation.amount)} 赔付？`
                    : '确认免除该笔赔付？'
                  }
                </p>
                <div className="mt-3 space-y-1 text-sm text-gray-700">
                  <p>📚 《{book?.title}》</p>
                  <p>👤 {parent?.name}{parent?.childName ? `（${parent.childName}${selectedCompensation.parentId?.includes('dad') ? '爸爸' : '妈妈'}）` : ''}</p>
                  {family && <p>🏠 {family.name}</p>}
                  <p>
                    📋 {selectedCompensation.compensationMode === 'tiered' ? '阶梯赔付' : '全价报损'}
                    {selectedCompensation.damageLevel && ` · ${getDamageLevelText(selectedCompensation.damageLevel)}`}
                  </p>
                </div>
              </div>
              
              <div className={cn(
                'p-4 rounded-xl flex items-start gap-3',
                processAction === 'paid' ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'
              )}>
                <ShieldCheck className={cn(
                  'w-5 h-5 flex-shrink-0 mt-0.5',
                  processAction === 'paid' ? 'text-amber-600' : 'text-blue-600'
                )} />
                <div className={cn(
                  'text-xs leading-relaxed',
                  processAction === 'paid' ? 'text-amber-800' : 'text-blue-800'
                )}>
                  <p className="font-bold mb-1">操作后将锁定记录（不可撤销）</p>
                  <ul className="space-y-0.5">
                    <li>• 赔付金额、赔付方式、破损等级将不可修改</li>
                    <li>• 财务数据保持不可篡改性，符合审计要求</li>
                    <li>• 如需申诉或修正，需联系系统管理员走数据调整流程</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowProcessModal(false)}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmProcess}
                  className={cn(
                    'px-6 py-2.5 rounded-xl font-medium hover:shadow-lg transition-all',
                    processAction === 'paid'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                      : 'bg-gradient-to-r from-gray-500 to-slate-600 text-white'
                  )}
                >
                  {processAction === 'paid' ? '确认收到，锁定记录' : '确认免除，锁定记录'}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* 成功提示 */}
      <Modal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="操作成功"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-gray-800 font-medium">{successMessage}</p>
          <button
            onClick={() => setShowSuccess(false)}
            className="mt-6 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            确定
          </button>
        </div>
      </Modal>
    </div>
  );
}
