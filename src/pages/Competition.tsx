import React, { useEffect, useState } from "react";

import { Button } from "../components/Button";
import {
  useWallet,
  NftRole,
  NftInfo,
  Competition as CompetionInfo,
} from "../contexts/WalletProvider";
import ImageUploader from "../components/ImageUploader";
import { Navbar } from "../components/Navbar";

type CompetitionProps = {
  competition: CompetionInfo;
};

const Competition = ({ competition }: CompetitionProps) => {
  const { currentWallet, mintUser } = useWallet()!;

  return (
    <div>
      <Navbar />
      <div className="w-full justify-center flex p-8 flex flex-col">
        <div className="w-full flex flex-col items-center justify-center">
          <div className="w-64 flex flex-col items-center justify-center gap-4">
            <button
              className="w-full py-4 text-xl hover:opacity-75 font-bold rounded-lg bg-gray-800 text-white"
              onClick={() => mintUser(competition, "User #1", 1)}
            >
              Buy User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Competition;
