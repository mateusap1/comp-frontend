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
          <div className="hidden md:block">
            <ul className="flex space-x-4">
              <Connector whitelistedWallets={["nami", "eternl"]} />
            </ul>
          </div>
          <div className="md:hidden">
            {/* Mobile menu button */}
            <button className="text-white focus:outline-none">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};