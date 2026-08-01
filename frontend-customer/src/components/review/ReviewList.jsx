import React, { useState, useEffect, useCallback } from 'react';
import { Star, ThumbsUp, ChevronLeft, ChevronRight } from 'lucide-react';
import CustomerService from '../../services/customerService'; // Import trực tiếp

const ReviewList = ({ menuItemId, showTitle = true }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      // Gọi API chuẩn
      const data = await CustomerService.getMenuItemReviews(menuItemId, {
        page: currentPage,
        limit: 5,
        sort: sortBy
      });

      if (data.success) {
        setReviews(data.data.reviews);
        setStats(data.data.stats);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [menuItemId, sortBy, currentPage]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
            size={14}
          />
        ))}
      </div>
    );
  };

  const renderRatingDistribution = () => {
    if (!stats) return null;
    const distribution = stats.rating_distribution;
    const total = stats.total_reviews;

    return (
      <div className="flex-1 space-y-1 pl-4 border-l border-gray-100">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-gray-500">{star}</span> 
              <Star size={10} className="text-gray-400" />
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-6 text-right text-gray-400">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Hôm nay';
    if (diffInDays === 1) return 'Hôm qua';
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  if (loading && currentPage === 1) {
    return <div className="py-8 text-center text-gray-500 text-sm animate-pulse">Đang tải đánh giá...</div>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      {showTitle && <h3 className="font-bold text-gray-800 text-lg">Đánh giá từ khách hàng</h3>}

      {/* Overall Rating Summary */}
      {stats && (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="text-center w-24">
            <div className="text-4xl font-black text-gray-900 leading-none mb-1">{stats.average_rating}</div>
            <div className="flex justify-center mb-1 scale-90">
                {renderStars(Math.round(parseFloat(stats.average_rating)))}
            </div>
            <div className="text-[10px] text-gray-400 font-medium">{stats.total_reviews} đánh giá</div>
          </div>
          {renderRatingDistribution()}
        </div>
      )}

      {/* Sort Options */}
      <div className="flex justify-end">
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setCurrentPage(1);
          }}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none focus:border-orange-500"
        >
          <option value="recent">Mới nhất</option>
          <option value="highest">Cao nhất</option>
          <option value="lowest">Thấp nhất</option>
          <option value="oldest">Cũ nhất</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Star className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-gray-500 font-medium text-sm">Chưa có đánh giá nào.</p>
            <p className="text-xs text-gray-400">Hãy là người đầu tiên trải nghiệm!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                    {review.customer_name?.charAt(0).toUpperCase() || 'K'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{review.customer_name || 'Khách hàng'}</span>
                      {review.is_verified_purchase && (
                        <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded text-[10px] font-medium border border-green-100 flex items-center gap-0.5">
                          <ThumbsUp size={8} /> Đã mua
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                       {renderStars(review.rating)}
                       <span className="text-[10px] text-gray-400">• {formatDate(review.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {review.comment && (
                <div className="text-sm text-gray-600 pl-11 leading-relaxed">{review.comment}</div>
              )}

              {review.admin_response && (
                <div className="mt-3 ml-11 bg-gray-50 p-3 rounded-lg border-l-2 border-orange-400 text-xs">
                  <strong className="text-gray-700 block mb-1">Phản hồi từ nhà hàng:</strong>
                  <p className="text-gray-600">{review.admin_response}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700">
            {currentPage} / {totalPages}
          </span>
          <button
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
