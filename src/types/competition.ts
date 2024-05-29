export type WinnerRate = {
  user: number;
  vote: number;
};

export type RewardRates = {
  admin: number;
  moderator: number;
  first: WinnerRate;
  second: WinnerRate;
  third: WinnerRate;
};

export type CompetitionShort = {
  name: string;
  description: string;

  adminImage: string;
  modImage: string;

  votePolicyId: string;

  rewardRates: RewardRates;

  adminPrice: number;
  userPrice: number;

  endDate: number;
};

export type CompetitionCreate = CompetitionShort & {
  scriptRefHash: string;
  scriptRefIndex: number;

  outRefHash: string;
  outRefIndex: number;

  adminAddress: string;
  userAddress: string;
  ticketPolicyId: string;
};

export type Competition = CompetitionCreate & {
  state: "voting" | "rewards";

  approvedAssetNames: string[];

  userAssetNamesRewarded: string[];
  voteAssetNamesRewarded: string[];
};

export type CompetitionRaw = Competition & {
  rewardRates: string;
  endDate: string;
};

export type UserShort = {
  name: string;
  image: string;
};

export type UserCreate = UserShort & {
  assetName: string;

  scriptRefHash: string;
  scriptRefIndex: number;
};

export type User = UserCreate & {
  state: "awaiting" | "approved" | "rejected";

  votes: string[];
  remainingVotes: string[];
  rewardedVotes: string[];

  isRewarded: boolean;
};

export type UserRaw = User & {
  votes: string;
  remainingVotes: string;
  rewardedVotes: string;
};
