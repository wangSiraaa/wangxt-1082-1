import { useState } from 'react';
import { BookOpen, Search, Filter, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import PageHeader from '@/components/PageHeader';
import BookCard from '@/components/BookCard';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { cn } from '@/lib/utils';
import { canParentBorrow } from '@/utils/businessRules';

const categories = ['全部', '情感启蒙', '认知启蒙', '亲情关系', '生活智慧', '国学启蒙', '英语启蒙', '科普百科', '科普探险', '生活故事'];
const ageRanges = ['全部', '0-2岁', '2-4岁', '3-6岁', '4-8岁', '5-12岁'];

export default function BookBrowse() {
  const { books, loans, currentParent, createLoan, getCompensationsByParent } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedAge, setSelectedAge] = useState('全部');
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const canBorrow = currentParent ? canParentBorrow(currentParent.id, loans) : false;
  const pendingCompensations = currentParent 
    ? getCompensationsByParent(currentParent.id).filter(c => c.status === 'pending')
    : [];

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.includes(searchQuery) || book.author.includes(searchQuery);
    const matchesCategory = selectedCategory === '全部' || book.category === selectedCategory;
    const matchesAge = selectedAge === '全部' || book.ageRange.includes(selectedAge.replace('岁', ''));
    return matchesSearch && matchesCategory && matchesAge;
  });

  const handleBorrow = (book: any) => {
    if (!currentParent) return;
    
    const result = createLoan(book.id, currentParent.id);
    if (!result.success) {
      setAlertMessage(result.message);
      setShowAlert(true);
    } else {
      setSelectedBook(null);
    }
  };

  const handleViewDetail = (book: any) => {
    setSelectedBook(book);
  };

  return (
    <div>
      <PageHeader
        title="绘本浏览"
        subtitle={currentParent ? `欢迎，${currentParent.name}（${currentParent.childName}妈妈）` : '浏览绘本馆的精彩绘本'}
        icon={<BookOpen className="w-6 h-6" />}
      />

      {pendingCompensations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">您有 {pendingCompensations.length} 笔待处理的赔付</p>
            <p className="text-sm text-amber-600 mt-1">请及时处理，以免影响您的借阅权限</p>
          </div>
        </div>
      )}

      {!canBorrow && currentParent && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">借阅权限暂时受限</p>
            <p className="text-sm text-red-600 mt-1">您有逾期未还的绘本，请先归还后再借阅新书</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索书名、作者..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">分类:</span>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-sm font-medium transition-all',
                      selectedCategory === cat
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">年龄:</span>
              <div className="flex flex-wrap gap-2">
                {ageRanges.map(age => (
                  <button
                    key={age}
                    onClick={() => setSelectedAge(age)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-sm font-medium transition-all',
                      selectedAge === age
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBooks.map(book => (
          <BookCard
            key={book.id}
            book={book}
            onBorrow={() => handleBorrow(book)}
            onView={() => handleViewDetail(book)}
            disabled={!canBorrow}
            disabledMessage={!canBorrow ? '有逾期' : ''}
          />
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无符合条件的绘本</p>
        </div>
      )}

      <Modal
        isOpen={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        title={selectedBook?.title || ''}
        className="max-w-2xl"
      >
        {selectedBook && (
          <div className="space-y-4">
            <div className="flex gap-6">
              <img 
                src={selectedBook.coverUrl} 
                alt=""
                className="w-40 h-56 object-cover rounded-xl shadow-lg"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedBook.available > 0 ? 'success' : 'danger'}>
                    {selectedBook.available > 0 ? `可借 ${selectedBook.available} 本` : '已借出'}
                  </StatusBadge>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">
                    {selectedBook.category}
                  </span>
                  <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-lg">
                    {selectedBook.ageRange}
                  </span>
                </div>
                <p className="text-sm text-gray-600">作者：{selectedBook.author}</p>
                <p className="text-sm text-gray-600">出版社：{selectedBook.publisher}</p>
                <p className="text-sm text-gray-600">出版日期：{selectedBook.publishDate}</p>
                <p className="text-sm text-gray-600">馆藏位置：{selectedBook.location}</p>
                <p className="text-lg font-bold text-indigo-600">¥{selectedBook.price.toFixed(2)}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">内容简介</h4>
              <p className="text-gray-600 text-sm leading-relaxed">{selectedBook.description}</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setSelectedBook(null)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
              <button
                onClick={() => handleBorrow(selectedBook)}
                disabled={!canBorrow || selectedBook.available <= 0}
                className={cn(
                  'px-6 py-2 rounded-xl font-medium transition-all',
                  canBorrow && selectedBook.available > 0
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-200'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                {!canBorrow ? '有逾期，暂不能借' : selectedBook.available <= 0 ? '暂无库存' : '立即借阅'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title="提示"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <p className="text-amber-800">{alertMessage}</p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setShowAlert(false)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              知道了
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
