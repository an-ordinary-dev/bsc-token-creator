"use client"

import Image from "next/image"
import Link from "next/link"
// import { ModeToggle } from "@/components/ui/mode-toggle"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-screen-xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center min-w-[40px]">
          <Image
            src="/logo.png"
            alt="BSC Token Creator Logo"
            width={36}
            height={36}
            priority
            className="block h-9 w-9 object-contain"
          />
        </Link>
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
          <appkit-button 
            size="md"
            label="Connect Wallet"
          />
        </div>
      </div>
    </header>
  )
} 