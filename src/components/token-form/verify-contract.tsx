"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { verifyContract } from "@/lib/contract"
import { Loader2 } from "lucide-react"

interface VerifyContractProps {
  contractAddress: string
  contractName: string
  constructorArguments: string
}

export function VerifyContract({ contractAddress, contractName, constructorArguments }: VerifyContractProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const { toast } = useToast()

  const handleVerify = async () => {
    try {
      setIsVerifying(true)
      const result = await verifyContract({
        contractAddress,
        contractName,
        constructorArguments,
      })

      if (result && result.success) {
        toast({
          title: "Verification Submitted",
          description: "Your contract verification has been submitted to Etherscan. It may take a few minutes to process.",
        })
      } else {
        toast({
          title: "Verification Failed",
          description: result?.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Verification error:", error)
      toast({
        title: "Error",
        description: "Failed to verify contract. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Card className="shadow-lg rounded-2xl border bg-zinc-900 w-full">
      <CardHeader>
        <CardTitle>Verify Contract on Etherscan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <label className="font-medium">Contract Address</label>
          <Input value={contractAddress} readOnly />
        </div>
        <div className="grid gap-2">
          <label className="font-medium">Contract Name</label>
          <Input value={contractName} readOnly />
        </div>
        <div className="grid gap-2">
          <label className="font-medium">Constructor Arguments</label>
          <Input value={constructorArguments} readOnly />
        </div>
        <Button
          onClick={handleVerify}
          disabled={isVerifying}
          className="w-full"
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Contract"
          )}
        </Button>
      </CardContent>
    </Card>
  )
} 