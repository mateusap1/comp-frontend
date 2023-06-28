import React from "react";

import { Connector } from "./components/Connector";
import { WalletProvider } from "./contexts/WalletProvider";

function App() {
  return (
    <WalletProvider networkMode="testnet">
      <>
        <h1>Hello, World</h1>
        <Connector whitelistedWallets={["nami", "eternl"]} />
      </>
    </WalletProvider>
  );
}

export default App;
