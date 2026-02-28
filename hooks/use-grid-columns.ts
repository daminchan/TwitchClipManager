// 機能: grid-clips のブレークポイントに合わせた列数を返す

import { useState, useEffect, useCallback } from 'react';

/**
 * grid-clips (grid-cols-1 / sm:2 / lg:3 / xl:4 / 2xl:5) の列数を返す
 */
export function useGridColumns(): number {
  const getColumns = useCallback(() => {
    if (typeof window === 'undefined') return 5;
    const w = window.innerWidth;
    if (w >= 1536) return 5;
    if (w >= 1280) return 4;
    if (w >= 1024) return 3;
    if (w >= 640) return 2;
    return 1;
  }, []);

  const [cols, setCols] = useState(getColumns);

  useEffect(() => {
    function onResize() {
      setCols(getColumns());
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [getColumns]);

  return cols;
}
