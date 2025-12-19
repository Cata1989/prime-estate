'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import profileDefault from '@/assets/images/profile.png';
import Spinner from '@/components/Spinner';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import SessionHistory from '@/components/SessionHistory';
import UsersListWithChat from '@/components/UsersListWithChat';

const ProfilePage = () => {
  const { data: session } = useSession();
  const profileImage = session?.user?.image;
  const profileName = session?.user?.name;
  const profileEmail = session?.user?.email;

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProperties = async (userId) => {
      if (!userId) {
        return;
      }

      try {
        const res = await fetch(`/api/properties/user/${userId}`);

        if (res.status === 200) {
          const data = await res.json();
          setProperties(data);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch user properties when session is available
    if (session?.user?.id) {
      fetchUserProperties(session.user.id);
    }
  }, [session]);

  const handleDeleteProperty = async (propertyId) => {
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
      });

      if (res.status === 200) {
        // Remove the property from state
        const updatedProperties = properties.filter(
          (property) => property._id !== propertyId
        );

        setProperties(updatedProperties);

        toast.success('Property Deleted');
      } else {
        toast.error('Failed to delete property');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to delete property');
    }
  };

  return (
    <section className='bg-blue-50'>
      <div className='container m-auto py-24'>
        <div className='bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0'>
          <div className='flex flex-col md:flex-row items-start'>
            {/* left sidebar */}
            <div className='w-full mx-2 md:w-1/4 md:mx-10 mt-10 min-w-[340px] md:sticky md:top-10 md:self-start'>
              <div className='flex flex-col items-center md:items-start text-center md:text-left'>
                <div className='mb-4'>
                  <Image
                    className='h-25 w-25 md:h-32 md:w-32 rounded-full mx-auto md:mx-0'
                    src={profileImage || profileDefault}
                    width={200}
                    height={200}
                    alt='User'
                  />
                </div>
                <h2 className='font-bold block text-2xl mb-1'>{profileName}</h2>
                {profileEmail && (
                  <a
                    href={`mailto:${profileEmail}`}
                    className='text-xl text-blue-600 hover:underline break-all'
                  >
                    {profileEmail}
                  </a>
                )}
              </div>
              <SessionHistory />

              <div>
                <h2 className='text-xl font-semibold mt-10 mb-3'>
                  Platform users
                </h2>
                <p className='text-sm text-gray-600 mb-3'>
                  Choose a user to start a chat.
                </p>
                <UsersListWithChat currentUserId={session?.user.id} />
              </div>
            </div>

            <div className='w-full md:w-3/4 md:pl-4'>
              <h2 className='text-xl font-semibold mt-10 mb-3'>
                Your Listings
              </h2>

              {!loading && properties.length === 0 && (
                <p>You have no property listings</p>
              )}

              {loading ? (
                <Spinner loading={loading} />
              ) : (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  {properties.map((property) => (
                    <div key={property._id} className='mb-10'>
                      <Link href={`/properties/${property._id}`}>
                        <Image
                          className='h-32 w-full rounded-md object-cover'
                          src={property.images[0]}
                          alt=''
                          width={500}
                          height={100}
                          priority={true}
                        />
                      </Link>
                      <div className='mt-2'>
                        <p className='text-lg font-semibold'>{property.name}</p>
                        <p className='text-gray-600'>
                          Address: {property.location.street}{' '}
                          {property.location.city} {property.location.state}
                        </p>
                      </div>
                      <div className='mt-2'>
                        <AlertDialog>
                          <AlertDialogTrigger>
                            <Button className='bg-blue-500 text-white px-3 py-3 rounded-md mr-2 hover:bg-blue-600'>
                              Edit
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Edit</AlertDialogTitle>
                              <AlertDialogDescription>
                                You are about to edit this property. This will
                                allow you to modify the details. Do you want to
                                proceed?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction>
                                <Link href={`/properties/${property._id}/edit`}>
                                  Edit
                                </Link>
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger>
                            <Button className='bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600'>
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this property?
                                This action cannot be undone and will
                                permanently remove the property listing and all
                                associated data from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteProperty(property._id)
                                }
                              >
                                Continue
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default ProfilePage;
