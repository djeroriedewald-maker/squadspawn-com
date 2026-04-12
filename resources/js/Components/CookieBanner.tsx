import { useEffect, useState } from 'react';

export default function CookieBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem('cookie_consent')) {
            setVisible(true);
        }
    }, []);

    const accept = () => {
        localStorage.setItem('cookie_consent', 'accepted');
        setVisible(false);
    };

    const decline = () => {
        localStorage.setItem('cookie_consent', 'declined');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-navy-800 p-4 shadow-lg sm:p-6">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row">
                <p className="flex-1 text-sm text-gray-300">
                    We use cookies to improve your experience. By continuing to use SquadSpawn, you agree to our{' '}
                    <a href="/cookie-policy" className="text-gaming-purple hover:underline">Cookie Policy</a>.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={decline}
                        className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-400 transition hover:bg-navy-700 hover:text-white"
                    >
                        Decline
                    </button>
                    <button
                        onClick={accept}
                        className="rounded-lg bg-gaming-purple px-4 py-2 text-sm font-semibold text-white transition hover:bg-gaming-purple/80"
                    >
                        Accept Cookies
                    </button>
                </div>
            </div>
        </div>
    );
}
