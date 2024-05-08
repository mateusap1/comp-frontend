import React, { useEffect } from "react";

import { Connector } from "../components/Connector";
import { useWallet, NftRole } from "../contexts/WalletProvider";

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
  const { walletLoaded, loadScriptInfo, scriptInfo, getPriceByRole, buyRoleNft } = useWallet()!;

  useEffect(() => {
    if (walletLoaded) {
      console.log("Loading script info...")
      loadScriptInfo()
    }
  }, [walletLoaded])

  useEffect(() => {
    if (scriptInfo !== null) {
      console.log("Script Info:", scriptInfo)
    }
  }, [scriptInfo])

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
    </div>
  );
}

export default Home;
