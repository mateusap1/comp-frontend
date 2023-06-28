import * as React from "react";

import walletsExtraInfoJSON from "../assets/wallets.json";

import { useWallet } from "../contexts/WalletProvider";
import { Modal } from "./Modal";

import { WalletApi } from "lucid-cardano";

const walletsExtraInfo: WalletExtraInfo = walletsExtraInfoJSON;

type WalletExtraInfo = {
  [key: string]: {
    name: string;
    installationURL: string;
    icon: string;
    disableMobile: boolean;
    deeplink?: string;
  };
};

type WalletInfo = {
  installed: boolean;
  walletKey: string;
  name: string;
  installationURL: string;
  icon: string;
  disableMobile: boolean;
  enable?: () => Promise<WalletApi>;
};

type WalletSelectorProps = {
  show: boolean;
  onHide: () => void;
  whitelistedWallets: string[];
  onConnectWallet: (wallet: string) => void;
};

export const WalletSelector = ({
  show,
  onHide,
  whitelistedWallets,
  onConnectWallet,
}: WalletSelectorProps) => {
  const { walletLoaded, currentWallet, getWallets } = useWallet()!;

  if (walletLoaded === false) {
    return <div>Loading</div>;
  }

  const wallets = getWallets()!;
  const orderedWallets: WalletInfo[] = [];
  for (let i = 0; i < whitelistedWallets.length; i++) {
    const wallet = whitelistedWallets[i];

    if (wallet in wallets && wallet in walletsExtraInfo) {
      orderedWallets.push({
        installed: true,
        walletKey: wallet,
        ...wallets[wallet],
        ...walletsExtraInfo[wallet],
      });
    } else if (wallet in walletsExtraInfo) {
      orderedWallets.push({
        installed: false,
        walletKey: wallet,
        ...walletsExtraInfo[wallet],
      });
    }
  }

  const isMobile = window.outerWidth < 1024;

  return (
    <Modal show={show} onHide={onHide} title="Select a Wallet">
      <div className="flex flex-col gap-4 p-4 w-96">
        {orderedWallets.map(
          ({
            installed,
            walletKey,
            name,
            icon,
            installationURL,
            disableMobile,
          }) => {
            return (
              <button
                onClick={() =>
                  !installed
                    ? window.open(installationURL)
                    : onConnectWallet(walletKey)
                }
                className="flex gap-4 items-center border rounded-lg p-2"
                key={`select-button#${walletKey}`}
                disabled={isMobile && disableMobile}
              >
                {icon !== null && (
                  <img className="w-10" src={icon} alt="Icon" />
                )}
                <span className="overflow-x-clip">{name}</span>
              </button>
            );
          }
        )}
      </div>
    </Modal>
  );
};
