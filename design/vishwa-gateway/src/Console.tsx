import { Activity, KeyRound, LayoutDashboard, Settings, Terminal, Wallet } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ConsoleSettings } from "./ConsoleSettings";
import { CustomerKeys as ConsoleKeys, CustomerOverview as Overview } from "./CustomerJourney";
import {
  CustomerActivity as ConsoleActivity,
  CustomerPlayground as ConsolePlayground,
} from "./CustomerTools";
import { CustomerBilling as ConsoleBilling } from "./CustomerBilling";
import "./console.css";

type ConsoleProps = {
  credit: number;
  onAddCredit: () => void;
  onModels: () => void;
  onSignOut?: () => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
};

const consoleNav = [
  { key: "overview", name: "Overview", icon: LayoutDashboard },
  { key: "keys", name: "API Keys", icon: KeyRound },
  { key: "activity", name: "Activity", icon: Activity },
  { key: "playground", name: "Playground", icon: Terminal },
  { key: "billing", name: "Billing", icon: Wallet },
  { key: "settings", name: "Settings", icon: Settings },
] as const;

function readConsoleRoute() {
  const parts = window.location.hash.replace(/^#\/?/, "").split(/[?#]/)[0].split("/");
  const target = parts[1] === "api-keys" ? "keys" : parts[1];
  const section = consoleNav.find((item) => item.key === target)?.key ?? "overview";
  return { section, tab: parts[2] ?? "" };
}

export function Console(props: ConsoleProps) {
  const [route, setRoute] = useState(readConsoleRoute);
  const mainRef = useRef<HTMLElement>(null);
  const [railOffset, setRailOffset] = useState(0);
  useEffect(() => {
    const update = () => setRoute(readConsoleRoute());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.section]);

  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const measure = () => {
      const firstPanel = main.querySelector<HTMLElement>(".gn-console-summary, .cw-panel");
      const offset = firstPanel
        ? Math.max(0, firstPanel.getBoundingClientRect().top - main.getBoundingClientRect().top)
        : 0;
      setRailOffset((current) => (Math.abs(current - offset) > 0.5 ? offset : current));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(main);
    Array.from(main.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [route.section, route.tab]);

  let content;
  switch (route.section) {
    case "keys":
      content = <ConsoleKeys />;
      break;
    case "activity":
      content = <ConsoleActivity key={route.tab} tab={route.tab} />;
      break;
    case "playground":
      content = <ConsolePlayground onModels={props.onModels} onAddCredit={props.onAddCredit} />;
      break;
    case "billing":
      content = <ConsoleBilling credit={props.credit} onAddCredit={props.onAddCredit} />;
      break;
    case "settings":
      content = (
        <ConsoleSettings
          key={route.tab}
          tab={route.tab}
          theme={props.theme}
          onToggleTheme={props.onToggleTheme}
          onSignOut={props.onSignOut}
        />
      );
      break;
    default:
      content = <Overview {...props} />;
  }

  return (
    <div
      className="cw-shell"
      style={
        {
          "--cw-rail-offset": railOffset + "px",
        } as import("react").CSSProperties
      }
    >
      <aside className="cw-rail">
        <nav aria-label="Console navigation">
          <p>Workspace</p>
          {consoleNav.map(({ key, name, icon: NavIcon }) => (
            <a
              key={key}
              href={key === "overview" ? "#/console" : "#/console/" + key}
              aria-current={route.section === key ? "page" : undefined}
            >
              <NavIcon aria-hidden="true" size={17} />
              <span>{name}</span>
            </a>
          ))}
        </nav>
      </aside>
      <main className="cw-main" ref={mainRef}>
        {content}
      </main>
    </div>
  );
}
