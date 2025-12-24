'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-white/95 backdrop-blur-xl shadow-md border-b border-green-900/20 w-full">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 group flex-shrink-0">
          <Image
            src="/mti-logo.jpg"
            alt="Markaz Tikrar Indonesia Logo"
            width={128}
            height={32}
            className="w-20 sm:w-24 md:w-32 h-5 sm:h-6 md:h-8 object-contain transition-transform duration-300 group-hover:scale-105"
            priority
          />
          <span className="text-xs sm:text-sm md:text-xl font-bold text-black transition-colors duration-300 group-hover:text-green-900 hidden sm:block whitespace-nowrap">
            Markaz Tikrar Indonesia
          </span>
        </Link>

        <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
          <Link href="/#program" className="text-black hover:text-green-900 transition-colors font-medium text-sm xl:text-base">
            Program
          </Link>
          <Link href="/#alur" className="text-black hover:text-green-900 transition-colors font-medium text-sm xl:text-base">
            Alur
          </Link>
          <Link href="/#testimoni" className="text-black hover:text-green-900 transition-colors font-medium text-sm xl:text-base">
            Testimoni
          </Link>
          <Link href="/donasi" className="text-black hover:text-green-900 transition-colors font-medium text-sm xl:text-base">
            Donasi
          </Link>
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
          <Button
            variant="outline"
            asChild
            className="hidden md:flex bg-green-900 hover:bg-green-800 text-white text-sm md:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group border-green-900 hover:border-green-900"
          >
            <Link href="/login" className="flex items-center gap-2">
              <span className="hidden lg:inline">Masuk</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="outline"
            asChild
            className="md:hidden border-green-900 text-green-900 hover:bg-green-50 hover:border-green-900 px-2 sm:px-3 py-1 sm:py-2"
          >
            <Link href="/login">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
