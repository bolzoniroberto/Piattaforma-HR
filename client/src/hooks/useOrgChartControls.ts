import { useRef, useState, useCallback } from "react";

export interface OrgChartControlsRef {
  highlightNode: (userId: string | null) => void;
  centerNode: (userId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  exportToPng: () => void;
  exportToSvg: () => void;
  exportToPdf: () => void;
  fitToScreen: () => void;
}

export function useOrgChartControls() {
  const chartRef = useRef<HTMLDivElement & OrgChartControlsRef>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.3));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  const highlightNode = useCallback((userId: string | null) => {
    if (chartRef.current?.highlightNode) {
      chartRef.current.highlightNode(userId);
    }
  }, []);

  const centerNode = useCallback((userId: string) => {
    if (chartRef.current?.centerNode) {
      chartRef.current.centerNode(userId);
    }
  }, []);

  const expandAll = useCallback(() => {
    if (chartRef.current?.expandAll) {
      chartRef.current.expandAll();
    }
  }, []);

  const collapseAll = useCallback(() => {
    if (chartRef.current?.collapseAll) {
      chartRef.current.collapseAll();
    }
  }, []);

  const exportToPng = useCallback(() => {
    if (chartRef.current?.exportToPng) {
      chartRef.current.exportToPng();
    }
  }, []);

  const exportToSvg = useCallback(() => {
    if (chartRef.current?.exportToSvg) {
      chartRef.current.exportToSvg();
    }
  }, []);

  const exportToPdf = useCallback(() => {
    if (chartRef.current?.exportToPdf) {
      chartRef.current.exportToPdf();
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      chartRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const fitToScreen = useCallback(() => {
    if (chartRef.current?.fitToScreen) {
      chartRef.current.fitToScreen();
    }
    resetZoom();
  }, [resetZoom]);

  return {
    chartRef,
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    highlightNode,
    centerNode,
    expandAll,
    collapseAll,
    exportToPng,
    exportToSvg,
    exportToPdf,
    toggleFullscreen,
    isFullscreen,
    fitToScreen,
  };
}
