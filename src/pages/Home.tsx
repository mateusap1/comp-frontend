import React, { useEffect, useState } from "react";

import { Button } from "../components/Button";
import { useWallet, NftRole, NftInfo } from "../contexts/WalletProvider";
import ImageUploader from "../components/ImageUploader";
import { Navbar } from "../components/Navbar";

type RoleMinterProps = {
  role: NftRole;
  isSelected: boolean;
  getPriceByRole: (role: NftRole) => number;
  onSelect: (role: NftRole) => void;
};

const RoleMinter = ({
  role,
  isSelected,
  getPriceByRole,
  onSelect,
}: RoleMinterProps) => {
  return (
    <div className="flex flex-col gap-2 bg-black p-4 rounded-lg">
      <Button onClick={() => onSelect(role)} className="w-32">
        {role}
      </Button>
      <span className="text-center text-2xl font-bold text-white">
        {getPriceByRole(role) / 1_000_000} ADA
      </span>
      {isSelected && (
        <span className="text-center text-lg font-bold text-white">
          SELECTED
        </span>
      )}
    </div>
  );
};

const Home = () => {
  const [nftName, setNftName] = useState<string>("");
  const [selectedRoles, setSelectedRoles] = useState<Array<NftRole>>([]);

  const { currentWallet, loadScriptInfo, getPriceByRole, buyRolesNft } =
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
                isSelected={selectedRoles.includes(role as NftRole)}
                getPriceByRole={getPriceByRole}
                onSelect={(role: NftRole) => {
                  if (selectedRoles.includes(role)) {
                    setSelectedRoles(selectedRoles.filter((r) => r != role))
                  } else {
                    setSelectedRoles([...selectedRoles, role])
                  }
                }}
              />
            ))}
          </div>
          <div className="w-full flex items-center justify-center">
            <Button onClick={() => buyRolesNft(selectedRoles, nftName)} className="w-64 py-4 rounded-lg bg-slate-800 text-white">
              Mint
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
