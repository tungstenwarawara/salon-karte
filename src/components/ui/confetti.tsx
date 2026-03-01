"use client";

import { useEffect, useState } from "react";

const COLORS = ["#C4956A", "#7BAE7F", "#E8A87C", "#E4A89E", "#8BBFA8"];

type Particle = {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
  shape: "square" | "circle" | "strip";
};

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[i % COLORS.length],
    size: 4 + Math.random() * 6,
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    rotation: Math.random() * 360,
    shape: (["square", "circle", "strip"] as const)[i % 3],
  }));
}

export function Confetti({ duration = 2500 }: { duration?: number }) {
  const [visible, setVisible] = useState(true);
  const [particles] = useState(() => generateParticles(25));

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: "-10px",
            width: p.shape === "strip" ? p.size * 0.4 : p.size,
            height: p.shape === "strip" ? p.size * 2 : p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : p.shape === "strip" ? "2px" : "1px",
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
