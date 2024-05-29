import {
  Data,
  Address,
  Constr,
  Lucid,
  fromText,
  UTxO,
  applyParamsToScript,
  applyDoubleCborEncoding,
} from "lucid-cardano";

import { Blueprint } from "../../types/blueprint.ts";
import blueprint from "../../assets/plutus.json";

import {
  CompetitionShort,
  CompetitionCreate,
  Competition,
  UserShort,
  UserCreate,
} from "../../types/competition.ts";
import {
  TicketParamsShort,
  TicketParams,
  CompiledScriptInfo,
} from "../../types/script.ts";

import { FullWallet } from "../../types/wallet.ts";
import { saveCompetition } from "./backend.ts";

const getAssetNameFromOutRef = (txHash: string, index: number) => {
  const indexByteArray = new Uint8Array([index]);
  const txBytes = Uint8Array.from(Buffer.from(txHash, "hex"));
  const txSlice = txBytes.slice(0, 31);

  const result = new Uint8Array(indexByteArray.length + txSlice.length);
  result.set(indexByteArray);
  result.set(txSlice, indexByteArray.length);

  return Buffer.from(result).toString("hex");
};

const splitStringIntoChunks = (input: string): string[] | string => {
  if (input.length <= 64) {
    return input;
  }

  const chunkSize = 64;
  const chunks: string[] = [];

  for (let i = 0; i < input.length; i += chunkSize) {
    chunks.push(input.slice(i, i + chunkSize));
  }

  return chunks;
};

const userDatum = (
  lucid: Lucid,
  competition: Competition,
  userState: "awaiting" | "approved" | "rejected",
  userAssetName: string,
  userVotes: string[]
) => {
  const adminHash = lucid.utils.paymentCredentialOf(
    competition.adminAddress
  ).hash;
  const adminAddress = new Constr(0, [
    new Constr(1, [adminHash]),
    new Constr(1, []),
  ]);

  const state = new Constr(
    userState == "rejected" ? 0 : userState == "approved" ? 1 : 2,
    []
  );

  const assetName = userAssetName;
  const ticketPolicyId = competition.ticketPolicyId;
  const votePolicyId = competition.votePolicyId;

  const endDate = BigInt(competition.endDate);

  const votes = userVotes;

  const datum = new Constr(0, [
    adminAddress,
    state,
    assetName,
    ticketPolicyId,
    votePolicyId,
    endDate,
    votes,
  ]);

  return Data.to(datum);
};

const adminVotesDatum = (
  lucid: Lucid,
  competition: CompetitionShort,
  compiledScriptInfo: CompiledScriptInfo,
  votesNum: number
) => {
  const userHash = lucid.utils.paymentCredentialOf(
    compiledScriptInfo.userAddress
  ).hash;
  const userAddress = new Constr(0, [
    new Constr(1, [userHash]),
    new Constr(1, []),
  ]);

  const adminPrice = BigInt(competition.adminPrice);
  const userPrice = BigInt(competition.userPrice);

  const ticketPolicyId = compiledScriptInfo.ticketPolicyId;
  const votePolicyId = competition.votePolicyId;

  const endDate = BigInt(competition.endDate);

  const rewardRates = new Constr(0, [
    BigInt(competition.rewardRates.admin),
    BigInt(competition.rewardRates.moderator),
    new Constr(0, [
      BigInt(competition.rewardRates.first.user),
      BigInt(competition.rewardRates.first.vote),
    ]),
    new Constr(0, [
      BigInt(competition.rewardRates.second.user),
      BigInt(competition.rewardRates.second.vote),
    ]),
    new Constr(0, [
      BigInt(competition.rewardRates.third.user),
      BigInt(competition.rewardRates.third.vote),
    ]),
  ]);

  const approvedVotes = BigInt(votesNum);

  const datum = new Constr(0, [
    userAddress,
    adminPrice,
    userPrice,
    ticketPolicyId,
    votePolicyId,
    endDate,
    rewardRates,
    approvedVotes,
  ]);

  return Data.to(datum);
};

const paramsToData = (lucid: Lucid, params: TicketParams) => {
  const outRef = new Constr(0, [
    new Constr(0, [params.outRef.txHash]),
    BigInt(params.outRef.outputIndex),
  ]);

  const adminHash = lucid.utils.paymentCredentialOf(params.adminAddress).hash;

  const userHash = lucid.utils.paymentCredentialOf(params.userAddress).hash;

  const adminAddress = new Constr(0, [
    new Constr(1, [adminHash]),
    new Constr(1, []),
  ]);

  const userAddress = new Constr(0, [
    new Constr(1, [userHash]),
    new Constr(1, []),
  ]);

  const endDate = BigInt(params.endDate);
  const votePolicyId = params.votePolicyId;

  const adminPrice = BigInt(params.adminPrice);
  const userPrice = BigInt(params.userPrice);

  const paramsData = new Constr(0, [
    outRef,
    adminAddress,
    userAddress,
    endDate,
    votePolicyId,
    adminPrice,
    userPrice,
  ]);

  return paramsData;
};

