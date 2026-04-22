import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

export default function DeleteUserForm({
    className = '',
}: {
    className?: string;
}) {
    const { auth } = usePage().props as any;
    // Users who signed up via Google never set a password, so asking
    // them to type one makes the account un-deletable. Switch to a
    // typed-string confirmation for those accounts.
    const isOAuthOnly = !!auth?.user?.google_id;

    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm<{ password: string; confirmation: string }>({
        password: '',
        confirmation: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => inputRef.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    const canSubmit = isOAuthOnly ? data.confirmation === 'DELETE' : data.password.length > 0;

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-ink-900">
                    Delete Account
                </h2>

                <p className="mt-1 text-sm text-ink-500">
                    Once your account is deleted, all of its resources and data
                    will be permanently deleted. Before deleting your account,
                    please download any data or information that you wish to
                    retain.
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion}>
                Delete Account
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-medium text-ink-900">
                        Are you sure you want to delete your account?
                    </h2>

                    <p className="mt-1 text-sm text-ink-500">
                        Once your account is deleted, all of its resources and
                        data will be permanently deleted.{' '}
                        {isOAuthOnly
                            ? 'Your account signed in with Google, so type the word DELETE in capitals to confirm.'
                            : 'Please enter your password to confirm you would like to permanently delete your account.'}
                    </p>

                    {isOAuthOnly ? (
                        <div className="mt-6">
                            <InputLabel htmlFor="confirmation" value="Type DELETE to confirm" className="sr-only" />
                            <TextInput
                                id="confirmation"
                                type="text"
                                name="confirmation"
                                ref={inputRef}
                                value={data.confirmation}
                                onChange={(e) => setData('confirmation', e.target.value)}
                                className="mt-1 block w-3/4 font-mono tracking-widest"
                                autoComplete="off"
                                autoCapitalize="characters"
                                isFocused
                                placeholder="DELETE"
                            />
                            <InputError message={errors.confirmation} className="mt-2" />
                        </div>
                    ) : (
                        <div className="mt-6">
                            <InputLabel htmlFor="password" value="Password" className="sr-only" />
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                ref={inputRef}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="mt-1 block w-3/4"
                                isFocused
                                placeholder="Password"
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>
                            Cancel
                        </SecondaryButton>

                        <DangerButton className="ms-3" disabled={processing || !canSubmit}>
                            Delete Account
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
