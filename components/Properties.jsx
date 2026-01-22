'use client';
import InfiniteScroll from '@/components/InfiniteScroll';
import PropertyCard from '@/components/PropertyCard';

const Properties = () => {
  const fetchProperties = async (page, pageSize) => {
    const res = await fetch(`/api/properties?page=${page}&pageSize=${pageSize}`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    
    return {
      items: data.properties,
      total: data.total
    };
  };

  return (
    <section className='px-4 py-6'>
      <div className='container-xl lg:container m-auto px-4 py-6'>
        <InfiniteScroll 
          fetchAction={fetchProperties}
          renderItem={(property) => <PropertyCard property={property} />}
          gridClass="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          itemName="properties"
        />
      </div>
    </section>
  );
};
export default Properties;