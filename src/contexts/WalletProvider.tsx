import * as React from "react";

import { createContext, useState, useContext, useEffect } from "react";
import {
  C,
  Data,
  Constr,
  Lucid,
  Blockfrost,
  WalletApi,
  Cardano,
  MintingPolicy,
  SpendingValidator,
  Validator,
  fromText,
  UTxO,
  Assets,
  applyParamsToScript,
  applyDoubleCborEncoding,
  OutRef,
  PolicyId,
} from "lucid-cardano";

import {
  Competition,
  User,
  RewardRates,
  CompetitionShort,
} from "../types/competition.ts";
import { TicketParams, CompiledScriptInfo } from "../types/script.ts";
import { FullWallet } from "../types/wallet.ts";

import { Blueprint } from "../types/blueprint.ts";

import blueprint from "../assets/plutus.json";

import * as backend from "./utils/backend.ts";
import * as transaction from "./utils/transaction.ts";

import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_BASE_URL,
});

window.cardano = window.cardano || {};

export type WalletContext = {
  walletLoaded: boolean;
  currentWallet: FullWallet | null;
  getWallets: () => Cardano | null;
  connect: (wallet: string) => Promise<void>;
  getCompetitions: () => Promise<Competition[]>;
  getUsers: (competitionId: string) => Promise<User[]>;
  mintAdmin: (
    competitionName: string,
    competitionDescription: string,
    modAddress: string,
    userPrice: number,
    votePolicyId: string,
    endDate: number,
    rewardRates: RewardRates
  ) => Promise<void>;
  mintUser: (competiton: Competition, userNames: string[]) => Promise<void>;
  reviewUser: (
    competition: Competition,
    user: User,
    approve: boolean
  ) => Promise<void>;
  voteUser: (competition: Competition, user: User) => Promise<void>;
};

export const Wallet = createContext<WalletContext | null>(null);

type WalletProviderProps = {
  children: JSX.Element;
  networkMode: "testnet" | "mainnet";
};

export const WalletProvider = ({
  children,
  networkMode,
}: WalletProviderProps) => {
  const [currentWallet, setCurrentWallet] = useState<string | null>(null);
  const [currentFullWallet, setCurrentFullWallet] = useState<FullWallet | null>(
    null
  );

  const [lucid, setLucid] = useState<Lucid | null>(null);
  const [wallets, setWallets] = useState<Cardano | null>(null);
  const [walletLoaded, setWalletLoaded] = useState<boolean>(false);

  useEffect(() => {
    loadCardano();
  }, []);

  useEffect(() => {
    updateCurrentFullWallet();
  }, [currentWallet, wallets]);

  const loadCardano = async () => {
    await setupLucid();
    setupWallets();

    setWalletLoaded(true);
  };

  const setupLucid = async () => {
    const newLucid = await Lucid.new(
      new Blockfrost(
        networkMode === "testnet"
          ? "https://cardano-preprod.blockfrost.io/api/v0"
          : "https://cardano-mainnet.blockfrost.io/api/v0",
        process.env.REACT_APP_PROJECT_ID
      ),
      networkMode === "testnet" ? "Preprod" : "Mainnet"
    );

    setLucid(newLucid);
  };

  const setupWallets = () => {
    const wallets: Cardano = {};
    if (window && window.cardano) {
      for (let key of Object.keys(window.cardano)) {
        if (
          typeof window.cardano[key] === "object" &&
          window.cardano[key] !== null &&
          "name" in window.cardano[key] &&
          "icon" in window.cardano[key] &&
          "enable" in window.cardano[key] &&
          "isEnabled" in window.cardano[key] &&
          "apiVersion" in window.cardano[key]
        ) {
          wallets[key] = {
            name: window.cardano[key].name,
            icon: window.cardano[key].icon,
            apiVersion: window.cardano[key].apiVersion,
            enable: window.cardano[key].enable,
            isEnabled: window.cardano[key].isEnabled,
          };
        }
      }

      if (Object.keys(wallets).length > 0) {
        setWallets(wallets);
      }
    }
  };

  const updateCurrentFullWallet = async () => {
    const currentFullWallet = await getCurrentWallet();
    setCurrentFullWallet(currentFullWallet);
  };

  const getCurrentWallet = async () => {
    if (currentWallet && wallets !== null && currentWallet in wallets) {
      const wallet = await wallets[currentWallet].enable();

      return { ...wallet, ...wallets[currentWallet] };
    } else {
      return null;
    }
  };

  const connect = async (wallet: string) => {
    if (walletLoaded === false) {
      return Promise.reject("Cardano extensions not loaded yet.");
    } else if (wallets === null) {
      return Promise.reject(
        "User doesn't have any wallet extensions installed."
      );
    } else if (!(wallet in wallets)) {
      return Promise.reject(`Wallet ${wallet} not installed.`);
    } else {
      setCurrentWallet(wallet);
    }
  };

  const getCompetitions = async (): Promise<Competition[]> => {
    return await backend.getCompetitions(api);
  };

  const getUsers = async (competitionId: string): Promise<User[]> => {
    return await backend.getUsers(api, competitionId);
  };

  const mintAdmin = async (
    competitionName: string,
    competitionDescription: string,
    modAddress: string,
    userPrice: number,
    votePolicyId: string,
    endDate: number,
    rewardRates: RewardRates
  ) => {
    if (!lucid) {
      return Promise.reject("Lucid not loaded yet.");
    }

    const wallet = await getCurrentWallet();
    if (!wallet) {
      return Promise.reject("Wallet has not been loaded yet!");
    }

    const image =
      "https://storage.googleapis.com/jpeg-optim-files/d911ee3a-80c2-45a1-b278-29b31a3abab6";
    const adminPrice = 10_000_000;

    const competition: CompetitionShort = {
      name: competitionName,
      description: competitionDescription,
      adminImage: image,
      modImage: image,
      votePolicyId: votePolicyId,
      rewardRates: rewardRates,
      adminPrice: adminPrice,
      userPrice: userPrice,
      endDate: endDate,
    };

    try {
      const competitionCreateDatas = await transaction.mintAdmin(
        lucid,
        wallet,
        competition,
        modAddress
      );

      await backend.saveCompetition(api, competitionCreateDatas)
    } catch(error: any) {
      toast.error(error);
    }
  };

  const mintUser = async (competition: Competition, userNames: string[]) => {};

  const reviewUser = async (
    competition: Competition,
    user: User,
    approve: boolean
  ) => {};

  const voteUser = async (competition: Competition, user: User) => {};

  return (
    <Wallet.Provider
      value={{
        walletLoaded,
        currentWallet: currentFullWallet,
        getWallets: () => wallets,
        getCompetitions,
        getUsers,
        connect,
        mintAdmin,
        mintUser,
        reviewUser,
        voteUser,
      }}
    >
      {children}
    </Wallet.Provider>
  );
};

export const useWallet = () => useContext(Wallet);
