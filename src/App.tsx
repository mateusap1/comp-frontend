import React from "react";

import { Connector } from "./components/Connector";
import { WalletProvider } from "./contexts/WalletProvider";

function App() {
  return (
    <WalletProvider networkMode="testnet">
      <>
        <Connector whitelistedWallets={["nami", "eternl"]} />
      </>
    </WalletProvider>
  );
}

export default App;