const compileScript = async (
  lucid: Lucid,
  params: TicketParamsShort
): Promise<CompiledScriptInfo> => {
  if (!lucid) {
    return Promise.reject("Lucid not loaded yet.");
  }

  const admin = (blueprint as Blueprint).validators.find(
    (v) => v.title === "admin.spend"
  );
  if (!admin) {
    return Promise.reject("admin.spend not found!");
  }

  const adminScript = admin.compiledCode;
  const adminAddress = lucid.utils.validatorToAddress({
    type: "PlutusV2",
    script: adminScript,
  });

  const user = (blueprint as Blueprint).validators.find(
    (v) => v.title === "user.spend"
  );
  if (!user) {
    return Promise.reject("user.spend not found!");
  }

  const userScript = user.compiledCode;
  const userAddress = lucid.utils.validatorToAddress({
    type: "PlutusV2",
    script: userScript,
  });

  const paramsData = paramsToData(lucid, {
    ...params,
    userAddress,
    adminAddress,
  });

  const ticket = (blueprint as Blueprint).validators.find(
    (v) => v.title === "ticket.mint"
  );
  if (!ticket) {
    return Promise.reject("ticket.mint not found!");
  }

  const ticketScript = applyParamsToScript(ticket.compiledCode, [paramsData]);
  const ticketPolicyId = lucid.utils.validatorToScriptHash({
    type: "PlutusV2",
    script: ticketScript,
  });

  return {
    ticketScript: {
      type: "PlutusV2",
      script: applyDoubleCborEncoding(ticketScript),
    },
    ticketPolicyId: ticketPolicyId,
    adminScript: {
      type: "PlutusV2",
      script: applyDoubleCborEncoding(adminScript),
    },
    adminAddress: adminAddress,
    userScript: {
      type: "PlutusV2",
      script: applyDoubleCborEncoding(userScript),
    },
    userAddress: userAddress,
  };
};

