import { useState } from 'react';
import { Users, Plus, Camera, Clock, BookOpen, Check } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { formatDate, today } from '@/utils/date';

export default function Checkins() {
  const { 
    books, loans, currentParent, addCheckin, 
    getLoansByParent, getCheckinsByParent, getCheckinsByLoan 
  } = useAppStore();
  
  const [showModal, setShowModal] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [checkinDate, setCheckinDate] = useState(today());
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const parentLoans = currentParent ? getLoansByParent(currentParent.id) : [];
  const activeLoans = parentLoans.filter(l => l.status !== 'returned');
  const allCheckins = currentParent ? getCheckinsByParent(currentParent.id) : [];

  const totalMinutes = allCheckins.reduce((sum, c) => sum + c.durationMinutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = new Set(allCheckins.map(c => c.checkinDate)).size;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentParent || !selectedLoanId) return;

    const loan = loans.find(l => l.id === selectedLoanId);
    if (!loan) return;

    addCheckin({
      loanId: selectedLoanId,
      parentId: currentParent.id,
      bookId: loan.bookId,
      checkinDate,
      durationMinutes,
      notes,
      photoUrl: photoUrl || `https://picsum.photos/seed/ck${Date.now()}/400/300`,
    });

    setShowModal(false);
    setShowSuccess(true);
    resetForm();
  };

  const resetForm = () => {
    setSelectedLoanId('');
    setCheckinDate(today());
    setDurationMinutes(20);
    setNotes('');
    setPhotoUrl('');
  };

  return (
    <div>
      <PageHeader
        title="共读打卡"
        subtitle="记录您和孩子的共读时光"
        icon={<Users className="w-6 h-6" />}
        action={
          <button
            onClick={() => setShowModal(true)}
            disabled={activeLoans.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            打卡
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">累计打卡</p>
              <p className="text-2xl font-bold">{allCheckins.length} 次</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">共读时长</p>
              <p className="text-2xl font-bold">{totalHours > 0 ? `${totalHours}小时` : ''}{totalMinutes % 60}分钟</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">共读天数</p>
              <p className="text-2xl font-bold">{totalDays} 天</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {activeLoans.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">正在阅读的绘本</h3>
              <p className="text-sm text-gray-500 mt-1">点击"打卡"记录今天的共读时光</p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeLoans.map(loan => {
                const book = books.find(b => b.id === loan.bookId);
                const checkins = getCheckinsByLoan(loan.id);
                return (
                  <div key={loan.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                    <img src={book?.coverUrl} alt="" className="w-16 h-24 object-cover rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 truncate">{book?.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">已打卡 {checkins.length} 次</p>
                      <button
                        onClick={() => {
                          setSelectedLoanId(loan.id);
                          setShowModal(true);
                        }}
                        className="mt-3 w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all"
                      >
                        打卡
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">打卡记录</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {allCheckins.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">暂无打卡记录</p>
                <p className="text-sm text-gray-400 mt-1">开始记录您和孩子的共读时光吧</p>
              </div>
            ) : (
              [...allCheckins]
                .sort((a, b) => new Date(b.checkinDate).getTime() - new Date(a.checkinDate).getTime())
                .map(checkin => {
                  const book = books.find(b => b.id === checkin.bookId);
                  return (
                    <div key={checkin.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex gap-4">
                        {checkin.photoUrl && (
                          <img 
                            src={checkin.photoUrl} 
                            alt=""
                            className="w-24 h-24 object-cover rounded-xl shadow-sm"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="font-medium text-gray-800">{book?.title}</h4>
                              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatDate(checkin.checkinDate)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {checkin.durationMinutes} 分钟
                                </span>
                              </div>
                            </div>
                            <StatusBadge status="success">
                              <Check className="w-3 h-3 mr-1" />
                              已打卡
                            </StatusBadge>
                          </div>
                          {checkin.notes && (
                            <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                              {checkin.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="记录共读打卡"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择绘本 *</label>
            <select
              required
              value={selectedLoanId}
              onChange={(e) => setSelectedLoanId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">请选择正在阅读的绘本</option>
              {activeLoans.map(loan => {
                const book = books.find(b => b.id === loan.bookId);
                return (
                  <option key={loan.id} value={loan.id}>
                    《{book?.title}》
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">打卡日期 *</label>
            <input
              type="date"
              required
              value={checkinDate}
              onChange={(e) => setCheckinDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">共读时长 (分钟) *</label>
            <input
              type="number"
              required
              min="1"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">共读照片URL</label>
            <div className="relative">
              <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="可选，留空将自动生成"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">共读心得</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="记录今天的共读感悟..."
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              完成打卡
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="打卡成功"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-800 font-medium text-lg">太棒了！</p>
          <p className="text-gray-500 mt-2">您已成功记录今天的共读时光</p>
          <p className="text-sm text-indigo-600 mt-2">坚持阅读，陪伴成长 💝</p>
          <button
            onClick={() => setShowSuccess(false)}
            className="mt-6 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            继续加油
          </button>
        </div>
      </Modal>
    </div>
  );
}
