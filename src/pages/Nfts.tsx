import React, { useEffect, useState } from "react";

import { Button } from "../components/Button";
import { useWallet, NftRole, NftInfo } from "../contexts/WalletProvider";
import { Navbar } from "../components/Navbar";

const NFTs = () => {
  const [nfts, setNfts] = useState<NftInfo[] | null>(null);
  const [userNfts, setUserNfts] = useState<string[] | null>(null)

  const {
    currentWallet,
    loadScriptInfo,
    scriptInfo,
    getPriceByRole,
    buyRoleNft,
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
          <div className="flex flex-row gap-4">
            {(nfts !== null) && (userNfts !== null) && nfts.map(({ assetName, role, isListed, votes }) => (
              <div className="p-4 flex flex-col bg-slate-100">
                <div className="flex flex-row gap-2">
                  <span>AssetName:</span>
                  <span>{assetName}</span>
                </div>
                <div className="flex flex-row gap-2">
                  <span>Role:</span>
                  <span>{role}</span>
                </div>
                <div className="flex flex-row gap-2">
                  <span>{isListed ? "LISTED" : "NOT LISTED"}</span>
                </div>
                <div className="flex flex-row gap-2">
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
