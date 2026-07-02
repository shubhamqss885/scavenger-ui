"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type UseScrollToBottomParams = Readonly<{
  enabled: boolean;
  active: boolean;
}>;

type UseScrollToBottomReturn = Readonly<{
  containerRef: React.RefObject<HTMLDivElement>;
  endRef: React.RefObject<HTMLDivElement>;
  isAtBottom: boolean;
  scrollToBottom: () => void;
}>;

const BOTTOM_THRESHOLD = 100;
const SCROLL_DEBOUNCE_MS = 150;

export const useScrollToBottom = ({
  enabled,
  active,
}: UseScrollToBottomParams): UseScrollToBottomReturn => {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef(true);
  const isUserScrollingRef = useRef(false);
  const enabledRef = useRef(enabled);
  const prevActiveRef = useRef(active);

  // Keep enabledRef in sync so observer callbacks read the latest value
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;

    if (!container) return;
    isAtBottomRef.current = true;
    container.scrollTo({ top: container.scrollHeight, behavior: "instant" });
  }, []);

  // Effect 1: Scroll event listener — tracks user position
  useEffect(() => {
    const container = containerRef.current;

    if (!container || !enabled) return;

    let scrollTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      isUserScrollingRef.current = true;
      clearTimeout(scrollTimeout);

      const { scrollTop, clientHeight, scrollHeight } = container;
      const atBottom =
        scrollTop + clientHeight >= scrollHeight - BOTTOM_THRESHOLD;
      setIsAtBottom(atBottom);
      isAtBottomRef.current = atBottom;

      scrollTimeout = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, SCROLL_DEBOUNCE_MS);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [enabled]);

  // Effect 2: MutationObserver + ResizeObserver — auto-scroll on DOM changes
  useEffect(() => {
    const container = containerRef.current;

    if (!container || !enabled) return;

    const scrollIfNeeded = () => {
      if (!enabledRef.current) return;
      if (!isAtBottomRef.current || isUserScrollingRef.current) return;

      requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "instant",
        });
      });
    };

    const mutationObserver = new MutationObserver(scrollIfNeeded);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    const resizeObserver = new ResizeObserver(scrollIfNeeded);
    resizeObserver.observe(container);
    Array.from(container.children).forEach((child) => {
      resizeObserver.observe(child);
    });

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [enabled]);

  // Effect 3: Force scroll when active transitions false → true (user sent a message)
  useEffect(() => {
    if (active && !prevActiveRef.current) {
      isAtBottomRef.current = true;
      setIsAtBottom(true);
      const container = containerRef.current;

      if (container) {
        requestAnimationFrame(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "instant",
          });
        });
      }
    }
    prevActiveRef.current = active;
  }, [active]);

  return { containerRef, endRef, isAtBottom, scrollToBottom };
};
