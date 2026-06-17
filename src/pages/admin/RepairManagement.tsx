import { useState } from 'react';
import { 
  Wrench, Search, AlertTriangle, CheckCircle, Clock, 
  Trash2, Plus, Hammer, Calendar, User, DollarSign, 
  BookOpen, Filter, TrendingDown, ShieldAlert, XCircle
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import type { RepairRecord, Book, Library } from '../../types';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: '待修补', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
  repairing: { label: '修补中', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Hammer },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
  scrapped: { label: '已报损', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: XCircle },
};

const damageConfig: Record<string, { label: string; color: string }> = {
  minor: { label: '轻微', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  moderate: { label: '中度', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  severe: { label: '严重', color: 'text-red-600 bg-red-50 border-red-200' },
  lost: { label: '丢失', color: 'text-gray-800 bg-gray-100 border-gray-300' },
};

export default function RepairManagement() {
  const {
    repairRecords, books, libraries,
    createRepairRecord, completeRepair, scrapBook
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showScrapModal, setShowScrapModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RepairRecord | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [createForm, setCreateForm] = useState({
    bookId: '',
    loanId: '',
    reportedBy: 'librarian',
    damageDescription: '',
    damageLevel: 'moderate' as const,
    libraryId: 'lib001'
  });

  const [completeForm, setCompleteForm] = useState({
    repairCost: 0,
    repairer: '',
    repairNotes: ''
  });

  const [scrapNotes, setScrapNotes] = useState('');

  const filteredRecords = repairRecords.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const book = books.find(b => b.id === r.bookId);
    return (
      book?.title.includes(searchQuery) ||
      book?.isbn.includes(searchQuery) ||
      r.damageDescription.includes(searchQuery)
    );
  }).sort((a, b) => new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime());

  const stats = {
    total: repairRecords.length,
    pending: repairRecords.filter(r => r.status === 'pending').length,
    repairing: repairRecords.filter(r => r.status === 'repairing').length,
    completed: repairRecords.filter(r => r.status === 'completed').length,
    totalCost: repairRecords
      .filter(r => r.status === 'completed' && r.repairCost)
      .reduce((sum, r) => sum + (r.repairCost || 0), 0)
  };

  const handleCreate = () => {
    if (!createForm.bookId || !createForm.damageDescription.trim()) {
      alert('请填写图书和破损描述');
      return;
    }
    createRepairRecord({
      ...createForm,
      status: 'pending',
      reportedDate: new Date().toISOString().slice(0, 10),
      loanId: createForm.loanId || undefined,
    });
    setSuccessMsg('破损记录已登记');
    setShowSuccess(true);
    setShowCreateModal(false);
    setCreateForm({
      bookId: '', loanId: '', reportedBy: 'librarian',
      damageDescription: '', damageLevel: 'moderate', libraryId: 'lib001'
    });
  };

  const handleComplete = () => {
    if (!selectedRecord || !completeForm.repairer.trim()) {
      alert('请填写修补人');
      return;
    }
    const result = completeRepair(
      selectedRecord.id,
      completeForm.repairCost,
      completeForm.repairer,
      completeForm.repairNotes
    );
    if (result.success) {
      setSuccessMsg(result.message);
      setShowSuccess(true);
      setShowCompleteModal(false);
      setCompleteForm({ repairCost: 0, repairer: '', repairNotes: '' });
      setSelectedRecord(null);
    } else {
      alert(result.message);
    }
  };

  const handleScrap = () => {
    if (!selectedRecord || !scrapNotes.trim()) {
      alert('请填写报损原因');
      return;
    }
    const result = scrapBook(selectedRecord.id, scrapNotes);
    if (result.success) {
      setSuccessMsg(result.message);
      setShowSuccess(true);
      setShowScrapModal(false);
      setScrapNotes('');
      setSelectedRecord(null);
    } else {
      alert(result.message);
    }
  };

  const getBook = (id: string): Book | undefined => books.find(b => b.id === id);
  const getLibrary = (id: string): Library | undefined => libraries.find(l => l.id === id);

  return (
    <div>
      <PageHeader
        title="修补记录管理"
        subtitle="绘本破损登记、修补进度追踪、报损处理"
        icon={<Wrench className="w-6 h-6" />}
        action={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            登记破损
          </button>
        }
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">总登记</span>
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-gray-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-red-600 font-medium">待修补</span>
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-red-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-amber-600 font-medium">修补中</span>
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Hammer className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-600">{stats.repairing}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-emerald-600 font-medium">已完成</span>
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-blue-600 font-medium">累计花费</span>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">¥{stats.totalCost}</p>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索书名、ISBN、破损描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="all">全部状态</option>
              <option value="pending">待修补</option>
              <option value="repairing">修补中</option>
              <option value="completed">已完成</option>
              <option value="scrapped">已报损</option>
            </select>
          </div>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-20">
              <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无修补记录</p>
            </div>
          ) : (
            filteredRecords.map(record => {
              const book = getBook(record.bookId);
              const lib = getLibrary(record.libraryId);
              const cfg = statusConfig[record.status];
              const dmg = damageConfig[record.damageLevel];
              const Icon = cfg.icon;

              return (
                <div key={record.id} className="p-6 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0 flex gap-4">
                      <div className="w-16 h-20 rounded-xl bg-gradient-to-br from-orange-100 to-rose-100 flex items-center justify-center text-3xl flex-shrink-0 shadow-sm">
                        📖
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 flex-wrap">
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-900 truncate">《{book?.title || '未知图书'}》</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              ISBN: {book?.isbn} · {lib?.name}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${cfg.color} flex-shrink-0`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${dmg.color} flex-shrink-0`}>
                            {dmg.label}破损
                          </span>
                        </div>
                        <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                          <p className="text-sm text-gray-700">
                            <span className="text-gray-400 text-xs block mb-1">破损描述</span>
                            {record.damageDescription}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            登记人：{record.reportedBy}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            登记日期：{record.reportedDate}
                          </span>
                          {record.repairer && (
                            <span className="flex items-center gap-1">
                              <Hammer className="w-3 h-3" />
                              修补人：{record.repairer}
                            </span>
                          )}
                          {record.completedDate && (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              完成日期：{record.completedDate}
                            </span>
                          )}
                          {record.repairCost != null && record.repairCost > 0 && (
                            <span className="flex items-center gap-1 text-blue-600 font-medium">
                              <DollarSign className="w-3 h-3" />
                              修补费用：¥{record.repairCost}
                            </span>
                          )}
                        </div>
                        {record.repairNotes && (
                          <p className="text-xs text-gray-500 mt-2 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
                            修补备注：{record.repairNotes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {record.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedRecord(record);
                              setShowCompleteModal(true);
                              setCompleteForm({ repairCost: 0, repairer: '', repairNotes: '' });
                            }}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            完成修补
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRecord(record);
                              setShowScrapModal(true);
                              setScrapNotes('');
                            }}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            报损处理
                          </button>
                        </>
                      )}
                      {record.status === 'repairing' && (
                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setShowCompleteModal(true);
                            setCompleteForm({
                              repairCost: record.repairCost || 0,
                              repairer: record.repairer || '',
                              repairNotes: record.repairNotes || ''
                            });
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-lg text-sm font-medium hover:shadow-md transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          修补完成
                        </button>
                      )}
                      {record.status === 'completed' && (
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 text-center">
                          图书已重新上架
                          <br />
                          <span className="text-[10px] opacity-70">库存已恢复可借</span>
                        </span>
                      )}
                      {record.status === 'scrapped' && (
                        <span className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-center">
                          已从馆藏中移除
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 新建破损登记弹窗 */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="登记图书破损"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所在分馆</label>
              <select
                value={createForm.libraryId}
                onChange={(e) => setCreateForm({ ...createForm, libraryId: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                {libraries.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">破损程度</label>
              <select
                value={createForm.damageLevel}
                onChange={(e) => setCreateForm({ ...createForm, damageLevel: e.target.value as any })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="minor">轻微（可擦除污渍、小折角）</option>
                <option value="moderate">中度（撕裂、脱页、污渍较多）</option>
                <option value="severe">严重（散页、大面积水渍、封面破损）</option>
                <option value="lost">丢失</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              图书
              <span className="text-gray-400 font-normal ml-2">
                （仅显示{getLibrary(createForm.libraryId)?.name}的在库图书）
              </span>
            </label>
            <select
              value={createForm.bookId}
              onChange={(e) => setCreateForm({ ...createForm, bookId: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="">请选择图书</option>
              {books
                .filter(b => b.libraryId === createForm.libraryId && b.status === 'available')
                .map(b => (
                  <option key={b.id} value={b.id}>
                    《{b.title}》 - {b.isbn} - {b.theme}
                  </option>
                ))
              }
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">破损详情描述</label>
            <textarea
              rows={3}
              value={createForm.damageDescription}
              onChange={(e) => setCreateForm({ ...createForm, damageDescription: e.target.value })}
              placeholder="请详细描述破损情况，如：第15-20页撕裂、封面大面积涂鸦、封底水渍等"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
            />
          </div>
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-medium mb-1">操作提示</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>登记破损后，图书将自动标记为 unavailable，不可被借阅</li>
                <li>完成修补后库存自动恢复；报损则从馆藏中永久移除</li>
                <li>如同时产生赔付，请前往「赔付管理」关联创建赔付单</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCreate}
              disabled={!createForm.bookId || !createForm.damageDescription.trim()}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              提交登记
            </button>
          </div>
        </div>
      </Modal>

      {/* 完成修补弹窗 */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="修补完成入库"
      >
        <div className="space-y-4">
          {selectedRecord && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="font-medium text-emerald-800">
                《{getBook(selectedRecord.bookId)?.title}》
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                完成修补后图书将恢复为可借状态
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">修补费用（元）</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={completeForm.repairCost}
                onChange={(e) => setCompleteForm({ ...completeForm, repairCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">修补人</label>
              <input
                type="text"
                value={completeForm.repairer}
                onChange={(e) => setCompleteForm({ ...completeForm, repairer: e.target.value })}
                placeholder="请输入修补人姓名"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">修补备注</label>
            <textarea
              rows={2}
              value={completeForm.repairNotes}
              onChange={(e) => setCompleteForm({ ...completeForm, repairNotes: e.target.value })}
              placeholder="修复方式、使用材料、注意事项等..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowCompleteModal(false)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleComplete}
              disabled={!completeForm.repairer.trim()}
              className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              确认入库
            </button>
          </div>
        </div>
      </Modal>

      {/* 报损弹窗 */}
      <Modal
        isOpen={showScrapModal}
        onClose={() => setShowScrapModal(false)}
        title="图书报损处理"
      >
        <div className="space-y-4">
          {selectedRecord && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="font-medium text-red-800 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                即将报损：《{getBook(selectedRecord.bookId)?.title}》
              </p>
              <p className="text-xs text-red-600 mt-2">
                报损后图书将从馆藏中永久移除，操作不可撤销。
                如需向读者索赔，请前往「赔付管理」创建赔付单。
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">报损原因 *</label>
            <textarea
              rows={3}
              value={scrapNotes}
              onChange={(e) => setScrapNotes(e.target.value)}
              placeholder="请详细描述报损原因，如：破损严重无法修复、已遗失无法找回、被读者严重损坏且已赔付等"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowScrapModal(false)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleScrap}
              disabled={!scrapNotes.trim()}
              className="px-6 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              确认报损
            </button>
          </div>
        </div>
      </Modal>

      {/* 成功提示 */}
      <Modal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="操作成功"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-gray-800 font-medium">{successMsg}</p>
          <button
            onClick={() => setShowSuccess(false)}
            className="mt-6 px-6 py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            确定
          </button>
        </div>
      </Modal>
    </div>
  );
}
