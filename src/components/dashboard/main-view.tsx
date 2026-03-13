"use client";
import { useState, useEffect, useCallback } from 'react';
import { useWalletStore } from '@/lib/store';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WarthogService } from '@/lib/warthog-config';
import { CryptoVault } from '@/lib/crypto-vault';
import { QRCodeSVG } from 'qrcode.react'; 
import { Html5QrcodeScanner } from "html5-qrcode";
import { 
  Send, Download, Copy, LogOut, Loader2, 
  ChevronLeft, Wallet, History, Settings, Shield, 
  Scan, ArrowUpRight, ArrowDownLeft, Eye, EyeOff
} from "lucide-react";

export function MainDashboard({ balance }: { balance: string }) {
  const { address, logout, vault } = useWalletStore();
  const [activeTab, setActiveTab] = useState<"wallet" | "history" | "settings">("wallet");
  const [view, setView] = useState<"home" | "send" | "receive">("home");
  const [isPrivate, setIsPrivate] = useState(false);

  // --- STATES ---
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "confirm">("input");

  // --- BACKUP & BIO ---
  const [showBackup, setShowBackup] = useState(false);
  const [backupMnemonic, setBackupMnemonic] = useState("");
  const [backupPin, setBackupPin] = useState("");
  const [bioActive, setBioActive] = useState(false);

  useEffect(() => {
    setBioActive(localStorage.getItem("biometrics_active") === "true");
  }, []);

  // --- UNIVERSAL COPY (Fixes iPhone/Safari/HTTP Error) ---
  const handleCopy = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => alert("U kopjua!"))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      alert("U kopjua!");
    } catch (err) {
      alert("Gabim! Kopjojeni manualisht.");
    }
    document.body.removeChild(textArea);
  };

  // --- FACEID LOGIC ---
  const handleEnableBiometrics = async () => {
    if (!window.isSecureContext) return alert("FaceID kërkon HTTPS (Vercel) për të punuar.");
    if (!window.PublicKeyCredential) return alert("Pajisja nuk e mbështet biometrinë.");
    
    try {
      const challenge = window.crypto.getRandomValues(new Uint8Array(32));
      const userID = window.crypto.getRandomValues(new Uint8Array(16));
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Warthog Wallet", id: window.location.hostname },
          user: { id: userID, name: "user@warthog", displayName: "Warthog User" },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
        }
      });
      if (credential) {
        localStorage.setItem("biometrics_active", "true");
        setBioActive(true);
        alert("FaceID u aktivizua!");
      }
    } catch (err) { console.error(err); }
  };

  // --- FETCH HISTORY ---
  const fetchHistory = useCallback(async () => {
    if (!address || activeTab !== "history") return;
    setLoadingHistory(true);
    try {
      const response = await fetch(`https://explorer.warthog.network/api/v1/address/${address}/transactions`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) { console.warn("Syncing..."); } finally { setLoadingHistory(false); }
  }, [address, activeTab]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // --- SEND LOGIC ---
  const handleSend = async () => {
    if (!vault) return;
    setLoading(true);
    try {
      const mnemonic = CryptoVault.unseal(vault, pin);
      if (!mnemonic) return alert("PIN i gabuar!");
      await WarthogService.sendTransaction(mnemonic, toAddress, parseFloat(amount));
      alert(`Sukses! Transaksioni u dërgua.`);
      resetSendState();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const resetSendState = () => {
    setView("home"); setStep("input"); setToAddress(""); setAmount(""); setPin(""); setIsScanning(false);
  };

  // --- SCANNER ---
  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
      scanner.render((text) => { setToAddress(text); setIsScanning(false); scanner.clear(); }, () => {});
      return () => { scanner.clear().catch(() => {}); };
    }
  }, [isScanning]);

  // --- VIEW: SEND ---
  if (view === "send") {
    return (
      <div className="min-h-screen bg-slate-50 p-6 pb-44">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={resetSendState} className="rounded-full bg-white shadow-sm"><ChevronLeft /></Button>
            <h2 className="text-xl font-bold text-slate-900">Dërgo WART</h2>
            <Button variant="outline" onClick={() => setIsScanning(!isScanning)}>
                <Scan size={20} className={isScanning ? "text-blue-600 animate-pulse" : ""} />
            </Button>
          </div>
          {isScanning && <div id="reader" className="overflow-hidden rounded-3xl border-4 border-blue-600 mb-4" />}
          <Card className="bg-slate-900 p-8 text-white rounded-[2.5rem] shadow-xl text-center">
              <p className="text-slate-400 text-xs font-bold uppercase">Balanca Disponueshme</p>
              <p className="text-4xl font-black mt-1">{isPrivate ? "••••" : balance} WART</p>
          </Card>
          <div className="space-y-4">
              <Input placeholder="Adresa wart1..." value={toAddress} onChange={(e) => setToAddress(e.target.value)} className="h-16 rounded-2xl bg-white px-6 font-mono text-sm border-none shadow-sm"/>
              <Input type="number" placeholder="Shuma" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-16 rounded-2xl bg-white text-2xl font-black px-6 border-none shadow-sm"/>
              
              <div className="flex justify-between items-center px-4 text-sm text-slate-500">
                <span>Komisioni (Fee):</span>
                <span className="font-bold text-slate-900">0.01 WART</span>
              </div>

              {step === "confirm" && (
                 <Input type="password" placeholder="PIN ****" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value)} className="h-16 rounded-2xl text-center text-3xl tracking-[0.5em] font-bold border-2 border-blue-600 bg-white"/>
              )}
              <Button onClick={step === "input" ? () => setStep("confirm") : handleSend} className="w-full h-16 rounded-[1.5rem] bg-blue-600 text-white font-bold text-lg shadow-lg active:scale-95 transition-transform">
                 {loading ? <Loader2 className="animate-spin mx-auto"/> : step === "input" ? "Vazhdo" : "Konfirmo Dërgimin"}
              </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-44"> 
      <div className="max-w-md mx-auto p-6 space-y-8 pt-10">
        <div className="flex justify-between items-center px-2">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 uppercase text-[10px] font-black text-slate-400">Warthog Network</div>
          <Button variant="ghost" onClick={logout} className="text-slate-400 bg-white shadow-sm rounded-xl px-3 hover:text-red-500 transition-colors"><LogOut size={18} /></Button>
        </div>

        {activeTab === "wallet" && (
          <div className="space-y-8 animate-in fade-in">
            <Card className="bg-slate-900 text-white rounded-[3rem] shadow-2xl p-12 text-center space-y-4 relative overflow-hidden">
              <button onClick={() => setIsPrivate(!isPrivate)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-xl">
                {isPrivate ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <p className="text-slate-400 text-sm">Balanca Juaj Reale</p>
              <h2 className="text-6xl font-black tracking-tighter">{isPrivate ? "••••" : balance}</h2>
              <p className="text-blue-400 font-bold text-lg">WART</p>
              <button onClick={() => handleCopy(address!)} className="text-[10px] font-mono text-slate-300 bg-white/5 px-4 py-2 rounded-xl border border-white/5 mx-auto flex items-center gap-2 active:bg-white/10">
                {address?.slice(0,10)}...{address?.slice(-10)} <Copy size={12}/>
              </button>
            </Card>
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => setView("send")} className="h-28 rounded-[2.5rem] bg-blue-600 text-white font-black flex-col gap-2 shadow-xl active:scale-95 transition-all"><Send size={24} /> <span>Dërgo</span></Button>
              <Button onClick={() => setView("receive")} className="h-28 rounded-[2.5rem] bg-white text-slate-900 border-2 border-slate-100 font-black flex-col gap-2 shadow-sm active:scale-95 transition-all"><Download size={24} className="text-blue-600" /> <span>Prano</span></Button>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4">
            <h3 className="text-2xl font-black text-center text-slate-900 uppercase tracking-tighter">Aktiviteti</h3>
            <div className="bg-white rounded-[2.5rem] p-4 shadow-sm min-h-[400px]">
              {loadingHistory ? (
                <div className="flex flex-col items-center mt-20 gap-2">
                  <Loader2 className="animate-spin text-blue-600" size={32} />
                  <p className="text-[10px] font-black text-slate-300 uppercase">Duke u përditësuar...</p>
                </div>
              ) : (
                transactions.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border-b last:border-0 border-slate-50">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${tx.to === address ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {tx.to === address ? <ArrowDownLeft size={20}/> : <ArrowUpRight size={20}/>}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{tx.to === address ? 'Marrë' : 'Dërguar'}</p>
                        <p className="text-[10px] text-slate-400">{new Date(tx.timestamp * 1000).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className={`font-black ${tx.to === address ? 'text-green-600' : 'text-red-600'}`}>
                      {isPrivate ? "•••" : (tx.to === address ? '+' : '-') + Number(tx.amount).toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
             <h3 className="text-2xl font-black px-2 text-slate-900">Cilësimet</h3>
             <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm">
                <button onClick={handleEnableBiometrics} className="w-full p-6 flex items-center justify-between border-b hover:bg-slate-50 transition">
                   <div className="flex items-center gap-4">
                     <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Scan size={20}/></div>
                     <p className="font-bold text-sm text-left">FaceID / TouchID</p>
                   </div>
                   <div className={`w-10 h-5 rounded-full relative transition-colors ${bioActive ? 'bg-green-500' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all ${bioActive ? 'translate-x-5' : ''}`} />
                   </div>
                </button>
                <button onClick={() => setShowBackup(true)} className="w-full p-6 flex items-center gap-4 border-b hover:bg-slate-50 transition">
                   <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Shield size={20}/></div>
                   <p className="font-bold text-sm text-left">Backup Seed Phrase</p>
                </button>
                <button onClick={logout} className="w-full p-6 flex items-center gap-4 text-red-600 hover:bg-red-50 font-black text-sm uppercase transition-colors">
                   <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><LogOut size={20}/></div>
                   Logout
                </button>
             </div>
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[360px] bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] p-2 flex justify-between shadow-2xl z-50 border border-white/10">
        <button onClick={() => setActiveTab("wallet")} className={`flex-1 flex flex-col items-center py-3 ${activeTab === "wallet" ? "text-blue-400" : "text-slate-500"}`}><Wallet size={20} /><span className="text-[9px] mt-1 font-black uppercase">Wallet</span></button>
        <button onClick={() => setActiveTab("history")} className={`flex-1 flex flex-col items-center py-3 ${activeTab === "history" ? "text-blue-400" : "text-slate-500"}`}><History size={20} /><span className="text-[9px] mt-1 font-black uppercase">Activity</span></button>
        <button onClick={() => setActiveTab("settings")} className={`flex-1 flex flex-col items-center py-3 ${activeTab === "settings" ? "text-blue-400" : "text-slate-500"}`}><Settings size={20} /><span className="text-[9px] mt-1 font-black uppercase">Settings</span></button>
      </div>

      {/* MODAL RECEIVE */}
      {view === "receive" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-6">
          <Card className="w-full max-w-sm rounded-[3rem] p-10 text-center bg-white shadow-2xl space-y-8 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-900">Adresa jote</h3>
            <div className="bg-white p-4 rounded-[2rem] border-4 border-slate-50 inline-block shadow-inner">
              <QRCodeSVG value={address || ""} size={200} level="H" includeMargin={true} />
            </div>
            <p className="text-[10px] font-mono bg-slate-50 p-4 rounded-2xl break-all text-slate-500 border border-slate-100">{address}</p>
            <Button className="w-full h-16 rounded-2xl bg-blue-600 text-white font-bold text-lg" onClick={() => handleCopy(address!)}>Kopjo Adresën</Button>
            <Button variant="ghost" onClick={() => setView("home")} className="w-full text-slate-400 font-bold">Mbyll</Button>
          </Card>
        </div>
      )}

      {/* MODAL BACKUP */}
      {showBackup && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[70] flex items-center justify-center p-6">
          <Card className="w-full max-w-sm rounded-[3rem] p-8 bg-white shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto"><Shield size={32} /></div>
              <h3 className="text-xl font-black text-slate-900">Backup Seed</h3>
            </div>
            {!backupMnemonic ? (
              <div className="space-y-4">
                <Input type="password" placeholder="PIN ****" maxLength={4} value={backupPin} onChange={(e) => setBackupPin(e.target.value)} className="h-16 rounded-2xl text-center text-2xl font-bold border-2 bg-white"/>
                <Button onClick={() => {
                  const mnemonic = CryptoVault.unseal(vault!, backupPin);
                  if (mnemonic) setBackupMnemonic(mnemonic);
                  else { alert("PIN i gabuar!"); setBackupPin(""); }
                }} className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold">Zbuloni Fjalët</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  {backupMnemonic.split(" ").map((word, i) => (
                    <div key={i} className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                      <span className="text-[8px] text-slate-300 block">{i + 1}</span>
                      <span className="text-[10px] font-bold text-slate-700">{word}</span>
                    </div>
                  ))}
                </div>
                <Button onClick={() => handleCopy(backupMnemonic)} className="w-full h-12 rounded-xl bg-blue-50 text-blue-600 font-bold flex gap-2 items-center justify-center active:bg-blue-100 transition-colors">
                  <Copy size={16}/> Kopjo Seed Phrase
                </Button>
              </div>
            )}
            <Button variant="ghost" onClick={() => {setShowBackup(false); setBackupMnemonic(""); setBackupPin("");}} className="w-full text-slate-400 font-bold h-12">Mbyll</Button>
          </Card>
        </div>
      )}
    </div>
  );
}