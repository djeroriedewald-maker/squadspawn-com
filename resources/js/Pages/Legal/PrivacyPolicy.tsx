import { Head, Link } from '@inertiajs/react';

export default function PrivacyPolicy() {
    return (
        <>
            <Head title="Privacy Policy" />
            <div className="min-h-screen bg-bone-50 text-ink-900">
                <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
                    <Link href="/" className="text-2xl font-bold text-neon-red">SquadSpawn</Link>
                </nav>
                <div className="mx-auto max-w-3xl px-6 py-12">
                    <h1 className="mb-8 text-3xl font-bold">Privacy Policy</h1>
                    <div className="space-y-6 text-sm leading-relaxed text-ink-700">
                        <p className="text-ink-500">Last updated: April 23, 2026</p>

                        <p>
                            This Privacy Policy explains how SquadSpawn ("we," "us," or "our") collects, uses, shares,
                            and protects your personal data when you use our platform at{' '}
                            <a href="https://squadspawn.com" className="text-neon-red hover:underline">squadspawn.com</a>.
                            We are committed to protecting your privacy and complying with the General Data Protection
                            Regulation (GDPR) and other applicable data protection laws.
                        </p>

                        {/* 1. Who We Are */}
                        <h2 className="text-xl font-semibold text-ink-900">1. Who We Are</h2>
                        <p>
                            SquadSpawn is a gaming matchmaking platform that helps gamers find compatible teammates,
                            form groups, and connect with the gaming community. SquadSpawn is built and operated by
                            BudgetPixels.nl, based in the Netherlands.
                        </p>
                        <p>
                            <strong className="text-ink-800">Data Controller:</strong> BudgetPixels.nl<br />
                            <strong className="text-ink-800">Contact:</strong>{' '}
                            <Link href="/contact" className="text-neon-red hover:underline">our contact form</Link><br />
                            <strong className="text-ink-800">Website:</strong>{' '}
                            <a href="https://squadspawn.com" className="text-neon-red hover:underline">squadspawn.com</a>
                        </p>

                        {/* 2. What Data We Collect */}
                        <h2 className="text-xl font-semibold text-ink-900">2. What Data We Collect</h2>

                        <h3 className="text-lg font-medium text-ink-900">2.1 Account Information</h3>
                        <p>When you create an account, we collect:</p>
                        <ul className="ml-4 list-disc space-y-1 text-ink-500">
                            <li>Full name</li>
                            <li>Email address</li>
                            <li>Password (stored as a secure hash — we never store your plain-text password)</li>
                        </ul>

                        <h3 className="text-lg font-medium text-ink-900">2.2 Gaming Profile Information</h3>
                        <p>To enable matchmaking and community features, we collect:</p>
                        <ul className="ml-4 list-disc space-y-1 text-ink-500">
                            <li>Username and display name</li>
                            <li>Bio and about-me text</li>
                            <li>Avatar image</li>
                            <li>Region and timezone</li>
                            <li>Games you play and your ranks in those games</li>
                            <li>Preferred roles and playstyles</li>
                            <li>Linked social accounts (e.g., Discord, Steam, Xbox, PlayStation)</li>
                        </ul>

                        <h3 className="text-lg font-medium text-ink-900">2.3 Usage Data</h3>
                        <p>As you use the platform, we collect data about your interactions:</p>
                        <ul className="ml-4 list-disc space-y-1 text-ink-500">
                            <li>Likes and passes on other profiles (matchmaking swipes)</li>
                            <li>Friend connections and friend requests</li>
                            <li>Messages sent and received through the chat system</li>
                            <li>LFG (Looking For Group) posts you create or join</li>
                            <li>Clips and media you upload or share</li>
                        </ul>

                        <h3 className="text-lg font-medium text-ink-900">2.4 Technical Data</h3>
                        <p>We automatically collect certain technical data when you visit our platform:</p>
                        <ul className="ml-4 list-disc space-y-1 text-ink-500">
                            <li>IP address</li>
                            <li>Browser type and version</li>
                            <li>Operating system</li>
                            <li>Cookies and session identifiers</li>
                            <li>Pages visited, referring URLs, and timestamps</li>
                            <li>Device information</li>
                        </ul>

                        <h3 className="text-lg font-medium text-ink-900">2.5 Google OAuth Data</h3>
                        <p>
                            If you choose to sign in with Google, we receive your name and email address from Google.
                            We do not receive your Google password. Google's use of your data is governed by{' '}
                            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-neon-red hover:underline">
                                Google's Privacy Policy
                            </a>.
                        </p>

                        <h3 className="text-lg font-medium text-ink-900">2.6 Push Notification Data</h3>
                        <p>
                            If you opt in to push notifications, your browser generates a subscription consisting of an
                            endpoint URL and two encryption keys. We store these only to deliver the messages you asked
                            for (new matches, squad invites, chat pings). No notification content is saved after delivery,
                            and you can turn push off at any time from the Alerts tab or your browser settings — which
                            removes the subscription from our database.
                        </p>

                        <h3 className="text-lg font-medium text-ink-900">2.7 Public Activity Feed</h3>
                        <p>
                            The dashboard shows a short live-activity feed (e.g. "a new gamer joined", "two players
                            became friends"). These entries are <strong>anonymised</strong>: no usernames, avatars or
                            identifiers of the individuals involved are ever sent to other users. Only the type of event
                            and the time of occurrence are visible.
                        </p>

                        {/* 3. Legal Basis for Processing */}
                        <h2 className="text-xl font-semibold text-ink-900">3. Legal Basis for Processing (GDPR Article 6)</h2>
                        <p>We process your personal data based on the following legal grounds:</p>
                        <ul className="ml-4 list-disc space-y-2 text-ink-500">
                            <li>
                                <strong className="text-ink-700">Contract Performance (Art. 6(1)(b)):</strong> Processing
                                necessary to provide you with the SquadSpawn service, including account management,
                                matchmaking, messaging, and LFG features.
                            </li>
                            <li>
                                <strong className="text-ink-700">Consent (Art. 6(1)(a)):</strong> Where you have given
                                explicit consent, such as for analytics cookies, marketing communications, or connecting
                                third-party accounts.
                            </li>
                            <li>
                                <strong className="text-ink-700">Legitimate Interests (Art. 6(1)(f)):</strong> Processing
                                necessary for our legitimate interests, including platform security, fraud prevention,
                                improving our services, and ensuring a safe community environment. We balance these interests
                                against your rights and freedoms.
                            </li>
                            <li>
                                <strong className="text-ink-700">Legal Obligation (Art. 6(1)(c)):</strong> Processing
                                necessary to comply with legal obligations, such as responding to lawful requests from
                                authorities.
                            </li>
                        </ul>

                        {/* 4. How We Use Your Data */}
                        <h2 className="text-xl font-semibold text-ink-900">4. How We Use Your Data</h2>
                        <p>We use your personal data for the following purposes:</p>
                        <ul className="ml-4 list-disc space-y-1 text-ink-500">
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
                        <h2 className="text-xl font-semibold text-ink-900">5. Who We Share Your Data With</h2>

                        <h3 className="text-lg font-medium text-ink-900">5.1 Other Users</h3>
                        <p>
                            Your gaming profile is <strong className="text-ink-900">public by default</strong>. This means
                            other SquadSpawn users can see your username, avatar, bio, games, ranks, roles, region, and
                            linked social accounts. This is necessary for the matchmaking system to function. You can
                            control certain visibility settings through your account settings.
                        </p>

                        <h3 className="text-lg font-medium text-ink-900">5.2 Service Providers (Sub-processors)</h3>
                        <p>
                            We use the following third-party processors to operate the platform. Each has a contractual
                            obligation to protect your data and process it only on our instructions. Where a processor
                            is based outside the EEA, transfers are covered by the European Commission's Standard
                            Contractual Clauses or an adequacy decision.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-ink-500">
                                <thead>
                                    <tr className="border-b border-ink-900/10">
                                        <th className="py-2 pr-4 text-ink-700">Service</th>
                                        <th className="py-2 pr-4 text-ink-700">What it does</th>
                                        <th className="py-2 pr-4 text-ink-700">Data it sees</th>
                                        <th className="py-2 text-ink-700">Region</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-900/5">
                                    <tr>
                                        <td className="py-2 pr-4 align-top">Google (OAuth)</td>
                                        <td className="py-2 pr-4 align-top">"Sign in with Google" flow</td>
                                        <td className="py-2 pr-4 align-top">Google account ID, name, email</td>
                                        <td className="py-2 align-top">US (SCCs)</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 align-top">Valve (Steam Web API)</td>
                                        <td className="py-2 pr-4 align-top">Read public Steam profile + playtime for users who link Steam</td>
                                        <td className="py-2 pr-4 align-top">Steam ID, public profile metadata</td>
                                        <td className="py-2 align-top">US (SCCs)</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 align-top">RAWG</td>
                                        <td className="py-2 pr-4 align-top">Game catalogue, cover art, metadata</td>
                                        <td className="py-2 pr-4 align-top">None — server-to-server, no personal data</td>
                                        <td className="py-2 align-top">US (no personal data transferred)</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 align-top">Plausible Analytics</td>
                                        <td className="py-2 pr-4 align-top">Aggregate page-view statistics (cookie-less)</td>
                                        <td className="py-2 pr-4 align-top">Anonymised hash of page + country, no cookies</td>
                                        <td className="py-2 align-top">EU (Germany)</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 align-top">Web Push endpoints<br />(Mozilla, Google, Apple)</td>
                                        <td className="py-2 pr-4 align-top">Delivers browser push notifications to opted-in users</td>
                                        <td className="py-2 pr-4 align-top">Browser-generated push subscription (endpoint URL + keys)</td>
                                        <td className="py-2 align-top">US/EU (SCCs where applicable)</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 align-top">Hosting &amp; storage</td>
                                        <td className="py-2 pr-4 align-top">Application hosting, database, file storage, encrypted backups</td>
                                        <td className="py-2 pr-4 align-top">All stored platform data</td>
                                        <td className="py-2 align-top">EU</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p>
                            We do not use advertising networks, marketing pixels, or data brokers. We never share your
                            data with third parties for their own marketing purposes.
                        </p>

                        <h3 className="text-lg font-medium text-ink-900">5.3 Law Enforcement</h3>
                        <p>
                            We may disclose your data to law enforcement authorities or regulatory bodies if required
                            by law, court order, or governmental regulation, or if we believe disclosure is necessary
                            to protect the safety of our users or the public.
                        </p>

                        <h3 className="text-lg font-medium text-ink-900">5.4 No Selling of Data</h3>
                        <p>
                            We do not sell, rent, or trade your personal data to third parties for their marketing purposes.
                        </p>

                        {/* 6. Data Retention */}
                        <h2 className="text-xl font-semibold text-ink-900">6. Data Retention</h2>
                        <ul className="ml-4 list-disc space-y-2 text-ink-500">
                            <li>
                                <strong className="text-ink-700">Account data:</strong> Retained for as long as your
                                account remains active. Upon account deletion, your personal data will be permanently
                                deleted within 30 days.
                            </li>
                            <li>
                                <strong className="text-ink-700">Messages:</strong> Chat messages are retained while both
                                participants have active accounts. Messages are permanently deleted when both users involved
                                in a conversation have deleted their accounts.
                            </li>
                            <li>
                                <strong className="text-ink-700">Usage data and logs:</strong> Technical logs and usage
                                data are retained for up to 12 months for security and analytics purposes, then anonymized
                                or deleted.
                            </li>
                            <li>
                                <strong className="text-ink-700">Backups:</strong> Data may persist in encrypted backups
                                for up to 30 days after deletion before being fully purged.
                            </li>
                        </ul>

                        {/* 7. Your Rights Under GDPR */}
                        <h2 className="text-xl font-semibold text-ink-900">7. Your Rights Under the GDPR</h2>
                        <p>As a data subject, you have the following rights under the GDPR:</p>
                        <ul className="ml-4 list-disc space-y-2 text-ink-500">
                            <li>
                                <strong className="text-ink-700">Right of Access (Art. 15):</strong> You have the right
                                to obtain confirmation of whether we process your personal data and to request a copy of
                                that data.
                            </li>
                            <li>
                                <strong className="text-ink-700">Right to Rectification (Art. 16):</strong> You have the
                                right to request correction of inaccurate personal data or completion of incomplete data.
                            </li>
                            <li>
                                <strong className="text-ink-700">Right to Erasure (Art. 17):</strong> You have the right
                                to request deletion of your personal data, subject to certain legal exceptions.
                            </li>
                            <li>
                                <strong className="text-ink-700">Right to Restriction of Processing (Art. 18):</strong> You
                                have the right to request that we restrict the processing of your data in certain
                                circumstances.
                            </li>
                            <li>
                                <strong className="text-ink-700">Right to Data Portability (Art. 20):</strong> You have
                                the right to receive your personal data in a structured, commonly used, and
                                machine-readable format and to transmit it to another controller.
                            </li>
                            <li>
                                <strong className="text-ink-700">Right to Object (Art. 21):</strong> You have the right
                                to object to the processing of your personal data based on legitimate interests or for
                                direct marketing purposes.
                            </li>
                            <li>
                                <strong className="text-ink-700">Right to Withdraw Consent (Art. 7(3)):</strong> Where
                                processing is based on consent, you have the right to withdraw your consent at any time.
                                Withdrawal does not affect the lawfulness of processing carried out before the withdrawal.
                            </li>
                        </ul>

                        <h3 className="text-lg font-medium text-ink-900">How to Exercise Your Rights</h3>
                        <p>
                            You can exercise most of these rights directly through your account settings on SquadSpawn.
                            For any requests you cannot complete through the platform, or if you wish to file a formal
                            request, please reach us via our{' '}
                            <Link href="/contact" className="text-neon-red hover:underline">contact form</Link>{' '}
                            (pick the "Privacy / GDPR" category). We will respond to your request within 30 days as required by the GDPR.
                        </p>
                        <p>
                            You also have the right to lodge a complaint with a supervisory authority. In the Netherlands,
                            this is the Autoriteit Persoonsgegevens (Dutch Data Protection Authority) at{' '}
                            <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" className="text-neon-red hover:underline">
                                autoriteitpersoonsgegevens.nl
                            </a>.
                        </p>

                        {/* 8. Cookies */}
                        <h2 className="text-xl font-semibold text-ink-900">8. Cookies</h2>
                        <p>
                            We use cookies and similar technologies to maintain your session, remember your preferences,
                            and analyze platform usage. For detailed information about the cookies we use and how to
                            manage them, please see our{' '}
                            <Link href="/cookie-policy" className="text-neon-red hover:underline">Cookie Policy</Link>.
                        </p>

                        {/* 9. Children's Privacy */}
                        <h2 className="text-xl font-semibold text-ink-900">9. Children's Privacy</h2>
                        <p>
                            SquadSpawn is only available to users aged <strong>16 and older</strong>. Under the Dutch
                            implementation of the GDPR (UAVG), 16 is the age at which a person may validly consent to
                            the processing of their own personal data by an online service provider. Accounts younger
                            than 16 are not accepted — both the email-signup form and the age-verification screen for
                            Google OAuth signups reject any date of birth that makes the user under 16 and immediately
                            log the account out.
                        </p>
                        <p>
                            We do not knowingly collect personal data from anyone under 16. If we become aware that a
                            user is under 16, we will delete their account and the associated personal data. If you are
                            a parent or guardian and believe your child has created an account on SquadSpawn, please
                            reach us via our{' '}
                            <Link href="/contact" className="text-neon-red hover:underline">contact form</Link>{' '}
                            and we will act on your request promptly.
                        </p>

                        {/* 10. Data Security */}
                        <h2 className="text-xl font-semibold text-ink-900">10. Data Security</h2>
                        <p>
                            We implement appropriate technical and organizational measures to protect your personal data
                            against unauthorized access, alteration, disclosure, or destruction. These measures include:
                        </p>
                        <ul className="ml-4 list-disc space-y-1 text-ink-500">
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
                        <h2 className="text-xl font-semibold text-ink-900">11. International Data Transfers</h2>
                        <p>
                            SquadSpawn is operated from the Netherlands. If you are accessing our platform from outside
                            the European Economic Area (EEA), your data may be transferred to and processed in the
                            Netherlands or other countries where our service providers operate. When transferring data
                            outside the EEA, we ensure appropriate safeguards are in place, such as Standard Contractual
                            Clauses (SCCs) approved by the European Commission, or transfers to countries with an
                            adequacy decision.
                        </p>

                        {/* 12. Changes to This Policy */}
                        <h2 className="text-xl font-semibold text-ink-900">12. Changes to This Privacy Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time to reflect changes in our practices,
                            technology, legal requirements, or other factors. When we make material changes, we will
                            notify you by posting the updated policy on this page with a revised "Last updated" date.
                            For significant changes, we may also notify you via email or through a notice on the
                            platform. We encourage you to review this policy periodically.
                        </p>

                        {/* 13. Contact Information */}
                        <h2 className="text-xl font-semibold text-ink-900">13. Contact Information and Data Protection Officer</h2>
                        <p>
                            If you have any questions, concerns, or requests regarding this Privacy Policy or our data
                            processing practices, please contact us:
                        </p>
                        <p>
                            <strong className="text-ink-800">SquadSpawn</strong> — operated by BudgetPixels.nl<br />
                            <strong className="text-ink-800">Contact:</strong>{' '}
                            <Link href="/contact" className="text-neon-red hover:underline">our contact form</Link><br />
                            <strong className="text-ink-800">Website:</strong>{' '}
                            <a href="https://squadspawn.com" className="text-neon-red hover:underline">squadspawn.com</a>
                        </p>
                        <p>
                            For privacy-specific inquiries (GDPR requests, data exports, erasure, complaints), use our{' '}
                            <Link href="/contact" className="text-neon-red hover:underline">contact form</Link>{' '}
                            and pick the <strong>Privacy / GDPR</strong> category so your message is routed quickly.
                            SquadSpawn is not required to appoint a dedicated Data Protection Officer under AVG Art. 37,
                            but the contact form is the single point of contact for all data-protection matters.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
