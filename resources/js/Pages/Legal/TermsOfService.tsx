import { Head, Link } from '@inertiajs/react';

export default function TermsOfService() {
    return (
        <>
            <Head title="Terms of Service" />
            <div className="min-h-screen bg-bone-50 text-ink-900">
                <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
                    <Link href="/" className="text-2xl font-bold text-neon-red">SquadSpawn</Link>
                </nav>
                <div className="mx-auto max-w-3xl px-6 py-12">
                    <h1 className="mb-8 text-3xl font-bold">Terms of Service</h1>
                    <div className="space-y-6 text-sm leading-relaxed text-ink-700">
                        <p className="text-ink-500">Last updated: April 13, 2026</p>

                        <p>
                            Welcome to SquadSpawn. These Terms of Service ("Terms") govern your access to and use of the
                            SquadSpawn platform at{' '}
                            <a href="https://squadspawn.com" className="text-neon-red hover:underline">squadspawn.com</a>,
                            including all features, services, and content offered through the platform. SquadSpawn is
                            operated by BudgetPixels.nl, based in the Netherlands.
                        </p>
                        <p>
                            Please read these Terms carefully before using our platform. By accessing or using SquadSpawn,
                            you agree to be bound by these Terms.
                        </p>

                        {/* 1. Acceptance of Terms */}
                        <h2 className="text-xl font-semibold text-ink-900">1. Acceptance of Terms</h2>
                        <p>
                            By creating an account, accessing, or using SquadSpawn in any way, you acknowledge that you
                            have read, understood, and agree to be bound by these Terms and our{' '}
                            <Link href="/privacy-policy" className="text-neon-red hover:underline">Privacy Policy</Link>.
                            If you do not agree to these Terms, you must not access or use the platform. Your continued
                            use of SquadSpawn after any changes to these Terms constitutes acceptance of those changes.
                        </p>

                        {/* 2. Eligibility */}
                        <h2 className="text-xl font-semibold text-ink-900">2. Eligibility</h2>
                        <p>To use SquadSpawn, you must:</p>
                        <ul className="ml-4 list-disc space-y-1 text-ink-500">
                            <li>Be at least 13 years of age.</li>
                            <li>If you are between 13 and 17 years old, you must have the consent of a parent or legal guardian to use the platform. Your parent or guardian agrees to be bound by these Terms on your behalf.</li>
                            <li>If you are between 13 and 15 years old and located in the European Economic Area, you must have verifiable parental consent in accordance with GDPR Article 8.</li>
                            <li>Have the legal capacity to enter into a binding agreement.</li>
                            <li>Not have been previously banned or removed from the platform.</li>
                        </ul>
                        <p>
                            We reserve the right to request proof of age or parental consent at any time and to
                            terminate accounts that do not meet these eligibility requirements.
                        </p>

                        {/* 3. Account Responsibilities */}
                        <h2 className="text-xl font-semibold text-ink-900">3. Account Responsibilities</h2>
                        <p>When you create an account on SquadSpawn, you agree to:</p>
                        <ul className="ml-4 list-disc space-y-1 text-ink-500">
                            <li>Provide accurate, current, and complete information during registration and keep it updated.</li>
                            <li>Maintain only one account per person. Creating multiple accounts is prohibited.</li>
                            <li>Keep your password secure and confidential. Do not share your login credentials with anyone.</li>
                            <li>Notify us immediately via our <Link href="/contact" className="text-neon-red hover:underline">contact form</Link> if you suspect unauthorized access to your account.</li>
                            <li>Accept full responsibility for all activity that occurs under your account.</li>
                        </ul>
                        <p>
                            We are not liable for any loss or damage arising from your failure to maintain the security
                            of your account credentials.
                        </p>

                        {/* 4. User Conduct */}
                        <h2 className="text-xl font-semibold text-ink-900">4. User Conduct</h2>
                        <p>
                            SquadSpawn is a community platform. To ensure a safe and welcoming environment for all gamers,
                            you agree to the following rules of conduct. You must not:
                        </p>
                        <ul className="ml-4 list-disc space-y-1 text-ink-500">
                            <li><strong className="text-ink-700">Harassment and bullying:</strong> Engage in harassment, bullying, intimidation, stalking, or threatening behavior toward any user.</li>
                            <li><strong className="text-ink-700">Hate speech:</strong> Post or transmit content that promotes hatred, discrimination, or violence based on race, ethnicity, national origin, religion, gender, gender identity, sexual orientation, disability, or any other protected characteristic.</li>
                            <li><strong className="text-ink-700">Sexual or explicit content:</strong> Upload, share, or display sexually explicit, pornographic, or obscene content in your avatar, profile, messages, or any other area of the platform.</li>
                            <li><strong className="text-ink-700">Spam:</strong> Send unsolicited messages, advertisements, or promotional material to other users.</li>
                            <li><strong className="text-ink-700">Impersonation:</strong> Impersonate another person, create fake profiles, or misrepresent your identity or affiliation.</li>
                            <li><strong className="text-ink-700">Cheating and hacking:</strong> Attempt to exploit, hack, reverse-engineer, or interfere with the platform's functionality, security, or other users' experiences.</li>
                            <li><strong className="text-ink-700">Commercial use:</strong> Use the platform for unauthorized commercial purposes, including advertising products or services without our prior written permission.</li>
                            <li><strong className="text-ink-700">Illegal activity:</strong> Use the platform for any unlawful purpose or in violation of any applicable laws or regulations.</li>
                            <li><strong className="text-ink-700">Respect others:</strong> Treat all users with respect and courtesy. Toxic behavior, griefing encouragement, or deliberately ruining others' gaming experiences is not tolerated.</li>
                        </ul>
                        <p>
                            Violations of these conduct rules may result in content removal, temporary suspension, or
                            permanent ban from the platform, at our sole discretion.
                        </p>

                        {/* 5. Content Ownership and License */}
                        <h2 className="text-xl font-semibold text-ink-900">5. Content Ownership and License</h2>
                        <p>
                            You retain full ownership of any content you create and upload to SquadSpawn, including your
                            profile information, bio text, messages, clips, and other media ("User Content").
                        </p>
                        <p>
                            By uploading User Content to the platform, you grant SquadSpawn a non-exclusive, worldwide,
                            royalty-free, transferable license to use, display, reproduce, and distribute your User Content
                            solely for the purpose of operating and providing the SquadSpawn service. This license ends
                            when you delete your content or your account, except where your content has been shared with
                            other users and they have not deleted their copies.
                        </p>
                        <p>
                            We reserve the right to remove, disable, or restrict access to any User Content that violates
                            these Terms, without prior notice.
                        </p>

                        {/* 6. Avatar and Image Policy */}
                        <h2 className="text-xl font-semibold text-ink-900">6. Avatar and Image Policy</h2>
                        <p>Avatars and images uploaded to SquadSpawn must comply with the following rules:</p>
                        <ul className="ml-4 list-disc space-y-1 text-ink-500">
                            <li>No sexually explicit, pornographic, or NSFW content.</li>
                            <li>No violent, graphic, or disturbing imagery.</li>
                            <li>No copyrighted material without the copyright holder's permission.</li>
                            <li>No hateful symbols, slurs, or imagery promoting discrimination.</li>
                            <li>No impersonation of real individuals without their consent.</li>
                        </ul>
                        <p>
                            We reserve the right to review, remove, or replace any avatar or image that we determine, in
                            our sole discretion, violates these guidelines. Repeated violations may result in account
                            suspension or termination.
                        </p>

                        {/* 7. Matchmaking Disclaimer */}
                        <h2 className="text-xl font-semibold text-ink-900">7. Matchmaking Disclaimer</h2>
                        <p>
                            SquadSpawn facilitates connections between gamers based on shared games, ranks, preferences,
                            and other profile data. However, we do not guarantee the quality, compatibility, or behavior
                            of any user. We are not responsible for:
                        </p>
                        <ul className="ml-4 list-disc space-y-1 text-ink-500">
                            <li>Any interactions, disputes, or outcomes between users, whether on or off the platform.</li>
                            <li>The accuracy of information provided by other users in their profiles.</li>
                            <li>Any damage, harm, or loss resulting from connections made through SquadSpawn.</li>
                        </ul>
                        <p>
                            You acknowledge that you interact with other users at your own risk and should exercise
                            caution and good judgment in all interactions.
                        </p>

                        {/* 8. LFG Groups */}
                        <h2 className="text-xl font-semibold text-ink-900">8. Looking For Group (LFG)</h2>
                        <p>
                            SquadSpawn provides LFG features that allow users to create and join gaming groups. Group
                            creators are responsible for managing their groups and ensuring compliance with these Terms.
                            We do not:
                        </p>
                        <ul className="ml-4 list-disc space-y-1 text-ink-500">
                            <li>Guarantee the skill level, availability, or behavior of group members.</li>
                            <li>Mediate disputes between group members.</li>
                            <li>Endorse or verify any claims made in LFG posts.</li>
                        </ul>

                        {/* 9. Chat and Messaging */}
                        <h2 className="text-xl font-semibold text-ink-900">9. Chat and Messaging</h2>
                        <p>
                            SquadSpawn provides in-platform messaging to facilitate communication between users. When
                            using our chat features:
                        </p>
                        <ul className="ml-4 list-disc space-y-1 text-ink-500">
                            <li>Do not share sensitive personal information such as your real address, phone number, financial details, or government ID with other users, especially people you do not know.</li>
                            <li>Report any abusive, threatening, or inappropriate messages using the platform's report feature.</li>
                            <li>All messages are subject to our user conduct rules.</li>
                        </ul>
                        <p>
                            We may review messages when investigating reported violations but do not actively monitor
                            all private communications.
                        </p>

                        {/* 10. Intellectual Property */}
                        <h2 className="text-xl font-semibold text-ink-900">10. Intellectual Property</h2>
                        <p>
                            The SquadSpawn name, logo, branding, design, and all original content created by SquadSpawn
                            are the intellectual property of BudgetPixels.nl and are protected by applicable intellectual
                            property laws. You may not use, reproduce, or distribute our branding without prior written
                            permission.
                        </p>
                        <p>
                            Game names, logos, and images displayed on the platform are the property of their respective
                            owners and are used for community identification purposes under fair use principles. If you
                            are a rights holder and believe your intellectual property is being used improperly, please
                            reach us via our{' '}
                            <Link href="/contact" className="text-neon-red hover:underline">contact form</Link>.
                        </p>

                        {/* 11. Third-Party Links */}
                        <h2 className="text-xl font-semibold text-ink-900">11. Third-Party Links and Services</h2>
                        <p>
                            SquadSpawn may contain links to third-party websites, services, or content (including linked
                            social accounts, game stores, and external communities). These links are provided for
                            convenience and do not imply endorsement. We are not responsible for the content, privacy
                            practices, or availability of any third-party sites or services. Your use of third-party
                            services is governed by their respective terms and policies.
                        </p>

                        {/* 12. Termination */}
                        <h2 className="text-xl font-semibold text-ink-900">12. Termination</h2>
                        <h3 className="text-lg font-medium text-ink-900">12.1 Termination by Us</h3>
                        <p>
                            We reserve the right to suspend or permanently terminate your account, with or without prior
                            notice, for any of the following reasons:
                        </p>
                        <ul className="ml-4 list-disc space-y-1 text-ink-500">
                            <li>Violation of these Terms or any applicable laws.</li>
                            <li>Conduct that is harmful to other users, the platform, or third parties.</li>
                            <li>Extended inactivity (accounts inactive for more than 24 months may be flagged for deletion).</li>
                            <li>At our sole discretion, if we determine it is necessary for the safety or integrity of the platform.</li>
                        </ul>

                        <h3 className="text-lg font-medium text-ink-900">12.2 Termination by You</h3>
                        <p>
                            You may delete your account at any time through your account settings. Upon deletion, your
                            personal data will be removed in accordance with our{' '}
                            <Link href="/privacy-policy" className="text-neon-red hover:underline">Privacy Policy</Link>.
                            Some data may be retained as described in our data retention practices.
                        </p>

                        {/* 13. Limitation of Liability */}
                        <h2 className="text-xl font-semibold text-ink-900">13. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by applicable law, SquadSpawn and BudgetPixels.nl, including
                            their officers, directors, employees, and agents, shall not be liable for any indirect,
                            incidental, special, consequential, or punitive damages, including but not limited to loss
                            of profits, data, goodwill, or other intangible losses, resulting from:
                        </p>
                        <ul className="ml-4 list-disc space-y-1 text-ink-500">
                            <li>Your use of or inability to use the platform.</li>
                            <li>Any conduct or content of any third party or other user on the platform.</li>
                            <li>Unauthorized access to or alteration of your transmissions or data.</li>
                            <li>Any other matter relating to the platform.</li>
                        </ul>
                        <p>
                            The platform is provided on an "as is" and "as available" basis without warranties of any
                            kind, whether express or implied, including but not limited to implied warranties of
                            merchantability, fitness for a particular purpose, and non-infringement. We do not warrant
                            that the platform will be uninterrupted, error-free, or secure.
                        </p>

                        {/* 14. Indemnification */}
                        <h2 className="text-xl font-semibold text-ink-900">14. Indemnification</h2>
                        <p>
                            You agree to indemnify, defend, and hold harmless SquadSpawn, BudgetPixels.nl, and their
                            respective officers, directors, employees, and agents from and against any claims, damages,
                            losses, liabilities, costs, and expenses (including reasonable attorney's fees) arising out
                            of or related to:
                        </p>
                        <ul className="ml-4 list-disc space-y-1 text-ink-500">
                            <li>Your use of the platform or violation of these Terms.</li>
                            <li>Your User Content or any content you submit, post, or transmit through the platform.</li>
                            <li>Your violation of any rights of another person or entity.</li>
                            <li>Your violation of any applicable law or regulation.</li>
                        </ul>

                        {/* 15. Dispute Resolution */}
                        <h2 className="text-xl font-semibold text-ink-900">15. Dispute Resolution</h2>
                        <p>
                            If a dispute arises between you and SquadSpawn, we encourage you to first reach us via our{' '}
                            <Link href="/contact" className="text-neon-red hover:underline">contact form</Link>{' '}
                            to seek an informal resolution. We will make reasonable efforts to resolve the matter
                            amicably.
                        </p>
                        <p>
                            If the dispute cannot be resolved informally within 30 days, it shall be submitted to the
                            competent courts in the Netherlands. For consumers within the European Union, you may also
                            use the European Commission's Online Dispute Resolution platform at{' '}
                            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-neon-red hover:underline">
                                ec.europa.eu/consumers/odr
                            </a>.
                        </p>

                        {/* 16. Governing Law */}
                        <h2 className="text-xl font-semibold text-ink-900">16. Governing Law</h2>
                        <p>
                            These Terms shall be governed by and construed in accordance with the laws of the Netherlands,
                            without regard to its conflict of law provisions. Any legal proceedings shall be brought
                            exclusively in the competent courts of the Netherlands. This does not affect your statutory
                            rights as a consumer under the mandatory consumer protection laws of your country of
                            residence.
                        </p>

                        {/* 17. Changes to Terms */}
                        <h2 className="text-xl font-semibold text-ink-900">17. Changes to These Terms</h2>
                        <p>
                            We reserve the right to modify these Terms at any time. When we make material changes, we
                            will update the "Last updated" date at the top of this page and, where appropriate, notify
                            you via email or through a prominent notice on the platform. Your continued use of SquadSpawn
                            after changes are posted constitutes your acceptance of the revised Terms. If you do not
                            agree with the changes, you must stop using the platform and delete your account.
                        </p>

                        {/* 18. Contact Information */}
                        <h2 className="text-xl font-semibold text-ink-900">18. Contact Information</h2>
                        <p>If you have any questions or concerns about these Terms of Service, please contact us:</p>
                        <p>
                            <strong className="text-ink-800">SquadSpawn</strong> — operated by BudgetPixels.nl<br />
                            <strong className="text-ink-800">Contact:</strong>{' '}
                            <Link href="/contact" className="text-neon-red hover:underline">our contact form</Link><br />
                            <strong className="text-ink-800">Website:</strong>{' '}
                            <a href="https://squadspawn.com" className="text-neon-red hover:underline">squadspawn.com</a>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
