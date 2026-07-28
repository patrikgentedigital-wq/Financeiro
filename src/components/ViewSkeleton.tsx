import React from 'react';

export const ViewSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 md:space-y-8 animate-pulse max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-purple-900/30 rounded-2xl border border-purple-500/20" />
          <div className="h-4 w-72 bg-purple-900/20 rounded-xl" />
        </div>
        <div className="h-10 w-36 bg-purple-900/30 rounded-2xl border border-purple-500/20" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="h-32 bg-[#120f24] rounded-3xl border border-purple-500/20 p-6 space-y-3">
          <div className="h-4 w-24 bg-purple-900/30 rounded-lg" />
          <div className="h-8 w-36 bg-purple-900/40 rounded-xl" />
        </div>
        <div className="h-32 bg-[#120f24] rounded-3xl border border-purple-500/20 p-6 space-y-3">
          <div className="h-4 w-24 bg-purple-900/30 rounded-lg" />
          <div className="h-8 w-36 bg-purple-900/40 rounded-xl" />
        </div>
        <div className="h-32 bg-[#120f24] rounded-3xl border border-purple-500/20 p-6 space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="h-4 w-24 bg-purple-900/30 rounded-lg" />
          <div className="h-8 w-36 bg-purple-900/40 rounded-xl" />
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="h-64 bg-[#120f24] rounded-3xl border border-purple-500/20 p-6 space-y-4">
        <div className="h-5 w-44 bg-purple-900/30 rounded-xl" />
        <div className="space-y-3 pt-2">
          <div className="h-10 w-full bg-[#1c1833] rounded-2xl border border-purple-500/10" />
          <div className="h-10 w-full bg-[#1c1833] rounded-2xl border border-purple-500/10" />
          <div className="h-10 w-full bg-[#1c1833] rounded-2xl border border-purple-500/10" />
        </div>
      </div>
    </div>
  );
};
