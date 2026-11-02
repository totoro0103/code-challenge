import { useState } from "react";
import type { Token } from "../lib/prices";

/** Token logo with a lettered fallback if the image is missing or fails. */
export function TokenIcon({ token, size = 28 }: { token: Token; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (failed || !token.icon) {
    // Turn the symbol into a number from 0 to 359 and use it as a colour hue,
    // so each token always gets the same colour.
    const hue = [...token.symbol].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
    return (
      <span
        className="token-icon token-icon--fallback"
        style={{ width: size, height: size, background: `hsl(${hue} 55% 46%)` }}
        aria-hidden="true"
      >
        {token.symbol.slice(0, 2)}
      </span>
    );
  }

  return (
    <img
      className="token-icon"
      src={token.icon}
      width={size}
      height={size}
      alt=""
      onError={() => setFailed(true)}
    />
  );
}
