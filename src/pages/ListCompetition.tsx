import React, { useEffect, useState } from "react";

import { Button } from "../components/Button";
import {
  useWallet,
  NftRole,
  NftInfo,
  Competition,
} from "../contexts/WalletProvider";
import { Navbar } from "../components/Navbar";

const ListCompetition = () => {
  const [competitions, setCompetitions] = useState<Competition[] | null>(null);

  const { backEndGetCompetitions, mintUser } = useWallet()!;

  useEffect(() => {
    loadCompetitions();
  }, []);

  const loadCompetitions = async () => {
    const competitionsNew = await backEndGetCompetitions();
    setCompetitions(competitionsNew);
  };

  return (
    <div>
      <Navbar />
      <div className="w-full justify-center flex p-8 flex flex-col">
        <div>
          <h1 className="text-2xl font-bold mb-8">Competitions</h1>
          {competitions && (
            <div className="flex flex-wrap gap-4">
              {competitions.map((competition) => (
                <div className="p-4 flex flex-col bg-slate-100 text-xl">
                  <div className="flex flex-row gap-2">
                    <span>Name</span>
                    <span>{competition.name}</span>
                  </div>
                  <button
                    className="w-full py-4 text-xl hover:opacity-75 font-bold rounded-lg bg-gray-800 text-white"
                    onClick={() => mintUser(competition, ["User #1", "User #2"])}
                  >
                    Buy User
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListCompetition;
