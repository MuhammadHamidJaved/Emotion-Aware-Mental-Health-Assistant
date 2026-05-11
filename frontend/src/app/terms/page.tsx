import Link from 'next/link';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 p-8 sm:p-12 md:p-20 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline mb-8 inline-block">
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Terms and Conditions</h1>
          <p className="text-gray-500 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using EmotionAI ("the Service"), you agree to be bound by these Terms. 
              If you disagree with any part of the terms then you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">2. Intellectual Property</h2>
            <p>
              The Service and its original content, features and functionality are and will remain the exclusive property of EmotionAI and its licensors. The Service is protected by copyright, trademark, and other laws of both the Country and foreign countries.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">3. User Accounts</h2>
            <p>
              When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
            </p>
            <p className="mt-2">
              You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a Third-Party Social Media Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">4. Medical Disclaimer</h2>
            <p>
              EmotionAI is designed to provide emotional wellness tracking and recommendations. It is NOT intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">5. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            <p className="mt-2">
              Upon termination, Your right to use the Service will cease immediately. If You wish to terminate Your account, You may simply discontinue using the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">6. Changes to These Terms</h2>
            <p>
              We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
