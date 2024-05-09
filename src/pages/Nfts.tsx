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

  const truncatedString = input.slice(0, startLength) + '...' + input.slice(-endLength);
  return truncatedString;
}

const NFTs = () => {
  const [nfts, setNfts] = useState<NftInfo[] | null>(null);
  const [userNfts, setUserNfts] = useState<string[] | null>(null)

  const {
    currentWallet,
    loadScriptInfo,
    scriptInfo,
    getUserNfts,
    getAllNfts,
    listNft,
    voteNft
  } = useWallet()!;

  useEffect(() => {
    if (currentWallet) {
      loadScriptInfo()
    }
  }, [currentWallet])

  useEffect(() => {
    if (scriptInfo) {
      loadUserNfts()
      loadAllNfts()
    }
  }, [scriptInfo])

  const loadUserNfts = async () => {
    const userNfts = await getUserNfts();
    setUserNfts(userNfts)
  }

  const loadAllNfts = async () => {
    const nfts = await getAllNfts();
    setNfts(nfts)
  }

  const handleUploadMetadata = async (blob: Blob) => {

  }

  return (
    <div>
      <Navbar />
      <div className="w-full justify-center flex p-8 flex flex-col">
        <div>
          <h1>All Minted NFTs</h1>
          <div className="flex flex-wrap gap-4">
            {(nfts !== null) && (userNfts !== null) && nfts.map(({ assetName, role, isListed, votes }) => (
              <div className="p-4 flex flex-col bg-slate-100 text-xl">
                <div className="flex w-full justify-center">
                  <img className="w-32 h-32 mb-8" src="https://storage.googleapis.com/jpeg-optim-files/d911ee3a-80c2-45a1-b278-29b31a3abab6"/>
                </div>
                <div className="flex flex-row gap-2">
                  <span>AssetName:</span>
                  <span>{truncateString(assetName, 20)}</span>
                </div>
                <div className="flex flex-row gap-2">
                  <span>Role:</span>
                  <span>{role}</span>
                </div>
                <div className="flex flex-row gap-2">
                  <span>{isListed ? "Listed" : "Not listed"}</span>
                </div>
                <div className="flex flex-row gap-2 mb-8">
                  <span>votes:</span>
                  <span>{votes.length}</span>
                </div>
                {userNfts.map(nft => nft.slice(56)).includes(assetName) && !isListed && role == "User" && (
                  <button onClick={() => listNft(assetName)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">List NFT</button>
                )}
                {!userNfts.map(nft => nft.slice(56)).includes(assetName) && isListed && (
                  <button onClick={() => voteNft(userNfts, assetName)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Vote</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NFTs;
