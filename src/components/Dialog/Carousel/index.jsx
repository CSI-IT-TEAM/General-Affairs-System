import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react"
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useDialogCarouselStore } from "../../../stores/use-dialog-store";

export default function CarouselDialog() {

    const open = useDialogCarouselStore(state => state.openDialog);
    const openCarousel = useDialogCarouselStore(state => state.triggerMenu);
    const carouselData = useDialogCarouselStore(state => state.dataModal);
    const items = carouselData ?? [];

    const [currentIndex, setCurrentIndex] = useState(0)
    const [touchStart, setTouchStart] = useState(0)
    const [touchEnd, setTouchEnd] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Reset to initial index when dialog opens
    useEffect(() => {
        if (open) {
            setCurrentIndex(0)
        }
    }, [open])

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev >= items.length - 1 ? 0 : prev + 1))
    }, [items.length])

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1))
    }, [items.length])

    const goToSlide = (index) => {
        setCurrentIndex(index)
    }

    // Touch handlers
    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX)
    }

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return

        const distance = touchStart - touchEnd
        const isLeftSwipe = distance > 50
        const isRightSwipe = distance < -50

        if (isLeftSwipe) {
            nextSlide()
        } else if (isRightSwipe) {
            prevSlide()
        }
    }

    // Keyboard navigation
    const handleKeyDown = (e) => {
        if (e.key === "ArrowLeft") {
            e.preventDefault()
            prevSlide()
        } else if (e.key === "ArrowRight") {
            e.preventDefault()
            nextSlide()
        } else if (e.key === "Escape") {
            openCarousel()
        }
    }

    return (
        <Dialog open={open} onOpenChange={openCarousel}>
            <DialogContent
                className={`${isFullscreen ? "max-w-[100vw] max-h-[100vh] w-full h-full" : "max-w-4xl max-h-[90vh]"} p-0 overflow-hidden`}
                onKeyDown={handleKeyDown}
            >
                {/* Main carousel container */}
                <div
                    className="relative w-full h-[70vh]"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="overflow-hidden h-full">
                        <div
                            className="flex h-full transition-transform duration-500 ease-in-out"
                            style={{
                                transform: `translateX(-${currentIndex * 100}%)`,
                            }}
                        >
                            {items.map((item, index) => (
                                <div key={item.id} className="flex-shrink-0 w-full h-full relative">
                                    <div
                                        className="w-full h-full flex items-center justify-center"
                                        style={{ backgroundColor: "#333" }}
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="max-w-full max-h-full object-fill"
                                            loading={Math.abs(index - currentIndex) <= 1 ? "eager" : "lazy"}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation arrows */}
                    {items.length > 1 && (
                        <>
                            <Button
                                variant="outline"
                                size="icon"
                                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg z-10"
                                onClick={prevSlide}
                                aria-label="Previous slide"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg z-10"
                                onClick={nextSlide}
                                aria-label="Next slide"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </>
                    )}

                    {/* Indicators */}
                    {items.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                            {items.map((_, index) => (
                                <button
                                    key={index}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex ? "bg-white w-8" : "bg-white/50 hover:bg-white/70"
                                        }`}
                                    onClick={() => goToSlide(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Slide counter */}
                    <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
                        {currentIndex + 1} / {items.length}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}