import medallion from "@/assets/kairous logo.png";

export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 9,
          overflow: "hidden",
          boxShadow: "0 0 14px -4px rgba(200,167,106,0.4)",
          flexShrink: 0,
        }}
      >
        <img
          src={medallion}
          alt="Kairos"
          width={size}
          height={size}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-sanctuary-display)",
            fontSize: 18,
            letterSpacing: "0.32em",
            color: "var(--k-marble)",
            fontWeight: 400,
          }}
        >
          KAIROS
        </span>
        <span
          style={{
            fontFamily: "var(--font-sanctuary-ui)",
            fontSize: 8,
            letterSpacing: "0.32em",
            color: "var(--k-muted)",
            marginTop: 4,
            fontWeight: 400,
          }}
        >
          MASTER YOUR TIME
        </span>
      </div>
    </div>
  );
}
