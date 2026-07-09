import { ImageResponse } from "next/og";

export const alt = "Foray — Swipe to fork";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share card: wordmark + tagline on the marketing background (#fafafa),
 * orange dot as the sole flourish (ADR-013). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafafa",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            fontSize: 180,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "#171717",
          }}
        >
          Foray
          {/* Satori's bundled font draws "." as a tofu box, so render the
              brand dot as a real circle. */}
          <div
            style={{
              width: 34,
              height: 34,
              marginLeft: 10,
              marginBottom: 26,
              borderRadius: 9999,
              background: "#ff9500",
            }}
          />
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 44,
            color: "#737373",
            letterSpacing: "-0.01em",
          }}
        >
          The recipes you save. Finally for dinner.
        </div>
      </div>
    ),
    size,
  );
}
