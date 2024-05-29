import { WalletApi } from "lucid-cardano";

export interface FullWallet extends WalletApi {
  name: string;
  icon: string;
  apiVersion: string;
}