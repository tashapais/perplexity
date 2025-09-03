export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Terms of Use</h1>
        
        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Acceptance of Terms</h2>
            <p>
              By using this application, you agree to these terms of use. This application is provided 
              for personal use to enhance your search and knowledge management experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Permitted Use</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Personal knowledge search and management</li>
              <li>Educational and research purposes</li>
              <li>Integration with your own Notion workspace</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Prohibited Use</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Accessing content you don't have permission to view</li>
              <li>Commercial use without proper licensing</li>
              <li>Attempting to compromise the security of the application</li>
              <li>Violating any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Your Responsibilities</h2>
            <p>
              You are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Ensuring you have permission to access connected content</li>
              <li>Keeping your account credentials secure</li>
              <li>Using the application in compliance with these terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Disclaimer</h2>
            <p>
              This application is provided "as is" without warranties. The AI-generated responses 
              are for informational purposes only and should not be considered as professional advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the application 
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
