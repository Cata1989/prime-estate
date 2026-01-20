'use client';
import { useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowAltCircleLeft } from 'react-icons/fa';
import PropertyCard from '@/components/PropertyCard';
import PropertySearchForm from '@/components/PropertySearchForm';
import InfiniteScroll from '@/components/InfiniteScroll';

const SearchResultsPage = ({ searchParams }) => {
  const { location='', propertyType='All' } = searchParams;

  const [pageSize, setPageSize] = useState(3);

  useEffect(() => {
    const updatePageSize = () => {
      if (window.innerWidth < 768) {
        setPageSize(1);
    } else {
      setPageSize(3);
    }
  }
  updatePageSize();
  window.addEventListener('resize', updatePageSize);

  return () => window.removeEventListener('resize', updatePageSize);
  }, []);


  const fetchSearchResults = useCallback(async (page, pageSize) => {
    const res = await fetch(
      `/api/properties/search?location=${location}&propertyType=${propertyType}&page=${page}&pageSize=${pageSize}`
    );
    const data = await res.json();
    return { items: data.properties, total: data.total };
  }, [location, propertyType]);

  return (
    <>
      <section className='bg-blue-700 py-4'>
        <div className='max-w-7xl mx-auto px-4 flex flex-col items-start sm:px-6 lg:px-8'>
          <PropertySearchForm />
        </div>
      </section>

      <section className='px-4 py-6'>
        <div className='container-xl lg:container m-auto px-4 py-6'>
          <Link href='/properties' className='flex items-center text-blue-500 hover:underline mb-3'>
            <FaArrowAltCircleLeft className='mr-2 mb-1' /> Back To Properties
          </Link>
          
          <h1 className='text-2xl mb-4 text-gray-800 font-bold'>Search Results</h1>

          <InfiniteScroll
            key={`${location}-${propertyType}`} 
            fetchAction={fetchSearchResults}
            renderItem={(property) => <PropertyCard property={property} />}
            pageSize={pageSize}
            gridClass="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            itemName="properties"
          />
        </div>
      </section>
    </>
  );
};
export default SearchResultsPage;
