export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Information We Collect</h2>
            <p>
              This application connects to your Notion workspace to search and display your personal content. 
              We only access the content you explicitly grant permission to during the OAuth authorization process.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To search and display your Notion content in response to your queries</li>
              <li>To provide AI-powered answers based on your personal knowledge</li>
              <li>To improve your search experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data Storage</h2>
            <p>
              Your Notion access tokens are stored securely and temporarily. We do not permanently store 
              your Notion content. All searches are performed in real-time using Notion's API.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Third-Party Services</h2>
            <p>
              This application integrates with:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Notion API for accessing your workspace content</li>
              <li>OpenAI for generating AI responses</li>
              <li>Web search APIs for external content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Your Rights</h2>
            <p>
              You can revoke access to your Notion workspace at any time by disconnecting the integration 
              in the application settings or through your Notion workspace settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
            <p>
              If you have questions about this privacy policy, please contact us through the application 
              or create an issue on our GitHub repository.
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
