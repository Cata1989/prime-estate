import {
  FaBed,
  FaBath,
  FaRulerCombined,
  FaTimes,
  FaCheck,
  FaMapMarker,
  FaEnvelope, 
  FaPhone,   
} from 'react-icons/fa';
import PropertyMap from '@/components/PropertyMap';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const PropertyDetails = ({ property }) => {

  const seller = property.account_info || {};
  const initials = (seller.username || seller.email || 'NA').slice(0, 2).toUpperCase();
  const avatarSrc = typeof seller.image === 'string' && seller.image.startsWith('https')
    ? seller.image
    : undefined;

  return (
    <main>
      <div className='bg-white p-6 rounded-lg shadow-md text-center md:text-left'>
        <div className='text-gray-500 mb-4'>{property.type}</div>
        <h1 className='text-3xl font-bold mb-4'>{property.name}</h1>
        <div className='text-gray-500 mb-4 flex align-middle justify-center md:justify-start'>
          <FaMapMarker className='text-lg text-orange-700 mr-2' />
          <p className='text-orange-700'>
            {property.location.street}, {property.location.city}{' '}
            {property.location.state}
          </p>
        </div>

        <h3 className='text-lg font-bold my-6 bg-gray-800 text-white p-2'>
          Rates & Options
        </h3>
        <div className='flex flex-col md:flex-row justify-around'>
          <div className='flex items-center justify-center mb-4 border-b border-gray-200 md:border-b-0 pb-4 md:pb-0'>
            <div className='text-gray-500 mr-2 font-bold'>Nightly</div>
            <div className='text-2xl font-bold text-blue-500'>
              {property.rates.nightly ? (
                `$${property.rates.nightly.toLocaleString()}`
              ) : (
                <FaTimes className='text-red-700' />
              )}
            </div>
          </div>
          <div className='flex items-center justify-center mb-4 border-b border-gray-200 md:border-b-0 pb-4 md:pb-0'>
            <div className='text-gray-500 mr-2 font-bold'>Weekly</div>
            <div className='text-2xl font-bold text-blue-500'>
              {property.rates.weekly ? (
                `$${property.rates.weekly.toLocaleString()}`
              ) : (
                <FaTimes className='text-red-700' />
              )}
            </div>
          </div>
          <div className='flex items-center justify-center mb-4 pb-4 md:pb-0'>
            <div className='text-gray-500 mr-2 font-bold'>Monthly</div>
            <div className='text-2xl font-bold text-blue-500'>
              {property.rates.monthly ? (
                `$${property.rates.monthly.toLocaleString()}`
              ) : (
                <FaTimes className='text-red-700' />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className='flex items-center gap-3 bg-white p-6 rounded-lg mt-6 mb-5 shadow-sm border border-slate-100'>
        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
          {avatarSrc && (
            <AvatarImage
              src={avatarSrc}
              alt={seller.username || 'Seller'}
              className="h-full w-full object-cover"
            />
          )}
          <AvatarFallback className="bg-slate-200 text-slate-600 text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col overflow-hidden">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Listed By
          </span>
          <span className="flex text-sm font-bold text-slate-800 truncate">
            {seller.username || property.seller_info?.name || 'Property Agent'}
          </span>
          
          <div className="flex flex-col md:flex-row gap-3 mt-3">
            {(seller.email || property.seller_info?.email) && (
              <a
                href={`mailto:${seller.email || property.seller_info?.email}`}
                className="text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1 text-xs"
                title="Send Email"
              >
                <FaEnvelope className="text-s" />
                <span className="text-[15px] sm:inline">Email: {seller.email} </span>
              </a>
            )}
            
            {property.seller_info?.phone && (
              <a
                href={`tel:${property.seller_info.phone}`}
                className="text-slate-500 hover:text-green-600 transition-colors flex items-center gap-1 text-xs"
                title="Call Agent"
              >
                <FaPhone className="text-s" />
                <span className="text-[15px] sm:inline">Call: {property.seller_info.phone} </span>
              </a>
            )}
          </div>
        </div>
      </div>


      <div className='bg-white p-6 rounded-lg shadow-md mt-6'>
        <h3 className='text-lg font-bold mb-6'>Description & Details</h3>
        <div className='flex justify-center gap-4 text-blue-500 mb-4 text-xl space-x-9'>
          <p>
            <FaBed className='inline-block mr-2' /> {property.beds}{' '}
            <span className='hidden sm:inline'>Beds</span>
          </p>
          <p>
            <FaBath className='inline-block mr-2' /> {property.baths}{' '}
            <span className='hidden sm:inline'>Baths</span>
          </p>
          <p>
            <i className='fa-solid fa-ruler-combined'></i>
            <FaRulerCombined className='inline-block mr-2' />
            {property.square_feet}{' '}
            <span className='hidden sm:inline'>sqft</span>
          </p>
        </div>
        <p className='text-gray-500 mb-4 text-center'>{property.description}</p>
      </div>

      <div className='bg-white p-6 rounded-lg shadow-md mt-6'>
        <h3 className='text-lg font-bold mb-6'>Amenities</h3>

        <ul className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 list-none space-y-2'>
          {property.amenities.map((amenity, index) => (
            <li key={index}>
              <FaCheck className='inline-block text-green-600 mr-2' /> {amenity}
            </li>
          ))}
        </ul>
      </div>

      <div className='bg-white p-6 rounded-lg shadow-md mt-6'>
        <PropertyMap property={property} />
      </div>
    </main>
  );
};
export default PropertyDetails;
