import React, { useEffect } from "react";

import { Routes, Route, BrowserRouter } from "react-router-dom";

import { WalletProvider } from "./contexts/WalletProvider";

import Home from "./pages/Home";
import NFTs from "./pages/Nfts";

function App() {
  return (
    <WalletProvider networkMode="testnet">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nfts" element={<NFTs />} />
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  );
}

export default App;
