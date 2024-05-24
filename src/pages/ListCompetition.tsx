import React, { useEffect, useState } from "react";

import { Button } from "../components/Button";
import { useWallet, Competition, User } from "../contexts/WalletProvider";
import { Navbar } from "../components/Navbar";

const truncateString = (input: string, maxLength: number): string => {
  if (input.length <= maxLength) {
    return input; // Return the original string if it's already shorter than maxLength
  }

  const startLength = Math.ceil((maxLength - 3) / 2); // Length of the start portion
  const endLength = Math.floor((maxLength - 3) / 2); // Length of the end portion

  const truncatedString =
    input.slice(0, startLength) + "..." + input.slice(-endLength);
  return truncatedString;
};

const ListCompetition = () => {
  const [competitions, setCompetitions] = useState<Competition[] | null>(null);
  const [users, setUsers] = useState<Record<string, User[]>>({});

  const { backEndGetCompetitions, backEndGetUsers, mintUser } = useWallet()!;

  useEffect(() => {
    loadCompetitions();
  }, []);

  const loadCompetitions = async () => {
    const competitionsNew = await backEndGetCompetitions();
    setCompetitions(competitionsNew);

    competitionsNew.forEach(({ policyId }) => loadUsers(policyId));
  };

  const loadUsers = async (competitionId: string) => {
    const usersNew = await backEndGetUsers(competitionId);

    setUsers({ ...users, [competitionId]: usersNew });
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
                <div className="p-4 flex flex-col gap-4 bg-slate-100 text-xl">
                  <div className="p-2 flex flex-col gap-2 text-xl">
                    <div className="flex flex-row gap-2 justify-between">
                      <span className="font-bold">Name</span>
                      <span>{competition.name}</span>
                    </div>
                    <div className="flex flex-row gap-2 justify-between">
                      <span className="font-bold">Description</span>
                      <span>{competition.description}</span>
                    </div>
                    <div className="flex flex-row gap-2 justify-between">
                      <span className="font-bold">PolicyId</span>
                      <span>{truncateString(competition.policyId, 20)}</span>
                    </div>
                    <div className="flex flex-row gap-2 justify-between">
                      <span className="font-bold">Address</span>
                      <span>{truncateString(competition.address, 20)}</span>
                    </div>
                    <div className="flex flex-row gap-2 justify-between">
                      <span className="font-bold">User Price</span>
                      <span>{competition.params.userPrice}</span>
                    </div>
                    <div className="flex flex-row gap-2 justify-between">
                      <span className="font-bold">Vote PolicyId</span>
                      <span>
                        {truncateString(competition.params.votePolicyId, 20)}
                      </span>
                    </div>
                    <div className="flex flex-row gap-2 justify-between">
                      <span className="font-bold">End Date</span>
                      <span>
                        {new Date(
                          competition.params.endDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    className="w-full py-4 text-xl hover:opacity-75 font-bold rounded-lg bg-gray-800 text-white"
                    onClick={() =>
                      mintUser(competition, ["User #1", "User #2"])
                    }
                  >
                    Buy User
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-8">NFTs</h1>
          <div>
            {competitions && (
              <>
                {competitions.map((competition) => (
                  <div>
                    <h1 className="text-xl font-bold mb-8">
                      {competition.name}
                    </h1>
                    <div className="flex flex-wrap gap-4">
                      {competition.policyId in users &&
                        users[competition.policyId].map((user) => (
                          <div className="p-4 flex flex-col gap-4 bg-slate-100 text-xl">
                            <div className="p-2 flex flex-col gap-2 text-xl">
                              <div className="flex flex-row gap-2 justify-between">
                                <span className="font-bold">Name</span>
                                <span>{user.name}</span>
                              </div>
                              <div className="flex flex-row gap-2 justify-between">
                                <span className="font-bold">Asset Name</span>
                                <span>
                                  {truncateString(user.assetName, 20)}
                                </span>
                              </div>
                              <div className="flex flex-row gap-2 justify-between">
                                <span className="font-bold">Votes</span>
                                <span>{user.votes.length}</span>
                              </div>
                              <div className="flex flex-row gap-2 justify-between">
                                <span className="font-bold">State</span>
                                <span>
                                  {user.isApproved
                                    ? "Listed"
                                    : user.isRejected
                                    ? "Rejected"
                                    : "Awaiting Review"}
                                </span>
                              </div>
                            </div>
                            <button
                              className="w-full py-4 text-xl hover:opacity-75 font-bold rounded-lg bg-gray-800 text-white"
                              onClick={() => {}}
                            >
                              Approve
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListCompetition;
