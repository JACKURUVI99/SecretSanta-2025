import { useEffect, useState } from 'react';

type Snowflake = {
  id: number;
  left: number;
  animationDuration: number;
  size: number;
  delay: number;
};

export default function SnowBackground() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    const flakes: Snowflake[] = [];
    for (let i = 0; i < 50; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100,
        animationDuration: Math.random() * 3 + 2,
        size: Math.random() * 10 + 5,
        delay: Math.random() * 2,
      });
    }
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute text-white opacity-70 animate-fall"
          style={{
            left: `${flake.left}%`,
            fontSize: `${flake.size}px`,
            animationDuration: `${flake.animationDuration}s`,
            animationDelay: `${flake.delay}s`,
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
}
