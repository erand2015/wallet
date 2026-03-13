import './polyfill';
import { Account } from "warthog-ts";
import * as bip39 from "bip39";
import { BIP32Factory } from "bip32";
import * as ecc from "tiny-secp256k1";

const bip32 = BIP32Factory(ecc);
const MAINNET_RPC = "https://rpc.warthog.network";
const EXPLORER_API = "https://api.warthog.network";

// Proxy për zhvillim (në Mobile App nativ do të hiqet)
const PROXY = "https://api.codetabs.com/v1/proxy/?url=";

export const WarthogService = {
  // Derivimi i llogarisë sipas standardit BIP44 (2070' është kodi i Warthog)
  async getAccount(mnemonic: string, isHardened: boolean = true) {
    try {
      const cleanMnemonic = mnemonic.trim().toLowerCase();
      const seed = await bip39.mnemonicToSeed(cleanMnemonic);
      const root = bip32.fromSeed(seed);
      // Path zyrtar: m/44'/2070'/0'/0/0
      const path = isHardened ? "m/44'/2070'/0'/0/0" : "m/44'/2070'/0/0/0";
      const child = root.derivePath(path);
      return Account.fromPrivateKeyHex(Buffer.from(child.privateKey!).toString("hex"));
    } catch (e) {
      console.error("Account derivation error:", e);
      throw e;
    }
  },

  async getBalance(addressHex: string): Promise<string> {
    try {
      const url = `${MAINNET_RPC}/api/v1/account/${addressHex}`;
      const res = await fetch(PROXY + encodeURIComponent(url));
      if (!res.ok) return "0.0000";
      
      const data = await res.json();
      // Dokumentacioni: Balanca vjen në format BigInt (njësi e8)
      const balanceE8 = BigInt(data.balance || 0);
      return (Number(balanceE8) / 100_000_000).toFixed(4);
    } catch (e) {
      return "0.0000";
    }
  },

  async getHistory(addressHex: string) {
    try {
      const url = `${EXPLORER_API}/api/v1/account/${addressHex}/transactions`;
      const res = await fetch(PROXY + encodeURIComponent(url));
      if (!res.ok) return [];
      
      const data = await res.json();
      const txs = data.transactions || (Array.isArray(data) ? data : []);
      
      return txs.map((tx: any) => ({
        id: tx.id || tx.hash,
        from: tx.from,
        to: tx.to,
        // Konvertimi i shumës nga e8 në WART
        amount: (Number(tx.amount || 0) / 100_000_000).toFixed(4),
        timestamp: tx.timestamp,
        type: tx.from.toLowerCase() === addressHex.toLowerCase() ? 'sent' : 'received'
      }));
    } catch (e) {
      return [];
    }
  },

  async sendTransaction(mnemonic: string, toAddress: string, amountWart: number) {
    try {
      const account = await this.getAccount(mnemonic);
      const myAddress = account.getAddress().hex;
      
      // 1. Marrim të dhënat e nevojshme sipas dokumentacionit
      const [accData, chainData] = await Promise.all([
        fetch(PROXY + encodeURIComponent(`${MAINNET_RPC}/api/v1/account/${myAddress}`)).then(r => r.json()),
        fetch(PROXY + encodeURIComponent(`${MAINNET_RPC}/api/v1/chain/head`)).then(r => r.json())
      ]);

      // 2. Parametrat e transaksionit
      const amountUnits = BigInt(Math.round(amountWart * 100_000_000));
      const feeUnits = BigInt(100_000); // Fee standarde 0.001 WART
      const nonce = accData.nonce;
      const chainPin = chainData.pin;

      // 3. Ndërtimi i transaksionit (Libraria warthog-ts merret me nënshkrimin)
      const tx = account.createTransaction(
        myAddress, 
        toAddress,
        amountUnits,
        feeUnits,
        nonce,
        chainPin
      );

      // 4. Transmetimi i transaksionit "RAW" në rrjet
      const response = await fetch(`${MAINNET_RPC}/api/v1/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: tx.encode().toString('hex') })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);
      return result.txId;
    } catch (e: any) {
      console.error("Gabim sipas dokumentacionit:", e.message);
      throw e;
    }
  }
};