'use client'

import { ToastProvider } from './toast-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastProvider />
    </>
  )
} 