import BroadcastPopup from '@/Components/BroadcastPopup';
import Dropdown from '@/Components/Dropdown';
import FlashBar from '@/Components/FlashBar';
import FloatingChat from '@/Components/FloatingChat';
import ImpersonationBar from '@/Components/ImpersonationBar';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import SearchBar from '@/Components/SearchBar';
import ThemeToggle from '@/Components/ThemeToggle';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth } = usePage().props as any;
    const user = auth.user;
    const achievementCount = auth.achievementCount || 0;
    const canModerate = !!auth.canModerate;
    const hasRole = !!(user?.is_admin || user?.is_moderator || user?.is_owner);
    const hasChangelogUpdate = !!auth.hasChangelogUpdate;
    // Server-shared feature toggles. Missing keys default to true so an
    // older backend (pre-flags) still shows the full nav.
    const features = (usePage().props as any).features ?? {};
    const isOn = (k: string) => features[k] !== false;

    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    return (
        <div className="min-h-screen bg-bone-50">
            <ImpersonationBar />
            <FlashBar />
            <nav className="relative z-50 border-b border-ink-900/5 bg-bone-50/80 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href="/" className="text-xl font-bold text-neon-red">
                                    SquadSpawn
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                <NavLink href={route('dashboard')} active={route().current('dashboard')}>
                                    Dashboard
                                </NavLink>
                                {isOn('discovery') && (
                                    <NavLink href={route('discovery.index')} active={route().current('discovery.*')}>
                                        Discover
                                    </NavLink>
                                )}
                                {isOn('lfg') && (
                                    <NavLink href={route('lfg.index')} active={route().current('lfg.*')}>
                                        LFG
                                    </NavLink>
                                )}
                                <NavLink href={route('games.index')} active={route().current('games.*')}>
                                    Games
                                </NavLink>
                                {isOn('community') && (
                                    <NavLink href={route('community.index')} active={route().current('community.*')}>
                                        Community
                                    </NavLink>
                                )}
                                {isOn('clips') && (
                                    <NavLink href={route('clips.index')} active={route().current('clips.*')}>
                                        Creators
                                    </NavLink>
                                )}
                                <NavLink href={route('game-profile.show')} active={route().current('game-profile.*')}>
                                    Profile
                                </NavLink>
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center sm:gap-3">
                            <SearchBar />

                            <Link
                                href={route('changelog.index')}
                                title="What's new"
                                aria-label="Changelog"
                                className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                                    route().current('changelog.*')
                                        ? 'border-neon-red/40 bg-neon-red/10 text-neon-red'
                                        : 'border-ink-900/10 bg-bone-100 text-ink-700 hover:border-neon-red/30 hover:text-neon-red'
                                }`}
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                                {hasChangelogUpdate && (
                                    <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-red opacity-70" />
                                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-neon-red ring-2 ring-bone-50" />
                                    </span>
                                )}
                            </Link>

                            <Link
                                href={route('help')}
                                title="Help centre"
                                aria-label="Help centre"
                                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                                    route().current('help')
                                        ? 'border-neon-red/40 bg-neon-red/10 text-neon-red'
                                        : 'border-ink-900/10 bg-bone-100 text-ink-700 hover:border-neon-red/30 hover:text-neon-red'
                                }`}
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                                </svg>
                            </Link>

                            <ThemeToggle compact />

                            <div className="relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-ink-900/10 bg-bone-100 px-3 py-2 text-sm font-medium leading-4 text-ink-700 transition duration-150 ease-in-out hover:text-ink-900 focus:outline-none"
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
                                                    <svg className="h-4 w-4 text-neon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span className="text-neon-red">Admin</span>
                                                </span>
                                            </Dropdown.Link>
                                        )}
                                        {canModerate && (
                                            <Dropdown.Link href="/mod/queue">
                                                <span className="flex items-center gap-2">
                                                    <svg className="h-4 w-4 text-gaming-cyan" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                                                    </svg>
                                                    <span className="text-gaming-cyan">Mod Queue</span>
                                                </span>
                                            </Dropdown.Link>
                                        )}
                                        {hasRole && (
                                            <Dropdown.Link href="/settings/role">
                                                <span className="flex items-center gap-2">
                                                    <svg className="h-4 w-4 text-gaming-orange" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                                                    </svg>
                                                    <span className="text-gaming-orange">Your Role</span>
                                                </span>
                                            </Dropdown.Link>
                                        )}
                                        <Dropdown.Link href={route('friends.index')}>
                                            Friends
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('invite.index')}>
                                            <span className="flex items-center gap-2">
                                                <span>Invite friends</span>
                                                <span className="rounded-full bg-neon-red/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-neon-red">
                                                    +xp
                                                </span>
                                            </span>
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('achievements.index')}>
                                            <span className="flex items-center gap-2">
                                                <span>Achievements</span>
                                                {achievementCount > 0 && (
                                                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-neon-red/20 px-1.5 text-[10px] font-bold text-neon-red">
                                                        {achievementCount}
                                                    </span>
                                                )}
                                            </span>
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('profile.edit')}>
                                            Settings
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('announcements.index')}>
                                            <span className="flex items-center gap-2">
                                                <svg className="h-4 w-4 text-ink-500" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
                                                </svg>
                                                <span>Announcements</span>
                                            </span>
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('help')}>
                                            <span className="flex items-center gap-2">
                                                <svg className="h-4 w-4 text-ink-500" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                                                </svg>
                                                <span>Help centre</span>
                                            </span>
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
                                className="inline-flex items-center justify-center rounded-md p-2 text-ink-500 transition duration-150 ease-in-out hover:bg-bone-100 hover:text-ink-900 focus:bg-bone-100 focus:text-ink-900 focus:outline-none"
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
                        {isOn('discovery') && (
                            <ResponsiveNavLink href={route('discovery.index')} active={route().current('discovery.*')}>
                                Discover
                            </ResponsiveNavLink>
                        )}
                        {isOn('lfg') && (
                            <ResponsiveNavLink href={route('lfg.index')} active={route().current('lfg.*')}>
                                LFG
                            </ResponsiveNavLink>
                        )}
                        <ResponsiveNavLink href={route('games.index')} active={route().current('games.*')}>
                            Games
                        </ResponsiveNavLink>
                        {isOn('community') && (
                            <ResponsiveNavLink href={route('community.index')} active={route().current('community.*')}>
                                Community
                            </ResponsiveNavLink>
                        )}
                        {isOn('clips') && (
                            <ResponsiveNavLink href={route('clips.index')} active={route().current('clips.*')}>
                                Creators
                            </ResponsiveNavLink>
                        )}
                        <ResponsiveNavLink href={route('game-profile.show')} active={route().current('game-profile.*')}>
                            Profile
                        </ResponsiveNavLink>
                    </div>

                    <div className="border-t border-ink-900/10 pb-1 pt-4">
                        <div className="px-4">
                            <div className="flex items-center gap-2">
                                <span className="text-base font-medium text-ink-900">{user.name}</span>
                                {user.profile?.level && user.profile.level > 1 && (
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        user.profile.level >= 6 ? 'bg-yellow-400/20 text-yellow-400' :
                                        user.profile.level >= 5 ? 'bg-gaming-pink/20 text-gaming-pink' :
                                        user.profile.level >= 4 ? 'bg-neon-red/20 text-neon-red' :
                                        user.profile.level >= 3 ? 'bg-gaming-cyan/20 text-gaming-cyan' :
                                        'bg-gaming-green/20 text-gaming-green'
                                    }`}>
                                        Lv.{user.profile.level}
                                    </span>
                                )}
                            </div>
                            <div className="mt-0.5 text-sm font-medium text-ink-500">{user.email}</div>
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
                                    <div className="h-1.5 overflow-hidden rounded-full bg-bone-100">
                                        <div className="h-full rounded-full bg-gradient-to-r from-neon-red to-gaming-green transition-all" style={{ width: `${Math.min(((user.profile.xp || 0) / 5000) * 100, 100)}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-3 space-y-1">
                            {user.is_admin && (
                                <ResponsiveNavLink href={route('admin.dashboard')}>
                                    <span className="text-neon-red">Admin Panel</span>
                                </ResponsiveNavLink>
                            )}
                            {canModerate && (
                                <ResponsiveNavLink href="/mod/queue">
                                    <span className="text-gaming-cyan">🛡 Mod Queue</span>
                                </ResponsiveNavLink>
                            )}
                            {hasRole && (
                                <ResponsiveNavLink href="/settings/role">
                                    <span className="text-gaming-orange">Your Role</span>
                                </ResponsiveNavLink>
                            )}
                            <ResponsiveNavLink href={route('friends.index')}>
                                Friends
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('invite.index')}>
                                <span className="flex items-center gap-2">
                                    <span>Invite friends</span>
                                    <span className="rounded-full bg-neon-red/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-neon-red">
                                        +xp
                                    </span>
                                </span>
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('achievements.index')}>
                                <span className="flex items-center gap-2">
                                    Achievements & XP
                                    {achievementCount > 0 && (
                                        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-neon-red/20 px-1.5 text-[10px] font-bold text-neon-red">
                                            {achievementCount}
                                        </span>
                                    )}
                                </span>
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('profile.edit')}>
                                Settings
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('announcements.index')}>
                                Announcements
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('help')}>
                                Help centre
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('changelog.index')}>
                                <span className="flex items-center gap-2">
                                    What's new
                                    {hasChangelogUpdate && <span className="h-2 w-2 rounded-full bg-neon-red" />}
                                </span>
                            </ResponsiveNavLink>
                            <ResponsiveNavLink method="post" href={route('logout')} as="button">
                                Log Out
                            </ResponsiveNavLink>
                            <div className="px-4 pt-3">
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="border-b border-ink-900/5 bg-bone-100/50">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main className="overflow-x-hidden">{children}</main>

            <footer className="mt-auto border-t border-ink-900/5 bg-bone-50 px-6 py-6 lg:px-12">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <Link href={route('announcements.index')} className="transition hover:text-ink-700">Announcements</Link>
                        <Link href={route('help')} className="transition hover:text-ink-700">Help</Link>
                        <Link href={route('changelog.index')} className="transition hover:text-ink-700">Changelog</Link>
                        <a href="/privacy-policy" className="transition hover:text-ink-700">Privacy Policy</a>
                        <a href="/terms-of-service" className="transition hover:text-ink-700">Terms of Service</a>
                        <a href="/cookie-policy" className="transition hover:text-ink-700">Cookie Policy</a>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <a
                            href="https://instagram.com/squadspawnhq"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md bg-gaming-pink/10 px-2.5 py-1 font-medium text-gaming-pink transition hover:bg-gaming-pink/20"
                            aria-label="Follow SquadSpawn on Instagram"
                        >
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                            @squadspawnhq
                        </a>
                        <p>
                            &copy; {new Date().getFullYear()} SquadSpawn &middot; Built by{' '}
                            <a href="https://budgetpixels.nl" target="_blank" rel="noopener noreferrer" className="text-neon-red hover:text-neon-red/80">
                                BudgetPixels.nl
                            </a>
                        </p>
                    </div>
                </div>
            </footer>

            {/* Floating Chat Widget */}
            <FloatingChat />

            {/* Admin broadcasts surface here — one popup at a time, queue
                handled server-side via dismissed_at. */}
            <BroadcastPopup />
        </div>
    );
}
