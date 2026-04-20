import NotificationPreferences from '@/Components/NotificationPreferences';
import SteamLink from '@/Components/SteamLink';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-ink-900">
                    Settings
                </h2>
            }
        >
            <Head title="Settings" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="rounded-xl border border-ink-900/10 bg-white p-4 sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="rounded-xl border border-ink-900/10 bg-white p-4 sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="rounded-xl border border-ink-900/10 bg-white p-4 sm:p-8">
                        <NotificationPreferences />
                    </div>

                    <div className="rounded-xl border border-ink-900/10 bg-white p-4 sm:p-8">
                        <SteamLink />
                    </div>

                    <div className="rounded-xl border border-ink-900/10 bg-white p-4 sm:p-8">
                        <section className="max-w-xl space-y-4">
                            <header>
                                <h2 className="text-lg font-medium text-ink-900">Download your data</h2>
                                <p className="mt-1 text-sm text-ink-500">
                                    Get a copy of all the information SquadSpawn holds about you — profile, games,
                                    ratings, messages, posts, achievements — as a JSON file. Meets the right to data
                                    portability (GDPR Art. 20).
                                </p>
                            </header>
                            <a
                                href={route('profile.dataExport')}
                                className="inline-flex items-center gap-2 rounded-md border border-ink-900/10 bg-white px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-neon-red hover:text-neon-red"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0-3-3m3 3 3-3M3 17V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                </svg>
                                Download my data (JSON)
                            </a>
                        </section>
                    </div>

                    <div className="rounded-xl border border-ink-900/10 bg-white p-4 sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
