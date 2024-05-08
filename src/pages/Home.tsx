import React, { useEffect, useState } from "react";

import { Connector } from "../components/Connector";
import { useWallet, NftRole, NftInfo } from "../contexts/WalletProvider";

type RoleMinterProps = {
  role: NftRole;
  getPriceByRole: (role: NftRole) => number;
  buyRoleNft: (role: NftRole) => Promise<void>
}

const RoleMinter = ({ role, getPriceByRole, buyRoleNft }: RoleMinterProps) => {
  return (
    <div className="flex flex-col gap-2 bg-slate-100 p-4 rounded-lg">
      <span className="text-center">{getPriceByRole(role) / 1_000_000} ADA</span>
      <button onClick={() => buyRoleNft(role)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">{role}</button>
    </div>
  )
}

const Home = () => {
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
    listNft
  } = useWallet()!;

  useEffect(() => {
    if (currentWallet) {
      console.log("Loading script info...")
      loadScriptInfo()
    }
  }, [currentWallet])

  useEffect(() => {
    if (scriptInfo) {
      console.log("Script Info:", scriptInfo)

      loadUserNfts()
      loadAllNfts()
    }
  }, [scriptInfo])

  const loadUserNfts = async () => {
    const userNfts = await getUserNfts();
    setUserNfts(userNfts)
    console.log("User NFTs", userNfts)
  }

  const loadAllNfts = async () => {
    console.log("Loading nfts")
    const nfts = await getAllNfts();
    console.log("nfts", nfts)
    setNfts(nfts)
  }

  return (
    <div className="p-8 flex flex-col">
      <div>
        <Connector whitelistedWallets={["nami", "eternl"]} />
      </div>
      <div className="p-4 flex flex-col gap-8">
        <h1 className="text-2xl">Mint your NFT!</h1>
        <div className="flex flex-row gap-8">
          {(["Admin", "Moderator", "Vote", "User"].map((role) => (
            <RoleMinter role={role as NftRole} getPriceByRole={getPriceByRole} buyRoleNft={buyRoleNft} />
          )))}
        </div>
      </div>
      <hr />
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
                <span>isListed:</span>
                <span>{isListed}</span>
              </div>
              <div className="flex flex-row gap-2">
                <span>votes:</span>
                <span>{votes}</span>
              </div>
              {userNfts.includes(assetName) && !isListed && (
                <button onClick={() => listNft(assetName)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">List NFT</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
