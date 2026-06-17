import { useState, useMemo } from 'react';
import { 
  Truck, Search, Package, ArrowRightLeft, MapPin,
  CheckCircle, Clock, XCircle, AlertTriangle, Send,
  Plus, ChevronDown, ChevronUp, BarChart3, Eye, ArrowLeft, ArrowRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { getThemeStockDiff } from '../../utils/businessRules';
import type { Book, Library, BookTransfer, ThemeStockDiff } from '../../types';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: '待审批', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  approved: { label: '已批准', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Eye },
  in_transit: { label: '运输中', color: 'bg-violet-100 text-violet-700 border-violet-200', icon: Truck },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: XCircle },
};

export default function TransferManagement() {
  const {
    books, libraries, transfers,
    createTransfer, approveTransfer, rejectTransfer,
    shipTransfer, receiveTransfer, cancelTransfer
  } = useAppStore();

  const [tab, setTab] = useState<'diff' | 'transfers'>('diff');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<BookTransfer | null>(null);
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState({
    bookId: '',
    fromLibraryId: '',
    toLibraryId: '',
    quantity: 1,
    reason: '',
    notes: ''
  });

  const themeStockDiff = useMemo(() => {
    return getThemeStockDiff(books, libraries);
  }, [books, libraries]);

  const filteredTransfers = transfers.filter(t => {
    if (!searchQuery) return true;
    const book = books.find(b => b.id === t.bookId);
    const from = libraries.find(l => l.id === t.fromLibraryId);
    const to = libraries.find(l => l.id === t.toLibraryId);
    return (
      book?.title.includes(searchQuery) ||
      book?.theme?.includes(searchQuery) ||
      from?.name.includes(searchQuery) ||
      to?.name.includes(searchQuery)
    );
  }).sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime());

  const handleCreateTransfer = () => {
    if (!form.bookId || !form.fromLibraryId || !form.toLibraryId || form.quantity <= 0) {
      alert('请填写完整的调拨信息');
      return;
    }
    if (form.fromLibraryId === form.toLibraryId) {
      alert('调入馆和调出馆不能相同');
      return;
    }
    const result = createTransfer({
      bookId: form.bookId,
      fromLibraryId: form.fromLibraryId,
      toLibraryId: form.toLibraryId,
      quantity: form.quantity,
      requestedBy: 'admin',
      reason: form.reason,
      notes: form.notes
    });
    if (result.success) {
      setSuccessMsg(result.message);
      setShowSuccess(true);
      setShowCreateModal(false);
      setForm({ bookId: '', fromLibraryId: '', toLibraryId: '', quantity: 1, reason: '', notes: '' });
    } else {
      alert(result.message);
    }
  };

  const handleApprove = (id: string) => {
    const r = approveTransfer(id);
    if (!r.success) return alert(r.message);
    setSuccessMsg(r.message);
    setShowSuccess(true);
  };

  const handleReject = () => {
    if (!selectedTransfer || !rejectReason.trim()) {
      alert('请填写驳回原因');
      return;
    }
    const r = rejectTransfer(selectedTransfer.id, rejectReason);
    if (!r.success) return alert(r.message);
    setSuccessMsg(r.message);
    setShowSuccess(true);
    setShowRejectModal(false);
    setRejectReason('');
    setSelectedTransfer(null);
  };

  const handleShip = (id: string) => {
    const r = shipTransfer(id);
    if (!r.success) return alert(r.message);
    setSuccessMsg(r.message);
    setShowSuccess(true);
  };

  const handleReceive = (id: string) => {
    const r = receiveTransfer(id);
    if (!r.success) return alert(r.message);
    setSuccessMsg(r.message);
    setShowSuccess(true);
  };

  const handleCancel = (id: string) => {
    if (!confirm('确定要取消这笔调拨吗？')) return;
    const r = cancelTransfer(id);
    if (!r.success) return alert(r.message);
    setSuccessMsg(r.message);
    setShowSuccess(true);
  };

  const getBook = (id: string): Book | undefined => books.find(b => b.id === id);
  const getLibrary = (id: string): Library | undefined => libraries.find(l => l.id === id);

  return (
    <div>
      <PageHeader
        title="跨馆调拨管理"
        subtitle="同主题库存差异监控、馆际调拨申请与审批"
        icon={<ArrowRightLeft className="w-6 h-6" />}
        action={
          tab === 'transfers' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              新建调拨
            </button>
          )
        }
      />

      {/* Tab切换 */}
      <div className="flex gap-2 mb-6 p-1.5 bg-gray-100 rounded-2xl w-fit">
        <button
          onClick={() => setTab('diff')}
          className={`px-5 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
            tab === 'diff' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          主题库存差异
        </button>
        <button
          onClick={() => setTab('transfers')}
          className={`px-5 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
            tab === 'transfers' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Truck className="w-4 h-4" />
          调拨记录
          {transfers.filter(t => t.status === 'pending').length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-red-500 text-white">
              {transfers.filter(t => t.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {tab === 'diff' && (
        <div className="space-y-4">
          {/* 主题库存差异卡片列表 */}
          {themeStockDiff.map(theme => {
            const isExpanded = expandedTheme === theme.theme;
            const maxCount = Math.max(...theme.libraryStocks.map(l => l.count), 1);
            const minCount = Math.min(...theme.libraryStocks.map(l => l.count));
            const hasImbalance = maxCount - minCount >= 2;
            const avgCount = Math.round(theme.totalStock / libraries.length);

            return (
              <div key={theme.theme} className={`bg-white rounded-2xl border-2 transition-all ${
                hasImbalance ? 'border-amber-200 shadow-sm' : 'border-gray-100'
              }`}>
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-lg text-gray-900">{theme.theme}</h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        hasImbalance 
                          ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        {hasImbalance ? (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            库存分布不均（建议调拨 {maxCount - avgCount} 册）
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            库存分布均衡
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                        总库存 {theme.totalStock} 册 · {libraries.length} 个馆
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      防止家庭将同主题多册图书一次借空，可将多余库存从高库存馆调拨至低库存馆
                    </p>
                  </div>
                  <button
                    onClick={() => setExpandedTheme(isExpanded ? null : theme.theme)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {theme.libraryStocks.map((lib, idx) => {
                        const percent = Math.round((lib.count / maxCount) * 100);
                        const isSurplus = lib.count > avgCount;
                        const isDeficit = lib.count < avgCount;
                        
                        return (
                          <div key={lib.libraryId} className={`p-4 rounded-xl border ${
                            isSurplus ? 'bg-emerald-50 border-emerald-100' : 
                            isDeficit ? 'bg-red-50 border-red-100' : 
                            'bg-gray-50 border-gray-100'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <MapPin className={`w-4 h-4 ${
                                  isSurplus ? 'text-emerald-600' : isDeficit ? 'text-red-600' : 'text-gray-500'
                                }`} />
                                <span className="font-medium text-gray-800">{lib.libraryName}</span>
                              </div>
                              {isSurplus && (
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                  多余 {lib.count - avgCount}
                                </span>
                              )}
                              {isDeficit && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                  缺少 {avgCount - lib.count}
                                </span>
                              )}
                            </div>
                            <div className="flex items-baseline gap-1 mb-3">
                              <span className="text-3xl font-bold text-gray-900">{lib.count}</span>
                              <span className="text-gray-400 text-sm">册 可借</span>
                            </div>
                            <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-100 mb-2">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  isSurplus ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                                  isDeficit ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                                  'bg-gradient-to-r from-gray-300 to-gray-400'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-500">
                              在架 {lib.available} / 馆藏 {lib.count}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {hasImbalance && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
                        <p className="text-sm font-medium text-indigo-800 mb-3 flex items-center gap-2">
                          <ArrowRightLeft className="w-4 h-4" />
                          一键创建调拨建议
                        </p>
                        <div className="space-y-2">
                          {theme.libraryStocks
                            .filter(l => l.count > avgCount)
                            .flatMap(surplusLib => {
                              const needLibs = theme.libraryStocks.filter(l => l.count < avgCount);
                              const sampleBook = books.find(b => 
                                b.theme === theme.theme && 
                                b.libraryId === surplusLib.libraryId &&
                                b.available > 0
                              );
                              return needLibs.map(needLib => {
                                const suggestQty = Math.min(
                                  surplusLib.count - avgCount,
                                  avgCount - needLib.count,
                                  sampleBook?.available || 1
                                );
                                if (suggestQty <= 0 || !sampleBook) return null;
                                return (
                                  <div key={`${surplusLib.libraryId}-${needLib.libraryId}`} 
                                    className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-100 flex-wrap">
                                    <Package className="w-5 h-5 text-gray-400" />
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="font-medium text-gray-700">{surplusLib.libraryName}</span>
                                      <ArrowRight className="w-4 h-4 text-indigo-500" />
                                      <span className="font-medium text-gray-700">{needLib.libraryName}</span>
                                    </div>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                      《{sampleBook.title}》 × {suggestQty}册
                                    </span>
                                    <button
                                      onClick={() => {
                                        setForm({
                                          bookId: sampleBook.id,
                                          fromLibraryId: surplusLib.libraryId,
                                          toLibraryId: needLib.libraryId,
                                          quantity: suggestQty,
                                          reason: `主题《${theme.theme}》库存均衡调拨`,
                                          notes: ''
                                        });
                                        setTab('transfers');
                                        setShowCreateModal(true);
                                      }}
                                      className="ml-auto px-3 py-1.5 bg-indigo-500 text-white text-xs font-medium rounded-lg hover:bg-indigo-600 transition-colors"
                                    >
                                      生成调拨
                                    </button>
                                  </div>
                                );
                              }).filter(Boolean);
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'transfers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索书名、主题、调入调出馆..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">调拨记录</h3>
              <div className="flex gap-2 text-xs">
                {Object.entries(statusConfig).map(([key, cfg]) => {
                  const count = transfers.filter(t => t.status === key).length;
                  return (
                    <span key={key} className={`px-2 py-1 rounded-full ${cfg.color} border`}>
                      {cfg.label} {count}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {filteredTransfers.length === 0 ? (
                <div className="text-center py-16">
                  <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">暂无调拨记录</p>
                </div>
              ) : (
                filteredTransfers.map(transfer => {
                  const book = getBook(transfer.bookId);
                  const from = getLibrary(transfer.fromLibraryId);
                  const to = getLibrary(transfer.toLibraryId);
                  const cfg = statusConfig[transfer.status];
                  const Icon = cfg.icon;
                  
                  return (
                    <div key={transfer.id} className="p-6 hover:bg-gray-50/60 transition-colors">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <div className="w-12 h-14 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-2xl flex-shrink-0">
                              📚
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-gray-800 truncate">
                                《{book?.title || '未知图书'}》 × {transfer.quantity}册
                              </h4>
                              <div className="flex items-center gap-2 text-sm mt-1 flex-wrap">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-600 flex items-center gap-1.5">
                                  <span className="font-medium">{from?.name}</span>
                                  <ArrowRight className="w-3 h-3 text-indigo-500" />
                                  <span className="font-medium">{to?.name}</span>
                                </span>
                              </div>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                              <Icon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 ml-15 pl-[60px]">
                            <span>申请日期：{transfer.requestedDate}</span>
                            {transfer.approvedDate && <span>批准日期：{transfer.approvedDate}</span>}
                            {transfer.shippedDate && <span>发货日期：{transfer.shippedDate}</span>}
                            {transfer.receivedDate && <span>签收日期：{transfer.receivedDate}</span>}
                          </div>
                          {transfer.reason && (
                            <p className="text-xs text-gray-500 mt-2 pl-[60px] bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
                              原因：{transfer.reason}
                            </p>
                          )}
                          {transfer.notes && (
                            <p className="text-xs text-red-600 mt-1 pl-[60px]">
                              备注：{transfer.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {transfer.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(transfer.id)}
                                className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                              >
                                批准
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTransfer(transfer);
                                  setShowRejectModal(true);
                                }}
                                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                              >
                                驳回
                              </button>
                              <button
                                onClick={() => handleCancel(transfer.id)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                              >
                                取消
                              </button>
                            </>
                          )}
                          {transfer.status === 'approved' && (
                            <>
                              <button
                                onClick={() => handleShip(transfer.id)}
                                className="px-3 py-1.5 bg-violet-500 text-white rounded-lg text-sm font-medium hover:bg-violet-600 transition-colors flex items-center gap-1"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                发货
                              </button>
                              <button
                                onClick={() => handleCancel(transfer.id)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                              >
                                取消
                              </button>
                            </>
                          )}
                          {transfer.status === 'in_transit' && (
                            <button
                              onClick={() => handleReceive(transfer.id)}
                              className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg text-sm font-medium hover:shadow-md transition-all flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              签收入库
                            </button>
                          )}
                          {transfer.status === 'completed' && (
                            <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                              调拨完成，库存已更新
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
        </div>
      )}

      {/* 新建调拨弹窗 */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建调拨申请"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">调出馆</label>
              <select
                value={form.fromLibraryId}
                onChange={(e) => setForm({ ...form, fromLibraryId: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">请选择调出馆</option>
                {libraries.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">调入馆</label>
              <select
                value={form.toLibraryId}
                onChange={(e) => setForm({ ...form, toLibraryId: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">请选择调入馆</option>
                {libraries.filter(l => l.id !== form.fromLibraryId).map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              图书
              {form.fromLibraryId && (
                <span className="text-gray-400 font-normal ml-2">
                  （仅显示{getLibrary(form.fromLibraryId)?.name}的库存）
                </span>
              )}
            </label>
            <select
              value={form.bookId}
              onChange={(e) => setForm({ ...form, bookId: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">请选择图书</option>
              {form.fromLibraryId
                ? books
                    .filter(b => b.libraryId === form.fromLibraryId && b.available > 0)
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        《{b.title}》 - {b.theme} - 可借{b.available}册 - ¥{b.price}
                      </option>
                    ))
                : books.map(b => (
                  <option key={b.id} value={b.id}>
                    《{b.title}》({getLibrary(b.libraryId)?.name}) - 可借{b.available}册
                  </option>
                ))
              }
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">调拨数量</label>
            <input
              type="number"
              min={1}
              max={form.bookId ? getBook(form.bookId)?.available || 99 : 99}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {form.bookId && (
              <p className="text-xs text-gray-500 mt-1">
                当前可借：{getBook(form.bookId)?.available || 0} 册
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">调拨原因</label>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="如：主题库存均衡调拨、读者预约等"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="其他补充说明..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCreateTransfer}
              disabled={!form.bookId || !form.fromLibraryId || !form.toLibraryId}
              className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              提交申请
            </button>
          </div>
        </div>
      </Modal>

      {/* 驳回原因弹窗 */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="驳回调拨申请"
      >
        <div className="space-y-4">
          {selectedTransfer && (
            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
              <p>驳回《{getBook(selectedTransfer.bookId)?.title}》的调拨申请</p>
              <p className="mt-1">
                {getLibrary(selectedTransfer.fromLibraryId)?.name} → {getLibrary(selectedTransfer.toLibraryId)?.name}，
                {selectedTransfer.quantity}册
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">驳回原因</label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请填写驳回原因..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowRejectModal(false)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleReject}
              disabled={!rejectReason.trim()}
              className="px-6 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              确认驳回
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
            className="mt-6 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            确定
          </button>
        </div>
      </Modal>
    </div>
  );
}
