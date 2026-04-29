import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface RegisterProps {
    founderSpotsLeft?: number;
    isFounderPhase?: boolean;
}

export default function Register({ founderSpotsLeft, isFounderPhase }: RegisterProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        date_of_birth: '',
        terms_accepted: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (!data.terms_accepted) return;

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register">
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            {/* Founder-phase context — the homepage promises a founder
                slot; this banner closes the loop on the registration form. */}
            {isFounderPhase && founderSpotsLeft !== undefined && founderSpotsLeft > 0 && (
                <div className="mb-5 rounded-lg border border-neon-red/30 bg-neon-red/5 p-3 text-center text-xs text-ink-700">
                    <strong className="text-neon-red">★ Founder phase</strong> — {founderSpotsLeft} permanent founder spots left.
                    Sign up now and your profile carries the badge for life.
                </div>
            )}

            <div className="space-y-2">
                <a
                    href={route('auth.google')}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-ink-900/10 bg-bone-100 px-4 py-3 text-sm font-medium text-ink-900 transition hover:bg-bone-100/80"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign up with Google
                </a>
                <a
                    href={route('auth.discord')}
                    className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#5865F2] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#4752c4]"
                >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    Sign up with Discord
                </a>
            </div>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-ink-900/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-gray-500">or</span>
                </div>
            </div>

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                        minLength={8}
                    />

                    <p className="mt-1 text-[11px] text-ink-500">8+ characters. Mix in numbers and symbols for extra strength.</p>
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="date_of_birth" value="Date of Birth" />
                    <TextInput
                        id="date_of_birth"
                        type="date"
                        name="date_of_birth"
                        value={data.date_of_birth}
                        className="mt-1 block w-full"
                        onChange={(e) => setData('date_of_birth', e.target.value)}
                        required
                    />
                    <InputError message={errors.date_of_birth} className="mt-2" />
                    <p className="mt-1 text-[10px] text-gray-500">You must be at least 16 years old to sign up.</p>
                </div>

                <div className="mt-5">
                    <label className="flex cursor-pointer items-start gap-2 text-xs text-ink-700">
                        <input
                            type="checkbox"
                            checked={data.terms_accepted}
                            onChange={(e) => setData('terms_accepted', e.target.checked)}
                            required
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-900/20 text-neon-red focus:ring-neon-red/30"
                        />
                        <span>
                            I'm 16+ and I accept SquadSpawn's{' '}
                            <Link href="/terms-of-service" target="_blank" className="text-neon-red underline hover:text-neon-red/80">Terms of Service</Link>
                            {' '}and{' '}
                            <Link href="/privacy-policy" target="_blank" className="text-neon-red underline hover:text-neon-red/80">Privacy Policy</Link>.
                        </span>
                    </label>
                </div>

                <div className="mt-5 flex items-center justify-end">
                    <Link
                        href={route('login')}
                        className="rounded-md text-sm text-ink-500 underline hover:text-ink-900 focus:outline-none focus:ring-2 focus:ring-neon-red/40 focus:ring-offset-2"
                    >
                        Already registered?
                    </Link>

                    <PrimaryButton className="ms-4" disabled={processing || !data.terms_accepted}>
                        Register
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
