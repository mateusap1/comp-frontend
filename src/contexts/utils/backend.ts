import {
  Competition,
  CompetitionRaw,
  CompetitionCreate,
  User,
  UserRaw,
  UserCreate,
} from "../../types/competition";
import {
  parseCompetition,
  parseCreateCompetition,
  parseUser,
  parseCreateUser,
} from "./parse";

import { AxiosInstance } from "axios";

export const getCompetitions = async (
  axios: AxiosInstance
): Promise<Competition[]> => {
  try {
    const result = await axios.get("/marketplace/competitions");
    const competitions: CompetitionRaw[] = result.data.competitions;

    return competitions.map((comp) => parseCompetition(comp));
  } catch (error) {
    console.log(error);
    return Promise.reject(error);
  }
};

export const saveCompetition = async (
  axios: AxiosInstance,
  competition: CompetitionCreate
): Promise<void> => {
  try {
    await axios.post(
      "/marketplace/competitions/create",
      parseCreateCompetition(competition)
    );
  } catch (error) {
    console.log(error);
  }
};

export const getUsers = async (
  axios: AxiosInstance,
  competitionId: string
): Promise<User[]> => {
  try {
    const result = await axios.get(
      `/marketplace/competitions/${competitionId}/users`
    );
    const users: UserRaw[] = result.data.users;

    return users.map((user) => parseUser(user));
  } catch (error) {
    console.log(error);
    return Promise.reject(error);
  }
};

export const saveUser = async (
  axios: AxiosInstance,
  competitionId: string,
  user: UserCreate
): Promise<void> => {
  try {
    await axios.post(
      `/marketplace/competitions/${competitionId}/users/create`,
      parseCreateUser(user)
    );
  } catch (error) {
    console.log(error);
    return Promise.reject(error);
  }
};

export const reviewUser = async (
  axios: AxiosInstance,
  competitionId: string,
  assetName: string,
  approve: boolean,
  newAdminRefHash: string,
  newAdminRefIndex: number,
  newUserRefHash: string,
  newUserRefIndex: number
): Promise<void> => {
  try {
    await axios.post(
      `/marketplace/competitions/${competitionId}/users/${assetName}/review?approve=${
        approve ? "true" : "false"
      }`,
      {
        newAdminRefHash,
        newAdminRefIndex,
        newUserRefHash,
        newUserRefIndex,
      }
    );
  } catch (error) {
    console.log(error);
    return Promise.reject(error);
  }
};

export const voteUser = async (
  axios: AxiosInstance,
  competitionId: string,
  userAssetName: string,
  voteAssetName: string,
  newUserRefHash: string,
  newUserRefIndex: number
): Promise<void> => {
  try {
    await axios.post(
      `/marketplace/competitions/${competitionId}/users/${userAssetName}/vote`,
      {
        voteAssetName,
        newUserRefHash,
        newUserRefIndex,
      }
    );
  } catch (error) {
    console.log(error);
    return Promise.reject(error);
  }
};