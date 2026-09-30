import { ImageResponse } from "next/og";

export const alt = "Cinematic Studio Template";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", color: "#f2f0ea", background: "#080705" }}>
      <div style={{ display: "flex", color: "#debd87", fontSize: 22, letterSpacing: "6px", marginBottom: 42 }}>OPEN SOURCE · MIT</div>
      <div style={{ display: "flex", fontSize: 76 }}>Cinematic Studio</div>
      <div style={{ display: "flex", fontSize: 76, color: "#debd87" }}>Template</div>
      <div style={{ display: "flex", fontSize: 26, color: "#aaa59b", marginTop: 38 }}>Bilingual · Responsive · Content Dashboard</div>
    </div>, size,
  );
}
