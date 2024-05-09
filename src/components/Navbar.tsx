import React from 'react';
import { Connector } from './Connector';

export const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="mx-0 px-4">
        <div className="flex justify-between items-center">
          <div className="flex-shrink-0">
            <a href="/" className="text-white font-bold text-lg">NFT Demo</a>
          </div>
          <div className="flex">
          <ul className="flex items-center space-x-4">
              <li><a href="/" className="text-white text-2xl hover:text-gray-300">Home</a></li>
              <li><a href="/nfts" className="text-white text-2xl hover:text-gray-300">View NFTs</a></li>
              </ul>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              <Connector whitelistedWallets={["nami", "eternl"]} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};