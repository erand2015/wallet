"use client";
import { useState } from 'react';
import * as bip39 from 'bip39';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Copy, CheckCircle2, Import, PlusCircle, RefreshCw } from "lucide-react";

export function SeedWizard({ onComplete }: { onComplete: (m: string) => void }) {
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [importMode, setImportMode] = useState(false);
  const [wordCount, setWordCount] = useState<12 | 24>(12);
  const [importText, setImportText] = useState("");
  const [copied, setCopied] = useState(false);

  // Gjenerimi i fjalëve bazuar në zgjedhjen 12 ose 24
  const generate = () => {
    const m = bip39.generateMnemonic(wordCount === 12 ? 128 : 256);
    setMnemonic(m.split(' '));
  };

  const handleImport = () => {
    const words = importText.trim().toLowerCase().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      return alert("Ju lutem vendosni saktësisht 12 ose 24 fjalë.");
    }
    if (!bip39.validateMnemonic(words.join(' '))) {
      return alert("Fjalët nuk janë të vlefshme. Kontrolloni drejtshkrimin.");
    }
    onComplete(words.join(' '));
  };

  return (
    <div className="max-w-md mx-auto space-y-8 p-6 pt-20">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">WARTHOG</h1>
        <p className="text-slate-500 font-medium">Siguria juaj, në duart tuaja</p>
      </div>

      {!importMode && mnemonic.length === 0 ? (
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center block">
                Krijo Portofol të Ri
              </label>
              
              {/* Selektori 12/24 */}
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button 
                  onClick={() => setWordCount(12)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${wordCount === 12 ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                >
                  12 Fjalë
                </button>
                <button 
                  onClick={() => setWordCount(24)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${wordCount === 24 ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                >
                  24 Fjalë
                </button>
              </div>

              <Button onClick={generate} className="w-full h-16 text-lg rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                <PlusCircle className="mr-2" size={20} /> Gjenero Seed Phrase
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Ose</span></div>
            </div>

            <Button onClick={() => setImportMode(true)} variant="outline" className="w-full h-16 text-lg rounded-2xl border-2 border-slate-100 hover:bg-slate-50">
              <Import className="mr-2" size={20} /> Importo Portofolin
            </Button>
          </CardContent>
        </Card>
      ) : importMode ? (
        /* UI për Importim */
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white">
          <CardContent className="p-8 space-y-6">
            <h3 className="text-xl font-bold text-center">Importo me Seed Phrase</h3>
            <textarea 
              placeholder="Shkruani fjalët këtu të ndara me hapësirë..." 
              className="w-full min-h-[150px] rounded-2xl bg-slate-50 border border-slate-100 p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none text-md resize-none font-mono"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <div className="flex gap-3">
               <Button variant="ghost" onClick={() => setImportMode(false)} className="flex-1 h-14 rounded-2xl">Anulo</Button>
               <Button onClick={handleImport} className="flex-[2] h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">Importo</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* UI për Shfaqjen e fjalëve të gjeneruara */
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white animate-in zoom-in-95 duration-300">
          <CardContent className="p-8 space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Kujdes: Mos i ndani me askënd!</span>
              <Button variant="ghost" size="sm" onClick={() => {
                navigator.clipboard.writeText(mnemonic.join(' '));
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }} className="text-blue-600 hover:bg-blue-50 rounded-xl">
                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100">
              {mnemonic.map((word, i) => (
                <div key={i} className="p-2 text-[11px] font-mono">
                  <span className="text-slate-300 mr-1">{i + 1}.</span>
                  <span className="font-bold text-slate-700">{word}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Button onClick={() => onComplete(mnemonic.join(' '))} className="w-full h-16 rounded-2xl bg-blue-600 text-lg font-bold shadow-xl shadow-blue-200">
                Vazhdo <ArrowRight className="ml-2" size={20} />
              </Button>
              <Button variant="ghost" onClick={() => setMnemonic([])} className="w-full text-slate-400 text-xs">
                <RefreshCw size={12} className="mr-1" /> Gjenero tjetër
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}