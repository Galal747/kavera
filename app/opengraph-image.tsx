import { ImageResponse } from "next/og";

export const alt = "Atelier Cairo: Egyptian streetwear";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          background: "#0a0a0a",
          color: "#fafafa",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          Atelier Cairo
        </div>
        <div style={{ marginTop: 24, fontSize: 32, color: "#a3a3a3" }}>
          Egyptian streetwear, made with intention.
        </div>
      </div>
    ),
    { ...size },
  );
}