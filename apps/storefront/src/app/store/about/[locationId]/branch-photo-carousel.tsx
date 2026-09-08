"use client";

import { useRef, useState } from "react";
import styles from "./branch-detail.module.css";

type Props = {
  photos: string[];
  locationName: string;
};

export function BranchPhotoCarousel({ photos, locationName }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const draggedRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);

  function updateActiveIndex() {
    const viewport = viewportRef.current;
    if (!viewport || viewport.clientWidth === 0) return;

    const index = Math.round(viewport.scrollLeft / viewport.clientWidth);
    setActiveIndex(Math.max(0, Math.min(photos.length - 1, index)));
  }

  function scrollToIndex(index: number) {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.scrollTo({
      left: viewport.clientWidth * index,
      behavior: "smooth",
    });
    setActiveIndex(index);
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;

    const viewport = viewportRef.current;
    if (!viewport) return;

    pointerIdRef.current = event.pointerId;
    dragStartXRef.current = event.clientX;
    dragStartScrollLeftRef.current = viewport.scrollLeft;
    draggedRef.current = false;
    setDragging(true);
    viewport.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!viewport || pointerIdRef.current !== event.pointerId) return;

    const distance = event.clientX - dragStartXRef.current;
    if (Math.abs(distance) > 4) draggedRef.current = true;

    viewport.scrollLeft = dragStartScrollLeftRef.current - distance;
  }

  function finishDrag(event: React.PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!viewport || pointerIdRef.current !== event.pointerId) return;

    pointerIdRef.current = null;
    setDragging(false);

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    const index = Math.round(viewport.scrollLeft / viewport.clientWidth);
    scrollToIndex(Math.max(0, Math.min(photos.length - 1, index)));
  }

  return (
    <div className={styles.carouselShell}>
      <div
        ref={viewportRef}
        className={`${styles.carouselViewport} ${dragging ? styles.dragging : ""}`}
        onScroll={updateActiveIndex}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        aria-label={`${locationName} photos`}
      >
        {photos.map((url, index) => (
          <div className={styles.carouselSlide} key={url}>
            <img
              src={url}
              alt={`${locationName} photo ${index + 1}`}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {photos.length > 1 ? (
        <div className={styles.carouselControls}>
          <div className={styles.carouselDots} aria-label="Photo navigation">
            {photos.map((url, index) => (
              <button
                type="button"
                className={`${styles.carouselDot} ${index === activeIndex ? styles.carouselDotActive : ""}`}
                onClick={() => scrollToIndex(index)}
                aria-label={`Show photo ${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
                key={url}
              />
            ))}
          </div>
          <span className={styles.carouselCounter}>
            {activeIndex + 1}/{photos.length}
          </span>
        </div>
      ) : null}
    </div>
  );
}
