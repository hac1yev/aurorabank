import { useEffect, useState } from "react";

/**
 * Counts down `retryAfter` seconds. A new countdown starts whenever `trigger`
 * changes (pass the mutation error object so repeated identical limits restart).
 */
export const useCountdown = (retryAfter: number | undefined, trigger: unknown) => {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!retryAfter || retryAfter <= 0) {
      setRemaining(0);
      return;
    }

    let left = retryAfter;
    setRemaining(left);

    const timer = window.setInterval(() => {
      left -= 1;
      setRemaining(Math.max(left, 0));

      if (left <= 0) {
        window.clearInterval(timer);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [retryAfter, trigger]);

  return remaining;
};

/** Formats seconds as m:ss, e.g. 90 -> "1:30". */
export const formatCountdown = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
};
