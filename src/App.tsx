import React, { useEffect } from "react";

import { Routes, Route, BrowserRouter } from "react-router-dom";

import { WalletProvider } from "./contexts/WalletProvider";

import Home from "./pages/Home";
import ListCompetition from "./pages/ListCompetition";

function App() {
  return (
    <WalletProvider networkMode="testnet">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/competitions" element={<ListCompetition />} />
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  );
}

export default App;
