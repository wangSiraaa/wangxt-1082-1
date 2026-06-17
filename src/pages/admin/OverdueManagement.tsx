import { useState, useMemo } from 'react';
import { 
  AlertTriangle, Clock, Search, Mail, Phone, DollarSign, Send,
  Wrench, Calculator, Shield, CalendarDays, Ban, CheckCircle,
  ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import type { Loan, Book, Parent, Family } from '../../types';
import { 
  getHolidaysBetween, 
  computeTieredCompensation, 
  computeOverdueFine,
  getHolidayDaysBetween
} from '@/utils/businessRules';
import { formatDate, getOverdueDays, addDays, daysBetween } from '@/utils/date';

type DamageLevel = 'minor' | 'moderate' | 'severe' | 'lost';
type CompensationMode = 'tiered' | 'full';

interface ProcessState {
  allowHolidayPostpone: boolean;
  postponeDays: number;
  postponeReason: string;
  needRepair: boolean;
  damageLevel: DamageLevel;
  damageDescription: string;
  compensationMode: CompensationMode;
}

export default function OverdueManagement() {
  const { 
    loans, books, parents, families, users, settings, holidays, 
    returnLoan, updateLoan, createRepairRecord, postponeOverdue
  } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [processState, setProcessState] = useState<ProcessState>({
    allowHolidayPostpone: true,
    postponeDays: 0,
    postponeReason: '',
    needRepair: false,
    damageLevel: 'minor',
    damageDescription: '',
    compensationMode: 'tiered'
  });

  const overdueLoans = loans
    .filter(l => l.status !== 'returned' && l.isOverdue)
    .sort((a, b) => getOverdueDays(b.dueDate) - getOverdueDays(a.dueDate));

  const filteredLoans = overdueLoans.filter(loan => {
    const book = books.find(b => b.id === loan.bookId);
    const parent = parents.find(p => p.id === loan.parentId);
    const user = users.find(u => u.id === loan.parentId);
    return book?.title.includes(searchQuery) || 
           parent?.name.includes(searchQuery) ||
           parent?.childName.includes(searchQuery) ||
           user?.phone.includes(searchQuery);
  });

  const totalOverdueAmount = overdueLoans.reduce((sum, loan) => {
    return sum + computeOverdueFine(loan, settings, holidays);
  }, 0);

  const selectedLoanDetails = useMemo(() => {
    if (!selectedLoan) return null;
    const book = books.find(b => b.id === selectedLoan.bookId);
    const parent = parents.find(p => p.id === selectedLoan.parentId);
    const family = parent ? families.find(f => f.id === parent.familyId) : undefined;
    const user = users.find(u => u.id === selectedLoan.parentId);
    const overdueDays = getOverdueDays(selectedLoan.dueDate);
    const overlapHolidays = getHolidaysBetween(selectedLoan.dueDate, formatDate(new Date()), holidays);
    const holidayDays = getHolidayDaysBetween(selectedLoan.dueDate, formatDate(new Date()), holidays);
    const overdueFine = computeOverdueFine(selectedLoan, settings, holidays);
    
    const tierResult = book ? computeTieredCompensation(book.price, processState.damageLevel, settings.compensationTiers) : { amount: 0, ratio: 1.0, tierName: '' };
    const totalCompensation = processState.compensationMode === 'full' 
      ? (book?.price || 0)
      : (tierResult.amount + overdueFine);

    return { book, parent, family, user, overdueDays, overlapHolidays, holidayDays, overdueFine, tierResult, totalCompensation };
  }, [selectedLoan, books, parents, families, users, holidays, settings, processState.damageLevel, processState.compensationMode]);

  const openProcessModal = (loan: Loan) => {
    const overlapHolidays = getHolidaysBetween(loan.dueDate, formatDate(new Date()), holidays);
    const holidayDays = getHolidayDaysBetween(loan.dueDate, formatDate(new Date()), holidays);
    setSelectedLoan(loan);
    setProcessState({
      allowHolidayPostpone: settings.allowHolidayPostpone && overlapHolidays.length > 0,
      postponeDays: holidayDays,
      postponeReason: overlapHolidays.map(h => h.name).join('、'),
      needRepair: false,
      damageLevel: 'minor',
      damageDescription: '',
      compensationMode: 'tiered'
    });
    setShowProcessModal(true);
  };

  const handleSendNotify = () => {
    if (!selectedLoan) return;
    setSuccessMessage(`已向家长发送逾期提醒：${notifyMessage || '您借阅的绘本已逾期，请尽快归还'}`);
    setShowNotifyModal(false);
    setShowSuccess(true);
    setNotifyMessage('');
    setSelectedLoan(null);
  };

  const handleSendBatchNotify = () => {
    setSuccessMessage(`已向 ${overdueLoans.length} 位逾期家长发送批量提醒`);
    setShowSuccess(true);
  };

  const confirmProcess = () => {
    if (!selectedLoan || !selectedLoanDetails) return;
    
    const steps: string[] = [];
    
    if (processState.allowHolidayPostpone && processState.postponeDays > 0) {
      postponeOverdue(selectedLoan.id, processState.postponeDays, processState.postponeReason || '节假日顺延');
      steps.push(`已顺延节假日${processState.postponeDays}天`);
    }
    
    if (processState.needRepair && processState.damageDescription && selectedLoanDetails.book) {
      createRepairRecord({
        bookId: selectedLoan.bookId,
        loanId: selectedLoan.id,
        reportedBy: 'system',
        reportedDate: formatDate(new Date()),
        damageDescription: processState.damageDescription,
        damageLevel: processState.damageLevel === 'lost' ? 'severe' : processState.damageLevel,
        status: processState.damageLevel === 'lost' ? 'scrapped' : 'pending',
        libraryId: selectedLoanDetails.book.libraryId
      });
      steps.push(`已登记待修补（${getDamageLabel(processState.damageLevel)}）`);
    }
    
    const result = returnLoan(
      selectedLoan.id, 
      processState.needRepair, 
      processState.damageDescription || undefined,
      processState.needRepair ? processState.damageLevel : undefined,
      processState.compensationMode
    );

    if (result.success) {
      steps.push('归还成功');
      setSuccessMessage([
        `处理完成：${selectedLoanDetails.book?.title}`,
        ...steps,
        `赔付合计：¥${selectedLoanDetails.totalCompensation.toFixed(2)}`
      ].join('\n'));
      setShowProcessModal(false);
      setShowSuccess(true);
      setSelectedLoan(null);
    } else {
      alert(result.message);
    }
  };

  const damageOptions: { value: DamageLevel; label: string; desc: string }[] = [
    { value: 'minor', label: '轻微破损', desc: '封面划痕、书角轻微卷边' },
    { value: 'moderate', label: '中度破损', desc: '涂鸦、书脊松动、轻微撕裂' },
    { value: 'severe', label: '严重破损', desc: '严重撕裂、缺页、水浸' },
    { value: 'lost', label: '遗失', desc: '图书遗失，按全价赔偿' }
  ];

  const getDamageLabel = (level: DamageLevel) => damageOptions.find(d => d.value === level)?.label || level;

  return (
    <div>
      <PageHeader
        title="逾期处理中心"
        subtitle="处理逾期借阅：节假日顺延、登记修补、阶梯赔付"
        icon={<AlertTriangle className="w-6 h-6" />}
        action={
          overdueLoans.length > 0 && (
            <button
              onClick={handleSendBatchNotify}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <Send className="w-4 h-4" />
              批量提醒 ({overdueLoans.length})
            </button>
          )
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">逾期订单</p>
              <p className="text-2xl font-bold">{overdueLoans.length} 笔</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">逾期总天数</p>
              <p className="text-2xl font-bold">
                {overdueLoans.reduce((sum, l) => sum + getOverdueDays(l.dueDate), 0)} 天
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">逾期罚款</p>
              <p className="text-2xl font-bold">¥{totalOverdueAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">节假日顺延</p>
              <p className="text-2xl font-bold">
                {settings.allowHolidayPostpone ? '已启用' : '未启用'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索书名、家长姓名、孩子姓名、电话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">逾期借阅列表</h3>
          <p className="text-sm text-gray-500">点击「处理」按钮完成逾期归还的三要素判断</p>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredLoans.length === 0 ? (
            <div className="text-center py-16">
              <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无逾期订单</p>
              <p className="text-sm text-gray-400 mt-1">所有绘本都按时归还，真棒！</p>
            </div>
          ) : (
            filteredLoans.map(loan => {
              const book = books.find(b => b.id === loan.bookId);
              const parent = parents.find(p => p.id === loan.parentId);
              const family = parent ? families.find(f => f.id === parent.familyId) : undefined;
              const user = users.find(u => u.id === loan.parentId);
              const overdueDays = getOverdueDays(loan.dueDate);
              const overlapHolidays = getHolidaysBetween(loan.dueDate, formatDate(new Date()), holidays);
              const holidayDays = getHolidayDaysBetween(loan.dueDate, formatDate(new Date()), holidays);
              const overdueFine = computeOverdueFine(loan, settings, holidays);
              const isExpanded = expandedId === loan.id;

              return (
                <div key={loan.id}>
                  <div className="p-6 hover:bg-gray-50/60 transition-colors">
                    <div className="flex items-start gap-4">
                      <img src={book?.coverUrl} alt="" className="w-16 h-24 object-cover rounded-lg shadow-sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-800">{book?.title}</h4>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <StatusBadge status="danger">
                                逾期 {overdueDays} 天
                              </StatusBadge>
                              <span className="text-sm text-red-600 font-medium">
                                罚款 ¥{overdueFine.toFixed(2)}
                              </span>
                              {book?.theme && (
                                <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">
                                  {book.theme}
                                </span>
                              )}
                              {overlapHolidays.length > 0 && (
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3" />
                                  含节假日 {holidayDays}天
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setShowNotifyModal(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-all"
                            >
                              <Send className="w-3 h-3" />
                              提醒
                            </button>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : loan.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              详情
                            </button>
                            <button
                              onClick={() => openProcessModal(loan)}
                              className="flex items-center gap-1 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-sm font-medium hover:shadow-md transition-all"
                            >
                              <CheckCircle className="w-3 h-3" />
                              处理
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">借阅人：</span>
                            <span className="text-gray-800 font-medium">{parent?.name}</span>
                            {family && <span className="text-gray-400">（{family.name}）</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{user?.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{user?.email}</span>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                          <span className="text-gray-500">借阅日期：{formatDate(loan.loanDate)}</span>
                          <span className="text-gray-500">应还日期：{formatDate(loan.dueDate)}</span>
                          <span className="text-gray-500">已续借：{loan.renewCount}次</span>
                        </div>
                        {overlapHolidays.length > 0 && (
                          <div className="mt-2 flex items-start gap-2 text-xs bg-blue-50 text-blue-700 rounded-lg px-3 py-2">
                            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <div>
                              到期日区间内包含 {overlapHolidays.length} 个节假日：
                              {overlapHolidays.map(h => (
                                <span key={h.id} className="ml-1 font-medium">
                                  「{h.name}」{h.startDate}~{h.endDate}
                                </span>
                              ))}
                              ，可自动顺延 {holidayDays} 天
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-4 ml-20 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50/80 rounded-xl">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">图书定价</p>
                          <p className="text-lg font-bold text-gray-800">¥{book?.price.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">阶梯赔付（轻微）</p>
                          <p className="text-lg font-bold text-emerald-600">
                            ¥{((book?.price || 0) * (settings.compensationTiers.find(t => t.level === 'minor')?.ratio || 0.2)).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">阶梯赔付（中度）</p>
                          <p className="text-lg font-bold text-amber-600">
                            ¥{((book?.price || 0) * (settings.compensationTiers.find(t => t.level === 'moderate')?.ratio || 0.4)).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">阶梯赔付（严重）</p>
                          <p className="text-lg font-bold text-red-600">
                            ¥{((book?.price || 0) * (settings.compensationTiers.find(t => t.level === 'severe')?.ratio || 0.6)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 处理逾期弹窗 - 三要素判断 */}
      <Modal
        isOpen={showProcessModal}
        onClose={() => setShowProcessModal(false)}
        title="逾期归还处理"
        size="lg"
      >
        {selectedLoan && selectedLoanDetails && (
          <div className="space-y-5">
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
              <div className="flex gap-4">
                <img src={selectedLoanDetails.book?.coverUrl} alt="" className="w-14 h-20 rounded-lg shadow" />
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{selectedLoanDetails.book?.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <span>{selectedLoanDetails.parent?.name}（{selectedLoanDetails.family?.name}）</span>
                    <span>·</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      selectedLoanDetails.overdueDays > 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      逾期{selectedLoanDetails.overdueDays}天
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>借阅日：{selectedLoan.loanDate}</span>
                    <span>→</span>
                    <span>应还：{selectedLoan.dueDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 要素一：节假日顺延 */}
            <div className={`p-4 rounded-xl border-2 transition-all ${
              processState.allowHolidayPostpone 
                ? 'border-blue-200 bg-blue-50/50' 
                : 'border-gray-100 bg-gray-50/30'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center text-sm font-bold">1</div>
                  <h4 className="font-bold text-gray-800">节假日顺延判断</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedLoanDetails.overlapHolidays.length > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {selectedLoanDetails.overlapHolidays.length > 0 
                      ? `区间内有${selectedLoanDetails.overlapHolidays.length}个节假日，建议顺延${selectedLoanDetails.holidayDays}天`
                      : '区间内无节假日'
                    }
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={processState.allowHolidayPostpone}
                    onChange={(e) => setProcessState({ ...processState, allowHolidayPostpone: e.target.checked })}
                    disabled={selectedLoanDetails.overlapHolidays.length === 0 || !settings.allowHolidayPostpone}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className={`text-sm font-medium ${
                    processState.allowHolidayPostpone ? 'text-blue-700' : 'text-gray-400'
                  }`}>启用顺延</span>
                </label>
              </div>
              {selectedLoanDetails.overlapHolidays.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedLoanDetails.overlapHolidays.map(h => (
                    <span key={h.id} className="px-2 py-1 bg-white rounded-lg text-xs border border-blue-100 text-gray-700">
                      📅 {h.name}：{h.startDate} ~ {h.endDate}
                    </span>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">顺延天数</label>
                  <input
                    type="number"
                    min={0}
                    value={processState.postponeDays}
                    onChange={(e) => setProcessState({ ...processState, postponeDays: parseInt(e.target.value) || 0 })}
                    disabled={!processState.allowHolidayPostpone}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">顺延原因</label>
                  <input
                    type="text"
                    value={processState.postponeReason}
                    onChange={(e) => setProcessState({ ...processState, postponeReason: e.target.value })}
                    disabled={!processState.allowHolidayPostpone}
                    placeholder="如：春节假期..."
                    className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* 要素二：是否转待修补 */}
            <div className={`p-4 rounded-xl border-2 transition-all ${
              processState.needRepair 
                ? 'border-amber-200 bg-amber-50/50' 
                : 'border-gray-100 bg-gray-50/30'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center text-sm font-bold">2</div>
                  <h4 className="font-bold text-gray-800">破损检查</h4>
                  <span className="text-xs text-gray-500">
                    检查绘本是否需要转待修补登记
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={processState.needRepair}
                    onChange={(e) => setProcessState({ ...processState, needRepair: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600"
                  />
                  <span className={`text-sm font-medium ${
                    processState.needRepair ? 'text-amber-700' : 'text-gray-400'
                  }`}>有破损</span>
                </label>
              </div>

              {processState.needRepair && (
                <div className="space-y-3 mt-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">破损程度</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {damageOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setProcessState({ ...processState, damageLevel: opt.value })}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            processState.damageLevel === opt.value
                              ? opt.value === 'lost' ? 'border-red-400 bg-red-50 ring-2 ring-red-200'
                              : opt.value === 'severe' ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-200'
                              : opt.value === 'moderate' ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200'
                              : 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className={`font-bold text-sm ${
                            processState.damageLevel === opt.value
                              ? opt.value === 'lost' ? 'text-red-700'
                              : opt.value === 'severe' ? 'text-orange-700'
                              : opt.value === 'moderate' ? 'text-amber-700'
                              : 'text-emerald-700'
                              : 'text-gray-700'
                          }`}>{opt.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      破损说明
                      <span className="text-gray-400 font-normal ml-1">（将自动登记为待修补记录）</span>
                    </label>
                    <textarea
                      rows={2}
                      value={processState.damageDescription}
                      onChange={(e) => setProcessState({ ...processState, damageDescription: e.target.value })}
                      placeholder="请描述破损情况，如：第12页被孩子撕坏、封面有大面积涂鸦..."
                      className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 要素三：赔付方式 */}
            <div className="p-4 rounded-xl border-2 border-rose-200 bg-rose-50/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center text-sm font-bold">3</div>
                  <h4 className="font-bold text-gray-800">赔付方式</h4>
                  <span className="text-xs text-gray-500">阶梯赔付 或 全价报损</span>
                </div>
                <div className="flex gap-2 p-1 bg-white rounded-xl border border-gray-200">
                  <button
                    onClick={() => setProcessState({ ...processState, compensationMode: 'tiered' })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                      processState.compensationMode === 'tiered'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    阶梯赔付
                  </button>
                  <button
                    onClick={() => setProcessState({ ...processState, compensationMode: 'full' })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                      processState.compensationMode === 'full'
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    全价报损
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Calculator className="w-3 h-3" />
                    赔付明细
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>图书原价</span>
                      <span>¥{selectedLoanDetails.book?.price.toFixed(2)}</span>
                    </div>
                    {processState.needRepair ? (
                      processState.compensationMode === 'tiered' ? (
                        <>
                          <div className="flex justify-between text-gray-600">
                            <span>赔付比例（{getDamageLabel(processState.damageLevel)}）</span>
                            <span>{(selectedLoanDetails.tierResult.ratio * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between text-amber-600 font-medium">
                            <span>破损赔付</span>
                            <span>¥{selectedLoanDetails.tierResult.amount.toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-red-600 font-medium">
                          <span>全价赔付（整册报损）</span>
                          <span>¥{selectedLoanDetails.book?.price.toFixed(2)}</span>
                        </div>
                      )
                    ) : (
                      <div className="flex justify-between text-gray-400">
                        <span>无破损赔付</span>
                        <span>¥0.00</span>
                      </div>
                    )}
                    <div className="flex justify-between text-blue-600">
                      <span>逾期罚款（扣{selectedLoanDetails.holidayDays}天节假日）</span>
                      <span>¥{selectedLoanDetails.overdueFine.toFixed(2)}</span>
                    </div>
                    {processState.allowHolidayPostpone && processState.postponeDays > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>节假日减免</span>
                        <span>-¥{Math.min(selectedLoanDetails.overdueFine, settings.overdueFinePerDay * processState.postponeDays).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-baseline">
                    <span className="text-sm font-medium text-gray-700">赔付合计</span>
                    <span className="text-2xl font-bold text-rose-600">
                      ¥{selectedLoanDetails.totalCompensation.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    阶梯赔付规则
                  </p>
                  <div className="space-y-2">
                    {settings.compensationTiers.map(tier => (
                      <div key={tier.level} className={`flex items-center justify-between p-2 rounded-lg ${
                        processState.needRepair && processState.damageLevel === tier.level 
                          ? 'bg-white shadow-sm border border-emerald-200'
                          : ''
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            tier.level === 'minor' ? 'bg-emerald-400' :
                            tier.level === 'moderate' ? 'bg-amber-400' :
                            tier.level === 'severe' ? 'bg-orange-400' : 'bg-red-500'
                          }`} />
                          <span className="text-sm font-medium text-gray-700">{tier.name}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-bold text-gray-800">{(tier.ratio * 100).toFixed(0)}%</span>
                          <span className="text-gray-400 mx-1">→</span>
                          <span className="text-gray-600">¥{((selectedLoanDetails.book?.price || 0) * tier.ratio).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
                onClick={confirmProcess}
                disabled={processState.needRepair && !processState.damageDescription}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                确认处理
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showNotifyModal}
        onClose={() => setShowNotifyModal(false)}
        title="发送逾期提醒"
      >
        {selectedLoan && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">
                将向 <span className="font-medium text-gray-800">
                  {parents.find(p => p.id === selectedLoan.parentId)?.name}
                </span> 发送提醒
              </p>
              <p className="text-sm text-gray-600 mt-1">
                绘本：<span className="font-medium text-gray-800">
                  《{books.find(b => b.id === selectedLoan.bookId)?.title}》
                </span>
              </p>
              <p className="text-sm text-red-600 mt-1">
                已逾期 {getOverdueDays(selectedLoan.dueDate)} 天，罚款 ¥{computeOverdueFine(selectedLoan, settings, holidays).toFixed(2)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">提醒内容</label>
              <textarea
                rows={4}
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                placeholder="请输入提醒内容..."
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                留空将发送默认提醒："您借阅的绘本已逾期，请尽快归还"
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowNotifyModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSendNotify}
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                发送提醒
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="操作成功"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-800 font-medium whitespace-pre-line">{successMessage}</p>
          <button
            onClick={() => setShowSuccess(false)}
            className="mt-6 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            确定
          </button>
        </div>
      </Modal>
    </div>
  );
}
