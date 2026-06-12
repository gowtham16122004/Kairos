import { Link, useRouterState } from "@tanstack/react-router";

// Custom Kairos artifact icons — PNG assets
import homeIcon from "../../assets/Bottom Nav Icon/Home icon.png";
import focusIcon from "../../assets/Bottom Nav Icon/Focus Icon.png";
import recoveryIcon from "../../assets/Bottom Nav Icon/Recovery icon.png";
import analyticsIcon from "../../assets/Bottom Nav Icon/Analytics icon.png";
import habitIcon from "../../assets/Bottom Nav Icon/Habit icon.png";

const items = [
  { to: "/",         label: "Home",      icon: homeIcon },
  { to: "/deep",     label: "Focus",     icon: focusIcon },
  { to: "/recovery", label: "Recover",   icon: recoveryIcon },
  { to: "/matrix",   label: "Oracle",    icon: analyticsIcon },
  { to: "/habits",   label: "Habit",     icon: habitIcon },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: s => s.location.pathname });

  return (
    <nav className="kairos-bottom-nav">
      {items.map(({ to, label, icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`kairos-nav-tab${active ? " kairos-nav-active" : ""}`}
          >
            {/* Active gold accent bar */}
            {active && <span className="kairos-nav-bar" />}

            {/* Icon — the hero element */}
            <img
              src={icon}
              alt={label}
              draggable={false}
              className="kairos-nav-icon"
            />

            {/* Label — secondary */}
            <span className="kairos-nav-label">{label}</span>
          </Link>
        );
      })}

      <style>{`
        /* ── Nav container ── */
        .kairos-bottom-nav {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 40;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          height: 64px;
          padding: 0;
          background: linear-gradient(180deg, rgba(5,5,5,0.88) 0%, rgba(5,5,5,0.98) 50%);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-top: 1px solid rgba(200,167,106,0.12);
          box-shadow:
            0 -8px 32px -8px rgba(0,0,0,0.7),
            inset 0 1px 0 rgba(200,167,106,0.06);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        /* ── Each tab ── */
        .kairos-nav-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          text-decoration: none;
          position: relative;
          -webkit-tap-highlight-color: transparent;
          cursor: pointer;
          padding: 4px 0 6px;
        }

        /* ── Active accent bar ── */
        .kairos-nav-bar {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 28px;
          height: 2px;
          border-radius: 1px;
          background: #C8A76A;
          box-shadow: 0 0 8px rgba(200,167,106,0.7), 0 0 18px rgba(200,167,106,0.3);
        }

        /* ── Icon — THE HERO ──
           Aggressive overrides to defeat Tailwind preflight:
           img { max-width: 100%; height: auto; display: block }
        */
        .kairos-nav-icon {
          display: block !important;
          width: 44px !important;
          height: 44px !important;
          min-width: 44px !important;
          min-height: 44px !important;
          max-width: none !important;
          max-height: none !important;
          object-fit: contain !important;
          flex-shrink: 0;
          image-rendering: auto;
          transition: filter 0.3s ease, opacity 0.3s ease, transform 0.25s ease;
          will-change: filter, transform, opacity;

          /* Inactive: muted, desaturated */
          filter: saturate(0.3) brightness(0.65);
          opacity: 0.55;
          transform: scale(1);
        }

        /* ── Active icon: gold illumination ── */
        .kairos-nav-active .kairos-nav-icon {
          filter:
            drop-shadow(0 0 5px rgba(200,167,106,0.6))
            drop-shadow(0 0 12px rgba(200,167,106,0.2))
            brightness(1.15);
          opacity: 1;
          transform: scale(1.1);
        }

        /* ── Hover: subtle lift ── */
        .kairos-nav-tab:hover .kairos-nav-icon {
          filter: drop-shadow(0 0 4px rgba(200,167,106,0.4)) brightness(1.0);
          opacity: 0.85;
          transform: scale(1.08) translateY(-1px);
        }

        /* ── Press: tactile snap ── */
        .kairos-nav-tab:active .kairos-nav-icon {
          transform: scale(0.96) !important;
          transition-duration: 0.08s !important;
        }

        /* ── Label — secondary element ── */
        .kairos-nav-label {
          font-family: var(--font-sanctuary-ui, "Inter", system-ui, sans-serif);
          font-size: 9px;
          letter-spacing: 0.12em;
          font-weight: 300;
          line-height: 1;
          color: #8E8578;
          transition: color 0.25s;
        }

        .kairos-nav-active .kairos-nav-label {
          color: #C8A76A;
          font-weight: 500;
        }
      `}</style>
    </nav>
  );
}
