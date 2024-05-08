import * as React from "react";

import { createContext, useState, useContext, useEffect } from "react";
import { C, Data, Constr, Lucid, Blockfrost, WalletApi, Cardano, MintingPolicy, SpendingValidator, fromText } from "lucid-cardano";

import { Blueprint } from "../types/blueprint.ts";
import blueprint from "../assets/plutus.json";

window.cardano = window.cardano || {};

export type WalletContext = {
  walletLoaded: boolean;
  currentWallet: FullWallet | null;
  getWallets: () => Cardano | null;
  connect: (wallet: string) => Promise<void>;
  loadScriptInfo: () => Promise<void>;
  scriptInfo: ScriptInfo | null,
  getPriceByRole: (role: NftRole) => number,
  buyRoleNft: (role: NftRole) => Promise<void>
};

export interface FullWallet extends WalletApi {
  name: string;
  icon: string;
  apiVersion: string;
}

export const Wallet = createContext<WalletContext | null>(null);

type WalletProviderProps = {
  children: JSX.Element;
  networkMode: "testnet" | "mainnet";
};

export type NftRole = "Admin" | "Moderator" | "Vote" | "User"

export type ScriptInfo = {
  mintScript: MintingPolicy,
  spendScript: SpendingValidator,
  policyId: string,
  address: string
}

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

  const [scriptInfo, setScriptInfo] = useState<ScriptInfo | null>(null);

  useEffect(() => {
    loadCardano();
  }, []);

  useEffect(() => {
    updateCurrentFullWallet();
  }, [currentWallet, wallets]);

  useEffect(() => {
    console.log(currentFullWallet);
  }, [currentFullWallet]);

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

    console.log("Everything good")
    console.log(newLucid)

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

  const loadScriptInfo = async () => {
    if (!lucid) {
      return Promise.reject("Lucid not loaded yet.");
    }

    const mint = (blueprint as Blueprint).validators.find((v) =>
      v.title === "gift.nft_mint"
    );

    const spend = (blueprint as Blueprint).validators.find((v) =>
      v.title === "gift.nft_redeem"
    );

    setScriptInfo({
      mintScript: {
        type: "PlutusV2",
        script: mint!.compiledCode,
      },
      spendScript: {
        type: "PlutusV2",
        script: spend!.compiledCode,
      },
      policyId: lucid.utils.validatorToScriptHash({
        type: "PlutusV2",
        script: mint!.compiledCode,
      }),
      address: lucid.utils.validatorToAddress({
        type: "PlutusV2",
        script: spend!.compiledCode
      })
    })
  }

  const getPriceByRole = (role: NftRole) => {
    const price = {
      "Admin": 20_000_000,
      "Moderator": 15_000_000,
      "Vote": 10_000_000,
      "User": 5_000_000,
    }

    return price[role];
  }

  const getDatumIdByRole = (role: NftRole) => {
    const datum = {
      "Admin": 0,
      "Moderator": 1,
      "Vote": 2,
      "User": 3
    }

    return datum[role];
  }

  const getAssetNameFromOutRef = (txHash: string, index: number) => {
    const indexByteArray = new Uint8Array([index]);
    const txBytes = Uint8Array.from(Buffer.from(txHash, 'hex'));
    const txSlice = txBytes.slice(0, 31);

    const result = new Uint8Array(indexByteArray.length + txSlice.length)
    result.set(indexByteArray)
    result.set(txSlice, indexByteArray.length)

    return Buffer.from(result).toString('hex');
  }

  const buyRoleNft = async (role: NftRole) => {
    if (!lucid) {
      return Promise.reject("Lucid not loaded yet.");
    }

    if (!scriptInfo) {
      return Promise.reject("Script Info has not been loaded yet!")
    }

    const wallet = await getCurrentWallet()
    if (!wallet) {
      return Promise.reject("Wallet has not been loaded yet!")
    }

    lucid.selectWallet(wallet)

    try {
      const utxos = await lucid.wallet.getUtxos()!;
      const utxo = utxos[0];

      const assetName = getAssetNameFromOutRef(utxo.txHash, utxo.outputIndex)
      const asset = `${scriptInfo.policyId}${assetName}`;

      const roleData = new Constr(getDatumIdByRole(role), [])
      const outRefData = new Constr(0, [new Constr(0, [utxo.txHash]), BigInt(utxo.outputIndex)])
      const redeemer = Data.to(new Constr(0, [roleData, outRefData]));

      const falseData = new Constr(0, [])
      const datum = Data.to(new Constr(0, [assetName, roleData, falseData, []]))

      console.log(scriptInfo.address)

      const tx = await lucid
        .newTx()
        .collectFrom([utxo])
        .attachMintingPolicy(scriptInfo.mintScript)
        .mintAssets(
          { [asset]: BigInt(1) },
          redeemer
        )
        .payToContract(
          scriptInfo.address,
          { inline: datum },
          { "lovelace": BigInt(getPriceByRole(role)) },
        )
        .complete();

      const txSigned = await tx.sign().complete();

      const txHash = await txSigned.submit();

      console.log(`Successfully submitted transaction ${txHash}`)

      // const success = await lucid!.awaitTx(txHash);

    } catch (error) {
      console.log(error)
    }
  };

  return (
    <Wallet.Provider
      value={{
        walletLoaded,
        currentWallet: currentFullWallet,
        getWallets: () => wallets,
        connect,
        loadScriptInfo,
        scriptInfo,
        getPriceByRole,
        buyRoleNft
      }}
    >
      {children}
    </Wallet.Provider>
  );
};

export const useWallet = () => useContext(Wallet);
