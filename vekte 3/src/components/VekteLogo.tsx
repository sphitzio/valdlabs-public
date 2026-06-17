import React, { useState } from "react";

interface VekteLogoProps {
  className?: string;
}

export const VekteLogo: React.FC<VekteLogoProps> = ({ className = "w-full h-auto" }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="flex items-center space-x-2 font-display uppercase tracking-[0.25em] text-white">
        <span className="text-xl font-black bg-gradient-to-r from-[#d4ff00] to-white bg-clip-text text-transparent select-none">
          VEKTE
        </span>
        <span className="text-[9px] text-zinc-500 font-mono tracking-normal lowercase align-bottom mt-1 select-none">
          vāld.labs
        </span>
      </div>
    );
  }

  return (
    <img
      src="https://raw.githubusercontent.com/sphitzio/valdlabs-public/refs/heads/main/public/vekte/assets/vekte-logo.svg"
      alt="VEKTE vāld.labs Logo"
      className={className}
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
    />
  );
};
