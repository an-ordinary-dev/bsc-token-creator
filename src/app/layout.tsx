import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'BSC Token Creator | Create BEP-20 Tokens on Binance Smart Chain',
  description: 'Create your own BEP-20 token on Binance Smart Chain in minutes. No coding required. Secure, fast, and easy token creation with anti-bot and anti-whale features. Start your crypto project today!',
  keywords: 'BSC token creator, BEP-20 token, Binance Smart Chain, create token, crypto token, token generator, BSC token maker',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
