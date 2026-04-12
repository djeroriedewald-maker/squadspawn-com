import { Head, Link } from '@inertiajs/react';

export default function PrivacyPolicy() {
    return (
        <>
            <Head title="Privacy Policy" />
            <div className="min-h-screen bg-navy-900 text-white">
                <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
                    <Link href="/" className="text-2xl font-bold text-gaming-purple">SquadSpawn</Link>
                </nav>
                <div className="mx-auto max-w-3xl px-6 py-12">
                    <h1 className="mb-8 text-3xl font-bold">Privacy Policy</h1>
                    <div className="space-y-6 text-sm leading-relaxed text-gray-300">
                        <p className="text-gray-400">Last updated: April 12, 2026</p>

                        <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
                        <p>When you create an account on SquadSpawn, we collect the following information:</p>
                        <ul className="ml-4 list-disc space-y-1 text-gray-400">
                            <li>Name and email address</li>
                            <li>Gaming profile information (username, bio, region, games, rank)</li>
                            <li>Avatar image (if uploaded)</li>
                            <li>Messages sent through the platform</li>
                            <li>Usage data and analytics</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-white">2. How We Use Your Information</h2>
                        <p>We use your information to:</p>
                        <ul className="ml-4 list-disc space-y-1 text-gray-400">
                            <li>Provide and maintain our matchmaking service</li>
                            <li>Match you with compatible gaming partners</li>
                            <li>Enable communication between matched users</li>
                            <li>Improve our platform and user experience</li>
                            <li>Send important service updates</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-white">3. Data Sharing</h2>
                        <p>We do not sell your personal data. Your gaming profile is visible to other users on the platform. We may share data with:</p>
                        <ul className="ml-4 list-disc space-y-1 text-gray-400">
                            <li>Service providers who help us operate the platform</li>
                            <li>Law enforcement when required by law</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-white">4. Data Security</h2>
                        <p>We implement appropriate security measures to protect your data. However, no method of transmission over the internet is 100% secure.</p>

                        <h2 className="text-xl font-semibold text-white">5. Your Rights (GDPR)</h2>
                        <p>Under the GDPR, you have the right to access, correct, delete, or port your personal data. You can exercise these rights through your account settings or by contacting us at info@squadspawn.com.</p>

                        <h2 className="text-xl font-semibold text-white">6. Cookies</h2>
                        <p>We use cookies to maintain your session and improve your experience. See our <a href="/cookie-policy" className="text-gaming-purple hover:underline">Cookie Policy</a> for more details.</p>

                        <h2 className="text-xl font-semibold text-white">7. Contact</h2>
                        <p>For questions about this policy, contact us at <a href="mailto:info@squadspawn.com" className="text-gaming-purple hover:underline">info@squadspawn.com</a>.</p>
                    </div>
                </div>
            </div>
        </>
    );
}
