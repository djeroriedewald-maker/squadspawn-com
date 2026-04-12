import { Head, Link } from '@inertiajs/react';

export default function TermsOfService() {
    return (
        <>
            <Head title="Terms of Service" />
            <div className="min-h-screen bg-navy-900 text-white">
                <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
                    <Link href="/" className="text-2xl font-bold text-gaming-purple">SquadSpawn</Link>
                </nav>
                <div className="mx-auto max-w-3xl px-6 py-12">
                    <h1 className="mb-8 text-3xl font-bold">Terms of Service</h1>
                    <div className="space-y-6 text-sm leading-relaxed text-gray-300">
                        <p className="text-gray-400">Last updated: April 12, 2026</p>

                        <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
                        <p>By accessing and using SquadSpawn, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>

                        <h2 className="text-xl font-semibold text-white">2. Eligibility</h2>
                        <p>You must be at least 13 years old to use SquadSpawn. If you are under 18, you must have parental consent.</p>

                        <h2 className="text-xl font-semibold text-white">3. User Accounts</h2>
                        <p>You are responsible for maintaining the security of your account. You must provide accurate information and keep it up to date. One person may only maintain one account.</p>

                        <h2 className="text-xl font-semibold text-white">4. Acceptable Use</h2>
                        <p>You agree not to:</p>
                        <ul className="ml-4 list-disc space-y-1 text-gray-400">
                            <li>Upload inappropriate, offensive, or sexually explicit content</li>
                            <li>Harass, bully, or threaten other users</li>
                            <li>Impersonate other people or create fake profiles</li>
                            <li>Use the platform for commercial spam or advertising</li>
                            <li>Attempt to exploit or hack the platform</li>
                            <li>Violate any applicable laws or regulations</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-white">5. Content</h2>
                        <p>You retain ownership of content you upload. By uploading, you grant SquadSpawn a license to display it on the platform. We reserve the right to remove content that violates these terms.</p>

                        <h2 className="text-xl font-semibold text-white">6. Termination</h2>
                        <p>We may suspend or terminate your account if you violate these terms. You may delete your account at any time through your settings.</p>

                        <h2 className="text-xl font-semibold text-white">7. Disclaimer</h2>
                        <p>SquadSpawn is provided "as is" without warranties. We are not responsible for interactions between users outside our platform.</p>

                        <h2 className="text-xl font-semibold text-white">8. Contact</h2>
                        <p>For questions about these terms, contact us at <a href="mailto:info@squadspawn.com" className="text-gaming-purple hover:underline">info@squadspawn.com</a>.</p>
                    </div>
                </div>
            </div>
        </>
    );
}
