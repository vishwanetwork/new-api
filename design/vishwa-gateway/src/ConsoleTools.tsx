import { Copy, FileText } from "lucide-react";
import { useState, type ReactNode } from "react";
import "./tools-refinements.css";

export const consoleModels = [
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
  { id: "deepseek-chat", name: "DeepSeek Chat" },
  { id: "qwen3-coder", name: "Qwen3 Coder" },
  { id: "mistral-large-latest", name: "Mistral Large" },
] as const;

export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const namespace = "vishwa-console:v1:";

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(namespace + key);
    return raw ? ((JSON.parse(raw) ?? fallback) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal<T>(key: string, value: T) {
  try {
    localStorage.setItem(namespace + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function ConsoleTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="cw-title">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="cw-title-actions">{action}</div>}
    </header>
  );
}

export function ConsoleEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="cw-empty">
      <span className="cw-empty-icon">
        <FileText size={19} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function CopyConfiguration({
  value,
  label = "Copy JSON",
}: {
  value: string;
  label?: string;
}) {
  const [result, setResult] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setResult("Copied");
    } catch {
      setResult("Clipboard unavailable. Select the JSON to copy it.");
    }
  }
  return (
    <span className="cw-copy">
      <button className="cw-button" type="button" onClick={copy}>
        <Copy size={15} />
        {label}
      </button>
      <span role="status">{result}</span>
    </span>
  );
}

export {
  CustomerPlayground as ConsolePlayground,
  CustomerActivity as ConsoleActivity,
} from "./CustomerTools";
export { CustomerBilling as ConsoleBilling } from "./CustomerBilling";
