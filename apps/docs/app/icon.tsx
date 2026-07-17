import { ImageResponse } from "next/og";

// Generated favicon — a branded monogram on the dark surface. Next injects this
// automatically as the site icon (tabs, bookmarks, search results).
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 42,
          fontWeight: 700,
          borderRadius: 14,
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
