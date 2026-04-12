import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

export default function Dashboard() {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-white">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Welcome Card */}
                    <div className="mb-8 rounded-xl border border-white/10 bg-navy-800 p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gaming-purple/20 text-2xl font-bold text-gaming-purple">
                                {user.profile?.avatar ? (
                                    <img src={user.profile.avatar} alt={user.name} className="h-full w-full object-cover" />
                                ) : (
                                    user.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    Welcome back, {user.name}!
                                </h3>
                                <p className="text-gray-400">
                                    {user.profile?.username
                                        ? `@${user.profile.username}`
                                        : 'Set up your gaming profile to get started'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mb-8 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-white/10 bg-navy-800 p-6 text-center">
                            <p className="text-3xl font-bold text-gaming-purple">
                                {user.games?.length ?? 0}
                            </p>
                            <p className="mt-1 text-sm text-gray-400">Games Added</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-navy-800 p-6 text-center">
                            <p className="text-3xl font-bold text-gaming-green">
                                --
                            </p>
                            <p className="mt-1 text-sm text-gray-400">Matches</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-navy-800 p-6 text-center">
                            <p className="text-3xl font-bold text-gaming-pink">
                                {user.profile?.region ?? '--'}
                            </p>
                            <p className="mt-1 text-sm text-gray-400">Region</p>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <h3 className="mb-4 text-lg font-semibold text-white">Quick Actions</h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Link
                            href={route('discovery.index')}
                            className="group rounded-xl border border-white/10 bg-navy-800 p-6 transition hover:border-gaming-purple/30"
                        >
                            <div className="mb-3 text-gaming-purple">
                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-white group-hover:text-gaming-purple">
                                Discover Players
                            </h4>
                            <p className="mt-1 text-sm text-gray-400">
                                Find teammates matching your playstyle
                            </p>
                        </Link>

                        <Link
                            href={route('matches.index')}
                            className="group rounded-xl border border-white/10 bg-navy-800 p-6 transition hover:border-gaming-green/30"
                        >
                            <div className="mb-3 text-gaming-green">
                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-white group-hover:text-gaming-green">
                                Your Matches
                            </h4>
                            <p className="mt-1 text-sm text-gray-400">
                                Chat with your matched teammates
                            </p>
                        </Link>

                        <Link
                            href={route('game-profile.edit')}
                            className="group rounded-xl border border-white/10 bg-navy-800 p-6 transition hover:border-gaming-pink/30"
                        >
                            <div className="mb-3 text-gaming-pink">
                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-white group-hover:text-gaming-pink">
                                Gaming Profile
                            </h4>
                            <p className="mt-1 text-sm text-gray-400">
                                Set up your games, rank, and preferences
                            </p>
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
