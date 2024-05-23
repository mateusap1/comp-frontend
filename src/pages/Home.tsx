import React, { useEffect, useState } from "react";

import { Button } from "../components/Button";
import { useWallet, NftRole, NftInfo } from "../contexts/WalletProvider";
import ImageUploader from "../components/ImageUploader";
import { Navbar } from "../components/Navbar";

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // getMonth() returns 0-11, so we add 1
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const Home = () => {
  const [competitionName, setCompetitionName] = useState<string>("");
  const [competitionDescription, setCompetitionDescription] =
    useState<string>("");

  const [moderatorAddress, setModeratorAddress] = useState<string>("");
  const [userPrice, setUserPrice] = useState<number>(0);
  const [votePolicyId, setVotePolicyId] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [adminRate, setAdminRate] = useState<number>(0);
  const [moderatorRate, setModeratorRate] = useState<number>(0);
  const [fstUserRate, setFstUserRate] = useState<number>(0);
  const [fstVoteRate, setFstVoteRate] = useState<number>(0);
  const [sndUserRate, setSndUserRate] = useState<number>(0);
  const [sndVoteRate, setSndVoteRate] = useState<number>(0);
  const [trdUserRate, setTrdUserRate] = useState<number>(0);
  const [trdVoteRate, setTrdVoteRate] = useState<number>(0);

  const { currentWallet, mintAdmin } = useWallet()!;

  return (
    <div>
      <Navbar />
      <div className="w-full justify-center flex p-8 flex flex-col">
        <div className="p-4 w-full justify-center items-center flex flex-col gap-8">
          <div className="w-96 flex flex-col gap-2">
            <div className="w-full justify-between items-center flex flex-row gap-4">
              <span>Competition Name</span>
              <input
                className="p-2 border-2 border-slate-600 rounded-lg w-64"
                type="text"
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
              />
            </div>
            <div className="w-full justify-between items-center justify-center flex flex-row gap-4">
              <span>Competition Description</span>
              <input
                className="p-2 border-2 border-slate-600 rounded-lg w-64"
                type="text"
                value={competitionDescription}
                onChange={(e) => setCompetitionDescription(e.target.value)}
              />
            </div>
            <div className="w-full justify-between items-center justify-center flex flex-row gap-4">
              <span>Moderator Address</span>
              <input
                className="p-2 border-2 border-slate-600 rounded-lg w-64"
                type="text"
                value={moderatorAddress}
                onChange={(e) => setModeratorAddress(e.target.value)}
              />
            </div>
            <div className="w-full justify-between items-center justify-center flex flex-row gap-4">
              <span>User Price</span>
              <input
                className="p-2 border-2 border-slate-600 rounded-lg w-32"
                type="number"
                min={1}
                // step={0.1}
                value={userPrice}
                onChange={(e) => setUserPrice(Number(e.target.value))}
              />
            </div>
            <div className="w-full justify-between items-center justify-center flex flex-row gap-4">
              <span>Vote Policy ID</span>
              <input
                className="p-2 border-2 border-slate-600 rounded-lg w-64"
                type="text"
                value={votePolicyId}
                onChange={(e) => setVotePolicyId(e.target.value)}
              />
            </div>
            <div className="w-full justify-between items-center justify-center flex flex-row gap-4">
              <span>End Date</span>
              <input
                className="p-2 border-2 border-slate-600 rounded-lg w-64"
                placeholder="Select your nft name"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="w-full justify-between items-center justify-center flex flex-col gap-2 mt-4">
              <span className="text-xl font-semibold">Reward Rate</span>
              <div className="w-full justify-between items-center justify-center flex flex-row gap-4">
                <input
                  className="p-2 border-2 border-slate-600 rounded-lg w-full"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  placeholder="Admin"
                  value={adminRate}
                  onChange={(e) => setAdminRate(Number(e.target.value))}
                />
                <input
                  className="p-2 border-2 border-slate-600 rounded-lg w-full"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  placeholder="Moderator"
                  value={moderatorRate}
                  onChange={(e) => setModeratorRate(Number(e.target.value))}
                />
              </div>
              <div className="w-full justify-between items-center justify-center flex flex-row gap-4">
                <span className="font-medium text-xl">#1</span>
                <input
                  className="p-2 border-2 border-slate-600 rounded-lg w-full"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  placeholder="User"
                  value={fstUserRate}
                  onChange={(e) => setFstUserRate(Number(e.target.value))}
                />
                <input
                  className="p-2 border-2 border-slate-600 rounded-lg w-full"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  placeholder="Vote"
                  value={fstVoteRate}
                  onChange={(e) => setFstVoteRate(Number(e.target.value))}
                />
              </div>
              <div className="w-full justify-between items-center justify-center flex flex-row gap-4">
                <span className="font-medium text-xl">#2</span>
                <input
                  className="p-2 border-2 border-slate-600 rounded-lg w-full"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  placeholder="User"
                  value={sndUserRate}
                  onChange={(e) => setSndUserRate(Number(e.target.value))}
                />
                <input
                  className="p-2 border-2 border-slate-600 rounded-lg w-full"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  placeholder="Vote"
                  value={sndVoteRate}
                  onChange={(e) => setSndVoteRate(Number(e.target.value))}
                />
              </div>
              <div className="w-full justify-between items-center justify-center flex flex-row gap-4">
                <span className="font-medium text-xl">#3</span>
                <input
                  className="p-2 border-2 border-slate-600 rounded-lg w-full"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  placeholder="User"
                  value={trdUserRate}
                  onChange={(e) => setTrdUserRate(Number(e.target.value))}
                />
                <input
                  className="p-2 border-2 border-slate-600 rounded-lg w-full"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  placeholder="Vote"
                  value={trdVoteRate}
                  onChange={(e) => setTrdVoteRate(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <div className="w-full flex flex-col items-center justify-center">
            <div className="w-64 flex flex-col items-center justify-center gap-4">
              <button
                className="w-full py-4 text-xl hover:opacity-75 font-bold rounded-lg bg-gray-800 text-white"
                onClick={() =>
                  mintAdmin(
                    competitionName,
                    competitionDescription,
                    moderatorAddress,
                    userPrice * 1_000_000,
                    votePolicyId,
                    (new Date(endDate)).getUTCMilliseconds(),
                    {
                      admin: adminRate,
                      moderator: moderatorRate,
                      winners: [
                        { user: fstUserRate, vote: fstVoteRate },
                        { user: sndUserRate, vote: sndVoteRate },
                        { user: trdUserRate, vote: trdVoteRate },
                      ],
                    }
                  )
                }
              >
                Create competition
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
