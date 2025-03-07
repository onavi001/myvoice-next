import React from "react";

interface ProgressBarProps {
  progress: number;
  label: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label }) => {
  return (
    <div className="mb-4">
      <div className="text-[#B0B0B0] text-xs mb-1">{label}: {Math.round(progress)}%</div>
      <div className="w-full bg-[#4A4A4A] rounded-full h-2.5">
        <div className="bg-[#34C759] h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

export default ProgressBar;