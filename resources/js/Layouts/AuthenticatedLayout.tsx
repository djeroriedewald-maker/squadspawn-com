import Dropdown from '@/Components/Dropdown';
import FloatingChat from '@/Components/FloatingChat';
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
    const achievementCount = auth.achievementCount || 0;

    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    return (
        <div className="min-h-screen bg-navy-900">
            <nav className="relative z-50 border-b border-white/5 bg-navy-900/80 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href="/" className="text-xl font-bold text-gaming-purple text-neon-purple">
                                    SquadSpawn
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                <NavLink href={route('dashboard')} active={route().current('dashboard')}>
                                    Dashboard
                                </NavLink>
                                <NavLink href={route('discovery.index')} active={route().current('discovery.*')}>
                                    Discover
                                </NavLink>
                                <NavLink href={route('lfg.index')} active={route().current('lfg.*')}>
                                    LFG
                                </NavLink>
                                <NavLink href={route('games.index')} active={route().current('games.*')}>
                                    Games
                                </NavLink>
                                <NavLink href={route('community.index')} active={route().current('community.*')}>
                                    Community
                                </NavLink>
                                <NavLink href={route('clips.index')} active={route().current('clips.*')}>
                                    Clips
                                </NavLink>
                                <NavLink href={route('game-profile.show')} active={route().current('game-profile.*')}>
                                    Profile
                                </NavLink>
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center sm:gap-3">
                            <SearchBar />

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
                                        {user.is_admin && (
                                            <Dropdown.Link href={route('admin.dashboard')}>
                                                <span className="flex items-center gap-2">
                                                    <svg className="h-4 w-4 text-gaming-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span className="text-gaming-purple">Admin</span>
                                                </span>
                                            </Dropdown.Link>
                                        )}
                                        <Dropdown.Link href={route('friends.index')}>
                                            Friends
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('achievements.index')}>
                                            <span className="flex items-center gap-2">
                                                <span>Achievements</span>
                                                {achievementCount > 0 && (
                                                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gaming-purple/20 px-1.5 text-[10px] font-bold text-gaming-purple">
                                                        {achievementCount}
                                                    </span>
                                                )}
                                            </span>
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('profile.edit')}>
                                            Settings
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('logout')} method="post" as="button">
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown((prev) => !prev)}
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-navy-700 hover:text-white focus:bg-navy-700 focus:text-white focus:outline-none"
                            >
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path
                                        className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden'}>
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>
                            Dashboard
                        </ResponsiveNavLink>
                        <ResponsiveNavLink href={route('discovery.index')} active={route().current('discovery.*')}>
                            Discover
                        </ResponsiveNavLink>
                        <ResponsiveNavLink href={route('lfg.index')} active={route().current('lfg.*')}>
                            LFG
                        </ResponsiveNavLink>
                        <ResponsiveNavLink href={route('games.index')} active={route().current('games.*')}>
                            Games
                        </ResponsiveNavLink>
                        <ResponsiveNavLink href={route('community.index')} active={route().current('community.*')}>
                            Community
                        </ResponsiveNavLink>
                        <ResponsiveNavLink href={route('clips.index')} active={route().current('clips.*')}>
                            Clips
                        </ResponsiveNavLink>
                        <ResponsiveNavLink href={route('game-profile.show')} active={route().current('game-profile.*')}>
                            Profile
                        </ResponsiveNavLink>
                    </div>

                    <div className="border-t border-white/10 pb-1 pt-4">
                        <div className="px-4">
                            <div className="flex items-center gap-2">
                                <span className="text-base font-medium text-white">{user.name}</span>
                                {user.profile?.level && user.profile.level > 1 && (
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        user.profile.level >= 6 ? 'bg-yellow-400/20 text-yellow-400' :
                                        user.profile.level >= 5 ? 'bg-gaming-pink/20 text-gaming-pink' :
                                        user.profile.level >= 4 ? 'bg-gaming-purple/20 text-gaming-purple' :
                                        user.profile.level >= 3 ? 'bg-gaming-cyan/20 text-gaming-cyan' :
                                        'bg-gaming-green/20 text-gaming-green'
                                    }`}>
                                        Lv.{user.profile.level}
                                    </span>
                                )}
                            </div>
                            <div className="mt-0.5 text-sm font-medium text-gray-400">{user.email}</div>
                            {user.profile?.xp !== undefined && (
                                <div className="mt-2">
                                    <div className="mb-1 flex items-center justify-between text-[10px]">
                                        <span className="text-gray-500">{user.profile.xp || 0} XP</span>
                                        <span className="text-gray-600">
                                            {user.profile.level >= 6 ? 'Legend' :
                                             user.profile.level >= 5 ? 'Champion' :
                                             user.profile.level >= 4 ? 'Elite' :
                                             user.profile.level >= 3 ? 'Veteran' :
                                             user.profile.level >= 2 ? 'Player' : 'Rookie'}
                                        </span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-navy-700">
                                        <div className="h-full rounded-full bg-gradient-to-r from-gaming-purple to-gaming-green transition-all" style={{ width: `${Math.min(((user.profile.xp || 0) / 5000) * 100, 100)}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-3 space-y-1">
                            {user.is_admin && (
                                <ResponsiveNavLink href={route('admin.dashboard')}>
                                    <span className="text-gaming-purple">Admin Panel</span>
                                </ResponsiveNavLink>
                            )}
                            <ResponsiveNavLink href={route('friends.index')}>
                                Friends
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('achievements.index')}>
                                <span className="flex items-center gap-2">
                                    Achievements & XP
                                    {achievementCount > 0 && (
                                        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gaming-purple/20 px-1.5 text-[10px] font-bold text-gaming-purple">
                                            {achievementCount}
                                        </span>
                                    )}
                                </span>
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('profile.edit')}>
                                Settings
                            </ResponsiveNavLink>
                            <ResponsiveNavLink method="post" href={route('logout')} as="button">
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

            <footer className="mt-auto border-t border-white/5 bg-navy-900 px-6 py-6 lg:px-12">
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

            {/* Floating Chat Widget */}
            <FloatingChat />
        </div>
    );
}
