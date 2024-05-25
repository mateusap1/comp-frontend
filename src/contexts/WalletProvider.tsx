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

import axios from "axios";

window.cardano = window.cardano || {};

export type WalletContext = {
  walletLoaded: boolean;
  currentWallet: FullWallet | null;
  getWallets: () => Cardano | null;
  connect: (wallet: string) => Promise<void>;
  backEndGetCompetitions: () => Promise<Competition[]>;
  backEndGetUsers: (competitionId: string) => Promise<User[]>;
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
  scriptRef: OutRef;
  name: string;
  description: string;
  policyId: string;
  address: string;
  approvedAssetNames: string[];
  rejectedAssetNames: string[];
  params: ScriptParams;
};

export type ScriptParams = {
  outRef: OutRef;
  adminPrice: number;
  userPrice: number;
  votePolicyId: PolicyId;
  endDate: number;
  rewardRates: RewardRates;
};

export type User = {
  scriptRef: OutRef;
  name: string;
  assetName: string;
  votes: string[];
  isApproved: boolean;
  isRejected: boolean;
};

const baseAxios = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_BASE_URL,
});

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
    try {
      const result = await baseAxios.get("/marketplace/competitions");
      const competitions = result.data.competitions;

      return competitions.map((comp: any) => ({
        scriptRef: {
          txHash: comp.scriptRefHash,
          outputIndex: comp.scriptRefIndex,
        },
        name: comp.name,
        description: comp.description,
        policyId: comp.policyId,
        address: comp.address,
        approvedAssetNames: comp.approvedAssetNames,
        rejectedAssetNames: comp.rejectedAssetNames,
        params: {
          outRef: {
            txHash: comp.outRefHash,
            outputIndex: comp.outRefIndex,
          },
          adminPrice: comp.adminPrice,
          userPrice: comp.userPrice,
          votePolicyId: comp.votePolicyId,
          endDate: new Date(comp.endDate).getTime(),
          rewardRates: JSON.parse(comp.rewardRates),
        },
      }));
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  };

  const backEndSaveCompetition = async (
    scriptRefHash: string,
    scriptRefIndex: number,
    name: string,
    description: string,
    policyId: string,
    address: string,
    params: ScriptParams
  ) => {
    try {
      await baseAxios.post("/marketplace/competitions/create", {
        scriptRefHash: scriptRefHash,
        scriptRefIndex: scriptRefIndex,
        name: name,
        description: description,
        policyId: policyId,
        address: address,
        outRefHash: params.outRef.txHash,
        outRefIndex: params.outRef.outputIndex,
        adminPrice: params.adminPrice,
        userPrice: params.userPrice,
        votePolicyId: params.votePolicyId,
        endDate: new Date(params.endDate).toISOString(),
        rewardRates: JSON.stringify(params.rewardRates),
      });
    } catch (error) {
      console.log(error);
    }
  };

  const backEndGetUsers = async (competitionId: string): Promise<User[]> => {
    try {
      const result = await baseAxios.get(
        `/marketplace/competitions/${competitionId}/users`
      );
      const users = result.data.users;

      return users.map((user: any) => ({
        scriptRef: {
          txHash: user.scriptRefHash,
          outputIndex: user.scriptRefIndex,
        },
        name: user.name,
        assetName: user.assetName,
        votes: JSON.parse(user.votes),
        isApproved: user.isApproved,
        isRejected: user.isRejected,
      }));
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  };

  const backEndSaveUser = async (
    scriptRefHash: string,
    scriptRefIndex: number,
    competitionId: string,
    name: string,
    assetName: string
  ) => {
    try {
      await baseAxios.post(
        `/marketplace/competitions/${competitionId}/users/create`,
        {
          scriptRefHash: scriptRefHash,
          scriptRefIndex: scriptRefIndex,
          name: name,
          assetName: assetName,
        }
      );
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  };

  const backEndReviewUser = async (
    competitionId: string,
    assetName: string,
    approve: boolean,
    newAdminRefHash: string,
    newAdminRefIndex: number,
    newUserRefHash: string,
    newUserRefIndex: number
  ) => {
    try {
      await baseAxios.post(
        `/marketplace/competitions/${competitionId}/users/${assetName}/review?approve=${
          approve ? "true" : "false"
        }`,
        {
          newAdminRefHash,
          newAdminRefIndex,
          newUserRefHash,
          newUserRefIndex,
        }
      );
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
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
        txHash,
        0,
        competitionName,
        competitionDescription,
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
    userNames: string[]
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
      const compiledScriptInfo = await compileScript(params);

      const utxos = await lucid.wallet.getUtxos()!;
      if (utxos.length < userNames.length) {
        toast.error(
          `User does not have enough UTxOs, must have at least ${userNames.length}`
        );
        return;
      }

      const outRefs = utxos.slice(0, userNames.length);
      const userAssetNames = outRefs.map((outRef) =>
        getAssetNameFromOutRef(outRef.txHash, outRef.outputIndex)
      );
      const userAssets = userAssetNames.map(
        (assetName) => `${compiledScriptInfo.policyId}${assetName}`
      );

      const machineAssetName = fromText("user-machine");
      const machineAsset = `${compiledScriptInfo.policyId}${machineAssetName}`;

      const redeemer = Data.to(
        new Constr(1, [
          outRefs.map(
            (outRef) =>
              new Constr(0, [
                new Constr(0, [outRef.txHash]),
                BigInt(outRef.outputIndex),
              ])
          ),
        ])
      );

      const parsedCompetitionName =
        competitionName.length > 64
          ? splitStringIntoChunks(competitionName)
          : competitionName;

      const parsedUserNames = userNames.map((name) => {
        return name.length > 64 ? splitStringIntoChunks(name) : name;
      });

      const userMetadatas = parsedUserNames.map((parsedUserName) => ({
        Name: parsedUserName,
        Image: [
          "https://storage.googleapis.com/jpeg-optim-files/d911ee3a-80c2-45",
          "a1-b278-29b31a3abab6",
        ],
        "Competition Name": parsedCompetitionName,
      }));

      let tx = lucid
        .newTx()
        .collectFrom(outRefs)
        .attachMintingPolicy(compiledScriptInfo.script)
        .attachMetadata(721, {
          [compiledScriptInfo.policyId]: Object.fromEntries(
            userAssetNames.map((asset, i) => [asset, userMetadatas[i]])
          ),
        })
        .mintAssets(
          {
            ...Object.fromEntries(
              userAssets.map((asset) => [asset, BigInt(1)])
            ),
            [machineAsset]: BigInt(userAssets.length),
          },
          redeemer
        )
        .validFrom(Date.now() - 20 * 60 * 1_000)
        .validTo(Date.now() + 30 * 60 * 1_000);

      for (const userAssetName of userAssetNames) {
        tx = tx.payToContract(
          compiledScriptInfo.address,
          { inline: Data.to(new Constr(2, [userAssetName])) },
          {
            lovelace: BigInt(params.userPrice),
            [machineAsset]: BigInt(1),
          }
        );
      }

      const result = await tx.complete();

      const txSigned = await result.sign().complete();

      const txHash = await txSigned.submit();

      userNames.forEach(async (name, i) => {
        await backEndSaveUser(
          txHash,
          i,
          compiledScriptInfo.policyId,
          name,
          userAssetNames[i]
        );
      });

      console.log(`Successfully submitted transaction ${txHash}`);
    } catch (error) {
      console.log(error);
    }
  };

  const reviewUser = async (
    competition: Competition,
    user: User,
    approve: boolean
  ) => {
    if (!lucid) {
      return Promise.reject("Lucid not loaded yet.");
    }

    const wallet = await getCurrentWallet();
    if (!wallet) {
      return Promise.reject("Wallet has not been loaded yet!");
    }

    lucid.selectWallet(wallet);

    console.log(competition);
    console.log(user);

    try {
      const compiledScriptInfo = await compileScript(competition.params);

      const userUTxOs = await lucid.utxosByOutRef([user.scriptRef]);
      if (userUTxOs.length != 1) {
        return Promise.reject("User script UTxO not found!");
      }
      const userUTxO = userUTxOs[0];

      const adminUTxOs = await lucid.utxosByOutRef([competition.scriptRef]);
      if (adminUTxOs.length != 1) {
        return Promise.reject("Admin script UTxO not found!");
      }
      const adminUTxO = adminUTxOs[0];

      const modAssetName = fromText("mod");
      const modAsset = `${compiledScriptInfo.policyId}${modAssetName}`;

      const address = await lucid.wallet.address()!;
      const owner = lucid.utils.paymentCredentialOf(address).hash!;

      const utxos = await lucid.wallet.getUtxos()!;

      const proofModUTxO = utxos.find((utxo) => modAsset in utxo.assets);
      if (!proofModUTxO) {
        return Promise.reject("Script UTxO not found");
      }

      const approveDatum = Data.to(new Constr(3, [user.assetName, []]));
      const rejectDatum = Data.to(new Constr(4, [user.assetName]));

      const adminDatum = Data.to(
        new Constr(
          0,
          approve
            ? [
                [user.assetName, ...competition.approvedAssetNames],
                competition.rejectedAssetNames,
              ]
            : [
                competition.approvedAssetNames,
                [user.assetName, ...competition.rejectedAssetNames],
              ]
        )
      );

      const trueData = new Constr(1, []);
      const falseData = new Constr(0, []);

      const auth = new Constr(0, [
        owner,
        new Constr(0, [
          new Constr(0, [proofModUTxO.txHash]),
          BigInt(proofModUTxO.outputIndex),
        ]),
      ]);

      const redeemer = Data.to(
        new Constr(1, [new Constr(0, [auth, approve ? trueData : falseData])])
      );

      const tx = await lucid
        .newTx()
        .collectFrom([adminUTxO], redeemer)
        .collectFrom([userUTxO], redeemer)
        .attachSpendingValidator(compiledScriptInfo.script)
        .readFrom([proofModUTxO])
        .addSigner(address)
        .payToContract(
          compiledScriptInfo.address,
          { inline: adminDatum },
          adminUTxO.assets
        )
        .payToContract(
          compiledScriptInfo.address,
          { inline: approve ? approveDatum : rejectDatum },
          userUTxO.assets
        )
        .validFrom(Date.now() - 20 * 60 * 1_000)
        .validTo(Date.now() + 30 * 60 * 1_000)
        .complete();

      const txSigned = await tx.sign().complete();

      const txHash = await txSigned.submit();

      await backEndReviewUser(
        competition.policyId,
        user.assetName,
        approve,
        txHash,
        0,
        txHash,
        1
      );

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
        backEndGetUsers,
        connect,
        mintAdmin,
        mintUser,
        reviewUser,
      }}
    >
      {children}
    </Wallet.Provider>
  );
};

export const useWallet = () => useContext(Wallet);
