import React, { useEffect, useState } from "react";

import { Button } from "../components/Button";
import { useWallet, NftRole, NftInfo } from "../contexts/WalletProvider";
import ImageUploader from "../components/ImageUploader";
import { Navbar } from "../components/Navbar";

type RoleMinterProps = {
  role: NftRole;
  getPriceByRole: (role: NftRole) => number;
  buyRoleNft: (role: NftRole) => Promise<void>
}

const RoleMinter = ({ role, getPriceByRole, buyRoleNft }: RoleMinterProps) => {
  return (
    <div className="flex flex-col gap-2 bg-black p-4 rounded-lg">
      <Button onClick={() => buyRoleNft(role)} className="w-32">{role}</Button>
      <span className="text-center text-2xl font-bold text-white">{getPriceByRole(role) / 1_000_000} ADA</span>
    </div>
  )
}

const Home = () => {
  const {
    currentWallet,
    loadScriptInfo,
    getPriceByRole,
    buyRoleNft
  } = useWallet()!;

  useEffect(() => {
    if (currentWallet) {
      loadScriptInfo()
    }
  }, [currentWallet])

  const handleUploadMetadata = async (blob: Blob) => {

  }

  return (
    <div>
      <Navbar />
      <div className="w-full justify-center flex p-8 flex flex-col">
        <div className="p-4 w-full justify-center flex flex-col gap-8">
          <div className="w-full flex justify-center">
            <ImageUploader handleUploadMetadata={handleUploadMetadata} />
          </div>
          <div className="w-full justify-center flex flex-row gap-8">
            {(["Admin", "Moderator", "Vote", "User"].map((role) => (
              <RoleMinter role={role as NftRole} getPriceByRole={getPriceByRole} buyRoleNft={buyRoleNft} />
            )))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
