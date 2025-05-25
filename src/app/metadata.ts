import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "BSC Token Creator | Launch BEP-20 Tokens in Minutes",
  description: "Create your own BSC BEP-20 token instantly. Customize your name, symbol, supply, tax settings, and add anti-bot or anti-whale protection. No coding skills needed — fast, secure, and beginner-friendly.",
  metadataBase: new URL('https://bsc-token-creator.byteory.com'),
  openGraph: {
    type: 'website',
    url: 'https://bsc-token-creator.byteory.com/',
    title: 'Create Your Own BSC Token Instantly | Launch BEP-20 Tokens',
    description: 'Easily create and deploy your own BEP-20 token on BSC. Customize name, symbol, supply, tax, anti-bot, and anti-whale features — no coding needed.',
    images: [
      {
        url: 'https://bsc-token-creator.byteory.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BSC Token Creator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create Your Own BSC Token Instantly | Launch BEP-20 Tokens',
    description: 'Deploy BSC tokens effortlessly with our secure and beginner-friendly Token Creator. Add custom tax, anti-bot, and anti-whale features in minutes.',
    images: ['https://bsc-token-creator.byteory.com/og-image.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  verification: {
    google: 'your-google-site-verification',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://bsc-token-creator.byteory.com/',
    languages: {
      'en': 'https://bsc-token-creator.byteory.com/',
    },
  },
  other: {
    'robots': 'index, follow',
  },
}

export default metadata 