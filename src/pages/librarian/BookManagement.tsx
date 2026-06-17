import { useState } from 'react';
import { BookOpen, Plus, Search, Edit, Trash2, Filter } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import PageHeader from '@/components/PageHeader';
import BookCard from '@/components/BookCard';
import Modal from '@/components/Modal';
import { cn } from '@/lib/utils';
import { today } from '@/utils/date';

const categories = ['全部', '情感启蒙', '认知启蒙', '亲情关系', '生活智慧', '国学启蒙', '英语启蒙', '科普百科', '科普探险', '生活故事'];

export default function BookManagement() {
  const { books, addBook, updateBook, deleteBook } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    publisher: '',
    publishDate: today(),
    isbn: '',
    category: '情感启蒙',
    ageRange: '2-6岁',
    price: 0,
    stock: 1,
    available: 1,
    coverUrl: 'https://picsum.photos/seed/newbook/300/400',
    description: '',
    status: 'available' as const,
    location: 'A区-01架',
    libraryId: 'lib001',
  });

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.includes(searchQuery) || book.author.includes(searchQuery) || book.isbn?.includes(searchQuery);
    const matchesCategory = selectedCategory === '全部' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBook) {
      updateBook(editingBook.id, formData);
    } else {
      addBook(formData);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (book: any) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      publishDate: book.publishDate,
      isbn: book.isbn || '',
      category: book.category,
      ageRange: book.ageRange,
      price: book.price,
      stock: book.stock,
      available: book.available,
      coverUrl: book.coverUrl,
      description: book.description,
      status: book.status,
      location: book.location,
      libraryId: book.libraryId,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这本绘本吗？')) {
      deleteBook(id);
    }
  };

  const resetForm = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      publisher: '',
      publishDate: today(),
      isbn: '',
      category: '情感启蒙',
      ageRange: '2-6岁',
      price: 0,
      stock: 1,
      available: 1,
      coverUrl: 'https://picsum.photos/seed/newbook/300/400',
      description: '',
      status: 'available',
      location: 'A区-01架',
      libraryId: 'lib001',
    });
  };

  return (
    <div>
      <PageHeader
        title="绘本管理"
        subtitle="管理绘本馆的所有绘本资源"
        icon={<BookOpen className="w-6 h-6" />}
        action={
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            添加绘本
          </button>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索书名、作者、ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
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
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBooks.map(book => (
          <div key={book.id} className="relative">
            <BookCard book={book} showBorrowButton={false} />
            <div className="absolute top-3 right-3 flex gap-1">
              <button
                onClick={() => handleEdit(book)}
                className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-sm transition-all"
              >
                <Edit className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => handleDelete(book.id)}
                className="p-2 bg-white/90 hover:bg-red-50 rounded-lg shadow-sm transition-all"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无符合条件的绘本</p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBook ? '编辑绘本' : '添加绘本'}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">书名 *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">作者 *</label>
              <input
                type="text"
                required
                value={formData.author}
                onChange={(e) => setFormData({...formData, author: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">出版社 *</label>
              <input
                type="text"
                required
                value={formData.publisher}
                onChange={(e) => setFormData({...formData, publisher: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">出版日期</label>
              <input
                type="date"
                value={formData.publishDate}
                onChange={(e) => setFormData({...formData, publishDate: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
              <input
                type="text"
                value={formData.isbn}
                onChange={(e) => setFormData({...formData, isbn: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {categories.filter(c => c !== '全部').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">适合年龄 *</label>
              <input
                type="text"
                required
                placeholder="如：2-6岁"
                value={formData.ageRange}
                onChange={(e) => setFormData({...formData, ageRange: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">定价 (元) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">库存总数 *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 1})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">可借数量 *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.available}
                onChange={(e) => setFormData({...formData, available: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">馆藏位置</label>
              <input
                type="text"
                placeholder="如：A区-01架"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="available">正常</option>
                <option value="damaged">破损</option>
                <option value="lost">遗失</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">封面图片URL</label>
              <input
                type="url"
                value={formData.coverUrl}
                onChange={(e) => setFormData({...formData, coverUrl: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">简介</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              {editingBook ? '保存修改' : '添加绘本'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
