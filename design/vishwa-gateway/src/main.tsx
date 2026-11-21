import { useEffect, useLayoutEffect, useState } from "react";
import { Boxes, LayoutGrid, LogOut, Moon, Plus, Sun, Info } from "lucide-react";
import { createRoot } from "react-dom/client";
import { Console } from "./Console";
import { Brand } from "./Brand";
import { Landing } from "./Landing";
import { Models } from "./Models";
import { Checkout, type Order } from "./Checkout";
import { Admin } from "./Admin";
import { useCommerce, currentCustomer } from "./commerce";
import "./theme.css";
import "./app.css";
import "./model-utilities.css";

const sessionKey = "vishwa-commerce-access";
const themeKey = "vishwa-commerce-appearance";
type Theme = "dark" | "light";
type Page = "landing" | "console" | "models" | "admin";

function sessionValid() {
  try {
    return [sessionStorage, localStorage].some(
      (store) => Number(store.getItem(sessionKey)) > Date.now(),
    );
  } catch {
    return false;
  }
}
function readTheme(): Theme {
  try {
    return localStorage.getItem(themeKey) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}
function pageFromHash(): Page {
  const value = location.hash.replace(/^#\/?/, "");
  if (value === "admin" || value.startsWith("admin/")) return "admin";
  if (value === "models" || value === "pricing") return "models";
  if (value === "console" || value.startsWith("console/") || value === "dashboard/overview")
    return "console";
  return "landing";
}
function signIn(next: "console" | "models" = "console") {
  const requested = location.hash.replace(/^#\/?/, "");
  const destination =
    /^console\/(keys|api-keys|activity(?:\/(usage|audit|tasks))?|playground|billing|settings(?:\/(profile|security|notifications|routing))?)$/.test(
      requested,
    )
      ? requested
      : next;
  location.assign("./signin.html?next=" + encodeURIComponent(destination));
}
const usd = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

document.documentElement.dataset.theme =
  pageFromHash() === "landing" || !sessionValid() ? "dark" : readTheme();
function App() {
  const [page, setPage] = useState<Page>(pageFromHash);
  const [signedIn, setSignedIn] = useState(sessionValid);
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [order, setOrder] = useState<Order | null>(null);
  const commerce = useCommerce();
  const credit = currentCustomer(commerce).balanceMicros / 1_000_000;
  const [showContext, setShowContext] = useState(false);
  useEffect(() => {
    const update = () => {
      setPage(pageFromHash());
      setSignedIn(sessionValid());
    };
    window.addEventListener("hashchange", update);
    window.addEventListener("pageshow", update);
    return () => {
      window.removeEventListener("hashchange", update);
      window.removeEventListener("pageshow", update);
    };
  }, []);
  useEffect(() => {
    if (page !== "landing" && page !== "admin" && !signedIn) signIn(page);
  }, [page, signedIn]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);
  useLayoutEffect(() => {
    document.documentElement.dataset.theme =
      page === "landing" || (!signedIn && page !== "admin") ? "dark" : theme;
    if ((signedIn || page === "admin") && page !== "landing") {
      try {
        localStorage.setItem(themeKey, theme);
      } catch {}
    }
  }, [theme, page, signedIn]);
  const toggleTheme = () => setTheme((value) => (value === "dark" ? "light" : "dark"));
  function navigate(next: Page) {
    location.hash = next === "landing" ? "/" : "/" + next;
  }
  function signOut() {
    try {
      for (const store of [sessionStorage, localStorage]) store.removeItem(sessionKey);
    } catch {}
    setOrder(null);
    setPage("landing");
    setSignedIn(false);
    navigate("landing");
  }
  if (page === "admin") return <Admin theme={theme} onToggleTheme={toggleTheme} />;
  if (page === "landing")
    return (
      <Landing
        onSignIn={() => (signedIn ? navigate("console") : signIn())}
        heroUrl="./gateway-hero-alpha.png"
        theme="dark"
      />
    );
  if (!signedIn)
    return (
      <main className="vg-redirect" role="status">
        Opening sign-in…
      </main>
    );
  return (
    <div className={"vg-app vg-" + page}>
      <header className="vg-appbar">
        <a href="#/" className="vg-shell-brand" aria-label="Vishwa Gateway home">
          <Brand />
        </a>
        <nav aria-label="Workspace">
          <a href="#/console" aria-current={page === "console" ? "page" : undefined}>
            <LayoutGrid size={16} /> Console
          </a>
          <a href="#/models" aria-current={page === "models" ? "page" : undefined}>
            <Boxes size={16} /> Model Market
          </a>
        </nav>
        <div className="vg-account">
          <div className="vg-workspace-context">
            <button
              type="button"
              className="vg-icon-button"
              aria-label="Workspace connection status"
              aria-expanded={showContext}
              onClick={() => setShowContext((v) => !v)}
            >
              <Info size={17} />
            </button>
            {showContext && (
              <div className="vg-context-popover" role="status">
                <strong>Local workspace</strong>
                <p>
                  This separate design copy uses synthetic records stored on this device. Email,
                  payment and model services are offline.
                </p>
              </div>
            )}
          </div>
          <div className="vg-credit">
            <div>
              <small>Credit</small>
              <strong>{usd(credit)}</strong>
            </div>
            <button
              type="button"
              onClick={() => setOrder({ kind: "credit" })}
              aria-label="Add credit"
            >
              <Plus size={19} />
            </button>
          </div>
          <button
            type="button"
            className="vg-icon-button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            className="vg-icon-button"
            onClick={signOut}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>
      {page === "models" ? (
        <Models onPurchase={(offer) => setOrder({ kind: "model", offer })} />
      ) : (
        <Console
          credit={credit}
          onAddCredit={() => setOrder({ kind: "credit" })}
          onModels={() => navigate("models")}
          onSignOut={signOut}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
      {order && <Checkout order={order} onClose={() => setOrder(null)} />}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
