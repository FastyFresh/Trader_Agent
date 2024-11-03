import { PublicKey } from '@solana/web3.js';

export interface PhantomProvider {
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: (args: any) => void) => void;
  isConnected: boolean;
  publicKey: PublicKey;
}