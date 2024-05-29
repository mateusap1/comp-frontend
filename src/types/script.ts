import { Address, OutRef, PolicyId, Validator } from "lucid-cardano";

export type CompiledScriptInfo = {
  ticketScript: Validator;
  ticketPolicyId: PolicyId;

  adminScript: Validator;
  adminAddress: Address;

  userScript: Validator;
  userAddress: Address;
};

export type TicketParamsShort = {
  outRef: OutRef;

  adminPrice: number;
  userPrice: number;

  votePolicyId: PolicyId;

  endDate: number;
}

export type TicketParams = TicketParamsShort & {
  adminAddress: Address;
  userAddress: Address;
}