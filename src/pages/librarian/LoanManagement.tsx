import { useState } from 'react';
import { Users, Search, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { getStatusText, canRenewLoan } from '@/utils/businessRules';
import { formatDate, getOverdueDays } from '@/utils/date';
import { cn } from '@/lib/utils';

export default function LoanManagement() {
  const { 
    loans, parents, books, 
    returnLoan, renewLoan, createLoan,
    getOverdueLoans, selectedParentId, setSelectedParentId 
  } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'borrowing' | 'overdue' | 'returned'>('all');
  const [returnModal, setReturnModal] = useState<{ loanId: string; bookTitle: string } | null>(null);
  const [hasDamage, setHasDamage] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [borrowModal, setBorrowModal] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');

  const filteredLoans = loans.filter(loan => {
    const parent = parents.find(p => p.id === loan.parentId);
    const book = books.find(b => b.id === loan.bookId);
    const matchesSearch = parent?.name.includes(searchQuery) || 
                          parent?.childName.includes(searchQuery) ||
                          book?.title.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime());

  const handleReturn = (loanId: string) => {
    returnLoan(loanId, hasDamage, damageDescription);
    setReturnModal(null);
    setHasDamage(false);
    setDamageDescription('');
  };

  const handleRenew = (loanId: string) => {
    const result = renewLoan(loanId);
    if (!result.success) {
      alert(result.message);
    }
  };

  const handleBorrow = () => {
    if (!selectedParentId || !selectedBookId) {
      alert('请选择家长和绘本');
      return;
    }
    const result = createLoan(selectedBookId, selectedParentId);
    if (!result.success) {
      alert(result.message);
      return;
    }
    setBorrowModal(false);
    setSelectedBookId('');
  };

  const availableBooks = books.filter(b => b.available > 0 && b.status === 'available');

  const overdueCount = getOverdueLoans().length;
  const borrowingCount = loans.filter(l => l.status !== 'returned').length;
  const returnedCount = loans.filter(l => l.status === 'returned').length;

  return (
    <div>
      <PageHeader
        title="借阅管理"
        subtitle="处理借阅、续借、归还等操作"
        icon={<Users className="w-6 h-6" />}
        action={
          <button
            onClick={() => setBorrowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all"
          >
            <Users className="w-4 h-4" />
            新建借阅
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">借阅中</p>
              <p className="text-2xl font-bold text-gray-800">{borrowingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">已逾期</p>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">已归还</p>
              <p className="text-2xl font-bold text-gray-800">{returnedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索家长姓名、孩子姓名、绘本名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {[
              { value: 'all', label: '全部' },
              { value: 'borrowing', label: '借阅中' },
              { value: 'overdue', label: '逾期' },
              { value: 'returned', label: '已归还' },
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value as any)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  statusFilter === filter.value
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">绘本</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">家长</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">借阅日期</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">应还日期</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLoans.map(loan => {
                const book = books.find(b => b.id === loan.bookId);
                const parent = parents.find(p => p.id === loan.parentId);
                const overdueDays = loan.isOverdue ? getOverdueDays(loan.dueDate) : 0;
                const canRenew = canRenewLoan(loan, useAppStore.getState().settings);

                return (
                  <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={book?.coverUrl} alt="" className="w-12 h-16 object-cover rounded-lg" />
                        <div>
                          <p className="font-medium text-gray-800">{book?.title}</p>
                          <p className="text-sm text-gray-500">{book?.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{parent?.name}</p>
                        <p className="text-sm text-gray-500">{parent?.childName} ({parent?.childAge}岁)</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(loan.loanDate)}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className={cn(loan.isOverdue && 'text-red-600 font-medium')}>
                          {formatDate(loan.dueDate)}
                        </p>
                        {loan.isOverdue && (
                          <p className="text-xs text-red-500">逾期 {overdueDays} 天</p>
                        )}
                        {loan.returnDate && (
                          <p className="text-sm text-gray-500">实际归还: {formatDate(loan.returnDate)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <StatusBadge status={
                          loan.status === 'returned' ? 'success' :
                          loan.isOverdue ? 'danger' :
                          loan.status === 'renewed' ? 'info' : 'warning'
                        }>
                          {getStatusText(loan.status)}
                          {loan.renewCount > 0 && ` (已续${loan.renewCount}次)`}
                        </StatusBadge>
                        {loan.hasDamage && (
                          <StatusBadge status="warning">有破损</StatusBadge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {loan.status !== 'returned' && (
                          <>
                            <button
                              onClick={() => handleRenew(loan.id)}
                              disabled={!canRenew}
                              className={cn(
                                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                                canRenew
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              )}
                            >
                              <RotateCcw className="w-3 h-3" />
                              续借
                            </button>
                            <button
                              onClick={() => setReturnModal({ loanId: loan.id, bookTitle: book?.title || '' })}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-all"
                            >
                              <Check className="w-3 h-3" />
                              归还
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredLoans.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无借阅记录</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!returnModal}
        onClose={() => setReturnModal(null)}
        title="归还绘本"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            确认归还 <span className="font-medium text-gray-800">《{returnModal?.bookTitle}》</span>
          </p>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              id="hasDamage"
              checked={hasDamage}
              onChange={(e) => setHasDamage(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="hasDamage" className="text-sm font-medium text-gray-700">
              归还时发现破损
            </label>
          </div>
          {hasDamage && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">破损描述</label>
              <textarea
                rows={3}
                value={damageDescription}
                onChange={(e) => setDamageDescription(e.target.value)}
                placeholder="请描述破损情况..."
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
              <p className="mt-2 text-sm text-amber-600">
                ⚠️ 有破损的绘本将自动进入赔付流程
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setReturnModal(null)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => returnModal && handleReturn(returnModal.loanId)}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              确认归还
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={borrowModal}
        onClose={() => setBorrowModal(false)}
        title="新建借阅"
        className="max-w-xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择家长 *</label>
            <select
              value={selectedParentId || ''}
              onChange={(e) => setSelectedParentId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">请选择家长</option>
              {parents.map(parent => (
                <option key={parent.id} value={parent.id}>
                  {parent.name} - {parent.childName}({parent.childAge}岁)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择绘本 *</label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">请选择绘本</option>
              {availableBooks.map(book => (
                <option key={book.id} value={book.id}>
                  《{book.title}》 - {book.author} (可借 {book.available} 本)
                </option>
              ))}
            </select>
          </div>
          {selectedParentId && (
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700">
                💡 提示：如果家长有逾期未还的绘本，将无法借阅新书
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setBorrowModal(false)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleBorrow}
              className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              确认借阅
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
