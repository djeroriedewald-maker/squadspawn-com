import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

export default function AgeVerification() {
    const [showParentalConsent, setShowParentalConsent] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        date_of_birth: '',
        parental_consent: false as boolean,
    });

    const checkAge = (dob: string) => {
        setData('date_of_birth', dob);
        if (dob) {
            const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            setShowParentalConsent(age >= 13 && age < 16);
        } else {
            setShowParentalConsent(false);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('age-verification.store'));
    };

    return (
        <GuestLayout>
            <Head title="Age Verification" />

            <div className="mb-4 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gaming-purple/10">
                    <svg className="h-7 w-7 text-gaming-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                </div>
                <h2 className="text-lg font-bold text-white">Age Verification</h2>
                <p className="mt-1 text-sm text-gray-400">
                    To keep our community safe, we need to verify your age before you can continue.
                </p>
            </div>

            <form onSubmit={submit}>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Date of Birth</label>
                    <input
                        type="date"
                        value={data.date_of_birth}
                        onChange={(e) => checkAge(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-navy-700 px-4 py-2.5 text-white focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                        required
                    />
                    <InputError message={errors.date_of_birth} className="mt-2" />
                    <p className="mt-1 text-[10px] text-gray-500">You must be at least 13 years old to use SquadSpawn.</p>
                </div>

                {showParentalConsent && (
                    <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
                        <label className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                checked={data.parental_consent}
                                onChange={(e) => setData('parental_consent', e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-white/20 bg-navy-700 text-gaming-purple focus:ring-gaming-purple"
                            />
                            <span className="text-sm text-gray-300">
                                <strong className="text-yellow-400">Parental Consent Required:</strong> I confirm that my parent or legal guardian has given consent for me to use this platform, in accordance with GDPR Article 8.
                            </span>
                        </label>
                        <InputError message={errors.parental_consent} className="mt-2" />
                    </div>
                )}

                <div className="mt-4 rounded-lg border border-white/5 bg-navy-900/50 p-3">
                    <p className="text-[11px] leading-relaxed text-gray-500">
                        <strong className="text-gray-400">Safety Notice:</strong> SquadSpawn is committed to online safety. We do not share your date of birth with other users. If you are under 16, please ensure a parent or guardian is aware of your use of this platform.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="mt-6 w-full rounded-lg bg-gaming-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gaming-purple/80 disabled:opacity-50"
                >
                    {processing ? 'Verifying...' : 'Continue'}
                </button>
            </form>
        </GuestLayout>
    );
}
