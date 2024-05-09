import React, { useEffect, useState } from "react";

import { Button } from "../components/Button";
import { useWallet, NftRole, NftInfo } from "../contexts/WalletProvider";
import ImageUploader from "../components/ImageUploader";
import { Navbar } from "../components/Navbar";

type RoleMinterProps = {
  role: NftRole;
  getPriceByRole: (role: NftRole) => number;
  buyRoleNft: (role: NftRole) => Promise<void>;
};

const RoleMinter = ({ role, getPriceByRole, buyRoleNft }: RoleMinterProps) => {
  return (
    <div className="flex flex-col gap-2 bg-black p-4 rounded-lg">
      <Button onClick={() => buyRoleNft(role)} className="w-32">
        {role}
      </Button>
      <span className="text-center text-2xl font-bold text-white">
        {getPriceByRole(role) / 1_000_000} ADA
      </span>
    </div>
  );
};

const Home = () => {
  const [nftName, setNftName] = useState<string>("");

  const { currentWallet, loadScriptInfo, getPriceByRole, buyRoleNft } =
    useWallet()!;

  useEffect(() => {
    if (currentWallet) {
      loadScriptInfo();
    }
  }, [currentWallet]);

  return (
    <div>
      <Navbar />
      <div className="w-full justify-center flex p-8 flex flex-col">
        <div className="p-4 w-full justify-center flex flex-col gap-8">
          <div className="w-full flex justify-center">
            <div className="w-full items-center flex flex-row mx-32 gap-4">
              <span>Name</span>
              <input
                className="p-2 border-2 border-slate-600 rounded-lg w-full"
                placeholder="Select your nft name"
                type="text"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
              />
            </div>
            {/* <ImageUploader handleUploadMetadata={(blob: Blob) => Promise.resolve("")} /> */}
          </div>
          <div className="w-full justify-center flex flex-row gap-8">
            {["Admin", "Moderator", "Vote", "User"].map((role) => (
              <RoleMinter
                role={role as NftRole}
                getPriceByRole={getPriceByRole}
                buyRoleNft={(role: NftRole) => buyRoleNft(role, nftName)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
