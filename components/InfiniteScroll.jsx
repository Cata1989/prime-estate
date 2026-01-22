'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Spinner from '@/components/Spinner';
import { FaArrowUp } from 'react-icons/fa';

const InfiniteScroll = ({ 
  fetchAction,      
  renderItem,       
  pageSize: pageSizeProp = 3,    
  gridClass = '',   
  itemName = 'items' 
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeProp);
  const [pageSizeReady, setPageSizeReady] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef(null);

  useEffect(() => {
    const updatePageSize = () => {
      const newSize = window.innerWidth < 768 ? 1 : pageSizeProp;
      setPageSize(prev => (prev === newSize ? prev : newSize));
      setPageSizeReady(true);
    };

    updatePageSize();
    window.addEventListener('resize', updatePageSize);
    return () => window.removeEventListener('resize', updatePageSize);
  }, [pageSizeProp]);
  
  const progressPercent = totalItems > 0 ? (items.length / totalItems) * 100 : 0;

  const loadData = useCallback(
    async (pageNum) => {
      if (!pageSizeReady) return;
      setLoading(true);
    try {
      const data = await fetchAction(pageNum, pageSize);

      setItems((prev) => {
        if (pageNum === 1) return data.items;

        const newItems = data.items.filter(
          (newItem) => !prev.some((oldItem) => (oldItem._id || oldItem.id) === (newItem._id || newItem.id))
        );
        return [...prev, ...newItems];
      });

      setTotalItems(data.total);

      if (data.items.length === 0 || (pageNum * pageSize) >= data.total) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      console.error("InfiniteScroll Error:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchAction, pageSize, pageSizeReady]);

  useEffect(() => {
    if (!pageSizeReady) return;
    setItems([]);
    setPage(1);
    setHasMore(true);
    loadData(1);
  }, [fetchAction, loadData, pageSize, pageSizeReady]);

  useEffect(() => {
    if (page > 1) {
      loadData(page);
    }
  }, [page, loadData]);

  const lastElementRef = useCallback((node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage((prev) => prev + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore, pageSizeReady]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gray-100 z-50">
        <div 
          className="h-full bg-blue-600 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(37,99,235,0.6)]"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {!loading && items.length === 0 && !hasMore ? (
        <div className="text-center py-20">
          <p className="text-xl text-gray-600 font-light">
            No {itemName} found for this search.
          </p>
        </div>
      ) : (
        <div className={gridClass}>
          {items.map((item, index) => {
            if (items.length === index + 1) {
              return (
                <div ref={lastElementRef} key={item._id || item.id || index}>
                  {renderItem(item)}
                </div>
              );
            }
            return <div key={item._id || item.id || index}>{renderItem(item)}</div>;
          })}
        </div>
      )}

      {loading && (
        <div className="my-10 text-center">
          <Spinner />
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <div className="mt-16 mb-10 flex flex-col items-center animate-fadeIn">
          <div className="flex items-center w-full max-w-lg mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-300"></div>
            <span className="px-4 text-sm font-medium text-gray-500 italic text-center">
              You've explored all {totalItems} {itemName}.
            </span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-300"></div>
          </div>
          
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 bg-white border border-gray-200 px-6 py-2 rounded-full shadow-sm hover:shadow-md hover:bg-gray-50 transition-all text-blue-600 font-semibold text-sm"
          >
            <FaArrowUp className="text-xs" /> Back to top
          </button>
        </div>
      )}
    </>
  );
};
export default InfiniteScroll;