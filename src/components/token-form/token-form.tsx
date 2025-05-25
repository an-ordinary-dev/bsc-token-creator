"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Plus, Minus, Lock, Shield, Info, CheckCircle2, AlertCircle, Copy } from "lucide-react"
import { z } from "zod"
import { useState, useEffect } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCreateToken } from "@/lib/contract"
import { useAccount } from "wagmi"
import * as Dialog from '@radix-ui/react-dialog'
import { Loader2 } from "lucide-react"
import { toast } from 'sonner'
import { getChainId } from "@/lib/config"

interface FeatureState {
  antiBot: boolean
  antiWhale: boolean
}

const formSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .transform((val) => val.trim().replace(/[<>]/g, '')) // Remove HTML tags and trim
    .refine((val) => val.length > 0, "Name cannot be empty after sanitization"),
  symbol: z.string()
    .min(1, "Symbol is required")
    .transform((val) => val.replace(/\s+/g, '').replace(/[<>]/g, '')) // Remove spaces and HTML tags
    .refine((val) => /^[a-zA-Z0-9]+$/.test(val), "Symbol must contain only alphanumeric characters"),
  supply: z.string()
    .min(1, "Supply is required")
    .transform((val) => val.replace(/\s+/g, '')) // Remove spaces
    .refine((val) => {
      const num = Number(val)
      if (isNaN(num)) return false
      if (num <= 0) return false
      const validNumberRegex = /^[0-9]+(\.[0-9]+)?([eE][-+]?[0-9]+)?$/
      return validNumberRegex.test(val)
    }, {
      message: "Supply must be a valid positive number"
    }),
  enableTax: z.boolean(),
  features: z.object({
    antiBot: z.boolean(),
    antiWhale: z.boolean(),
  }),
  maxTxAmount: z.string()
    .transform((val) => val ? val.replace(/\s+/g, '') : '0') // Remove spaces
    .refine((val) => {
      const num = Number(val)
      return !isNaN(num) && num >= 0
    }, "Max transaction amount must be a valid non-negative number"),
  taxRecipients: z.array(z.object({
    address: z.string()
      .transform((val) => {
        const cleanAddress = val.toLowerCase().startsWith('0x') ? val.slice(2) : val
        return `0x${cleanAddress}`
      })
      .refine((val) => /^0x[a-fA-F0-9]{40}$/.test(val), "Invalid BSC address"),
    percentage: z.string().refine((val) => {
      const num = Number(val)
      return !isNaN(num) && num > 0 && num <= 100
    }, "Percentage must be between 0 and 100")
  }))
}).superRefine((data, ctx) => {
  if (data.features.antiWhale) {
    if (isNaN(Number(data.maxTxAmount)) || Number(data.maxTxAmount) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Max transaction amount is required and must be greater than 0 when Anti Whale is enabled.",
        path: ["maxTxAmount"],
      })
    }
  }
  if (data.enableTax) {
    // Check for duplicate addresses
    const addresses = new Set<string>()
    data.taxRecipients.forEach((recipient, index) => {
      if (addresses.has(recipient.address)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate tax recipient address",
          path: ["taxRecipients", index, "address"],
        })
      }
      addresses.add(recipient.address)
    })

    const totalTax = data.taxRecipients.reduce((sum, recipient) => sum + Number(recipient.percentage), 0)
    if (totalTax > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Total tax percentage cannot exceed 100%",
        path: ["taxRecipients"],
      })
    }
    if (totalTax < 0.1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Total tax percentage must be at least 0.1%",
        path: ["taxRecipients"],
      })
    }
  }
})

type FormValues = z.infer<typeof formSchema>

