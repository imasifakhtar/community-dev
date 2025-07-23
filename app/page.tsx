export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4">
      <div className="max-w-2xl w-full text-center py-20">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
          Welcome to Community Connect
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          The social platform for entrepreneurs and investors to connect, share, and grow together. Join our community to discover opportunities, share your journey, and build your network.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/auth/signup" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition">Get Started</a>
          <a href="/auth/login" className="px-6 py-3 bg-white border border-blue-600 text-blue-600 rounded-lg font-semibold shadow hover:bg-blue-50 transition">Sign In</a>
        </div>
      </div>
    </main>
  );
}
