"use client";

interface ProgressBarProps {
  progress: number; // 0 to 1
  isActive: boolean;
}

export function ProgressBar({ progress, isActive }: ProgressBarProps) {
  if (!isActive && progress === 0) return null;

  const percent = Math.round(progress * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-zinc-400 font-medium">Pipeline Progress</span>
        <span className="text-xs text-zinc-500 font-mono">{percent}%</span>
      </div>
      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#FF6B35] to-[#ff8f65] rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
