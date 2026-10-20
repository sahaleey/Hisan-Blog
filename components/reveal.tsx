"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const node = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReady(true);
    const element = node.current;
    if (!element || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const style = { "--reveal-delay": `${delay}ms` } as CSSProperties;
  return <div ref={node} className={`${className} ${ready ? "reveal-ready" : ""} ${visible ? "is-visible" : ""}`} style={style}>{children}</div>;
}
