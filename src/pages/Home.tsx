import React, { useEffect, useState } from "react";

import { Button } from "../components/Button";
import { useWallet, NftRole, NftInfo } from "../contexts/WalletProvider";
import ImageUploader from "../components/ImageUploader";
import { Navbar } from "../components/Navbar";

const Home = () => {
  const [competitionName, setCompetitionName] = useState<string>("");
  const [competitionDescription, setCompetitionDescription] =
    useState<string>("");

  const { currentWallet, mintAdmin } = useWallet()!;

  return (
    <div>
      <Navbar />
      <div className="w-full justify-center flex p-8 flex flex-col">
        <div className="p-4 w-full justify-center flex flex-col gap-8">
          <div className="w-full flex justify-center">
            <div className="w-full items-center justify-center flex flex-row gap-4">
              <span>Competition Name</span>
              <input
                className="p-2 border-2 border-slate-600 rounded-lg w-64"
                placeholder="Select your nft name"
                type="text"
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
              />
            </div>
            <div className="w-full items-center justify-center flex flex-row gap-4">
              <span>Competition Description</span>
              <input
                className="p-2 border-2 border-slate-600 rounded-lg w-64"
                placeholder="Select your nft name"
                type="text"
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
              />
            </div>
            <div className="w-full items-center justify-center flex flex-row gap-4">
              <span>Moderator Address</span>
              <input
                className="p-2 border-2 border-slate-600 rounded-lg w-64"
                placeholder="Select your nft name"
                type="text"
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
              />
            </div>
            <div className="w-full items-center justify-center flex flex-row gap-4">
              <span>User Price</span>
              <input
                className="p-2 border-2 border-slate-600 rounded-lg w-64"
                placeholder="Select your nft name"
                type="text"
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
              />
            </div>
            <div className="w-full items-center justify-center flex flex-row gap-4">
              <span>Vote Policy ID</span>
              <input
                className="p-2 border-2 border-slate-600 rounded-lg w-64"
                placeholder="Select your nft name"
                type="text"
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
              />
            </div>
            <div className="w-full items-center justify-center flex flex-row gap-4">
              <span>End Date</span>
              <input
                className="p-2 border-2 border-slate-600 rounded-lg w-64"
                placeholder="Select your nft name"
                type="text"
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
              />
            </div>
            <div className="w-full items-center justify-center flex flex-row gap-4">
              <span>Reward Rates</span>
              <input
                className="p-2 border-2 border-slate-600 rounded-lg w-64"
                placeholder="Select your nft name"
                type="text"
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full flex flex-col items-center justify-center">
            <div className="w-64 flex flex-col items-center justify-center gap-4">
              <button
                className="w-full py-4 text-xl hover:opacity-75 font-bold rounded-lg bg-gray-800 text-white"
                onClick={() =>
                  mintAdmin(
                    "Comp 1",
                    "Description comp 1",
                    "addr_test1qp747wu6gsvxplhzv5uz5mhw47rv82pl5ydzkgfuj037cyq5ca83vxg4dzuudph5uh32pncujdjj5w7uvers088vagaqcy0mlr",
                    5_000_000,
                    "02aa7e9d83f43ad54ab2585900292db7280ec43410e7563dac934d17",
                    1716564341000,
                    {
                      admin: 50,
                      moderator: 20,
                      winners: [{user: 20, vote: 0}, {user: 10, vote: 0}]
                    }
                  )
                }
              >
                Create competition
              </button>
              {/* <div className="w-full flex flex-row items-center justify-center">
                <input
                  className="p-4 w-24 text-xl border-2 rounded-lg border-gray-800"
                  placeholder="amount"
                  type="number"
                />
                <button
                  className="w-64 py-4 border-2 border-gray-800 text-xl hover:opacity-75 font-bold rounded-lg bg-gray-800 text-white"
                  onClick={() => buyRolesNft(selectedRoles, nftName)}
                >
                  Buy User
                </button>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
