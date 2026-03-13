"use client";
import { useState, useEffect } from 'react';
import { useWalletStore } from '@/lib/store';
import { CryptoVault } from '@/lib/crypto-vault';
import { WarthogService } from '@/lib/warthog-config';
import { SeedWizard } from '@/components/onboarding/seed-wizard';
import { MainDashboard } from '@/components/dashboard/main-view';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Lock, ChevronRight } from "lucide-react";

export default function App() {
  const { vault, address, setVault, isLocked, unlock } = useWalletStore();
  const [balance, setBalance] = useState("0.0000");
  const [pin, setPin] = useState("");

  // States për procesin e ri të setup-it
  const [setupStep, setSetupStep] = useState<"seed" | "path" | "pin">("seed");
  const [tempMnemonic, setTempMnemonic] = useState("");
  const [selectedHardened, setSelectedHardened] = useState(true);
  const [newPin, setNewPin] = useState("");

  // Përditëso balancën automatikisht
  useEffect(() => {
    if (address && !isLocked) {
      WarthogService.getBalance(address).then(setBalance);
      const interval = setInterval(() => {
        WarthogService.getBalance(address).then(setBalance);
      }, 30000); 
      return () => clearInterval(interval);
    }
  }, [address, isLocked]);

  // Kalimi nga SeedWizard te zgjedhja e Path-it
  const handleSeedComplete = (mnemonic: string) => {
    setTempMnemonic(mnemonic);
    setSetupStep("path");
  };

  // Krijimi final i Wallet-it
  const handleFinalizeSetup = async () => {
    if (newPin.length < 4) return alert("PIN duhet të jetë 4 shifra");
    
    try {
      const account = await WarthogService.getAccount(tempMnemonic, selectedHardened);
      
      let addressHex = "";
      if (typeof account.getAddress === 'function') {
        const addrObj = account.getAddress();
        addressHex = typeof addrObj === 'string' ? addrObj : addrObj.hex;
      } else {
        addressHex = (account as any).address?.hex || (account as any).address;
      }

      if (!addressHex) throw new Error("Adresa nuk u gjet");

      const encryptedVault = await CryptoVault.seal(tempMnemonic, newPin);
      setVault(encryptedVault, addressHex);
      
      // Reset setup states
      setSetupStep("seed");
      setTempMnemonic("");
      setNewPin("");
    } catch (err) {
      console.error(err);
      alert("Gabim gjatë krijimit të llogarisë.");
    }
  };

  const handleUnlock = () => {
    if (!vault) return;
    const decrypted = CryptoVault.unseal(vault, pin);
    if (decrypted) {
      unlock();
    } else {
      alert("PIN i gabuar!");
      setPin("");
    }
  };

  // --- RRJEDHA E ONBOARDING ---
  if (!vault) {
    // Hapi 1: Seed Phrase
    if (setupStep === "seed") {
      return <SeedWizard onComplete={handleSeedComplete} />;
    }

    // Hapi 2: Zgjedhja e Path-it (Zëvendëson confirm)
    if (setupStep === "path") {
      return (
        <div className="max-w-md mx-auto pt-20 p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter">Derivation Path</h2>
            <p className="text-slate-500">Zgjidhni llojin e rrugës për gjenerimin e adresës</p>
          </div>
          <div className="grid gap-4">
            <button 
              onClick={() => setSelectedHardened(true)}
              className={`p-6 rounded-[2rem] border-2 text-left transition-all ${selectedHardened ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white'}`}
            >
              <div className="font-bold text-lg flex items-center gap-2">
                <ShieldCheck className={selectedHardened ? "text-blue-600" : "text-slate-400"} />
                Hardened (Official)
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono">m/44'/2070'/0'/0/0</p>
            </button>
            <button 
              onClick={() => setSelectedHardened(false)}
              className={`p-6 rounded-[2rem] border-2 text-left transition-all ${!selectedHardened ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white'}`}
            >
              <div className="font-bold text-lg flex items-center gap-2">
                <ShieldCheck className={!selectedHardened ? "text-blue-600" : "text-slate-400"} />
                Non-Hardened
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono">m/44'/2070'/0/0/0</p>
            </button>
          </div>
          <Button onClick={() => setSetupStep("pin")} className="w-full h-16 rounded-2xl bg-blue-600 text-lg shadow-xl shadow-blue-200">
            Vazhdo te PIN <ChevronRight className="ml-2" />
          </Button>
        </div>
      );
    }

    // Hapi 3: Krijimi i PIN-it (Zëvendëson prompt)
    if (setupStep === "pin") {
      return (
        <div className="max-w-md mx-auto pt-32 p-6 text-center space-y-8 animate-in zoom-in-95 duration-300">
          <div className="space-y-2">
            <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-3xl mx-auto flex items-center justify-center">
              <Lock size={32} />
            </div>
            <h2 className="text-3xl font-bold tracking-tighter">Krijo PIN-in</h2>
            <p className="text-slate-500">Ky PIN do të mbrojë portofolin tuaj</p>
          </div>
          <Input 
            type="password" 
            value={newPin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              setNewPin(val);
              if (val.length === 4) {
                 // Mund ta bëjmë auto-finalize ose të presim butonin
              }
            }} 
            className="text-center text-4xl h-20 rounded-3xl tracking-[0.5em] font-bold border-2 focus:border-blue-500" 
            placeholder="****"
            maxLength={4} 
            autoFocus
          />
          <Button 
            disabled={newPin.length < 4}
            onClick={handleFinalizeSetup} 
            className="w-full h-16 rounded-2xl bg-blue-600 text-lg shadow-xl shadow-blue-200"
          >
            Përfundo Setup-in
          </Button>
        </div>
      );
    }
  }

  // --- LOGIN SCREEN ---
  if (isLocked) return (
    <div className="max-w-md mx-auto pt-40 p-6 text-center space-y-6">
      <div className="bg-blue-600 w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
        <span className="text-2xl font-bold">W</span>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Portofoli i Kyçur</h2>
        <p className="text-slate-500">Shkruani PIN-in tuaj për të vazhduar</p>
      </div>
      <Input 
        type="password" 
        value={pin} 
        onChange={(e) => setPin(e.target.value)} 
        className="text-center text-3xl h-16 rounded-2xl tracking-[0.5em] font-bold" 
        placeholder="****"
        maxLength={4} 
      />
      <Button onClick={handleUnlock} className="w-full h-14 bg-blue-600 rounded-2xl text-lg shadow-lg">Hap Wallet</Button>
    </div>
  );

  return <MainDashboard balance={balance} />;
}