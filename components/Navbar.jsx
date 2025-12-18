'use client';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import logo from '@/assets/images/logo-white.png';
import profileDefault from '@/assets/images/profile.png';
import { FaGoogle } from 'react-icons/fa';
import { signIn, signOut, useSession, getProviders } from 'next-auth/react';
import UnreadMessageCount from './UnreadMessageCount';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const Navbar = () => {
  const { data: session } = useSession();
  const profileImage = session?.user?.image;
  const [providers, setProviders] = useState(null);
  const pathname = usePathname();

  const baseNavigation = [
    { name: 'Home', href: '/' },
    { name: 'Properties', href: '/properties' },
    ...(session ? [{ name: 'Add Property', href: '/properties/add' }] : []),
  ];

  const navigation = baseNavigation.map((item) => ({
    ...item,
    current: item.href === pathname,
  }));

  const user = {
    name: session?.user?.name,
    email: session?.user?.email,
    imageUrl: session?.user?.image,
  };

  const userNavigation = [
    { name: 'Your profile', href: '/profile' },
    { name: 'Saved Properties', href: '/properties/saved' },
    { name: 'Sign Out', type: 'action', actionKey: 'logout' },
  ];

  useEffect(() => {
    const setAuthProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };

    setAuthProviders();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut({ redirect: true, callbackUrl: '/' });
    } catch (e) {
      console.error('logout error', e);
    }
  }, []);

  return (
    <>
      <div className='min-h-full'>
        <Disclosure as='nav' className='bg-gray-800'>
          <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
            <div className='flex h-16 items-center justify-between'>
              <div className='flex items-center'>
                <div className='shrink-0'>
                  <Link className='flex flex-shrink-0 items-center' href='/'>
                    <Image className='size-8' src={logo} alt='PrimeEstate' />
                    <span className='hidden md:block text-white text-2xl font-bold ml-2'>
                      PrimeEstate
                    </span>
                  </Link>
                </div>
                <div className='hidden md:block'>
                  <div className='ml-10 flex items-baseline space-x-4'>
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        aria-current={item.current ? 'page' : undefined}
                        className={classNames(
                          item.current
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-300 hover:bg-white/5 hover:text-white',
                          'rounded-md px-3 py-2 text-sm font-medium'
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {session && (
                <div className='hidden md:block'>
                  <div className='ml-4 flex items-center md:ml-6'>
                    <Link href='/messages' className='relative group ml-auto'>
                      <button
                        type='button'
                        className='relative shrink-0 rounded-full p-1 text-gray-400 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500'
                      >
                        <span className='absolute -inset-1.5' />
                        <span className='sr-only'>View notifications</span>
                        <BellIcon aria-hidden='true' className='size-6' />
                      </button>
                      <UnreadMessageCount session={session} />
                    </Link>

                    {/* Profile dropdown */}
                    <Menu as='div' className='relative ml-3'>
                      <MenuButton className='relative flex max-w-xs items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500'>
                        <span className='absolute -inset-1.5' />
                        <span className='sr-only'>Open user menu</span>
                        <Image
                          className='size-8 rounded-full outline -outline-offset-1 outline-white/10'
                          src={profileImage || profileDefault}
                          alt=''
                          width={40}
                          height={40}
                        />
                      </MenuButton>

                      <MenuItems
                        transition
                        className='absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg outline-1 outline-black/5 transition data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[enter]:ease-out data-[leave]:duration-75 data-[leave]:ease-in'
                      >
                        {userNavigation.map((item) =>
                          item.type === 'action' ? (
                            <MenuItem key={item.name}>
                              <button
                                onClick={handleLogout}
                                className='block w-full text-left px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-hidden'
                              >
                                {item.name}
                              </button>
                            </MenuItem>
                          ) : (
                            <MenuItem key={item.name}>
                              <Link
                                key={item.name}
                                href={item.href}
                                className='block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-hidden'
                              >
                                {item.name}
                              </Link>
                            </MenuItem>
                          )
                        )}
                      </MenuItems>
                    </Menu>
                  </div>
                </div>
              )}

              {/* Show login button if not logged in on desktop */}

              {!session && (
                <div className='hidden md:block md:ml-6'>
                  <div className='flex items-center'>
                    {providers &&
                      Object.values(providers).map((provider, index) => (
                        <button
                          onClick={() => signIn(provider.id)}
                          key={index}
                          className='flex items-center text-white bg-gray-700 hover:bg-gray-900 hover:text-white rounded-md px-3 py-2'
                        >
                          <FaGoogle className='text-white mr-2' />
                          <span>Login or Register</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className='-mr-2 flex md:hidden'>
                {/* Mobile menu button */}
                <DisclosureButton className='group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500'>
                  <span className='absolute -inset-0.5' />
                  <span className='sr-only'>Open main menu</span>
                  <Bars3Icon
                    aria-hidden='true'
                    className='block size-6 group-data-[open]:hidden'
                  />
                  <XMarkIcon
                    aria-hidden='true'
                    className='hidden size-6 group-data-[open]:block'
                  />
                </DisclosureButton>
              </div>
            </div>
          </div>

          <DisclosurePanel className='md:hidden'>
            <div className='space-y-1 px-2 pt-2 pb-3 sm:px-3'>
              {navigation.map((item) => (
                <DisclosureButton
                  key={item.name}
                  as='a'
                  href={item.href}
                  aria-current={item.current ? 'page' : undefined}
                  className={classNames(
                    item.current
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white',
                    'block rounded-md px-3 py-2 text-base font-medium'
                  )}
                >
                  {item.name}
                </DisclosureButton>
              ))}

              {/* Show login button if not logged in on mobile */}
              {!session && (
                <div className='flex items-center'>
                  {providers &&
                    Object.values(providers).map((provider, index) => (
                      <button
                        onClick={() => signIn(provider.id)}
                        key={index}
                        className='flex items-center text-white bg-gray-700 hover:bg-gray-900 hover:text-white rounded-md px-3 py-2'
                      >
                        <FaGoogle className='text-white mr-2' />
                        <span>Login or Register</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
            {session && (
              <div className='border-t border-white/10 pt-4 pb-3'>
                <div className='flex items-center px-5'>
                  <div className='shrink-0'>
                    <Image
                      className='size-8 rounded-full outline -outline-offset-1 outline-white/10'
                      src={profileImage || profileDefault}
                      alt=''
                      width={40}
                      height={40}
                    />
                  </div>
                  <div className='ml-3'>
                    <div className='text-base/5 font-medium text-white'>
                      {user.name}
                    </div>
                    <div className='text-sm font-medium text-gray-400'>
                      {user.email}
                    </div>
                  </div>
                  <Link href='/messages' className='relative group ml-auto'>
                    <button
                      type='button'
                      className='relative shrink-0 rounded-full p-1 text-gray-400 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500'
                    >
                      <span className='absolute -inset-1.5' />
                      <span className='sr-only'>View notifications</span>
                      <BellIcon aria-hidden='true' className='size-6' />
                    </button>
                    <UnreadMessageCount session={session} />
                  </Link>
                </div>
                <div className='mt-3 space-y-1 px-2'>
                  {userNavigation.map((item) =>
                    item.type === 'action' ? (
                      <DisclosureButton
                        key={item.name}
                        as='a'
                        onClick={handleLogout}
                        className='block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer'
                      >
                        {item.name}
                      </DisclosureButton>
                    ) : (
                      <DisclosureButton
                        key={item.name}
                        as='a'
                        href={item.href}
                        className='block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-white/5 hover:text-white'
                      >
                        {item.name}
                      </DisclosureButton>
                    )
                  )}
                </div>
              </div>
            )}
          </DisclosurePanel>
        </Disclosure>
      </div>
    </>
  );
};

export default Navbar;
