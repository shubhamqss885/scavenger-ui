"use client";

import { cn } from "@/lib/utils";

export function FeedbackTableSkeleton() {
  return (
    <div className="border border-gray-200 overflow-hidden bg-white">
      <table className="w-full">
        {/* Header */}
        <thead className="bg-gray-50">
          <tr className="border-b border-gray-200">
            {[40, 60, 100, 300, 140, 160, 80, 40, 60].map((width, i) => (
              <th
                key={i}
                className="px-3 py-2.5 text-left"
                style={{ width: `${width}px` }}
              >
                <div
                  className="h-3 bg-gray-200 rounded animate-pulse"
                  style={{ width: `${Math.min(width - 20, 60)}px` }}
                />
              </th>
            ))}
          </tr>
        </thead>
        {/* Body - 5 skeleton rows */}
        <tbody>
          {Array.from({ length: 10 }).map((_, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                "transition-colors duration-150",
                rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/50",
              )}
            >
              {/* Checkbox */}
              <td className="px-3 py-3" style={{ width: "40px" }}>
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                </div>
              </td>
              {/* Rating */}
              <td className="px-3 py-3" style={{ width: "60px" }}>
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                </div>
              </td>
              {/* Type badge */}
              <td className="px-3 py-3" style={{ width: "100px" }}>
                <div className="w-14 h-5 bg-gray-200 rounded-full animate-pulse" />
              </td>
              {/* Prompt */}
              <td className="px-3 py-3">
                <div
                  className="h-4 bg-gray-200 rounded animate-pulse"
                  style={{ width: `${200 + rowIndex * 30}px` }}
                />
              </td>
              {/* Project */}
              <td className="px-3 py-3" style={{ width: "140px" }}>
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
              </td>
              {/* User */}
              <td className="px-3 py-3" style={{ width: "160px" }}>
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
              </td>
              {/* Time */}
              <td className="px-3 py-3" style={{ width: "80px" }}>
                <div className="w-10 h-3 bg-gray-200 rounded animate-pulse" />
              </td>
              {/* Comment indicator */}
              <td className="px-3 py-3" style={{ width: "40px" }}>
                {rowIndex % 3 === 0 && (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                )}
              </td>
              {/* Actions */}
              <td className="px-3 py-3" style={{ width: "60px" }}>
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
