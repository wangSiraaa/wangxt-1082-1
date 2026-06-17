import { useState } from 'react';
import { Shield, Search, AlertTriangle, Check, X, Edit, Lock, FileText, DollarSign } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { canEditDamageReason, computeCompensationAmount, getDamageLevelText } from '@/utils/businessRules';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';

export default function CompensationManagement() {
  const { 
    compensations, books, parents, users, loans,
    getCompensationsByStatus, getCompensationsByParent,
    processCompensation, updateDamageReason, createCompensation
  } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'paid' | 'waived'>('all');
  const [selectedCompensation, setSelectedCompensation] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [newDamageReason, setNewDamageReason] = useState('');
  const [processAction, setProcessAction] = useState<'paid' | 'waived'>('paid');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const filteredCompensations = (selectedStatus === 'all' 
    ? compensations 
    : getCompensationsByStatus(selectedStatus)
  ).filter(c => {
    const book = books.find(b => b.id === c.bookId);
    const parent = parents.find(p => p.id === c.parentId);
    const loan = loans.find(l => l.id === c.loanId);
    return book?.title.includes(searchQuery) || 
           parent?.name.includes(searchQuery) ||
           parent?.childName.includes(searchQuery) ||
           c.damageReason.includes(searchQuery);
  });

  const pendingCount = getCompensationsByStatus('pending').length;
  const totalAmount = compensations.filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  const handleEditDamageReason = (compensation: any) => {
    if (!canEditDamageReason(compensation)) {
      alert('已赔付的记录不能修改破损原因');
      return;
    }
    setSelectedCompensation(compensation);
    setNewDamageReason(compensation.damageReason);
    setShowEditModal(true);
  };

  const handleSaveDamageReason = () => {
    if (!selectedCompensation) return;
    const result = updateDamageReason(selectedCompensation.id, newDamageReason);
    if (result.success) {
      setShowEditModal(false);
      setSuccessMessage('破损原因已更新');
      setShowSuccess(true);
    } else {
      alert(result.message);
    }
  };

  const handleProcessCompensation = (compensation: any, action: 'paid' | 'waived') => {
    setSelectedCompensation(compensation);
    setProcessAction(action);
    setShowProcessModal(true);
  };

  const handleConfirmProcess = () => {
    if (!selectedCompensation) return;
    const result = processCompensation(selectedCompensation.id, processAction);
    if (result.success) {
      setShowProcessModal(false);
      setSuccessMessage(processAction === 'paid' ? '赔付已确认到账' : '赔付已免除');
      setShowSuccess(true);
    } else {
      alert(result.message);
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: '待处理',
      paid: '已赔付',
      waived: '已免除'
    };
    return map[status] || status;
  };

  return (
    <div>
      <PageHeader
        title="赔付管理"
        subtitle="处理破损绘本的赔付流程"
        icon={<Shield className="w-6 h-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">待处理</p>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">已赔付</p>
              <p className="text-2xl font-bold text-green-600">{getCompensationsByStatus('paid').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <X className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">已免除</p>
              <p className="text-2xl font-bold text-gray-600">{getCompensationsByStatus('waived').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">赔付总额</p>
              <p className="text-2xl font-bold">¥{totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索书名、家长姓名、破损原因..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'pending', 'paid', 'waived'] as const).map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={cn(
                  'px-4 py-2 rounded-xl font-medium transition-all',
                  selectedStatus === status
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {status === 'all' ? '全部' : getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">绘本信息</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">借阅人</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">破损原因</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">破损等级</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">赔付金额</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">状态</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">报告日期</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCompensations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">暂无赔付记录</p>
                  </td>
                </tr>
              ) : (
                filteredCompensations.map(compensation => {
                  const book = books.find(b => b.id === compensation.bookId);
                  const parent = parents.find(p => p.id === compensation.parentId);
                  const user = users.find(u => u.id === compensation.parentId);
                  const loan = loans.find(l => l.id === compensation.loanId);
                  const damageLevel = loan?.damageLevel || 'minor';
                  const canEdit = canEditDamageReason(compensation);
                  const estimatedAmount = computeCompensationAmount(book?.price || 0, damageLevel);

                  return (
                    <tr key={compensation.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={book?.coverUrl} alt="" className="w-12 h-16 object-cover rounded-lg" />
                          <div>
                            <p className="font-medium text-gray-800">{book?.title}</p>
                            <p className="text-xs text-gray-500">原价 ¥{book?.price.toFixed(2)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{parent?.name}</p>
                        <p className="text-xs text-gray-500">{parent?.childName}妈妈</p>
                        <p className="text-xs text-gray-400">{user?.phone}</p>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex items-start gap-2">
                          <p className="text-sm text-gray-700 line-clamp-2">{compensation.damageReason}</p>
                          {!canEdit && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              已锁定
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={
                          damageLevel === 'severe' ? 'danger' :
                          damageLevel === 'lost' ? 'warning' : 'info'
                        }>
                          {getDamageLevelText(damageLevel)}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-lg text-gray-800">¥{compensation.amount.toFixed(2)}</p>
                          {book && (
                            <p className="text-xs text-gray-500">
                              估算 ¥{estimatedAmount.toFixed(2)}
                              {damageLevel === 'minor' && ' (20%)'}
                              {damageLevel === 'severe' && ' (60%)'}
                              {damageLevel === 'lost' && ' (100%)'}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={
                          compensation.status === 'pending' ? 'warning' :
                          compensation.status === 'paid' ? 'paid' : 'waived'
                        }>
                          {getStatusLabel(compensation.status)}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(compensation.reportedDate)}
                        {compensation.paidDate && (
                          <p className="text-xs text-gray-400">
                            {compensation.status === 'paid' ? '赔付' : '免除'}：{formatDate(compensation.paidDate)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {compensation.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleEditDamageReason(compensation)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="编辑破损原因"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleProcessCompensation(compensation, 'paid')}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="确认赔付"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleProcessCompensation(compensation, 'waived')}
                                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                title="免除赔付"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {compensation.status !== 'pending' && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              已锁定
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="编辑破损原因"
      >
        {selectedCompensation && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-xl">
              <p className="text-sm text-amber-700">
                正在编辑《{books.find(b => b.id === selectedCompensation.bookId)?.title}》的破损原因
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">破损原因 *</label>
              <textarea
                rows={4}
                required
                value={newDamageReason}
                onChange={(e) => setNewDamageReason(e.target.value)}
                placeholder="请详细描述破损情况..."
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700 flex items-start gap-2">
                <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  赔付金额将根据破损等级自动计算：<br/>
                  轻微破损：原价 × 20% &nbsp;&nbsp;
                  严重破损：原价 × 60% &nbsp;&nbsp;
                  遗失：原价 × 100%
                </span>
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveDamageReason}
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                保存
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showProcessModal}
        onClose={() => setShowProcessModal(false)}
        title={processAction === 'paid' ? '确认赔付' : '免除赔付'}
      >
        {selectedCompensation && (
          <div className="space-y-4">
            <div className={cn(
              'p-4 rounded-xl',
              processAction === 'paid' ? 'bg-green-50' : 'bg-gray-50'
            )}>
              <p className={cn(
                'font-medium',
                processAction === 'paid' ? 'text-green-800' : 'text-gray-800'
              )}>
                {processAction === 'paid' 
                  ? `确认收到 ¥${selectedCompensation.amount.toFixed(2)} 赔付？`
                  : '确认免除该笔赔付？'
                }
              </p>
              <p className="text-sm text-gray-600 mt-2">
                绘本：《{books.find(b => b.id === selectedCompensation.bookId)?.title}》<br/>
                借阅人：{parents.find(p => p.id === selectedCompensation.parentId)?.name}（{parents.find(p => p.id === selectedCompensation.parentId)?.childName}妈妈）
              </p>
            </div>
            {processAction === 'paid' ? (
              <div className="p-4 bg-amber-50 rounded-xl">
                <p className="text-sm text-amber-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>确认赔付后，该记录将被锁定，破损原因将不能再修改。</span>
                </p>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-700">
                  免除赔付后，该记录将标记为"已免除"并锁定。
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowProcessModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmProcess}
                className={cn(
                  'px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-all',
                  processAction === 'paid'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'bg-gradient-to-r from-gray-500 to-slate-600 text-white'
                )}
              >
                {processAction === 'paid' ? '确认收到' : '确认免除'}
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
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-800 font-medium">{successMessage}</p>
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
