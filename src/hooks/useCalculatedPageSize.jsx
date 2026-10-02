import { useState, useEffect } from "react";

const UI_HEIGHTS = {
  FIXED_HEADER: 380,
  ROW_HEIGHT: 52,
};

const DEFAULT_PAGE_SIZE = 12;

export const useCalculatedPageSize = (minPageSize = 5, maxPageSize = 20) => {
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_PAGE_SIZE;

    const availableHeight = window.innerHeight - UI_HEIGHTS.FIXED_HEADER;
    const calculatedRows = Math.floor(
      availableHeight / UI_HEIGHTS.ROW_HEIGHT
    );

    return Math.max(
      minPageSize,
      Math.min(maxPageSize, calculatedRows)
    );
  });

  useEffect(() => {
    let timeoutId;

    const calculatePageSize = () => {
      const availableHeight = window.innerHeight - UI_HEIGHTS.FIXED_HEADER;
      const calculatedRows = Math.floor(
        availableHeight / UI_HEIGHTS.ROW_HEIGHT
      );

      setPageSize(
        Math.max(
          minPageSize,
          Math.min(maxPageSize, calculatedRows)
        )
      );
    };

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculatePageSize, 150);
    };

    window.addEventListener("resize", handleResize);
    calculatePageSize();

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [minPageSize, maxPageSize]);

  return pageSize;
};