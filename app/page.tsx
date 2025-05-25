"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );
  const router = useRouter();

  const handleStartCreating = () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/signup");
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <Navbar />

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {isAuthenticated && user ? (
              <>
                Welcome back,
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}
                  {user.name.split(" ")[0]}!{" "}
                </span>
                Ready to create?
              </>
            ) : (
              <>
                Create Amazing
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}
                  Templates{" "}
                </span>
                Effortlessly
              </>
            )}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            {isAuthenticated && user
              ? "Continue working on your templates or start creating new ones. Your dashboard awaits!"
              : "Upload your background images and question images to create professional templates. Perfect for educators, designers, and content creators."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          {isLoading ? (
            // Loading state
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-64 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="w-48 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          ) : isAuthenticated ? (
            // Authenticated user - show single button to dashboard
            <Button
              size="lg"
              onClick={handleStartCreating}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-medium rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              Start Creating Templates
            </Button>
          ) : (
            // Non-authenticated user - show both buttons
            <>
              <Button
                size="lg"
                onClick={handleStartCreating}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-medium rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                Start Creating Templates
              </Button>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white/80 border-gray-200 px-8 py-3 text-lg font-medium rounded-xl hover:bg-white transition-all duration-200"
                >
                  Sign In to Continue
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 w-full">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload Backgrounds
            </h3>
            <p className="text-gray-600">
              Upload your background images to serve as the foundation for your
              templates.
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Add Questions
            </h3>
            <p className="text-gray-600">
              Upload question images that will be automatically placed on your
              background templates.
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Download Templates
            </h3>
            <p className="text-gray-600">
              Get your completed templates as downloadable files ready for use.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-200 bg-white/50">
        <div className="max-w-6xl mx-auto text-center text-gray-600">
          <p>&copy; 2024 Templatr. Build for Gyanoda</p>
        </div>
      </footer>
    </div>
  );
}
