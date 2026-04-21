import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';

interface Props {
    role: {
        is_admin: boolean;
        is_moderator: boolean;
        is_owner: boolean;
    };
}

export default function RoleSettings({ role }: Props) {
    const stepDownMod = async () => {
        if (!window.confirm('Step down from moderator? You\'ll lose access to the mod queue and community moderation tools. An admin can reinstate you later.')) return;
        try {
            await axios.post(route('settings.role.stepDownMod'));
            router.reload();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to step down.');
        }
    };

    const stepDownAdmin = async () => {
        if (!window.confirm('⚠️ Step down from admin?\n\nYou\'ll lose full platform access: user bans, role management, games, reports, and admin-level tooling. Another admin will need to restore this role — you can\'t re-promote yourself.\n\nContinue?')) return;
        try {
            await axios.post(route('settings.role.stepDownAdmin'));
            router.reload();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to step down.');
        }
    };

    const hasAnyRole = role.is_admin || role.is_moderator || role.is_owner;

    return (
        <AuthenticatedLayout>
            <Head title="Your Role" />

            <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-ink-900">Your Role</h1>
                    <p className="mt-1 text-sm text-ink-500">Manage your moderator / admin privileges.</p>
                </div>

                {!hasAnyRole && (
                    <div className="rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100 p-8 text-center text-sm text-ink-500">
                        You don't have any moderation roles right now. Admins can promote you from the user management panel.
                    </div>
                )}

                {role.is_owner && (
                    <div className="mb-4 rounded-xl border border-gaming-orange/30 bg-gaming-orange/5 p-5">
                        <div className="flex items-center gap-2 text-lg font-bold text-gaming-orange">👑 Platform Owner</div>
                        <p className="mt-2 text-sm text-ink-700">
                            You're the platform owner. This role is permanent and can't be revoked through the UI — not even by you. It protects the account from hostile admin actions.
                        </p>
                    </div>
                )}

                {role.is_admin && (
                    <div className="mb-4 rounded-xl border border-neon-red/30 bg-neon-red/5 p-5">
                        <div className="flex items-center gap-2 text-lg font-bold text-neon-red">ADMIN</div>
                        <p className="mt-2 text-sm text-ink-700">
                            You have full platform access: user bans, role management, games, reports, and moderation tools.
                        </p>
                        {!role.is_owner && (
                            <button
                                onClick={stepDownAdmin}
                                className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/10"
                            >
                                Step down from admin
                            </button>
                        )}
                    </div>
                )}

                {role.is_moderator && (
                    <div className="mb-4 rounded-xl border border-gaming-cyan/30 bg-gaming-cyan/5 p-5">
                        <div className="flex items-center gap-2 text-lg font-bold text-gaming-cyan">MODERATOR</div>
                        <p className="mt-2 text-sm text-ink-700">
                            You can hide, lock, and pin community posts and comments, and review reports in the mod queue.
                        </p>
                        <button
                            onClick={stepDownMod}
                            className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/10"
                        >
                            Step down from moderator
                        </button>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
