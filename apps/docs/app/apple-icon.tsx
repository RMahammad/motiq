import { ImageResponse } from "next/og";

// Apple touch icon (home-screen / iOS share). Same branded monogram as the
// favicon, at the 180×180 size Apple expects.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7c5cff 0%, #4f7cff 100%)",
          color: "#fff",
          fontSize: 120,
          fontWeight: 700,
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
