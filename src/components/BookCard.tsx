import { Book } from '@/types';
import { cn } from '@/lib/utils';
import StatusBadge from './StatusBadge';

interface BookCardProps {
  book: Book;
  onBorrow?: () => void;
  onView?: () => void;
  showBorrowButton?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}

export default function BookCard({ 
  book, 
  onBorrow, 
  onView, 
  showBorrowButton = true,
  disabled = false,
  disabledMessage 
}: BookCardProps) {
  const isAvailable = book.available > 0 && book.status === 'available';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img 
          src={book.coverUrl} 
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <StatusBadge status={isAvailable ? 'success' : 'danger'}>
            {isAvailable ? `可借 ${book.available}` : '已借出'}
          </StatusBadge>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-lg text-xs font-medium">
            {book.ageRange}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{book.title}</h3>
        <p className="text-sm text-gray-500 mb-2">{book.author}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">
            {book.category}
          </span>
          <span className="text-sm font-semibold text-gray-700">¥{book.price.toFixed(2)}</span>
        </div>
        <div className="mt-4 flex gap-2">
          {onView && (
            <button
              onClick={onView}
              className="flex-1 py-2 px-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              详情
            </button>
          )}
          {showBorrowButton && onBorrow && (
            <button
              onClick={onBorrow}
              disabled={disabled || !isAvailable}
              title={disabled ? disabledMessage : !isAvailable ? '暂无库存' : ''}
              className={cn(
                'flex-1 py-2 px-3 text-sm font-medium rounded-xl transition-all',
                disabled || !isAvailable
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-200'
              )}
            >
              {disabled ? disabledMessage || '不可借阅' : '借阅'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
