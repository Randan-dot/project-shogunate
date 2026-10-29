export default function SakuraPetals() {
  const petals = Array.from({ length: 16 }, (_, i) => ({
    left: `${(i * 6.7 + 2) % 100}%`,
    size: 8 + (i % 5) * 3,
    duration: 9 + (i % 6) * 2.2,
    delay: (i * 1.3) % 9,
    opacity: 0.4 + (i % 3) * 0.15,
  }));

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {petals.map((p, i) => (
        <span
          key={i}
          className="sakura-petal"
          style={{
            left: p.left,
            width: p.size,
            height: p.size * 1.15,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
            background:
              "radial-gradient(circle at 30% 30%, #fbe0e6, #f0a6b6)",
            borderRadius: "150% 0 150% 0",
          }}
        />
      ))}
    </div>
  );
}
