const Pagination = ({ page, pageSize, totalItems, onPageChange, onPageSizeChange }) => {
  const totalPages = Math.ceil(totalItems / pageSize);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  const handlePageSizeChange = (e) => {
    const newPageSize = parseInt(e.target.value, 10);
    if (newPageSize > 0) {
      onPageSizeChange(newPageSize);
    }
  }

  return (
    <section className='container mx-auto flex flex-col md:flex-row justify-center items-center my-8'>
      <div className='flex items-center'>
        <button
          className='mr-2 px-2 py-1 border border-gray-300 rounded'
          disabled={page === 1}
          onClick={() => handlePageChange(page - 1)}
        >
          Previous
        </button>
        <span className='mx-2'>
          Page {page} of {totalPages}
        </span>
        <button
          className='ml-2 px-2 py-1 border border-gray-300 rounded'
          disabled={page === totalPages}
          onClick={() => handlePageChange(page + 1)}
        >
          Next
        </button>
      </div>
      <div className='flex items-center md:mt-0 mt-2 ml-2'>
        <label htmlFor="pageSize" className="mr-2">
          Items per page:
        </label>
        <input
          id='pageSize'
          type='number'
          value={pageSize}
          className='w-14 px-2 py-1 border border-gray-300 rounded'
          onChange={handlePageSizeChange}
          min={1}
        />
      </div>
    </section>
  );
};
export default Pagination;
