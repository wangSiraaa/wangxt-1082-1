import { useState } from 'react';
import { BookOpen, Clock, AlertCircle, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { getStatusText, canRenewLoan, computeOverdueFine } from '@/utils/businessRules';
import { formatDate, getOverdueDays } from '@/utils/date';
import { cn } from '@/lib/utils';

export default function MyLoans() {
  const { 
    loans, books, currentParent, settings, 
    renewLoan, getLoansByParent, getCompensationsByParent 
  } = useAppStore();
  
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [showRenewSuccess, setShowRenewSuccess] = useState(false);
  const [damageModal, setDamageModal] = useState<{ loanId: string; bookTitle: string } | null>(null);
  const [damageDescription, setDamageDescription] = useState('');

  const parentLoans = currentParent ? getLoansByParent(currentParent.id) : [];
  const pendingCompensations = currentParent 
    ? getCompensationsByParent(currentParent.id).filter(c => c.status === 'pending')
    : [];

  const activeLoans = parentLoans.filter(l => l.status !== 'returned');
  const historyLoans = parentLoans.filter(l => l.status === 'returned');

  const handleRenew = (loanId: string) => {
    const result = renewLoan(loanId);
    if (result.success) {
      setShowRenewSuccess(true);
      setSelectedLoan(null);
    } else {
      alert(result.message);
    }
  };

  const handleReportDamage = () => {
    if (!damageModal) return;
    const loan = loans.find(l => l.id === damageModal.loanId);
    if (loan && !loan.hasDamage) {
      alert('破损报告已提交，请在管理员页面处理赔付');
    }
    setDamageModal(null);
    setDamageDescription('');
  };

  return (
    <div>
      <PageHeader
        title="我的借阅"
        subtitle="查看您的借阅记录和续借操作"
        icon={<BookOpen className="w-6 h-6" />}
      />

      {pendingCompensations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">您有 {pendingCompensations.length} 笔待处理的赔付</p>
            <p className="text-sm text-amber-600 mt-1">请及时联系管理员处理</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">借阅中</p>
              <p className="text-2xl font-bold text-gray-800">{activeLoans.length}</p>
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
              <p className="text-2xl font-bold text-red-600">
                {activeLoans.filter(l => l.isOverdue).length}
              </p>
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
              <p className="text-2xl font-bold text-gray-800">{historyLoans.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">借阅中的绘本</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {activeLoans.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无借阅中的绘本</p>
            </div>
          ) : (
            activeLoans.map(loan => {
              const book = books.find(b => b.id === loan.bookId);
              const overdueDays = loan.isOverdue ? getOverdueDays(loan.dueDate) : 0;
              const overdueFine = computeOverdueFine(loan, settings);
              const canRenew = canRenewLoan(loan, settings);

              return (
                <div key={loan.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <img src={book?.coverUrl} alt="" className="w-20 h-28 object-cover rounded-lg shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-gray-800 text-lg">{book?.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{book?.author}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            <StatusBadge status={
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
                          <div className="flex gap-2">
                            {!loan.isOverdue && !loan.hasDamage && (
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
                                {canRenew ? '续借' : '无法续借'}
                              </button>
                            )}
                            {!loan.hasDamage && (
                              <button
                                onClick={() => setDamageModal({ loanId: loan.id, bookTitle: book?.title || '' })}
                                className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-all"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                报告破损
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-500">借阅日期：{formatDate(loan.loanDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className={cn('text-gray-500', loan.isOverdue && 'text-red-600 font-medium')}>
                            应还日期：{formatDate(loan.dueDate)}
                          </span>
                        </div>
                        {loan.isOverdue && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-red-600 font-medium">
                              逾期 {overdueDays} 天，罚款 ¥{overdueFine.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">历史借阅记录</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {historyLoans.length === 0 ? (
            <div className="text-center py-12">
              <Check className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无历史借阅记录</p>
            </div>
          ) : (
            historyLoans.map(loan => {
              const book = books.find(b => b.id === loan.bookId);
              return (
                <div key={loan.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <img src={book?.coverUrl} alt="" className="w-14 h-20 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{book?.title}</h4>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-1">
                        <span>借阅：{formatDate(loan.loanDate)}</span>
                        <span>归还：{formatDate(loan.returnDate!)}</span>
                        {loan.hasDamage && <span className="text-amber-600">有破损</span>}
                      </div>
                    </div>
                    <StatusBadge status="success">已归还</StatusBadge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Modal
        isOpen={showRenewSuccess}
        onClose={() => setShowRenewSuccess(false)}
        title="续借成功"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-800 font-medium">续借成功！</p>
          <p className="text-gray-500 mt-2">您的借阅期限已延长</p>
          <button
            onClick={() => setShowRenewSuccess(false)}
            className="mt-6 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            确定
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!damageModal}
        onClose={() => setDamageModal(null)}
        title="报告绘本破损"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            请描述《{damageModal?.bookTitle}》的破损情况
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">破损描述</label>
            <textarea
              rows={4}
              value={damageDescription}
              onChange={(e) => setDamageDescription(e.target.value)}
              placeholder="请详细描述破损情况..."
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>
          <div className="p-4 bg-amber-50 rounded-xl">
            <p className="text-sm text-amber-700">
              ⚠️ 提交后将进入赔付流程，请您如实描述破损情况。管理员会根据破损程度确定赔付金额。
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setDamageModal(null)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleReportDamage}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              提交报告
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
