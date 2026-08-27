export default function PrivacyPolicyPage() {
  return (
    <div className="app-background min-h-screen text-neutral-100 px-5 py-24">
      <div className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-black/40 p-8 backdrop-blur-md sm:p-12">
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-neutral-400">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-invert mt-8 max-w-none text-sm text-neutral-300">
          <h2>1. Introduction</h2>
          <p>Welcome to PrioryxAI. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.</p>

          <h2>2. The Data We Collect About You</h2>
          <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
          <ul>
            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
            <li><strong>Contact Data</strong> includes email address.</li>
            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
            <li><strong>Profile Data</strong> includes your username and password, your interests, preferences, feedback and survey responses.</li>
          </ul>

          <h2>3. How We Use Your Personal Data</h2>
          <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
          <ul>
            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
            <li>Where we need to comply with a legal obligation.</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.</p>

          <h2>5. Contact Us</h2>
          <p>If you have any questions about this privacy policy or our privacy practices, please contact us at: <a href="mailto:prioryxai@gmail.com" className="text-mint hover:underline">prioryxai@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
}
