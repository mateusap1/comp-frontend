import React, { useEffect } from "react";

import { Connector } from "./components/Connector";
import { WalletProvider } from "./contexts/WalletProvider";

import Home from "./pages/Home";

function App() {
  return (
    <WalletProvider networkMode="testnet">
      <Home />
    </WalletProvider>
  );
}

export default App;
