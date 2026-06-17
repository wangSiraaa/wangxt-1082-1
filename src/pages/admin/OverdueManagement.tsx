import { useState } from 'react';
import { AlertTriangle, Clock, Search, Mail, Phone, DollarSign, Send } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { getStatusText, computeOverdueFine } from '@/utils/businessRules';
import { formatDate, getOverdueDays, addDays } from '@/utils/date';

export default function OverdueManagement() {
  const { loans, books, parents, users, settings, returnLoan, updateLoan } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
    return sum + computeOverdueFine(loan, settings);
  }, 0);

  const handleReturn = (loanId: string) => {
    const result = returnLoan(loanId, false, '');
    if (result.success) {
      setSuccessMessage('归还成功！逾期罚款已计入账户');
      setShowSuccess(true);
    } else {
      alert(result.message);
    }
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

  const handleExtendDueDate = (loan: any) => {
    const newDueDate = addDays(loan.dueDate, 7);
    updateLoan(loan.id, { dueDate: newDueDate, isOverdue: false });
    setSuccessMessage('已延长借阅期限7天');
    setShowSuccess(true);
  };

  return (
    <div>
      <PageHeader
        title="逾期处理"
        subtitle="管理逾期借阅，发送提醒，处理归还"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">累计罚款</p>
              <p className="text-2xl font-bold">¥{totalOverdueAmount.toFixed(2)}</p>
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
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">逾期借阅列表</h3>
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
              const user = users.find(u => u.id === loan.parentId);
              const overdueDays = getOverdueDays(loan.dueDate);
              const overdueFine = computeOverdueFine(loan, settings);

              return (
                <div key={loan.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <img src={book?.coverUrl} alt="" className="w-16 h-24 object-cover rounded-lg shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-gray-800">{book?.title}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <StatusBadge status="danger">
                              逾期 {overdueDays} 天
                            </StatusBadge>
                            <span className="text-sm text-red-600 font-medium">
                              罚款 ¥{overdueFine.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
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
                            onClick={() => handleExtendDueDate(loan)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-all"
                          >
                            <Clock className="w-3 h-3" />
                            延期7天
                          </button>
                          <button
                            onClick={() => handleReturn(loan.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-all"
                          >
                            确认归还
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">借阅人：</span>
                          <span className="text-gray-800 font-medium">{parent?.name}（{parent?.childName}妈妈）</span>
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
                      <div className="mt-2 flex flex-wrap gap-6 text-sm">
                        <span className="text-gray-500">借阅日期：{formatDate(loan.loanDate)}</span>
                        <span className="text-gray-500">应还日期：{formatDate(loan.dueDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

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
                已逾期 {getOverdueDays(selectedLoan.dueDate)} 天，罚款 ¥{computeOverdueFine(selectedLoan, settings).toFixed(2)}
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
            <Send className="w-8 h-8 text-green-600" />
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
