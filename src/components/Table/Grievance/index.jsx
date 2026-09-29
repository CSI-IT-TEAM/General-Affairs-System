import React from "react";
import { flexRender } from "@tanstack/react-table";

// --- COMPONENT: GrievanceTableView Desktop Table ---
const GrievanceTableView = ({
  table,
  visibleRows,
  columnVisibility,
}) => {
  return (
    <div className="hidden md:block w-full h-full overflow-auto custom-scrollbar">
      <table className="w-full border-collapse table-premium">
        {/* Premium Header with Gradient */}
        <thead className="sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b-2 border-blue-100 dark:border-blue-900/50"
            >
              {headerGroup.headers.map((header) => {
                if (!header.column.getIsVisible()) return null;

                const columnAlign =
                  header.column.columnDef.meta?.align || "center";

                const alignClass =
                  columnAlign === "left"
                    ? "text-left"
                    : columnAlign === "right"
                    ? "text-right"
                    : "text-center";

                return (
                  <th
                    key={header.id}
                    className={`
                      px-4 py-4
                      ${alignClass}
                      text-xs font-bold uppercase tracking-wide
                      text-slate-1000 dark:text-slate-200
                      border-r border-slate-200 dark:border-slate-600 last:border-r-0
                      bg-gradient-to-b from-slate-150 to-slate-250/80 dark:from-slate-800 dark:to-slate-900
                    `}
                    style={{ width: header.column.getSize() }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>

        {/* Premium Body with Hover Effects */}
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {visibleRows.map((row, index) => (
            <tr
              key={row.id}
              className={`
                group
                transition-all duration-200 ease-out
                hover:bg-gradient-to-r hover:from-blue-50/80 hover:via-indigo-50/50 hover:to-blue-50/80
                dark:hover:from-blue-950/30 dark:hover:via-indigo-950/20 dark:hover:to-blue-950/30
                hover:shadow-[inset_0_0_0_1px_rgba(59,130,246,0.15)]
                ${
                  index % 2 === 0
                    ? "bg-white dark:bg-slate-900/50"
                    : "bg-slate-50/50 dark:bg-slate-800/30"
                }
              `}
            >
              {row.getVisibleCells().map((cell) => {
                const columnAlign =
                  cell.column.columnDef.meta?.align || "center";

                const alignClass =
                  columnAlign === "left"
                    ? "text-left"
                    : columnAlign === "right"
                    ? "text-right"
                    : "text-center";

                return (
                  <td
                    key={cell.id}
                    className={`
                      px-3 py-2.5
                      ${alignClass}
                      text-sm text-slate-700 dark:text-slate-300
                      border-r border-slate-100 dark:border-slate-800/50 last:border-r-0
                      transition-colors duration-200
                      group-hover:text-slate-900 dark:group-hover:text-slate-100
                    `}
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GrievanceTableView;