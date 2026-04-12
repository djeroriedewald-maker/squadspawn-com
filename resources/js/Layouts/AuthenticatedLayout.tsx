import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import SearchBar from '@/Components/SearchBar';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth } = usePage().props as any;
    const user = auth.user;
    const unreadCount = auth.unreadCount || 0;
    const notifications = auth.notifications || [];

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    return (
        <div className="min-h-screen bg-navy-900">
            <nav className="border-b border-white/10 bg-navy-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href="/" className="text-xl font-bold text-gaming-purple">
                                    SquadSpawn
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                >
                                    Dashboard
                                </NavLink>
                                <NavLink
                                    href={route('discovery.index')}
                                    active={route().current('discovery.*')}
                                >
                                    Discover
                                </NavLink>
                                <NavLink
                                    href={route('lfg.index')}
                                    active={route().current('lfg.*')}
                                >
                                    LFG
                                </NavLink>
                                <NavLink
                                    href={route('friends.index')}
                                    active={route().current('friends.*')}
                                >
                                    Friends
                                </NavLink>
                                <NavLink
                                    href={route('games.index')}
                                    active={route().current('games.*')}
                                >
                                    Games
                                </NavLink>
                                <NavLink
                                    href={route('clips.index')}
                                    active={route().current('clips.*')}
                                >
                                    Clips
                                </NavLink>
                                <NavLink
                                    href={route('game-profile.show')}
                                    active={route().current('game-profile.*')}
                                >
                                    Profile
                                </NavLink>
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center sm:gap-3">
                            {/* Search */}
                            <SearchBar />

                            {/* Notification Bell */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="relative rounded-lg p-2 text-gray-400 transition hover:bg-navy-700 hover:text-white"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gaming-pink text-[10px] font-bold text-white">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                                        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-white/10 bg-navy-800 shadow-lg">
                                            <div className="border-b border-white/10 px-4 py-3">
                                                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                                            </div>
                                            <div className="max-h-80 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="px-4 py-6 text-center text-sm text-gray-500">No new notifications</div>
                                                ) : (
                                                    notifications.map((notif: any) => (
                                                        <Link
                                                            key={notif.id}
                                                            href={
                                                                notif.data.type === 'new_message'
                                                                    ? route('chat.show', { playerMatch: notif.data.match_id })
                                                                    : notif.data.type === 'new_match'
                                                                      ? route('chat.show', { playerMatch: notif.data.match_id })
                                                                      : route('dashboard')
                                                            }
                                                            className="flex items-center gap-3 border-b border-white/5 px-4 py-3 transition hover:bg-navy-700"
                                                            onClick={() => setShowNotifications(false)}
                                                        >
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gaming-purple/20">
                                                                {notif.data.sender_avatar || notif.data.partner_avatar ? (
                                                                    <img src={notif.data.sender_avatar || notif.data.partner_avatar} alt="" className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <span className="text-xs font-bold text-gaming-purple">
                                                                        {(notif.data.sender_name || notif.data.partner_name || '?')[0].toUpperCase()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm text-white">
                                                                    {notif.data.type === 'new_match' ? (
                                                                        <>New friend: <strong>{notif.data.partner_name}</strong>!</>
                                                                    ) : (
                                                                        <><strong>{notif.data.sender_name}</strong>: {notif.data.message_preview}</>
                                                                    )}
                                                                </p>
                                                                <p className="text-[10px] text-gray-500">{notif.created_at}</p>
                                                            </div>
                                                        </Link>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-white/10 bg-navy-700 px-3 py-2 text-sm font-medium leading-4 text-gray-300 transition duration-150 ease-in-out hover:text-white focus:outline-none"
                                            >
                                                {user.name}

                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                        >
                                            Settings
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center gap-2 sm:hidden">
                            {/* Mobile notification bell */}
                            <Link href={route('friends.index')} className="relative rounded-lg p-2 text-gray-400 hover:text-white">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gaming-pink text-[10px] font-bold text-white">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </Link>
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-navy-700 hover:text-white focus:bg-navy-700 focus:text-white focus:outline-none"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        (showingNavigationDropdown ? 'block' : 'hidden') +
                        ' sm:hidden'
                    }
                >
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                        >
                            Dashboard
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('discovery.index')}
                            active={route().current('discovery.*')}
                        >
                            Discover
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('lfg.index')}
                            active={route().current('lfg.*')}
                        >
                            LFG
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('friends.index')}
                            active={route().current('friends.*')}
                        >
                            Friends
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('games.index')}
                            active={route().current('games.*')}
                        >
                            Games
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('clips.index')}
                            active={route().current('clips.*')}
                        >
                            Clips
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('game-profile.show')}
                            active={route().current('game-profile.*')}
                        >
                            Profile
                        </ResponsiveNavLink>
                    </div>

                    <div className="border-t border-white/10 pb-1 pt-4">
                        <div className="px-4">
                            <div className="text-base font-medium text-white">
                                {user.name}
                            </div>
                            <div className="text-sm font-medium text-gray-400">
                                {user.email}
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>
                                Settings
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                            >
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="border-b border-white/5 bg-navy-800/50">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>

            <footer className="mt-auto border-t border-white/10 bg-navy-800/30 px-6 py-6 lg:px-12">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
                    <div className="flex gap-4 text-xs text-gray-500">
                        <a href="/privacy-policy" className="transition hover:text-gray-300">Privacy Policy</a>
                        <a href="/terms-of-service" className="transition hover:text-gray-300">Terms of Service</a>
                        <a href="/cookie-policy" className="transition hover:text-gray-300">Cookie Policy</a>
                    </div>
                    <p className="text-xs text-gray-500">
                        &copy; {new Date().getFullYear()} SquadSpawn &middot; Built by{' '}
                        <a href="https://budgetpixels.nl" target="_blank" rel="noopener noreferrer" className="text-gaming-purple hover:text-gaming-purple/80">
                            BudgetPixels.nl
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
}
