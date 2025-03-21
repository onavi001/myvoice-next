import React from "react";

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[#1A1A1A] bg-opacity-80 flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-t-4 border-[#B0B0B0] border-t-[#34C759] rounded-full animate-spin"></div>
        <p className="mt-4 text-[#B0B0B0] text-sm">Cargando...</p>
      </div>
    </div>
  );
};

export const SmallLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-t-4 border-[#B0B0B0] border-t-[#34C759] rounded-full animate-spin"></div>
    </div>
  );
};

export default Loader;