export const mintAdmin = async (
  lucid: Lucid,
  wallet: FullWallet,
  competition: CompetitionShort,
  modAddress: Address
): Promise<CompetitionCreate> => {
  lucid.selectWallet(wallet);

  const utxos = await lucid.wallet.getUtxos()!;
  const outRef = utxos[0];

  const params: TicketParamsShort = {
    outRef: outRef,
    adminPrice: competition.adminPrice,
    userPrice: competition.userPrice,
    votePolicyId: competition.votePolicyId,
    endDate: competition.endDate,
  };

  // Compile our script based on parameters
  const compiledScriptInfo = await compileScript(lucid, params);

  const adminAssetName = fromText("admin");
  const adminAsset = `${compiledScriptInfo.ticketPolicyId}${adminAssetName}`;

  const modAssetName = fromText("mod");
  const modAsset = `${compiledScriptInfo.ticketPolicyId}${modAssetName}`;

  const machineAssetName = fromText("admin-machine");
  const machineAsset = `${compiledScriptInfo.ticketPolicyId}${machineAssetName}`;

  const redeemer = Data.to(new Constr(0, []));
  const adminDatum = adminVotesDatum(lucid, competition, compiledScriptInfo, 0);

  const parsedCompetitionName = splitStringIntoChunks(competition.name);
  const parsedCompetitionDescription = splitStringIntoChunks(
    competition.description
  );

  const adminName = `${competition.name} - Admin`;
  const parsedAdminName = splitStringIntoChunks(adminName);

  const modName = `${competition.name} - Mod`;
  const parsedModName = splitStringIntoChunks(modName);

  let tx = lucid
    .newTx()
    .collectFrom([outRef])
    .attachMintingPolicy(compiledScriptInfo.ticketScript)
    .attachMetadata(721, {
      [compiledScriptInfo.ticketPolicyId]: {
        [adminAssetName]: {
          name: parsedAdminName,
          image: splitStringIntoChunks(competition.adminImage),
          "Competition Name": parsedCompetitionName,
          "Competition Description": parsedCompetitionDescription,
        },
        [modAssetName]: {
          name: parsedModName,
          image: splitStringIntoChunks(competition.modImage),
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
      compiledScriptInfo.adminAddress,
      { inline: adminDatum },
      {
        lovelace: BigInt(competition.adminPrice),
        [machineAsset]: BigInt(1),
      }
    )
    .payToAddress(modAddress, { [modAsset]: BigInt(1) });

  const result = await tx.complete();

  const txSigned = await result.sign().complete();

  const txHash = await txSigned.submit();

  console.log(`Successfully submitted transaction ${txHash}`);

  return {
    ...competition,
    scriptRefHash: txHash,
    scriptRefIndex: 0,
    outRefHash: outRef.txHash,
    outRefIndex: outRef.outputIndex,
    adminAddress: compiledScriptInfo.adminAddress,
    userAddress: compiledScriptInfo.userAddress,
    ticketPolicyId: compiledScriptInfo.ticketPolicyId,
  };
};

export const mintUser = async (
  lucid: Lucid,
  wallet: FullWallet,
  competition: Competition,
  users: UserShort[]
): Promise<UserCreate[]> => {
  lucid.selectWallet(wallet);

  const params: TicketParamsShort = {
    outRef: {
      txHash: competition.outRefHash,
      outputIndex: competition.outRefIndex,
    },
    ...competition,
  };

  const compiledScriptInfo = await compileScript(lucid, params);

  const utxos = await lucid.wallet.getUtxos()!;
  if (utxos.length < users.length) {
    return Promise.reject(
      `User does not have enough UTxOs, must have at least ${users.length}`
    );
  }

  const outRefs = utxos.slice(0, users.length);
  const userAssetNames = outRefs.map((outRef) =>
    getAssetNameFromOutRef(outRef.txHash, outRef.outputIndex)
  );
  const userAssets = userAssetNames.map(
    (assetName) => `${compiledScriptInfo.ticketPolicyId}${assetName}`
  );

  const machineAssetName = fromText("user-machine");
  const machineAsset = `${compiledScriptInfo.ticketPolicyId}${machineAssetName}`;

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

  const names = users.map(({ name }) => name);
  const images = users.map(({ image }) => image);

  const userMetadatas = names.map((name, i) => ({
    name: splitStringIntoChunks(name),
    image: splitStringIntoChunks(images[i]),
    "Competition Name": splitStringIntoChunks(competition.name),
  }));

  let tx = lucid
    .newTx()
    .collectFrom(outRefs)
    .attachMintingPolicy(compiledScriptInfo.ticketScript)
    .attachMetadata(721, {
      [compiledScriptInfo.ticketPolicyId]: Object.fromEntries(
        userAssetNames.map((asset, i) => [asset, userMetadatas[i]])
      ),
    })
    .mintAssets(
      {
        ...Object.fromEntries(userAssets.map((asset) => [asset, BigInt(1)])),
        [machineAsset]: BigInt(userAssets.length),
      },
      redeemer
    )
    .validFrom(Date.now() - 20 * 60 * 1_000)
    .validTo(Date.now() + 30 * 60 * 1_000);

  for (const userAssetName of userAssetNames) {
    tx = tx.payToContract(
      compiledScriptInfo.userAddress,
      { inline: userDatum(lucid, competition, "awaiting", userAssetName, []) },
      {
        lovelace: BigInt(params.userPrice),
        [machineAsset]: BigInt(1),
      }
    );
  }

  const result = await tx.complete();

  const txSigned = await result.sign().complete();

  const txHash = await txSigned.submit();

  console.log(`Successfully submitted transaction ${txHash}`);

  return users.map((user, i) => ({
    ...user,
    assetName: userAssetNames[i],
    scriptRefHash: outRefs[i].txHash,
    scriptRefIndex: outRefs[i].outputIndex,
  }));
};

// const reviewUser = async (
//   competition: Competition,
//   user: User,
//   approve: boolean
// ) => {
//   if (!lucid) {
//     return Promise.reject("Lucid not loaded yet.");
//   }

//   const wallet = await getCurrentWallet();
//   if (!wallet) {
//     return Promise.reject("Wallet has not been loaded yet!");
//   }

//   lucid.selectWallet(wallet);

//   try {
//     const compiledScriptInfo = await compileScript(competition.params);

//     const userUTxOs = await lucid.utxosByOutRef([user.scriptRef]);
//     if (userUTxOs.length != 1) {
//       return Promise.reject("User script UTxO not found!");
//     }
//     const userUTxO = userUTxOs[0];

//     const adminUTxOs = await lucid.utxosByOutRef([competition.scriptRef]);
//     if (adminUTxOs.length != 1) {
//       return Promise.reject("Admin script UTxO not found!");
//     }
//     const adminUTxO = adminUTxOs[0];

//     const modAssetName = fromText("mod");
//     const modAsset = `${compiledScriptInfo.policyId}${modAssetName}`;

//     const address = await lucid.wallet.address()!;
//     const owner = lucid.utils.paymentCredentialOf(address).hash!;

//     const utxos = await lucid.wallet.getUtxos()!;

//     const proofModUTxO = utxos.find((utxo) => modAsset in utxo.assets);
//     if (!proofModUTxO) {
//       return Promise.reject("Mod asset not found");
//     }

//     const approveDatum = Data.to(new Constr(3, [user.assetName, []]));
//     const rejectDatum = Data.to(new Constr(4, [user.assetName]));

//     const adminDatum = Data.to(
//       new Constr(
//         0,
//         approve
//           ? [
//               [user.assetName, ...competition.approvedAssetNames],
//               competition.rejectedAssetNames,
//             ]
//           : [
//               competition.approvedAssetNames,
//               [user.assetName, ...competition.rejectedAssetNames],
//             ]
//       )
//     );

//     const trueData = new Constr(1, []);
//     const falseData = new Constr(0, []);

//     const auth = new Constr(0, [
//       owner,
//       new Constr(0, [
//         new Constr(0, [proofModUTxO.txHash]),
//         BigInt(proofModUTxO.outputIndex),
//       ]),
//     ]);

//     const redeemer = Data.to(
//       new Constr(1, [new Constr(0, [auth, approve ? trueData : falseData])])
//     );

//     const tx = await lucid
//       .newTx()
//       .collectFrom([adminUTxO], redeemer)
//       .collectFrom([userUTxO], redeemer)
//       .attachSpendingValidator(compiledScriptInfo.script)
//       .readFrom([proofModUTxO])
//       .addSigner(address)
//       .payToContract(
//         compiledScriptInfo.address,
//         { inline: adminDatum },
//         adminUTxO.assets
//       )
//       .payToContract(
//         compiledScriptInfo.address,
//         { inline: approve ? approveDatum : rejectDatum },
//         userUTxO.assets
//       )
//       .validFrom(Date.now() - 20 * 60 * 1_000)
//       .validTo(Date.now() + 30 * 60 * 1_000)
//       .complete();

//     const txSigned = await tx.sign().complete();

//     const txHash = await txSigned.submit();

//     await backEndReviewUser(
//       competition.policyId,
//       user.assetName,
//       approve,
//       txHash,
//       0,
//       txHash,
//       1
//     );

//     console.log(`Successfully submitted transaction ${txHash}`);
//   } catch (error) {
//     console.log(error);
//   }
// };

// const voteUser = async (competition: Competition, user: User) => {
//   if (!lucid) {
//     return Promise.reject("Lucid not loaded yet.");
//   }

//   const wallet = await getCurrentWallet();
//   if (!wallet) {
//     return Promise.reject("Wallet has not been loaded yet!");
//   }

//   lucid.selectWallet(wallet);

//   try {
//     const compiledScriptInfo = await compileScript(competition.params);

//     const userUTxOs = await lucid.utxosByOutRef([user.scriptRef]);
//     if (userUTxOs.length != 1) {
//       return Promise.reject("User script UTxO not found!");
//     }
//     const userUTxO = userUTxOs[0];

//     const address = await lucid.wallet.address()!;
//     const owner = lucid.utils.paymentCredentialOf(address).hash!;

//     const utxos = await lucid.wallet.getUtxos()!;

//     let voteAsset: string | null = null;
//     let voteAssetName: string | null = null;
//     let proofVoteUTxO: UTxO | null = null;
//     for (const utxo of utxos) {
//       for (const asset of Object.keys(utxo.assets)) {
//         if (asset.includes(competition.params.votePolicyId)) {
//           proofVoteUTxO = utxo;
//           voteAsset = asset;
//           voteAssetName = asset.slice(56);
//           break;
//         }
//       }
//       if (proofVoteUTxO) break;
//     }

//     if (!proofVoteUTxO || !voteAsset || !voteAssetName) {
//       return Promise.reject("Vote asset not found");
//     }

//     const userDatum = Data.to(
//       new Constr(3, [user.assetName, [voteAssetName, ...user.votes]])
//     );

//     const auth = new Constr(0, [
//       owner,
//       new Constr(0, [
//         new Constr(0, [proofVoteUTxO.txHash]),
//         BigInt(proofVoteUTxO.outputIndex),
//       ]),
//     ]);

//     const redeemer = Data.to(
//       new Constr(1, [new Constr(1, [auth, voteAssetName])])
//     );

//     const tx = await lucid
//       .newTx()
//       .collectFrom([userUTxO], redeemer)
//       .attachSpendingValidator(compiledScriptInfo.script)
//       .readFrom([proofVoteUTxO])
//       .addSigner(address)
//       .payToContract(
//         compiledScriptInfo.address,
//         { inline: userDatum },
//         userUTxO.assets
//       )
//       .validFrom(Date.now() - 20 * 60 * 1_000)
//       .validTo(Date.now() + 30 * 60 * 1_000)
//       .complete();

//     const txSigned = await tx.sign().complete();

//     const txHash = await txSigned.submit();

//     await backEndVoteUser(
//       competition.policyId,
//       user.assetName,
//       voteAssetName,
//       txHash,
//       0
//     );

//     console.log(`Successfully submitted transaction ${txHash}`);
//   } catch (error) {
//     console.log(error);
//   }
// };
