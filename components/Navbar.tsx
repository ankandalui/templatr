"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/UserDropdown";
import { useAppSelector } from "@/store/hooks";

export function Navbar() {
  const { user, isLoading, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  return (
    <header className="p-4 sm:p-6 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <nav className="flex justify-between items-center max-w-6xl mx-auto">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Image
            src="/icon.png"
            alt="Templatr Logo"
            width={40}
            height={40}
            className="w-10 h-10"
          />
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">
            Templatr
          </h1>
        </Link>

        {/* Navigation Items */}
        <div className="flex items-center gap-3 sm:gap-4">
          {isLoading ? (
            // Loading state
            <div className="flex items-center gap-3">
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : isAuthenticated && user ? (
            // Authenticated state
            <UserDropdown />
          ) : (
            // Unauthenticated state
            <>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="bg-white/80 border-gray-200 hover:bg-white text-sm sm:text-base px-3 sm:px-4 h-8 sm:h-10"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm sm:text-base px-3 sm:px-4 h-8 sm:h-10">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
