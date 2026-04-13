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
                        <p className="text-gray-400">Last updated: April 13, 2026</p>

                        <p>
                            This Cookie Policy explains how SquadSpawn ("we," "us," or "our"), operated by
                            BudgetPixels.nl, uses cookies and similar technologies when you visit our platform at{' '}
                            <a href="https://squadspawn.com" className="text-gaming-purple hover:underline">squadspawn.com</a>.
                            This policy should be read alongside our{' '}
                            <Link href="/privacy-policy" className="text-gaming-purple hover:underline">Privacy Policy</Link>.
                        </p>

                        {/* 1. What Are Cookies */}
                        <h2 className="text-xl font-semibold text-white">1. What Are Cookies</h2>
                        <p>
                            Cookies are small text files that are placed on your device (computer, tablet, or mobile
                            phone) when you visit a website. They are widely used to make websites work efficiently,
                            provide a better user experience, and supply information to the site owners. Cookies can be
                            "session" cookies (which are deleted when you close your browser) or "persistent" cookies
                            (which remain on your device for a set period or until you delete them).
                        </p>

                        {/* 2. Essential Cookies */}
                        <h2 className="text-xl font-semibold text-white">2. Cookies We Use</h2>

                        <h3 className="text-lg font-medium text-white">2.1 Essential Cookies (Strictly Necessary)</h3>
                        <p>
                            These cookies are required for the platform to function correctly. They cannot be disabled.
                            Without these cookies, the platform cannot operate properly.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-gray-400">
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="py-2 pr-4 text-gray-300">Cookie</th>
                                        <th className="py-2 pr-4 text-gray-300">Purpose</th>
                                        <th className="py-2 text-gray-300">Duration</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    <tr>
                                        <td className="py-2 pr-4 font-mono text-xs">laravel_session</td>
                                        <td className="py-2 pr-4">Maintains your authenticated session and keeps you logged in during your visit.</td>
                                        <td className="py-2">2 hours</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 font-mono text-xs">XSRF-TOKEN</td>
                                        <td className="py-2 pr-4">Protects against Cross-Site Request Forgery (CSRF) attacks by validating that form submissions originate from our platform.</td>
                                        <td className="py-2">2 hours</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 font-mono text-xs">cookie_consent</td>
                                        <td className="py-2 pr-4">Stores your cookie consent preferences so we do not ask you repeatedly.</td>
                                        <td className="py-2">12 months</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 2.2 Functional Cookies */}
                        <h3 className="text-lg font-medium text-white">2.2 Functional Cookies</h3>
                        <p>
                            These cookies enable enhanced functionality and personalization. They may be set by us or
                            by third-party providers whose services we use. If you do not allow these cookies, some
                            features may not function properly.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-gray-400">
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="py-2 pr-4 text-gray-300">Cookie</th>
                                        <th className="py-2 pr-4 text-gray-300">Purpose</th>
                                        <th className="py-2 text-gray-300">Duration</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    <tr>
                                        <td className="py-2 pr-4 font-mono text-xs">remember_web_*</td>
                                        <td className="py-2 pr-4">Keeps you logged in between browser sessions when you select "Remember Me" during login.</td>
                                        <td className="py-2">30 days</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 font-mono text-xs">locale</td>
                                        <td className="py-2 pr-4">Stores your preferred language setting for the platform interface.</td>
                                        <td className="py-2">12 months</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 2.3 Analytics Cookies */}
                        <h3 className="text-lg font-medium text-white">2.3 Analytics Cookies</h3>
                        <p>
                            We may use analytics cookies to understand how visitors interact with our platform. This
                            helps us improve the user experience, identify popular features, and detect issues. Analytics
                            data is anonymized and aggregated.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-gray-400">
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="py-2 pr-4 text-gray-300">Cookie</th>
                                        <th className="py-2 pr-4 text-gray-300">Purpose</th>
                                        <th className="py-2 text-gray-300">Duration</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    <tr>
                                        <td className="py-2 pr-4 font-mono text-xs">_ga</td>
                                        <td className="py-2 pr-4">Google Analytics cookie used to distinguish unique users. IP addresses are anonymized.</td>
                                        <td className="py-2">24 months</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 font-mono text-xs">_ga_*</td>
                                        <td className="py-2 pr-4">Google Analytics cookie used to maintain session state.</td>
                                        <td className="py-2">24 months</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p>
                            Analytics cookies are only set with your consent. You can opt out of Google Analytics across
                            all websites by installing the{' '}
                            <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-gaming-purple hover:underline">
                                Google Analytics Opt-out Browser Add-on
                            </a>.
                        </p>

                        {/* 2.4 Third-Party Cookies */}
                        <h3 className="text-lg font-medium text-white">2.4 Third-Party Cookies</h3>
                        <p>
                            Certain third-party services integrated into SquadSpawn may set their own cookies. We do not
                            control these cookies. The following third-party services may place cookies on your device:
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-gray-400">
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="py-2 pr-4 text-gray-300">Service</th>
                                        <th className="py-2 pr-4 text-gray-300">Purpose</th>
                                        <th className="py-2 text-gray-300">Policy</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    <tr>
                                        <td className="py-2 pr-4">Google OAuth</td>
                                        <td className="py-2 pr-4">Enables "Sign in with Google" functionality. Google may set authentication cookies when you use this feature.</td>
                                        <td className="py-2">
                                            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gaming-purple hover:underline">
                                                Google Privacy Policy
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4">YouTube</td>
                                        <td className="py-2 pr-4">When gaming clips are embedded from YouTube, Google may set cookies for video playback and analytics.</td>
                                        <td className="py-2">
                                            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gaming-purple hover:underline">
                                                Google Privacy Policy
                                            </a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 3. How to Manage Cookies */}
                        <h2 className="text-xl font-semibold text-white">3. How to Manage Cookies</h2>
                        <p>
                            You have several options for managing cookies:
                        </p>

                        <h3 className="text-lg font-medium text-white">3.1 Cookie Consent Banner</h3>
                        <p>
                            When you first visit SquadSpawn, you will be presented with a cookie consent banner that
                            allows you to accept or decline non-essential cookies. You can change your preferences at
                            any time through the cookie settings on our platform.
                        </p>

                        <h3 className="text-lg font-medium text-white">3.2 Browser Settings</h3>
                        <p>
                            Most web browsers allow you to control cookies through their settings. You can typically
                            find these options in the "Settings," "Preferences," or "Privacy" section of your browser.
                            Here are links to cookie management instructions for common browsers:
                        </p>
                        <ul className="ml-4 list-disc space-y-1 text-gray-400">
                            <li>
                                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-gaming-purple hover:underline">
                                    Google Chrome
                                </a>
                            </li>
                            <li>
                                <a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-gaming-purple hover:underline">
                                    Mozilla Firefox
                                </a>
                            </li>
                            <li>
                                <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-gaming-purple hover:underline">
                                    Apple Safari
                                </a>
                            </li>
                            <li>
                                <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-gaming-purple hover:underline">
                                    Microsoft Edge
                                </a>
                            </li>
                        </ul>

                        <h3 className="text-lg font-medium text-white">3.3 Opt-Out Links</h3>
                        <p>For specific third-party cookies, you can use these opt-out tools:</p>
                        <ul className="ml-4 list-disc space-y-1 text-gray-400">
                            <li>
                                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-gaming-purple hover:underline">
                                    Google Analytics Opt-out
                                </a>
                            </li>
                            <li>
                                <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-gaming-purple hover:underline">
                                    Google Ad Settings
                                </a>
                            </li>
                        </ul>

                        <p>
                            Please note that disabling essential cookies may prevent certain features of the platform
                            from functioning correctly. You may not be able to log in or use SquadSpawn if essential
                            cookies are blocked.
                        </p>

                        {/* 4. Changes to This Cookie Policy */}
                        <h2 className="text-xl font-semibold text-white">4. Changes to This Cookie Policy</h2>
                        <p>
                            We may update this Cookie Policy from time to time to reflect changes in the cookies we use,
                            changes in technology, or changes in applicable laws. When we make changes, we will update
                            the "Last updated" date at the top of this page. For significant changes, we may also
                            notify you through a cookie consent banner refresh or a notice on the platform. We encourage
                            you to review this policy periodically.
                        </p>

                        {/* 5. Contact Information */}
                        <h2 className="text-xl font-semibold text-white">5. Contact Information</h2>
                        <p>
                            If you have any questions about our use of cookies or this Cookie Policy, please contact us:
                        </p>
                        <p>
                            <strong className="text-gray-200">SquadSpawn</strong> — operated by BudgetPixels.nl<br />
                            <strong className="text-gray-200">Email:</strong>{' '}
                            <a href="mailto:info@squadspawn.com" className="text-gaming-purple hover:underline">info@squadspawn.com</a><br />
                            <strong className="text-gray-200">Website:</strong>{' '}
                            <a href="https://squadspawn.com" className="text-gaming-purple hover:underline">squadspawn.com</a>
                        </p>
                        <p>
                            For more information about how we handle your personal data, please see our{' '}
                            <Link href="/privacy-policy" className="text-gaming-purple hover:underline">Privacy Policy</Link>.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