function WalletApprovalDialog({ 
  isOpen, 
  onClose, 
  status, 
  tokenAddress
}: { 
  isOpen: boolean
  onClose: () => void
  status: 'approving' | 'creating' | 'completed' | 'error' | null | undefined
  tokenAddress?: string | null
}) {
  const [dialogTitle, setDialogTitle] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (status) {
      if (status === 'approving') setDialogTitle('Approve Transaction')
      else if (status === 'creating') setDialogTitle('Creating Token')
      else if (status === 'completed') setDialogTitle('Token Created')
      else if (status === 'error') setDialogTitle('Error')
      else setDialogTitle('Dialog')
    }
  }, [status])

  const handleCopyAddress = async () => {
    if (tokenAddress) {
      try {
        await navigator.clipboard.writeText(tokenAddress)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      } catch {
        // Silently handle clipboard errors
      }
    }
  }

  return (
    <Dialog.Root
      open={isOpen}
      modal
      onOpenChange={(open) => {
        if (!open) {
          if (status === 'error') {
            onClose()
          } else if (status === 'completed') {
            // Only allow closing via the close button
            return
          } else if (status === 'approving' || status === 'creating') {
            // Prevent closing
            return
          }
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity" />
        <Dialog.Content
          className="
            fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4
            rounded-2xl border border-border bg-[#121212] p-8 shadow-xl outline-none
            transition-all duration-200
          "
          onInteractOutside={(event: React.MouseEvent | Event) => {
            event.preventDefault();
          }}
          onEscapeKeyDown={(event: React.KeyboardEvent | KeyboardEvent) => {
            if (status === 'completed') event.preventDefault()
          }}
        >
          {(status === 'completed' || status === 'error') && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors"
              aria-label="Close"
              type="button"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
          <Dialog.Title className={status ? 'flex items-center gap-2 mb-2 text-lg font-semibold' : 'sr-only'}>
            {status === 'approving' && <><Loader2 className="h-5 w-5 animate-spin" />Approve Transaction</>}
            {status === 'creating' && <><Loader2 className="h-5 w-5 animate-spin" />Creating Token</>}
            {status === 'completed' && <><CheckCircle2 className="h-5 w-5 text-green-500" />Token Created</>}
            {status === 'error' && <><AlertCircle className="h-5 w-5 text-red-500" />Error</>}
            {!status && dialogTitle}
          </Dialog.Title>
          <Dialog.Description className="text-muted-foreground mb-2">
            {status === 'approving' && 'Please approve the BNB payment from your wallet to complete the transaction.'}
            {status === 'creating' && 'Your BEP20 token is being created on Binance Smart Chain. This may take a few moments...'}
            {status === 'completed' && tokenAddress && 'Your BEP20 token has been successfully created on Binance Smart Chain!'}
            {status === 'error' && 'An error occurred while creating your BEP20 token. Please try again.'}
          </Dialog.Description>
          {status === 'completed' && tokenAddress && (
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg">
                <span className="text-sm font-mono truncate flex-1">{tokenAddress}</span>
                <button
                  onClick={handleCopyAddress}
                  className={`p-2 rounded-md transition-colors ${copied ? 'bg-green-500/90 text-white' : 'bg-primary/90 hover:bg-primary text-white'}`}
                  title="Copy token address"
                >
                  {copied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </button>
                {copied && <span className="text-green-500 text-xs font-semibold ml-1">Copied!</span>}
              </div>
              <a
                href={getExplorerUrl(tokenAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-black font-semibold rounded-lg shadow-lg hover:bg-zinc-100 transition-colors text-base border border-zinc-200"
                onClick={e => e.stopPropagation()}
              >
                Check on BscScan
              </a>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function TokenSummary({
  name,
  symbol,
  supply,
  contractAddress,
  creationFee,
  taxRecipients,
  features,
  maxTxAmount,
}: {
  name: string
  symbol: string
  supply: string
  contractAddress: string
  creationFee: string
  taxRecipients: { address: string; percentage: string }[]
  features: { antiBot: boolean; antiWhale: boolean }
  maxTxAmount?: string
}) {
  const [copied, setCopied] = useState(false)
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(contractAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }
  return (
    <div className="relative rounded-xl border-l-8 border-primary bg-card/80 p-8 shadow-lg flex flex-col gap-6 mb-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="inline-flex items-center justify-center rounded-full bg-green-500/90 text-white w-8 h-8">
          <CheckCircle2 className="w-6 h-6" />
        </span>
        <span className="font-extrabold text-2xl text-primary">Your Token Was Created!</span>
      </div>
      <div className="text-muted-foreground text-base mb-2">
        This is the summary of the token you just created. Save this information for your records.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        <div className="space-y-2">
          <div>
            <div className="font-semibold text-sm text-muted-foreground">Name</div>
            <div className="text-lg font-medium">{name}</div>
          </div>
          <div>
            <div className="font-semibold text-sm text-muted-foreground">Symbol</div>
            <div className="text-lg font-medium">{symbol}</div>
          </div>
          <div>
            <div className="font-semibold text-sm text-muted-foreground">Total Supply</div>
            <div className="text-lg font-medium">{supply}</div>
          </div>
          <div>
            <div className="font-semibold text-sm text-muted-foreground">Creation Fee</div>
            <div className="text-lg font-medium">{Number(creationFee) / 1e18} BNB</div>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <div className="font-semibold text-sm text-muted-foreground">Contract Address</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-base truncate flex-1 bg-zinc-900/60 px-2 py-1 rounded select-all">{contractAddress}</span>
              <button
                onClick={handleCopyAddress}
                className={`p-2 rounded-md transition-colors ${copied ? 'bg-green-500/90 text-white' : 'bg-primary/90 hover:bg-primary text-white'}`}
                title="Copy contract address"
              >
                {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
              {copied && <span className="text-green-500 text-xs font-semibold ml-1">Copied!</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-700 my-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="font-semibold text-sm text-muted-foreground">Features Enabled</div>
          <ul className="text-base">
            {features.antiBot && <li>Anti Bot</li>}
            {features.antiWhale && <li>Anti Whale {maxTxAmount && (<span className="text-xs text-muted-foreground">(Max Tx: {maxTxAmount})</span>)}</li>}
            {!features.antiBot && !features.antiWhale && <li>None</li>}
          </ul>
        </div>
        {taxRecipients.length > 0 && (
          <div className="space-y-2">
            <div className="font-semibold text-sm text-muted-foreground">Tax Recipients</div>
            <ul className="text-base">
              {taxRecipients.map((r, i) => (
                <li key={i} className="flex gap-2 items-center">
                  <span className="font-mono">{r.address}</span>
                  <span className="text-muted-foreground">({r.percentage}%)</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function TokenForm() {
  const { address } = useAccount()
  const chainId = getChainId()
  const [isLoading, setIsLoading] = useState(false)
  const [createdTokenAddress, setCreatedTokenAddress] = useState<string | null>(null)
  const { createToken, creationFee } = useCreateToken()
  const [features, setFeatures] = useState<FeatureState>({
    antiBot: false,
    antiWhale: false,
  })
  const [enableTax, setEnableTax] = useState(false)
  const [walletDialogStatus, setWalletDialogStatus] = useState<'approving' | 'creating' | 'completed' | 'error' | null>(null)
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [tokenDecimals] = useState(18)
  const [lastTokenDetails, setLastTokenDetails] = useState<{
    name: string
    symbol: string
    supply: string
    contractAddress: string
    creationFee: string
    taxRecipients: { address: string; percentage: string }[]
    features: { antiBot: boolean; antiWhale: boolean }
    maxTxAmount?: string
  } | null>(null)
  const [showConnectError, setShowConnectError] = useState(false)

  useEffect(() => {
    if (address && showConnectError) setShowConnectError(false)
  }, [address, showConnectError])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      symbol: "",
      supply: "",
      enableTax: false,
      features: {
        antiBot: false,
        antiWhale: false,
      },
      maxTxAmount: "0",
      taxRecipients: [],
    },
    mode: "onChange",
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "taxRecipients",
  })

  function handleFeatureChange(feature: keyof FeatureState, value: boolean) {
    setFeatures(prev => ({ ...prev, [feature]: value }))
    form.setValue(`features.${feature}`, value)
    if (feature === "antiWhale" && !value) form.setValue("maxTxAmount", "")
  }

  function addTaxRecipient() {
    append({ address: "", percentage: "" })
  }

  function removeTaxRecipient(index: number) {
    remove(index)
  }

  function handleTaxToggle(value: boolean) {
    setEnableTax(value)
    form.setValue("enableTax", value)
    if (!value) form.setValue("taxRecipients", [])
  }

  async function onSubmit(data: FormValues) {
    if (!address) {
      setShowConnectError(true)
      setTimeout(() => setShowConnectError(false), 5000)
      return
    }
    try {
      setIsLoading(true)
      setWalletDialogStatus('approving')
      setTokenSymbol(data.symbol.toUpperCase())
      const decimals = tokenDecimals || 18
      const initialSupply = (BigInt(data.supply) * 10n ** BigInt(decimals)).toString()
      const maxTxAmount = data.features.antiWhale
        ? (BigInt(data.maxTxAmount) * 10n ** BigInt(decimals)).toString()
        : "0"
      
      const taxRecipients = data.enableTax ? data.taxRecipients.map(r => r.address as `0x${string}`) : []
      const taxPercentages = data.enableTax ? data.taxRecipients.map(r => BigInt(Math.floor(Number(r.percentage)))) : []

      const result = await createToken({
        name: data.name,
        symbol: data.symbol,
        initialSupply,
        antiBot: data.features.antiBot,
        antiWhale: data.features.antiWhale,
        maxTxAmount,
        taxEnabled: data.enableTax ?? false,
        taxRecipients,
        taxPercentages
      }, () => setWalletDialogStatus('creating'))

      if (result?.tokenAddress && result?.transactionHash) {
        // Get contract address from API (for verification, if needed)
        const response = await fetch(`/api/contract?txHash=${result.transactionHash}&network=${chainId === 56 ? 'mainnet' : 'testnet'}`)
        const apiResult = await response.json()

        if (!response.ok) {
          throw new Error(apiResult.error || 'Failed to get contract address')
        }

        setWalletDialogStatus('completed')
        setCreatedTokenAddress(result.tokenAddress)
        setTimeout(() => setWalletDialogStatus(null), 20000)
        // Reset form after successful submission
        form.reset()
        setFeatures({ antiBot: false, antiWhale: false })
        setEnableTax(false)
        setLastTokenDetails({
          name: data.name,
          symbol: data.symbol,
          supply: data.supply,
          contractAddress: result.tokenAddress,
          creationFee,
          taxRecipients: data.taxRecipients,
          features: data.features,
          maxTxAmount: data.maxTxAmount,
        })
      }
    } catch (error) {
      console.error('Error creating token:', error)
      if (error instanceof Error && error.message === 'USER_REJECTED') {
        setWalletDialogStatus(null)
        return
      }
      setWalletDialogStatus('error')
      toast.error('Failed to create token')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8 w-full">
      <WalletApprovalDialog
        isOpen={!!walletDialogStatus}
        onClose={() => setWalletDialogStatus(null)}
        status={walletDialogStatus || 'approving'}
        tokenAddress={createdTokenAddress}
      />

      {/* Show token summary after creation instead of alert */}
      {lastTokenDetails && (
        <TokenSummary
          name={lastTokenDetails.name}
          symbol={lastTokenDetails.symbol}
          supply={lastTokenDetails.supply}
          contractAddress={lastTokenDetails.contractAddress}
          creationFee={lastTokenDetails.creationFee}
          taxRecipients={lastTokenDetails.taxRecipients}
          features={lastTokenDetails.features}
          maxTxAmount={lastTokenDetails.maxTxAmount}
        />
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="shadow-lg rounded-2xl border bg-zinc-900 w-full">
          <CardHeader>
            <CardTitle>Token Details</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Basic information about your token</p>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <label htmlFor="name" className="font-medium">Name</label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>The name of your token (e.g., MyToken)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input 
                id="name" 
                {...form.register("name")} 
                placeholder="e.g. MyToken" 
                autoComplete="off"
                aria-invalid={form.formState.errors.name ? "true" : "false"}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <label htmlFor="symbol" className="font-medium">Symbol/Ticker</label>
              <Input id="symbol" {...form.register("symbol")} placeholder="e.g. MTK" autoComplete="off" className="uppercase" />
            </div>
            <div className="grid gap-2">
              <label htmlFor="supply" className="font-medium">Total Supply</label>
              <Input 
                id="supply" 
                type="text" 
                inputMode="numeric" 
                pattern="[0-9]*"
                {...form.register("supply")} 
                placeholder="e.g. 1000000" 
                autoComplete="off"
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-2xl border bg-zinc-900 w-full">
          <CardHeader>
            <CardTitle>Token Distribution</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Set up your token&apos;s initial supply and distribution</p>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <label htmlFor="enableTax" className="font-medium">Enable Tax</label>
              <Switch checked={enableTax} onCheckedChange={handleTaxToggle} />
            </div>
            {enableTax && (
              <div className="flex flex-col gap-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-2 gap-4 items-end">
                    <div className="grid gap-2">
                      <label className="font-medium">Recipient Address</label>
                      <Input
                        {...form.register(`taxRecipients.${index}.address`)}
                        placeholder="0x..."
                        autoComplete="off"
                      />
                      {form.formState.errors.taxRecipients?.[index]?.address && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.taxRecipients[index]?.address?.message}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <label className="font-medium">Percentage</label>
                      <div className="flex gap-2">
                        <Input
                          {...form.register(`taxRecipients.${index}.percentage`)}
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*[.,]?[0-9]*"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="0-100"
                          autoComplete="off"
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeTaxRecipient(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                      {form.formState.errors.taxRecipients?.[index]?.percentage && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.taxRecipients[index]?.percentage?.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={addTaxRecipient}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tax Recipient
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-2xl border bg-zinc-900 w-full">
          <CardHeader>
            <CardTitle>Token Features</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Add extra features to protect your token on the market</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <FeatureToggle
                icon={<Shield className="w-5 h-5" />}
                title="Anti Bot"
                description="Prevents bots from trading your token by limiting to one trade per block"
                checked={features.antiBot}
                onChange={val => handleFeatureChange("antiBot", val)}
              />
              <FeatureToggle
                icon={<Lock className="w-5 h-5" />}
                title="Anti Whale"
                description="Allows you to set limits when trading your token"
                checked={features.antiWhale}
                onChange={val => handleFeatureChange("antiWhale", val)}
              />
              {features.antiWhale && (
                <div className="grid gap-2 pl-8">
                  <label htmlFor="maxTxAmount" className="font-medium">Max Transaction Amount</label>
                  <Input 
                    id="maxTxAmount" 
                    type="text" 
                    inputMode="numeric" 
                    pattern="[0-9]*"
                    {...form.register("maxTxAmount")} 
                    placeholder="e.g. 5000" 
                    autoComplete="off"
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                  />
                  {form.formState.errors.maxTxAmount?.message && (
                    <p className="text-sm text-red-500">{form.formState.errors.maxTxAmount.message}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 justify-center items-center">
          {/* Error message for wallet not connected - moved here */}
          {showConnectError && (
            <div className="w-full flex justify-center">
              <div className="bg-red-500/90 text-white text-sm font-semibold rounded-lg px-4 py-2 mb-2 shadow border border-red-600 animate-pulse">
                Please connect your wallet to create a token.
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Creation Fee: {Number(creationFee) / 1e18} BNB
          </p>
          <Button 
            type="submit" 
            className="mt-4 px-4 py-4 min-w-[220px] text-base font-medium rounded-md mx-auto flex justify-center text-center"
            disabled={isLoading}
          >
            {isLoading ? "Creating Token..." : "Create Token"}
          </Button>
        </div>
      </form>
    </div>
  )
}

function FeatureToggle({ icon, title, description, checked, onChange }: Omit<FeatureToggleProps, 'price'>) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">{title}</span>
          </div>
          <Switch checked={checked} onCheckedChange={onChange} />
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  )
}

interface FeatureToggleProps {
  icon: React.ReactNode
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function getExplorerUrl(tokenAddress: string) {
  const network = process.env.NEXT_PUBLIC_NETWORK;
  if (network === 'bscTestnet') {
    return `https://testnet.bscscan.com/token/${tokenAddress}`;
  }
  // Default to BSC mainnet
  return `https://bscscan.com/token/${tokenAddress}`;
}

export { TokenForm }