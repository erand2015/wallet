"use client";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WarthogService } from '@/lib/warthog-config';
import { useWalletStore } from '@/lib/store';
import { CryptoVault } from '@/lib/crypto-vault';
import { Loader2, Send, AlertCircle } from "lucide-react";

export function SendModal({ balance, onClose }: { balance: string, onClose: () => void }) {
  const { vault } = useWalletStore();
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"details" | "confirm">("details");

  const fee = 0.001; // Fee zyrtare fikse

  const handleSend = async () => {
    if (!vault) return;
    setLoading(true);
    
    try {
      // 1. Hapim Vault me PIN-in që shkruan përdoruesi
      const mnemonic = CryptoVault.unseal(vault, pin);
      if (!mnemonic) {
        alert("PIN i gabuar!");
        setLoading(false);
        return;
      }

      // 2. Dërgojmë transaksionin
      const txId = await WarthogService.sendTransaction(mnemonic, toAddress, parseFloat(amount));
      
      alert(`Sukses! Transaksioni u dërgua.\nID: ${txId}`);
      onClose();
    } catch (err: any) {
      alert("Gabim: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-6 animate-in slide-in-from-bottom-10 duration-300">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Dërgo WART</h2>
          <button onClick={onClose} className="text-slate-400 font-bold">X</button>
        </div>

        {step === "details" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Adresa e Marrësit</label>
              <Input 
                placeholder="4f66..." 
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                className="rounded-2xl h-14 bg-slate-50 border-none"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase">Shuma</label>
                <span className="text-xs text-blue-600 font-bold">Max: {parseFloat(balance) - fee}</span>
              </div>
              <Input 
                type="number"
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-2xl h-14 bg-slate-50 border-none text-xl font-bold"
              />
            </div>
            
            {/* Kjo eshte pjesa e FEE qe te mungonte */}
            <div className="bg-blue-50 p-4 rounded-2xl flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700">Tarifa e Rrjetit (Fee)</span>
              <span className="font-mono font-bold text-blue-700">{fee} WART</span>
            </div>

            <Button 
              disabled={!toAddress || !amount}
              onClick={() => setStep("confirm")} 
              className="w-full h-16 rounded-2xl bg-blue-600 text-lg"
            >
              Vazhdo
            </Button>
          </div>
        ) : (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-slate-500 text-sm">Po dërgoni</p>
              <p className="text-4xl font-black">{amount} WART</p>
              <p className="text-xs text-slate-400">Target: {toAddress.slice(0,10)}...</p>
            </div>
            
            <Input 
              type="password"
              placeholder="Shkruaj PIN-in për konfirmim"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="text-center text-2xl h-16 rounded-2xl tracking-widest"
              maxLength={4}
            />

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep("details")} className="flex-1 h-14 rounded-2xl">Kthehu</Button>
              <Button 
                onClick={handleSend} 
                disabled={loading || pin.length < 4}
                className="flex-[2] h-14 rounded-2xl bg-blue-600"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Send className="mr-2" size={18}/> Konfirmo</>}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}