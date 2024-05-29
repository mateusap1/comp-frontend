import {
  CompetitionCreate,
  CompetitionRaw,
  Competition,
  UserCreate,
  UserRaw,
  User,
} from "../../types/competition";

export const parseCompetition = (data: CompetitionRaw): Competition => {
  return {
    ...data,
    endDate: new Date(data.endDate).getTime(),
    rewardRates: JSON.parse(data.rewardRates),
  };
};

export const parseCreateCompetition = (competition: CompetitionCreate) => {
  return {
    ...competition,
    endDate: new Date(competition.endDate).toISOString(),
    rewardRates: JSON.stringify(competition.rewardRates),
  };
};

export const parseUser = (data: UserRaw): User => {
  return {
    ...data,
    votes: JSON.parse(data.votes),
    rewardedVotes: JSON.parse(data.rewardedVotes),
    remainingVotes: JSON.parse(data.remainingVotes),
  };
};

export const parseCreateUser = (user: UserCreate) => {
  return user;
};
