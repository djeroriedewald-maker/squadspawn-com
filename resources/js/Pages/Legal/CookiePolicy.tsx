import { Head, Link } from '@inertiajs/react';

export default function CookiePolicy() {
    return (
        <>
            <Head title="Cookie Policy" />
            <div className="min-h-screen bg-navy-900 text-white">
                <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
                    <Link href="/" className="text-2xl font-bold text-gaming-purple">SquadSpawn</Link>
                </nav>
                <div className="mx-auto max-w-3xl px-6 py-12">
                    <h1 className="mb-8 text-3xl font-bold">Cookie Policy</h1>
                    <div className="space-y-6 text-sm leading-relaxed text-gray-300">
                        <p className="text-gray-400">Last updated: April 12, 2026</p>

                        <h2 className="text-xl font-semibold text-white">1. What Are Cookies</h2>
                        <p>Cookies are small text files stored on your device when you visit our website. They help us provide a better experience by remembering your preferences and login status.</p>

                        <h2 className="text-xl font-semibold text-white">2. Cookies We Use</h2>

                        <h3 className="text-lg font-medium text-white">Essential Cookies</h3>
                        <p>These are required for the platform to function. They include:</p>
                        <ul className="ml-4 list-disc space-y-1 text-gray-400">
                            <li><strong className="text-gray-300">Session cookie</strong> - Keeps you logged in during your visit</li>
                            <li><strong className="text-gray-300">CSRF token</strong> - Protects against cross-site request forgery</li>
                            <li><strong className="text-gray-300">Cookie consent</strong> - Remembers your cookie preferences</li>
                        </ul>

                        <h3 className="text-lg font-medium text-white">Functional Cookies</h3>
                        <p>These remember your preferences:</p>
                        <ul className="ml-4 list-disc space-y-1 text-gray-400">
                            <li><strong className="text-gray-300">Remember me</strong> - Keeps you logged in between sessions</li>
                            <li><strong className="text-gray-300">Language preference</strong> - Stores your preferred language</li>
                        </ul>

                        <h3 className="text-lg font-medium text-white">Analytics Cookies</h3>
                        <p>We may use analytics cookies to understand how visitors use our platform. This data is anonymized and helps us improve our service.</p>

                        <h2 className="text-xl font-semibold text-white">3. Managing Cookies</h2>
                        <p>You can manage cookies through your browser settings. Note that disabling essential cookies may prevent you from using certain features of the platform.</p>

                        <h2 className="text-xl font-semibold text-white">4. Contact</h2>
                        <p>For questions about our cookie policy, contact us at <a href="mailto:info@squadspawn.com" className="text-gaming-purple hover:underline">info@squadspawn.com</a>.</p>
                    </div>
                </div>
            </div>
        </>
    );
}
