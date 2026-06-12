import { Link } from "@tanstack/react-router";
import { BrandMark } from "./BrandMark";
import settingsIcon from "../../assets/Setting Icon.png";

export function MobileTopBar({
  background = "rgba(5,5,5,0.85)",
  showSettings = true,
}: { background?: string; showSettings?: boolean }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
        paddingTop: "env(safe-area-inset-top, 0px)",
        background,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(200,167,106,0.06)",
      }}
    >
      <BrandMark />
      {showSettings && (
        <Link
          to="/settings"
          aria-label="Settings"
          style={{
            display: "grid",
            placeItems: "center",
            width: 40, height: 40,
            borderRadius: 10,
            border: "1px solid rgba(200,167,106,0.18)",
            background: "rgba(200,167,106,0.04)",
            position: "relative",
            overflow: "hidden",
            transition: "all 0.2s ease",
          }}
          className="kairos-header-settings"
        >
          <img
            src={settingsIcon}
            alt="Settings"
            style={{
              width: 24,
              height: 24,
              objectFit: "contain",
              filter: "drop-shadow(0 0 4px rgba(200,167,106,0.5))",
            }}
          />
          <style>{`
            .kairos-header-settings:hover {
              background: rgba(200,167,106,0.1) !important;
              border-color: rgba(200,167,106,0.3) !important;
              transform: scale(1.05);
            }
            .kairos-header-settings:active {
              transform: scale(0.95);
            }
          `}</style>
        </Link>
      )}
    </header>
  );
}
