import { useState, useEffect, useCallback, useRef } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Minimize2,
    ZoomIn,
    ZoomOut,
    RotateCw,
    RotateCcw,
    ExternalLink,
    X,
    ImageOff,
    Loader2,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { useDialogCarouselStore } from "../../../stores/use-dialog-store";
import { cn } from "../../../lib/utils";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

export default function CarouselDialog() {
    const open = useDialogCarouselStore((state) => state.openDialog);
    const openCarousel = useDialogCarouselStore((state) => state.triggerMenu);
    const carouselData = useDialogCarouselStore((state) => state.dataModal);
    const items = carouselData ?? [];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [imageMeta, setImageMeta] = useState({});
    const [failedImages, setFailedImages] = useState({});

    const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
    const touchStartXRef = useRef(0);
    const touchEndXRef = useRef(0);

    const resetTransform = useCallback(() => {
        setZoom(1);
        setRotation(0);
        setPan({ x: 0, y: 0 });
        setIsDragging(false);
    }, []);

    // Reset state when dialog opens or data changes
    useEffect(() => {
        if (open) {
            setCurrentIndex(0);
            setIsFullscreen(false);
            resetTransform();
            setFailedImages({});
        }
    }, [open, carouselData, resetTransform]);

    // Reset zoom/pan/rotation when switching slides
    useEffect(() => {
        resetTransform();
    }, [currentIndex, resetTransform]);

    const nextSlide = useCallback(() => {
        if (items.length <= 1) return;
        setCurrentIndex((prev) => (prev >= items.length - 1 ? 0 : prev + 1));
    }, [items.length]);

    const prevSlide = useCallback(() => {
        if (items.length <= 1) return;
        setCurrentIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
    }, [items.length]);

    const handleZoomIn = useCallback(() => {
        setZoom((prev) => Math.min(MAX_ZOOM, Number((prev + ZOOM_STEP).toFixed(2))));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom((prev) => {
            const next = Math.max(MIN_ZOOM, Number((prev - ZOOM_STEP).toFixed(2)));
            if (next <= 1) setPan({ x: 0, y: 0 });
            return next;
        });
    }, []);

    const handleRotate = useCallback(() => {
        setRotation((prev) => (prev + 90) % 360);
    }, []);

    const handleDoubleClick = useCallback(() => {
        setZoom((prev) => {
            if (prev > 1) {
                setPan({ x: 0, y: 0 });
                return 1;
            }
            return 2;
        });
    }, []);

    const handleWheel = useCallback((e) => {
        if (e.deltaY < 0) {
            setZoom((prev) => Math.min(MAX_ZOOM, Number((prev + ZOOM_STEP).toFixed(2))));
        } else {
            setZoom((prev) => {
                const next = Math.max(MIN_ZOOM, Number((prev - ZOOM_STEP).toFixed(2)));
                if (next <= 1) setPan({ x: 0, y: 0 });
                return next;
            });
        }
    }, []);

    // Pointer drag-to-pan when zoomed in
    const handleMouseDown = (e) => {
        if (zoom <= 1) return;
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            panX: pan.x,
            panY: pan.y,
        };
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setPan({
            x: dragStartRef.current.panX + dx,
            y: dragStartRef.current.panY + dy,
        });
    };

    const handleMouseUp = () => {
        if (isDragging) setIsDragging(false);
    };

    // Touch swipe handlers (disabled when zoomed in)
    const handleTouchStart = (e) => {
        if (zoom > 1 || e.targetTouches.length !== 1) return;
        touchStartXRef.current = e.targetTouches[0].clientX;
        touchEndXRef.current = 0;
    };

    const handleTouchMove = (e) => {
        if (zoom > 1 || e.targetTouches.length !== 1) return;
        touchEndXRef.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (zoom > 1 || !touchStartXRef.current || !touchEndXRef.current) return;
        const distance = touchStartXRef.current - touchEndXRef.current;
        if (distance > 50) {
            nextSlide();
        } else if (distance < -50) {
            prevSlide();
        }
        touchStartXRef.current = 0;
        touchEndXRef.current = 0;
    };

    // Global keyboard shortcuts while open
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => {
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                prevSlide();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                nextSlide();
            } else if (e.key === "+" || e.key === "=") {
                e.preventDefault();
                handleZoomIn();
            } else if (e.key === "-") {
                e.preventDefault();
                handleZoomOut();
            } else if (e.key === "0") {
                e.preventDefault();
                resetTransform();
            } else if (e.key === "r" || e.key === "R") {
                e.preventDefault();
                handleRotate();
            } else if (e.key === "f" || e.key === "F") {
                e.preventDefault();
                setIsFullscreen((prev) => !prev);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, prevSlide, nextSlide, handleZoomIn, handleZoomOut, resetTransform, handleRotate]);

    const currentItem = items[currentIndex];
    const currentKey = currentItem ? `${currentIndex}-${currentItem.image}` : "";
    const currentMeta = imageMeta[currentKey];
    const isCurrentFailed = Boolean(failedImages[currentKey]);
    const isTransformed = zoom !== 1 || rotation !== 0 || pan.x !== 0 || pan.y !== 0;

    return (
        <Dialog open={open} onOpenChange={openCarousel}>
            <DialogContent
                overlayClassName="z-[1000] bg-black/85 backdrop-blur-xs"
                hideCloseButton
                className={cn(
                    "z-[1001] p-0 gap-0 border-neutral-800 bg-neutral-950 text-white shadow-2xl overflow-hidden flex flex-col",
                    isFullscreen
                        ? "w-screen max-w-[100vw] h-screen max-h-[100vh] rounded-none sm:rounded-none border-0"
                        : "w-[92vw] max-w-[92vw] h-[88vh] max-h-[88vh] rounded-xl"
                )}
            >
                <DialogTitle className="sr-only">Image Viewer</DialogTitle>
                <DialogDescription className="sr-only">
                    Preview attached images with zoom, rotate, and navigation controls.
                </DialogDescription>

                {/* Top Toolbar */}
                <div className="flex items-center justify-between gap-2 px-3 sm:px-4 h-12 shrink-0 bg-neutral-900/95 border-b border-white/10 select-none z-20">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white tabular-nums">
                            {items.length > 0 ? `${currentIndex + 1} / ${items.length}` : "0 / 0"}
                        </span>
                        {currentMeta && !isCurrentFailed && (
                            <span className="hidden sm:inline-flex items-center text-xs text-neutral-400 tabular-nums">
                                {currentMeta.width} × {currentMeta.height}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={handleZoomOut}
                            disabled={zoom <= MIN_ZOOM || isCurrentFailed}
                            title="Zoom out (-)"
                            aria-label="Zoom out"
                            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 disabled:opacity-35 disabled:pointer-events-none transition-colors"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={resetTransform}
                            disabled={!isTransformed}
                            title="Reset zoom & position (0)"
                            className="min-w-[52px] px-1.5 py-1 rounded-lg text-xs font-semibold text-neutral-200 hover:text-white hover:bg-white/10 disabled:opacity-60 tabular-nums transition-colors"
                        >
                            {Math.round(zoom * 100)}%
                        </button>
                        <button
                            type="button"
                            onClick={handleZoomIn}
                            disabled={zoom >= MAX_ZOOM || isCurrentFailed}
                            title="Zoom in (+)"
                            aria-label="Zoom in"
                            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 disabled:opacity-35 disabled:pointer-events-none transition-colors"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>

                        <div className="w-px h-4 bg-white/15 mx-1" />

                        <button
                            type="button"
                            onClick={handleRotate}
                            disabled={isCurrentFailed}
                            title="Rotate 90° (R)"
                            aria-label="Rotate image"
                            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 disabled:opacity-35 disabled:pointer-events-none transition-colors"
                        >
                            <RotateCw className="w-4 h-4" />
                        </button>
                        {isTransformed && (
                            <button
                                type="button"
                                onClick={resetTransform}
                                title="Fit to screen (0)"
                                aria-label="Reset view"
                                className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsFullscreen((prev) => !prev)}
                            title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
                            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            {isFullscreen ? (
                                <Minimize2 className="w-4 h-4" />
                            ) : (
                                <Maximize2 className="w-4 h-4" />
                            )}
                        </button>
                        {currentItem?.image && (
                            <a
                                href={currentItem.image}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open original image in new tab"
                                aria-label="Open original image in new tab"
                                className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        )}

                        <div className="w-px h-4 bg-white/15 mx-1" />

                        <button
                            type="button"
                            onClick={openCarousel}
                            title="Close (Esc)"
                            aria-label="Close"
                            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-rose-500/80 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Main Image Stage */}
                <div
                    className={cn(
                        "relative flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden bg-neutral-950 p-4 sm:p-6",
                        zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
                    )}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {currentItem && (
                        <>
                            {!currentMeta && !isCurrentFailed && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <Loader2 className="w-7 h-7 text-neutral-400 animate-spin" />
                                </div>
                            )}

                            {isCurrentFailed ? (
                                <div className="flex flex-col items-center justify-center gap-2 text-neutral-400">
                                    <ImageOff className="w-10 h-10 text-neutral-500" />
                                    <p className="text-sm">Failed to load image</p>
                                </div>
                            ) : (
                                <img
                                    key={currentKey}
                                    src={currentItem.image}
                                    alt={currentItem.title || `Image ${currentIndex + 1}`}
                                    draggable={false}
                                    onDoubleClick={handleDoubleClick}
                                    onLoad={(e) => {
                                        const { naturalWidth, naturalHeight } = e.currentTarget;
                                        setImageMeta((prev) => ({
                                            ...prev,
                                            [currentKey]: {
                                                width: naturalWidth,
                                                height: naturalHeight,
                                            },
                                        }));
                                    }}
                                    onError={() => {
                                        setFailedImages((prev) => ({
                                            ...prev,
                                            [currentKey]: true,
                                        }));
                                    }}
                                    style={{
                                        transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom}) rotate(${rotation}deg)`,
                                    }}
                                    className={cn(
                                        "w-auto h-auto max-w-full max-h-full object-contain select-none rounded-sm shadow-2xl",
                                        isDragging ? "transition-none" : "transition-transform duration-200 ease-out"
                                    )}
                                />
                            )}
                        </>
                    )}

                    {/* Navigation Arrows */}
                    {items.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    prevSlide();
                                }}
                                aria-label="Previous image"
                                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/55 hover:bg-black/80 text-white border border-white/15 backdrop-blur-xs flex items-center justify-center shadow-lg transition-all z-10 cursor-pointer"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    nextSlide();
                                }}
                                aria-label="Next image"
                                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/55 hover:bg-black/80 text-white border border-white/15 backdrop-blur-xs flex items-center justify-center shadow-lg transition-all z-10 cursor-pointer"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </>
                    )}
                </div>

                {/* Bottom Thumbnail Strip (only when multiple images) */}
                {items.length > 1 && (
                    <div className="shrink-0 bg-neutral-900/95 border-t border-white/10 px-3 py-2.5 flex items-center justify-center gap-2 overflow-x-auto z-20">
                        {items.map((item, index) => {
                            const isActive = index === currentIndex;
                            return (
                                <button
                                    key={item.id ?? index}
                                    type="button"
                                    onClick={() => setCurrentIndex(index)}
                                    aria-label={`View image ${index + 1}`}
                                    className={cn(
                                        "relative h-12 w-16 shrink-0 rounded-md overflow-hidden border-2 transition-all cursor-pointer bg-neutral-800",
                                        isActive
                                            ? "border-blue-400 ring-2 ring-blue-400/40 opacity-100 scale-105"
                                            : "border-transparent opacity-55 hover:opacity-90"
                                    )}
                                >
                                    <img
                                        src={item.image}
                                        alt={item.title || `Thumbnail ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </button>
                            );
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
