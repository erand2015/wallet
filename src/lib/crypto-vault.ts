import CryptoJS from 'crypto-js';

export const CryptoVault = {
  async seal(mnemonic: string, pin: string) {
    const salt = CryptoJS.lib.WordArray.random(128 / 8);
    const key = CryptoJS.PBKDF2(pin, salt, { 
      keySize: 256 / 32, 
      iterations: 10000 
    });
    
    const encrypted = CryptoJS.AES.encrypt(mnemonic, key.toString()).toString();
    
    return JSON.stringify({
      ciphertext: encrypted,
      salt: salt.toString()
    });
  },

  unseal(vaultJson: string, pin: string): string | null {
    try {
      if (!vaultJson || vaultJson === "undefined") return null;

      // Sigurohemi që JSON është i vlefshëm
      let data;
      try {
        data = JSON.parse(vaultJson);
      } catch (e) {
        console.error("Vault JSON i dëmtuar");
        return null;
      }

      const { ciphertext, salt } = data;
      if (!ciphertext || !salt) return null;
      
      const key = CryptoJS.PBKDF2(pin, CryptoJS.enc.Hex.parse(salt), { 
        keySize: 256 / 32, 
        iterations: 10000 
      });

      const bytes = CryptoJS.AES.decrypt(ciphertext, key.toString());
      
      // Kthejmë në tekst dhe kapim gabimin Malformed UTF-8
      const result = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!result) return null;
      return result;
    } catch (e) {
      // Ky bllok kap çdo gjë tjetër, përfshirë gabimet e CryptoJS
      return null;
    }
  }
};