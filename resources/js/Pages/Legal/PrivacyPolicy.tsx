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
                        <p className="text-gray-400">Last updated: April 13, 2026</p>

                        <p>
                            This Privacy Policy explains how SquadSpawn ("we," "us," or "our") collects, uses, shares,
                            and protects your personal data when you use our platform at{' '}
                            <a href="https://squadspawn.com" className="text-gaming-purple hover:underline">squadspawn.com</a>.
                            We are committed to protecting your privacy and complying with the General Data Protection
                            Regulation (GDPR) and other applicable data protection laws.
                        </p>

                        {/* 1. Who We Are */}
                        <h2 className="text-xl font-semibold text-white">1. Who We Are</h2>
                        <p>
                            SquadSpawn is a gaming matchmaking platform that helps gamers find compatible teammates,
                            form groups, and connect with the gaming community. SquadSpawn is built and operated by
                            BudgetPixels.nl, based in the Netherlands.
                        </p>
                        <p>
                            <strong className="text-gray-200">Data Controller:</strong> BudgetPixels.nl<br />
                            <strong className="text-gray-200">Contact Email:</strong>{' '}
                            <a href="mailto:info@squadspawn.com" className="text-gaming-purple hover:underline">info@squadspawn.com</a><br />
                            <strong className="text-gray-200">Website:</strong>{' '}
                            <a href="https://squadspawn.com" className="text-gaming-purple hover:underline">squadspawn.com</a>
                        </p>

                        {/* 2. What Data We Collect */}
                        <h2 className="text-xl font-semibold text-white">2. What Data We Collect</h2>

                        <h3 className="text-lg font-medium text-white">2.1 Account Information</h3>
                        <p>When you create an account, we collect:</p>
                        <ul className="ml-4 list-disc space-y-1 text-gray-400">
                            <li>Full name</li>
                            <li>Email address</li>
                            <li>Password (stored as a secure hash — we never store your plain-text password)</li>
                        </ul>

                        <h3 className="text-lg font-medium text-white">2.2 Gaming Profile Information</h3>
                        <p>To enable matchmaking and community features, we collect:</p>
                        <ul className="ml-4 list-disc space-y-1 text-gray-400">
                            <li>Username and display name</li>
                            <li>Bio and about-me text</li>
                            <li>Avatar image</li>
                            <li>Region and timezone</li>
                            <li>Games you play and your ranks in those games</li>
                            <li>Preferred roles and playstyles</li>
                            <li>Linked social accounts (e.g., Discord, Steam, Xbox, PlayStation)</li>
                        </ul>

                        <h3 className="text-lg font-medium text-white">2.3 Usage Data</h3>
                        <p>As you use the platform, we collect data about your interactions:</p>
                        <ul className="ml-4 list-disc space-y-1 text-gray-400">
                            <li>Likes and passes on other profiles (matchmaking swipes)</li>
                            <li>Friend connections and friend requests</li>
                            <li>Messages sent and received through the chat system</li>
                            <li>LFG (Looking For Group) posts you create or join</li>
                            <li>Clips and media you upload or share</li>
                        </ul>

                        <h3 className="text-lg font-medium text-white">2.4 Technical Data</h3>
                        <p>We automatically collect certain technical data when you visit our platform:</p>
                        <ul className="ml-4 list-disc space-y-1 text-gray-400">
                            <li>IP address</li>
                            <li>Browser type and version</li>
                            <li>Operating system</li>
                            <li>Cookies and session identifiers</li>
                            <li>Pages visited, referring URLs, and timestamps</li>
                            <li>Device information</li>
                        </ul>

                        <h3 className="text-lg font-medium text-white">2.5 Google OAuth Data</h3>
                        <p>
                            If you choose to sign in with Google, we receive your name and email address from Google.
                            We do not receive your Google password. Google's use of your data is governed by{' '}
                            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gaming-purple hover:underline">
                                Google's Privacy Policy
                            </a>.
                        </p>

                        {/* 3. Legal Basis for Processing */}
                        <h2 className="text-xl font-semibold text-white">3. Legal Basis for Processing (GDPR Article 6)</h2>
                        <p>We process your personal data based on the following legal grounds:</p>
                        <ul className="ml-4 list-disc space-y-2 text-gray-400">
                            <li>
                                <strong className="text-gray-300">Contract Performance (Art. 6(1)(b)):</strong> Processing
                                necessary to provide you with the SquadSpawn service, including account management,
                                matchmaking, messaging, and LFG features.
                            </li>
                            <li>
                                <strong className="text-gray-300">Consent (Art. 6(1)(a)):</strong> Where you have given
                                explicit consent, such as for analytics cookies, marketing communications, or connecting
                                third-party accounts.
                            </li>
                            <li>
                                <strong className="text-gray-300">Legitimate Interests (Art. 6(1)(f)):</strong> Processing
                                necessary for our legitimate interests, including platform security, fraud prevention,
                                improving our services, and ensuring a safe community environment. We balance these interests
                                against your rights and freedoms.
                            </li>
                            <li>
                                <strong className="text-gray-300">Legal Obligation (Art. 6(1)(c)):</strong> Processing
                                necessary to comply with legal obligations, such as responding to lawful requests from
                                authorities.
                            </li>
                        </ul>

                        {/* 4. How We Use Your Data */}
                        <h2 className="text-xl font-semibold text-white">4. How We Use Your Data</h2>
                        <p>We use your personal data for the following purposes:</p>
                        <ul className="ml-4 list-disc space-y-1 text-gray-400">
                            <li>Providing and operating the matchmaking service</li>
                            <li>Matching you with compatible gaming partners based on your profile, games, ranks, and preferences</li>
                            <li>Enabling friend connections and social features</li>
                            <li>Facilitating LFG group creation and discovery</li>
                            <li>Providing in-platform chat and messaging</li>
                            <li>Sending notifications about matches, messages, friend requests, and platform updates</li>
                            <li>Displaying your profile to other users for matchmaking purposes</li>
                            <li>Analyzing usage patterns to improve the platform and user experience</li>
                            <li>Ensuring platform security and preventing abuse</li>
                            <li>Complying with legal obligations</li>
                        </ul>

                        {/* 5. Data Sharing */}
                        <h2 className="text-xl font-semibold text-white">5. Who We Share Your Data With</h2>

                        <h3 className="text-lg font-medium text-white">5.1 Other Users</h3>
                        <p>
                            Your gaming profile is <strong className="text-white">public by default</strong>. This means
                            other SquadSpawn users can see your username, avatar, bio, games, ranks, roles, region, and
                            linked social accounts. This is necessary for the matchmaking system to function. You can
                            control certain visibility settings through your account settings.
                        </p>

                        <h3 className="text-lg font-medium text-white">5.2 Service Providers</h3>
                        <p>
                            We share data with trusted third-party service providers who help us operate the platform,
                            including hosting providers, email delivery services, and content delivery networks. These
                            providers are contractually obligated to protect your data and process it only on our
                            instructions.
                        </p>

                        <h3 className="text-lg font-medium text-white">5.3 Law Enforcement</h3>
                        <p>
                            We may disclose your data to law enforcement authorities or regulatory bodies if required
                            by law, court order, or governmental regulation, or if we believe disclosure is necessary
                            to protect the safety of our users or the public.
                        </p>

                        <h3 className="text-lg font-medium text-white">5.4 No Selling of Data</h3>
                        <p>
                            We do not sell, rent, or trade your personal data to third parties for their marketing purposes.
                        </p>

                        {/* 6. Data Retention */}
                        <h2 className="text-xl font-semibold text-white">6. Data Retention</h2>
                        <ul className="ml-4 list-disc space-y-2 text-gray-400">
                            <li>
                                <strong className="text-gray-300">Account data:</strong> Retained for as long as your
                                account remains active. Upon account deletion, your personal data will be permanently
                                deleted within 30 days.
                            </li>
                            <li>
                                <strong className="text-gray-300">Messages:</strong> Chat messages are retained while both
                                participants have active accounts. Messages are permanently deleted when both users involved
                                in a conversation have deleted their accounts.
                            </li>
                            <li>
                                <strong className="text-gray-300">Usage data and logs:</strong> Technical logs and usage
                                data are retained for up to 12 months for security and analytics purposes, then anonymized
                                or deleted.
                            </li>
                            <li>
                                <strong className="text-gray-300">Backups:</strong> Data may persist in encrypted backups
                                for up to 30 days after deletion before being fully purged.
                            </li>
                        </ul>

                        {/* 7. Your Rights Under GDPR */}
                        <h2 className="text-xl font-semibold text-white">7. Your Rights Under the GDPR</h2>
                        <p>As a data subject, you have the following rights under the GDPR:</p>
                        <ul className="ml-4 list-disc space-y-2 text-gray-400">
                            <li>
                                <strong className="text-gray-300">Right of Access (Art. 15):</strong> You have the right
                                to obtain confirmation of whether we process your personal data and to request a copy of
                                that data.
                            </li>
                            <li>
                                <strong className="text-gray-300">Right to Rectification (Art. 16):</strong> You have the
                                right to request correction of inaccurate personal data or completion of incomplete data.
                            </li>
                            <li>
                                <strong className="text-gray-300">Right to Erasure (Art. 17):</strong> You have the right
                                to request deletion of your personal data, subject to certain legal exceptions.
                            </li>
                            <li>
                                <strong className="text-gray-300">Right to Restriction of Processing (Art. 18):</strong> You
                                have the right to request that we restrict the processing of your data in certain
                                circumstances.
                            </li>
                            <li>
                                <strong className="text-gray-300">Right to Data Portability (Art. 20):</strong> You have
                                the right to receive your personal data in a structured, commonly used, and
                                machine-readable format and to transmit it to another controller.
                            </li>
                            <li>
                                <strong className="text-gray-300">Right to Object (Art. 21):</strong> You have the right
                                to object to the processing of your personal data based on legitimate interests or for
                                direct marketing purposes.
                            </li>
                            <li>
                                <strong className="text-gray-300">Right to Withdraw Consent (Art. 7(3)):</strong> Where
                                processing is based on consent, you have the right to withdraw your consent at any time.
                                Withdrawal does not affect the lawfulness of processing carried out before the withdrawal.
                            </li>
                        </ul>

                        <h3 className="text-lg font-medium text-white">How to Exercise Your Rights</h3>
                        <p>
                            You can exercise most of these rights directly through your account settings on SquadSpawn.
                            For any requests you cannot complete through the platform, or if you wish to file a formal
                            request, please contact us at{' '}
                            <a href="mailto:info@squadspawn.com" className="text-gaming-purple hover:underline">info@squadspawn.com</a>.
                            We will respond to your request within 30 days as required by the GDPR.
                        </p>
                        <p>
                            You also have the right to lodge a complaint with a supervisory authority. In the Netherlands,
                            this is the Autoriteit Persoonsgegevens (Dutch Data Protection Authority) at{' '}
                            <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" className="text-gaming-purple hover:underline">
                                autoriteitpersoonsgegevens.nl
                            </a>.
                        </p>

                        {/* 8. Cookies */}
                        <h2 className="text-xl font-semibold text-white">8. Cookies</h2>
                        <p>
                            We use cookies and similar technologies to maintain your session, remember your preferences,
                            and analyze platform usage. For detailed information about the cookies we use and how to
                            manage them, please see our{' '}
                            <Link href="/cookie-policy" className="text-gaming-purple hover:underline">Cookie Policy</Link>.
                        </p>

                        {/* 9. Children's Privacy */}
                        <h2 className="text-xl font-semibold text-white">9. Children's Privacy</h2>
                        <p>
                            SquadSpawn is not intended for children under the age of 13. We do not knowingly collect
                            personal data from children under 13. If you are between 13 and 16 years old, you may only
                            use SquadSpawn with verifiable parental or guardian consent, in accordance with GDPR Article
                            8. If we become aware that we have collected personal data from a child under 13 without
                            appropriate consent, we will take steps to delete that data promptly.
                        </p>
                        <p>
                            If you are a parent or guardian and believe your child has provided us with personal data
                            without your consent, please contact us at{' '}
                            <a href="mailto:info@squadspawn.com" className="text-gaming-purple hover:underline">info@squadspawn.com</a>.
                        </p>

                        {/* 10. Data Security */}
                        <h2 className="text-xl font-semibold text-white">10. Data Security</h2>
                        <p>
                            We implement appropriate technical and organizational measures to protect your personal data
                            against unauthorized access, alteration, disclosure, or destruction. These measures include:
                        </p>
                        <ul className="ml-4 list-disc space-y-1 text-gray-400">
                            <li>Encryption of data in transit using TLS/SSL</li>
                            <li>Secure password hashing using industry-standard algorithms</li>
                            <li>CSRF protection on all forms and state-changing requests</li>
                            <li>Regular security updates and vulnerability patching</li>
                            <li>Access controls limiting who can access personal data</li>
                            <li>Encrypted database backups</li>
                        </ul>
                        <p>
                            While we strive to use commercially acceptable means to protect your data, no method of
                            transmission over the internet or electronic storage is 100% secure. We cannot guarantee
                            absolute security.
                        </p>

                        {/* 11. International Data Transfers */}
                        <h2 className="text-xl font-semibold text-white">11. International Data Transfers</h2>
                        <p>
                            SquadSpawn is operated from the Netherlands. If you are accessing our platform from outside
                            the European Economic Area (EEA), your data may be transferred to and processed in the
                            Netherlands or other countries where our service providers operate. When transferring data
                            outside the EEA, we ensure appropriate safeguards are in place, such as Standard Contractual
                            Clauses (SCCs) approved by the European Commission, or transfers to countries with an
                            adequacy decision.
                        </p>

                        {/* 12. Changes to This Policy */}
                        <h2 className="text-xl font-semibold text-white">12. Changes to This Privacy Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time to reflect changes in our practices,
                            technology, legal requirements, or other factors. When we make material changes, we will
                            notify you by posting the updated policy on this page with a revised "Last updated" date.
                            For significant changes, we may also notify you via email or through a notice on the
                            platform. We encourage you to review this policy periodically.
                        </p>

                        {/* 13. Contact Information */}
                        <h2 className="text-xl font-semibold text-white">13. Contact Information and Data Protection Officer</h2>
                        <p>
                            If you have any questions, concerns, or requests regarding this Privacy Policy or our data
                            processing practices, please contact us:
                        </p>
                        <p>
                            <strong className="text-gray-200">SquadSpawn</strong> — operated by BudgetPixels.nl<br />
                            <strong className="text-gray-200">Email:</strong>{' '}
                            <a href="mailto:info@squadspawn.com" className="text-gaming-purple hover:underline">info@squadspawn.com</a><br />
                            <strong className="text-gray-200">Website:</strong>{' '}
                            <a href="https://squadspawn.com" className="text-gaming-purple hover:underline">squadspawn.com</a>
                        </p>
                        <p>
                            For data protection inquiries, you may also contact our Data Protection Officer (DPO) at{' '}
                            <a href="mailto:info@squadspawn.com" className="text-gaming-purple hover:underline">info@squadspawn.com</a>{' '}
                            with the subject line "DPO Request."
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
