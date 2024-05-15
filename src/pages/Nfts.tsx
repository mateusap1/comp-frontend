import React, { useEffect, useState } from "react";

import { Button } from "../components/Button";
import { useWallet, NftRole, NftInfo } from "../contexts/WalletProvider";
import { Navbar } from "../components/Navbar";

const truncateString = (input: string, maxLength: number): string => {
  if (input.length <= maxLength) {
    return input; // Return the original string if it's already shorter than maxLength
  }

  const startLength = Math.ceil((maxLength - 3) / 2); // Length of the start portion
  const endLength = Math.floor((maxLength - 3) / 2); // Length of the end portion

  const truncatedString =
    input.slice(0, startLength) + "..." + input.slice(-endLength);
  return truncatedString;
};

type ContainerNFTProps = {
  ownedByUser: boolean;
  nft: NftInfo;
  listNft: (nft: string) => Promise<void>;
  voteNft: (nft: string) => Promise<void>;
  approveNft: (nft: string) => Promise<void>;
};

const ContainerNFT = ({
  nft,
  ownedByUser,
  listNft,
  voteNft,
  approveNft,
}: ContainerNFTProps) => {
  return (
    <div className="p-4 flex flex-col bg-slate-100 text-xl">
      <div className="flex w-full justify-center">
        <img
          className="w-32 h-32 mb-8"
          src="https://storage.googleapis.com/jpeg-optim-files/d911ee3a-80c2-45a1-b278-29b31a3abab6"
        />
      </div>
      <div className="flex flex-row gap-2">
        <span>AssetName:</span>
        <span>{truncateString(nft.assetName, 20)}</span>
      </div>
      <div className="flex flex-row gap-2">
        <span>Role:</span>
        <span>{nft.role}</span>
      </div>
      <div className="flex flex-row gap-2">
        <span>{nft.isListed ? "Listed" : "Not listed"}</span>
      </div>
      <div className="flex flex-row gap-2 mb-8">
        <span>votes:</span>
        <span>{nft.votes.length}</span>
      </div>
      {ownedByUser && !nft.isListed && nft.role == "User" && (
        <button
          onClick={() => listNft(nft.assetName)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          List NFT
        </button>
      )}
      {!ownedByUser && nft.isListed && nft.isApproved && (
        <button
          onClick={() => voteNft(nft.assetName)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Vote
        </button>
      )}
      {!ownedByUser && nft.isListed && !nft.isApproved &&  (
        <button
          onClick={() => approveNft(nft.assetName)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Approve
        </button>
      )}
    </div>
  );
};

type NftsListProps = {
  nfts: NftInfo[];
  userNfts: string[];
  showUnlisted: boolean;
  listNft: (nft: string) => Promise<void>;
  voteNft: (userNfts: string[], nft: string) => Promise<void>;
  approveNft: (userNfts: string[], nft: string) => Promise<void>;
};

const NftsList = ({
  nfts,
  userNfts,
  showUnlisted,
  listNft,
  voteNft,
  approveNft,
}: NftsListProps) => {
  return (
    <div className="flex flex-wrap gap-4">
      {(!showUnlisted ? nfts.filter((assetInfo) => assetInfo.isListed && assetInfo.isApproved) : nfts).map((assetInfo) => (
        <ContainerNFT
          ownedByUser={userNfts
            .map((nft) => nft.slice(56))
            .includes(assetInfo.assetName)}
          nft={assetInfo}
          listNft={listNft}
          voteNft={(nft) => voteNft(userNfts, nft)}
          approveNft={(nft) => approveNft(userNfts, nft)}
        />
      ))}
    </div>
  );
};

const NFTs = () => {
  const [nfts, setNfts] = useState<NftInfo[] | null>(null);
  const [userNfts, setUserNfts] = useState<string[] | null>(null);

  const {
    currentWallet,
    loadScriptInfo,
    scriptInfo,
    getUserNfts,
    getAllNfts,
    listNft,
    voteNft,
    approveNft,
  } = useWallet()!;

  useEffect(() => {
    if (currentWallet) {
      loadScriptInfo();
    }
  }, [currentWallet]);

  useEffect(() => {
    if (scriptInfo) {
      loadUserNfts();
      loadAllNfts();
    }
  }, [scriptInfo]);

  const loadUserNfts = async () => {
    const userNfts = await getUserNfts();
    setUserNfts(userNfts);
  };

  const loadAllNfts = async () => {
    const nfts = await getAllNfts();
    setNfts(nfts);
  };

  return (
    <div>
      <Navbar />
      <div className="w-full justify-center flex p-8 flex flex-col">
        <div>
          <h1 className="text-2xl font-bold mb-8">All Minted NFTs</h1>
          {nfts && userNfts && (
            <div className="flex flex-col gap-8">
              <div>
                <span className="text-xl font-semibold">User NFTs</span>
                <NftsList
                  nfts={nfts.filter((assetInfo) =>
                    userNfts
                      .map((nft) => nft.slice(56))
                      .includes(assetInfo.assetName)
                  )}
                  userNfts={userNfts}
                  showUnlisted={true}
                  listNft={listNft}
                  voteNft={voteNft}
                  approveNft={approveNft}
                />
              </div>
              <div>
                <span className="text-xl font-semibold">Others</span>
                <NftsList
                  nfts={nfts.filter((assetInfo) =>
                    !userNfts
                      .map((nft) => nft.slice(56))
                      .includes(assetInfo.assetName)
                  )}
                  userNfts={userNfts}
                  showUnlisted={true}
                  listNft={listNft}
                  voteNft={voteNft}
                  approveNft={approveNft}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NFTs;
