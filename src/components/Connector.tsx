import { useState, useEffect } from "react";

import { WalletSelector } from "./WalletSelector";
import { Modal } from "./Modal";
import { useWallet } from "../contexts/WalletProvider";

type ConnectorProps = {
  whitelistedWallets: Array<string>;
};

export function Connector({ whitelistedWallets }: ConnectorProps) {
  const [statusDisplay, setStatusDisplay] = useState<JSX.Element>(
    <span>Connect Wallet</span>
  );

  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletSelectorShow, setWalletSelectorShow] = useState(false);

  const { walletLoaded, currentWallet, getWallets, connect } = useWallet()!;

  useEffect(() => {
    if (currentWallet === null) {
      setStatusDisplay(<span>Connect Wallet</span>);
    } else {
      setStatusDisplay(<span>Connected</span>);
    }
  }, [currentWallet]);

  if (walletLoaded === false) {
    // This will handle loading states
    // After this statement we can assume currentWallet, getWallets
    // will never be null

    return <></>;
  }

  return (
    <div className="user-menu-button">
      <button
        onClick={() => setWalletSelectorShow(true)}
        className="user-menu-button-text"
      >
        {statusDisplay}
      </button>

      <WalletSelector
        show={walletSelectorShow}
        onHide={() => setWalletSelectorShow(false)}
        whitelistedWallets={whitelistedWallets}
        onConnectWallet={(wallet) => {
          setWalletSelectorShow(false); // Close modal

          connect(wallet)
            .then(() => {
              setStatusDisplay(<span>Change wallet</span>);
            })
            .catch((err: any) => {
              if (err === undefined || err === null)
                setWalletError("User denied access to wallet");
              else if (
                typeof err === "object" &&
                !Array.isArray(err) &&
                err !== null &&
                "info" in err
              )
                setWalletError(err.info);
              else setWalletError(err);
              console.log("error", err);
            });
        }}
      />
      <Modal
        title="Wallet error"
        show={walletError !== null}
        onHide={() => setWalletError(null)}
      >
        <div className="p-4">
          Could not connect to wallet. Failed with error: <b>{walletError}</b>
        </div>
      </Modal>
    </div>
  );
}
