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

import { Blueprint } from "../types/blueprint.ts";
import blueprint from "../assets/plutus.json";
import { toast } from "react-toastify";

window.cardano = window.cardano || {};

export type WalletContext = {
  walletLoaded: boolean;
  currentWallet: FullWallet | null;
  getWallets: () => Cardano | null;
  connect: (wallet: string) => Promise<void>;
  backEndGetCompetitions: () => Promise<Competition[]>;
  mintAdmin: (
    competitionName: string,
    competitionDescription: string,
    modAddress: string,
    userPrice: number,
    votePolicyId: string,
    endDate: number,
    rewardRates: RewardRates
  ) => Promise<void>;
  mintUser: (
    competiton: Competition,
    userName: string,
    amount: number
  ) => Promise<void>;
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

export type NftRole = "Admin" | "Moderator" | "Vote" | "User";

export type NftInfo = {
  assetName: string;
  role: NftRole;
  isListed: boolean;
  isApproved: boolean;
  isRejected: boolean;
  votes: string[];
};

export type CompiledScriptInfo = {
  script: Validator;
  policyId: string;
  address: string;
};

export type WinnerRate = {
  user: number;
  vote: number;
};

export type RewardRates = {
  admin: number;
  moderator: number;
  winners: WinnerRate[];
};

export type Competition = {
  name: string;
  policyId: string;
  address: string;
  params: ScriptParams;
};

type ModifiedScriptParams = {
  outRefHash: string;
  outRefIndex: number;
  adminPrice: number;
  userPrice: number;
  votePolicyId: PolicyId;
  endDate: number;
  rewardRates: RewardRates;
};

export type ScriptParams = {
  outRef: OutRef;
  adminPrice: number;
  userPrice: number;
  votePolicyId: PolicyId;
  endDate: number;
  rewardRates: RewardRates;
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

  const backEndGetCompetitions = async (): Promise<Competition[]> => {
    const projectsRaw = localStorage.getItem("@competitions");
    if (projectsRaw) {
      return JSON.parse(projectsRaw);
    } else {
      return [];
    }
  };

  const backEndSaveCompetition = async (
    name: string,
    policyId: string,
    address: string,
    params: ScriptParams
  ) => {
    const projects = await backEndGetCompetitions();
    localStorage.setItem(
      "@competitions",
      JSON.stringify([
        {
          name,
          policyId,
          address,
          params,
        },
        ...projects,
      ])
    );
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

  const compileScript = async (
    params: ScriptParams
  ): Promise<CompiledScriptInfo> => {
    if (!lucid) {
      return Promise.reject("Lucid not loaded yet.");
    }

    const mint = (blueprint as Blueprint).validators.find(
      (v) => v.title === "comp.mint"
    );

    const outRefData = new Constr(0, [
      new Constr(0, [params.outRef.txHash]),
      BigInt(params.outRef.outputIndex),
    ]);

    const adminPriceData = BigInt(params.adminPrice);
    const userPriceData = BigInt(params.userPrice);

    const votePolicyIdData = params.votePolicyId;
    const endDateData = BigInt(params.endDate);
    const rewardRatesData = new Constr(0, [
      BigInt(params.rewardRates.admin),
      BigInt(params.rewardRates.moderator),
      [
        new Constr(
          0,
          params.rewardRates.winners.map(
            ({ user, vote }) => new Constr(0, [BigInt(user), BigInt(vote)])
          )
        ),
      ],
    ]);

    const paramsData = new Constr(0, [
      outRefData,
      adminPriceData,
      userPriceData,
      votePolicyIdData,
      endDateData,
      rewardRatesData,
    ]);

    const script = applyParamsToScript(mint!.compiledCode, [paramsData]);

    const policyId = lucid.utils.validatorToScriptHash({
      type: "PlutusV2",
      script: script,
    });

    const address = lucid.utils.validatorToAddress({
      type: "PlutusV2",
      script: script,
    });

    return {
      script: { type: "PlutusV2", script: applyDoubleCborEncoding(script) },
      policyId: policyId,
      address: address,
    };
  };

  const getAssetNameFromOutRef = (txHash: string, index: number) => {
    const indexByteArray = new Uint8Array([index]);
    const txBytes = Uint8Array.from(Buffer.from(txHash, "hex"));
    const txSlice = txBytes.slice(0, 31);

    const result = new Uint8Array(indexByteArray.length + txSlice.length);
    result.set(indexByteArray);
    result.set(txSlice, indexByteArray.length);

    return Buffer.from(result).toString("hex");
  };

  const getAssetInfoFromUTxO = (utxo: UTxO) => {
    const Datum = Data.Object({
      asset_name: Data.Bytes(),
      role: Data.Any(),
      isListed: Data.Boolean(),
      isApproved: Data.Boolean(),
      isRejected: Data.Boolean(),
      votes: Data.Array(Data.Bytes()),
    });

    const datum = Data.from(utxo.datum!, Datum);

    const rolesMap = ["Admin", "Moderator", "Vote", "User"];

    const roleIndex: number = datum.role.index;

    const nftInfo = {
      assetName: datum.asset_name,
      role: rolesMap[roleIndex],
      isListed: datum.isListed,
      isApproved: datum.isApproved,
      isRejected: datum.isRejected,
      votes: datum.votes,
    } as NftInfo;

    return nftInfo;
  };

  const splitStringIntoChunks = (input: string): string[] => {
    const chunkSize = 64;
    const chunks: string[] = [];

    for (let i = 0; i < input.length; i += chunkSize) {
      chunks.push(input.slice(i, i + chunkSize));
    }

    return chunks;
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

    lucid.selectWallet(wallet);

    try {
      const utxos = await lucid.wallet.getUtxos()!;
      const outRef = utxos[0];

      const params = {
        outRef: {
          txHash: outRef.txHash,
          outputIndex: outRef.outputIndex,
        },
        adminPrice: 10_000_000,
        userPrice,
        votePolicyId,
        endDate,
        rewardRates,
      };

      // Compile our script based on parameters
      const compiledScriptInfo = await compileScript(params);

      const adminAssetName = fromText("admin");
      const adminAsset = `${compiledScriptInfo.policyId}${adminAssetName}`;

      const modAssetName = fromText("mod");
      const modAsset = `${compiledScriptInfo.policyId}${modAssetName}`;

      const machineAssetName = fromText("admin-machine");
      const machineAsset = `${compiledScriptInfo.policyId}${machineAssetName}`;

      const redeemer = Data.to(new Constr(0, []));
      const datum = Data.to(new Constr(0, [[], []]));

      const parsedCompetitionName =
        competitionName.length > 64
          ? splitStringIntoChunks(competitionName)
          : competitionName;
      const parsedCompetitionDescription =
        competitionDescription.length > 64
          ? splitStringIntoChunks(competitionDescription)
          : competitionDescription;

      const adminName = `${competitionName} - Admin`;
      const parsedAdminName =
        adminName.length > 64 ? splitStringIntoChunks(adminName) : adminName;

      const modName = `${competitionName} - Mod`;
      const parsedModName =
        modName.length > 64 ? splitStringIntoChunks(modName) : modName;

      let tx = lucid
        .newTx()
        .collectFrom([outRef])
        .attachMintingPolicy(compiledScriptInfo.script)
        .attachMetadata(721, {
          [compiledScriptInfo.policyId]: {
            [adminAssetName]: {
              Name: parsedAdminName,
              Image: [
                "https://storage.googleapis.com/jpeg-optim-files/d911ee3a-80c2-45",
                "a1-b278-29b31a3abab6",
              ],
              "Competition Name": parsedCompetitionName,
              "Competition Description": parsedCompetitionDescription,
            },
            [modAssetName]: {
              Name: parsedModName,
              Image: [
                "https://storage.googleapis.com/jpeg-optim-files/d911ee3a-80c2-45",
                "a1-b278-29b31a3abab6",
              ],
            },
          },
        })
        .mintAssets(
          {
            [adminAsset]: BigInt(1),
            [modAsset]: BigInt(1),
            [machineAsset]: BigInt(1),
          },
          redeemer
        )
        .payToContract(
          compiledScriptInfo.address,
          { inline: datum },
          {
            lovelace: BigInt(10_000_000),
            [machineAsset]: BigInt(1),
          }
        )
        .payToAddress(modAddress, { [modAsset]: BigInt(1) });

      const result = await tx.complete();

      const txSigned = await result.sign().complete();

      const txHash = await txSigned.submit();

      await backEndSaveCompetition(
        competitionName,
        compiledScriptInfo.policyId,
        compiledScriptInfo.address,
        params
      );

      console.log(`Successfully submitted transaction ${txHash}`);
    } catch (error) {
      console.log(error);
    }
  };

  const mintUser = async (
    { params, name: competitionName, address: test_address }: Competition,
    userName: string,
    amount: number
  ) => {
    if (!lucid) {
      return Promise.reject("Lucid not loaded yet.");
    }

    const wallet = await getCurrentWallet();
    if (!wallet) {
      return Promise.reject("Wallet has not been loaded yet!");
    }

    lucid.selectWallet(wallet);

    try {
      const utxos = await lucid.wallet.getUtxos()!;
      const outRef = utxos[0];

      const compiledScriptInfo = await compileScript(params);

      const userAssetName = getAssetNameFromOutRef(
        outRef.txHash,
        outRef.outputIndex
      );
      const userAsset = `${compiledScriptInfo.policyId}${userAssetName}`;

      const machineAssetName = fromText("user-machine");
      const machineAsset = `${compiledScriptInfo.policyId}${machineAssetName}`;

      const redeemer = Data.to(
        new Constr(1, [
          [
            new Constr(0, [
              new Constr(0, [outRef.txHash]),
              BigInt(outRef.outputIndex),
            ]),
          ],
        ])
      );
      const datum = Data.to(new Constr(2, [userAssetName]));

      const parsedCompetitionName =
        competitionName.length > 64
          ? splitStringIntoChunks(competitionName)
          : competitionName;

      const parsedUserName =
        userName.length > 64 ? splitStringIntoChunks(userName) : userName;

      let tx = lucid
        .newTx()
        .collectFrom([outRef])
        .attachMintingPolicy(compiledScriptInfo.script)
        .attachMetadata(721, {
          [compiledScriptInfo.policyId]: {
            [userAssetName]: {
              Name: parsedUserName,
              Image: [
                "https://storage.googleapis.com/jpeg-optim-files/d911ee3a-80c2-45",
                "a1-b278-29b31a3abab6",
              ],
              "Competition Name": parsedCompetitionName,
            },
          },
        })
        .mintAssets(
          {
            [userAsset]: BigInt(1),
            [machineAsset]: BigInt(1),
          },
          redeemer
        )
        .payToContract(
          compiledScriptInfo.address,
          { inline: datum },
          {
            lovelace: BigInt(params.userPrice),
            [machineAsset]: BigInt(1),
          }
        )
        .validFrom(Date.now() - 20 * 60 * 1_000)
        .validTo(Date.now() + 30 * 60 * 1_000);

      const result = await tx.complete();

      const txSigned = await result.sign().complete();

      const txHash = await txSigned.submit();

      console.log(`Successfully submitted transaction ${txHash}`);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Wallet.Provider
      value={{
        walletLoaded,
        currentWallet: currentFullWallet,
        getWallets: () => wallets,
        backEndGetCompetitions,
        connect,
        mintAdmin,
        mintUser,
      }}
    >
      {children}
    </Wallet.Provider>
  );
};

export const useWallet = () => useContext(Wallet);
