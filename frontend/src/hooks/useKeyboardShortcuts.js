import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Global keyboard shortcuts:
 *  - g d  → dashboard
 *  - g c  → customers
 *  - g a  → accounts
 *  - g t  → transactions
 *  - g l  → loans
 *  - g p  → products
 *  - g k  → kyc
 *  - /    → focus global search
 */
export default function useKeyboardShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    let lastG = 0;
    const handler = (e) => {
      const t = e.target;
      const tag = t?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable;
      if (e.key === "/" && !isInput) {
        e.preventDefault();
        document.querySelector('[data-testid="topbar-global-search"]')?.focus();
        return;
      }
      if (isInput) return;
      if (e.key === "g") { lastG = Date.now(); return; }
      const withinCombo = Date.now() - lastG < 700;
      if (!withinCombo) return;
      const map = { d: "/", c: "/customers", a: "/accounts", t: "/transactions", l: "/loans", p: "/products", k: "/kyc" };
      if (map[e.key]) { e.preventDefault(); navigate(map[e.key]); lastG = 0; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
}
