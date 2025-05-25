import { TokenForm } from "@/components/token-form/token-form"
import { Header } from "@/components/header"
import { ShieldCheck, Rocket, Gem, Send } from "lucide-react"
import { faqSchema } from "./structured-data"

function FeaturesSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div className="rounded-xl bg-card p-6 flex flex-col items-center text-center shadow-md">
        <Rocket className="h-8 w-8 text-pink-500 mb-2" />
        <span className="font-semibold text-lg text-primary mb-1">Quick Launch</span>
        <span className="text-muted-foreground text-sm">Create and deploy your BEP20 token on Binance Smart Chain in just a few minutes using our simple and intuitive process.</span>
      </div>
      <div className="rounded-xl bg-card p-6 flex flex-col items-center text-center shadow-md">
        <ShieldCheck className="h-8 w-8 text-blue-400 mb-2" />
        <span className="font-semibold text-lg text-primary mb-1">Secure & Reliable</span>
        <span className="text-muted-foreground text-sm">Your token is deployed using a security-first approach with audited smart contracts, ensuring safety and reliability on BSC.</span>
      </div>
      <div className="rounded-xl bg-card p-6 flex flex-col items-center text-center shadow-md">
        <Gem className="h-8 w-8 text-cyan-400 mb-2" />
        <span className="font-semibold text-lg text-primary mb-1">Token Standards</span>
        <span className="text-muted-foreground text-sm">Fully compliant with BEP20 token standards and best practices for seamless trading and integrations on Binance Smart Chain.</span>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-bold text-center mb-4 sm:mb-8 text-[clamp(2.1rem,5vw,3rem)]">
            Create Your Own BSC Token Instantly
          </h1>
          <p className="text-center text-muted-foreground mb-8 px-2 sm:px-0 text-[clamp(1rem,2.5vw,1.25rem)]">
            Deploy your custom BEP20 token on Binance Smart Chain (BSC) with advanced features like tax, anti-bot, and anti-whale protection — no coding required.
          </p>
          {/* Features above form on md+ screens */}
          <div className="hidden md:block">
            <FeaturesSection />
          </div>
          <div className="w-full">
            <TokenForm />
          </div>
          {/* Features below form on mobile */}
          <div className="block md:hidden mt-10">
            <FeaturesSection />
          </div>
          {/* FAQ Section */}
          <section className="mt-12">
            <h2 className="font-bold text-center mb-6 text-primary text-[clamp(1.3rem,3vw,2rem)]">Frequently Asked Questions</h2>
            <div className="space-y-4 w-full">
              <div className="rounded-lg bg-card p-5 shadow">
                <div className="font-semibold mb-1 text-[clamp(1.1rem,2.5vw,1.25rem)]">What is the BSC Token Creator?</div>
                <div className="text-muted-foreground text-sm">The BSC Token Creator is an easy-to-use platform that allows you to generate and deploy your own BEP20 tokens on the Binance Smart Chain without writing a single line of code. Perfect for both beginners and experts.</div>
              </div>
              <div className="rounded-lg bg-card p-5 shadow">
                <div className="font-semibold mb-1 text-[clamp(1.1rem,2.5vw,1.25rem)]">Is it Safe to Create BSC Tokens Here?</div>
                <div className="text-muted-foreground text-sm">Absolutely. Our platform uses blockchain-secured processes to ensure your token is created and delivered directly to your wallet. We never store your private keys or access your wallet.</div>
              </div>
              <div className="rounded-lg bg-card p-5 shadow">
                <div className="font-semibold mb-1 text-[clamp(1.1rem,2.5vw,1.25rem)]">How Much Time Does It Take to Create a Token?</div>
                <div className="text-muted-foreground text-sm">Creating a token usually takes less than 5 minutes. Simply fill in your token details, configure optional features, confirm the transaction, and your token will be live on BSC shortly.</div>
              </div>
              <div className="rounded-lg bg-card p-5 shadow">
                <div className="font-semibold mb-1 text-[clamp(1.1rem,2.5vw,1.25rem)]">Which Wallet Can I Use?</div>
                <div className="text-muted-foreground text-sm">You can use any BSC-compatible wallet such as MetaMask, Trust Wallet, or WalletConnect-supported wallets. Just connect your wallet and start building.</div>
              </div>
              <div className="rounded-lg bg-card p-5 shadow">
                <div className="font-semibold mb-1 text-[clamp(1.1rem,2.5vw,1.25rem)]">How Many Tokens Can I Create?</div>
                <div className="text-muted-foreground text-sm">You can create tokens with any total supply you wish. Simply set your desired amount during the creation process. Our platform is flexible enough to support millions, billions, or even trillions of tokens depending on your needs.</div>
              </div>
            </div>
          </section>
          {/* Contact Section */}
          <section className="mt-16 mb-8">
            <h2 className="font-bold text-center mb-6 text-primary text-[clamp(1.3rem,3vw,2rem)]">Get in Touch</h2>
            <div className="rounded-xl bg-card p-8 flex flex-col items-center text-center shadow-md w-full">
              <div className="font-semibold text-lg mb-2 text-[clamp(1.1rem,2.5vw,1.25rem)]">Have questions or need help?</div>
              <div className="text-muted-foreground mb-4 text-sm">Join our community for support and updates through our official Telegram channel:</div>
              <a
                href="https://t.me/byteory"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-base"
              >
                <Send className="h-5 w-5" />
                Join our Telegram
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
} 