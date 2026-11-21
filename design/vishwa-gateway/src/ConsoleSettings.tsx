import { CustomerNotifications } from "./CustomerNotifications";
import {
  CircleCheck,
  KeyRound,
  LockKeyhole,
  LogOut,
  Moon,
  Plus,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import {
  ConsoleEmpty,
  ConsoleTitle,
  consoleModels,
  money,
  readLocal,
  writeLocal,
} from "./ConsoleTools";

type KeyDraft = {
  id: string;
  name: string;
  budget: number | null;
  expires: string;
  models: string[];
  enabled: boolean;
};

function isKeyDraft(value: unknown): value is KeyDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const draft = value as Partial<KeyDraft>;
  return (
    typeof draft.id === "string" &&
    Boolean(draft.id) &&
    typeof draft.name === "string" &&
    Boolean(draft.name.trim()) &&
    (draft.budget === null ||
      (typeof draft.budget === "number" && Number.isFinite(draft.budget) && draft.budget > 0)) &&
    typeof draft.expires === "string" &&
    typeof draft.enabled === "boolean" &&
    Array.isArray(draft.models) &&
    draft.models.every((model) => typeof model === "string")
  );
}

function KeyEditor({
  draft,
  onSave,
  onCancel,
}: {
  draft: KeyDraft | null;
  onSave: (value: KeyDraft) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const name = String(fields.get("name") ?? "").trim();
    if (!name) {
      setError("Enter a name.");
      return;
    }
    const budget = String(fields.get("budget") ?? "").trim();
    onSave({
      id: draft?.id ?? globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
      name,
      budget: budget ? Number(budget) : null,
      expires: String(fields.get("expires") ?? ""),
      models: fields.getAll("models").map(String),
      enabled: draft?.enabled ?? true,
    });
  }
  return (
    <form className="cw-panel cw-form" onSubmit={submit}>
      <div className="cw-panel-title">
        <h2>{draft ? "Edit key draft" : "New key draft"}</h2>
        <p>No credential will be generated.</p>
      </div>
      <label>
        Name
        <input
          required
          name="name"
          maxLength={64}
          defaultValue={draft?.name}
          placeholder="For example, development"
        />
      </label>
      <div className="cw-fields">
        <label>
          Monthly budget (USD)
          <input
            type="number"
            name="budget"
            min=".01"
            max="1000000"
            step=".01"
            defaultValue={draft?.budget ?? ""}
            placeholder="No limit"
          />
        </label>
        <label>
          Expires on
          <input type="date" name="expires" defaultValue={draft?.expires} />
        </label>
      </div>
      <fieldset>
        <legend>Allowed models</legend>
        <p>Leave unchecked to allow all models.</p>
        <div className="cw-check-grid">
          {consoleModels.map((model) => (
            <label className="cw-checkbox" key={model.id}>
              <input
                type="checkbox"
                name="models"
                value={model.id}
                defaultChecked={draft?.models.includes(model.id)}
              />
              {model.name}
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p className="cw-feedback" role="alert">
          {error}
        </p>
      )}
      <div className="cw-form-actions">
        <button type="submit" className="cw-button cw-primary">
          Save draft
        </button>
        <button type="button" className="cw-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function ConsoleKeys() {
  const [drafts, setDrafts] = useState<KeyDraft[]>(() => {
    const value = readLocal<unknown>("keys", []);
    return Array.isArray(value) ? value.filter(isKeyDraft) : [];
  });
  const [editor, setEditor] = useState<KeyDraft | "new" | null>(null);
  const [feedback, setFeedback] = useState("");
  function update(next: KeyDraft[], message: string) {
    const saved = writeLocal("keys", next);
    setDrafts(next);
    setFeedback(saved ? message : "Browser storage unavailable. Changes only last on this page.");
  }
  const create = (
    <button
      type="button"
      className="cw-button cw-primary"
      onClick={() => {
        setFeedback("");
        setEditor("new");
      }}
    >
      <Plus size={16} /> New key draft
    </button>
  );
  return (
    <>
      <ConsoleTitle
        title="API Keys"
        description="Configure drafts on this device. A connected service is required to issue keys."
        action={create}
      />
      {editor && (
        <KeyEditor
          key={editor === "new" ? "new" : editor.id}
          draft={editor === "new" ? null : editor}
          onCancel={() => setEditor(null)}
          onSave={(draft) => {
            update(
              editor === "new"
                ? [draft, ...drafts]
                : drafts.map((row) => (row.id === draft.id ? draft : row)),
              "Draft saved on this device.",
            );
            setEditor(null);
          }}
        />
      )}
      {feedback && (
        <p className="cw-feedback" role="status">
          {feedback}
        </p>
      )}
      <section className="cw-panel" aria-label="Key drafts">
        <div className="cw-panel-title">
          <h2>Local drafts</h2>
        </div>
        {drafts.length ? (
          <div className="cw-key-list">
            {drafts.map((draft) => (
              <article className="cw-key-row" key={draft.id}>
                <div className="cw-key-main">
                  <span className="cw-row-icon">
                    <KeyRound size={17} />
                  </span>
                  <div>
                    <h3>{draft.name}</h3>
                    <p>
                      {draft.budget == null
                        ? "No budget limit"
                        : money.format(draft.budget) + " / month"}{" "}
                      · {draft.expires ? "Expires " + draft.expires : "No expiry"}
                    </p>
                    <p>
                      {draft.models.length
                        ? draft.models
                            .map((id) => consoleModels.find((model) => model.id === id)?.name ?? id)
                            .join(", ")
                        : "All models"}
                    </p>
                  </div>
                </div>
                <span className="cw-badge" data-tone={draft.enabled ? "success" : undefined}>
                  {draft.enabled ? "Enabled" : "Disabled"}
                </span>
                <div className="cw-key-actions">
                  <button type="button" className="cw-button" onClick={() => setEditor(draft)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="cw-button"
                    onClick={() =>
                      update(
                        drafts.map((row) =>
                          row.id === draft.id ? { ...row, enabled: !row.enabled } : row,
                        ),
                        draft.enabled ? "Draft disabled." : "Draft enabled.",
                      )
                    }
                  >
                    {draft.enabled ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    className="cw-icon-button"
                    aria-label={"Delete " + draft.name + " draft"}
                    onClick={() => {
                      if (typeof editor === "object" && editor?.id === draft.id) setEditor(null);
                      update(
                        drafts.filter((row) => row.id !== draft.id),
                        "Draft removed.",
                      );
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <ConsoleEmpty
            title="No key drafts"
            description="Set a budget, expiry, and model access before issuing a credential."
          />
        )}
      </section>
    </>
  );
}

type Profile = { name: string; workspace: string; timezone: string };
type Routing = { priority: string; fallback: boolean; retention: string };
const defaultProfile: Profile = { name: "", workspace: "", timezone: "UTC" };
const defaultRouting: Routing = {
  priority: "balanced",
  fallback: true,
  retention: "provider",
};

function readSettings<T extends Record<string, string | boolean>>(
  storageKey: string,
  defaults: T,
): T {
  const saved = readLocal<unknown>(storageKey, null);
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return defaults;
  const record = saved as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => [
      key,
      typeof record[key] === typeof fallback ? record[key] : fallback,
    ]),
  ) as T;
}

function SettingsForm<T extends Record<string, string | boolean>>({
  title,
  note,
  storageKey,
  defaults,
  children,
  parse,
}: {
  title: string;
  note: string;
  storageKey: string;
  defaults: T;
  children: (value: T) => ReactNode;
  parse: (data: FormData) => T;
}) {
  const [initial] = useState(() => readSettings(storageKey, defaults));
  const [feedback, setFeedback] = useState("");
  return (
    <form
      className="cw-panel cw-form"
      onChange={() => setFeedback("")}
      onSubmit={(event) => {
        event.preventDefault();
        const value = parse(new FormData(event.currentTarget));
        setFeedback(
          writeLocal(storageKey, value)
            ? "Saved on this device."
            : "Browser storage unavailable. Changes were not saved.",
        );
      }}
    >
      <div className="cw-panel-title">
        <h2>{title}</h2>
        <p>{note}</p>
      </div>
      {children(initial)}
      <div className="cw-form-actions">
        <button type="submit" className="cw-button cw-primary">
          Save locally
        </button>
        {feedback && (
          <span className="cw-feedback" role="status">
            {feedback}
          </span>
        )}
      </div>
    </form>
  );
}

type SettingsProps = {
  tab: string;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
  onSignOut?: () => void;
};
const settingsTabs = [
  ["profile", "Profile"],
  ["security", "Security"],
  ["notifications", "Notifications"],
  ["routing", "Routing & privacy"],
] as const;

const securityOptions = [
  {
    name: "Two-factor authentication",
    action: "Set up",
    steps: [
      "Connect an account service.",
      "Verify your identity in that service.",
      "Enroll an authenticator and save recovery codes there.",
    ],
  },
  {
    name: "Passkeys",
    action: "Set up",
    steps: [
      "Connect an account service.",
      "Open its passkey enrollment.",
      "Confirm the new passkey on your device.",
    ],
  },
  {
    name: "Session history",
    action: "View requirements",
    steps: [
      "Connect an account service that tracks sessions.",
      "Review and revoke sessions in that service.",
    ],
  },
] as const;

function SecuritySettings({ onSignOut }: { onSignOut?: () => void }) {
  const [selected, setSelected] = useState<(typeof securityOptions)[number] | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (selected && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [selected]);
  return (
    <>
      <section className="cw-panel">
        <div className="cw-panel-title">
          <h2>
            <LockKeyhole size={17} /> Account security
          </h2>
          <p>Account services are not connected.</p>
        </div>
        <dl className="cw-setting-rows">
          {securityOptions.map((option) => (
            <div key={option.name}>
              <dt>{option.name}</dt>
              <dd>
                <button
                  type="button"
                  className="cw-button"
                  aria-label={option.action + ": " + option.name}
                  onClick={() => setSelected(option)}
                >
                  {option.action}
                </button>
              </dd>
            </div>
          ))}
        </dl>
      </section>
      {onSignOut && (
        <section className="cw-panel cw-inline-panel">
          <div className="cw-panel-title">
            <h2>This browser</h2>
            <p>End your current session on this device.</p>
          </div>
          <button type="button" className="cw-button" onClick={onSignOut}>
            <LogOut size={16} /> Sign out
          </button>
        </section>
      )}
      {selected && (
        <dialog
          ref={dialog}
          className="cw-dialog"
          aria-labelledby="cw-security-title"
          onClose={() => setSelected(null)}
        >
          <header>
            <h2 id="cw-security-title">{selected.name}</h2>
            <button
              type="button"
              className="cw-icon-button"
              aria-label="Close setup"
              onClick={() => dialog.current?.close()}
            >
              <X size={18} />
            </button>
          </header>
          <p className="cw-note">Setup is handled by your account service.</p>
          <ol className="cw-security-steps">
            {selected.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <button type="button" className="cw-button" onClick={() => dialog.current?.close()}>
            Done
          </button>
        </dialog>
      )}
    </>
  );
}

export function ConsoleSettings({ tab, theme, onToggleTheme, onSignOut }: SettingsProps) {
  const current = settingsTabs.some(([id]) => id === tab) ? tab : "profile";
  return (
    <>
      <ConsoleTitle title="Settings" />
      <nav className="cw-tabs" aria-label="Settings views">
        {settingsTabs.map(([id, title]) => (
          <a
            key={id}
            href={"#/console/settings" + (id === "profile" ? "" : "/" + id)}
            aria-current={id === current ? "page" : undefined}
          >
            {title}
          </a>
        ))}
      </nav>
      {current === "profile" && (
        <>
          <SettingsForm
            title="Profile"
            note="Preferences are stored on this device."
            storageKey="profile"
            defaults={defaultProfile}
            parse={(data) => ({
              name: String(data.get("name") ?? "").trim(),
              workspace: String(data.get("workspace") ?? "").trim(),
              timezone: String(data.get("timezone") ?? "UTC"),
            })}
          >
            {(profile) => (
              <>
                <div className="cw-fields">
                  <label>
                    Display name
                    <input
                      name="name"
                      maxLength={64}
                      defaultValue={profile.name}
                      placeholder="Your name"
                    />
                  </label>
                  <label>
                    Workspace name
                    <input
                      name="workspace"
                      maxLength={64}
                      defaultValue={profile.workspace}
                      placeholder="Workspace"
                    />
                  </label>
                </div>
                <label>
                  Preferred time zone
                  <select name="timezone" defaultValue={profile.timezone}>
                    <option value="UTC">UTC</option>
                    <option value="America/Los_Angeles">Pacific time</option>
                    <option value="America/New_York">Eastern time</option>
                    <option value="Europe/London">London</option>
                    <option value="Asia/Shanghai">China Standard Time</option>
                    <option value="Asia/Tokyo">Japan Standard Time</option>
                  </select>
                </label>
              </>
            )}
          </SettingsForm>
          {onToggleTheme && (
            <section className="cw-panel cw-inline-panel">
              <div className="cw-panel-title">
                <h2>Appearance</h2>
                <p>{theme === "light" ? "Light theme" : "Dark theme"}</p>
              </div>
              <button type="button" className="cw-button" onClick={onToggleTheme}>
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                {theme === "light" ? "Switch to dark" : "Switch to light"}
              </button>
            </section>
          )}
        </>
      )}
      {current === "security" && <SecuritySettings onSignOut={onSignOut} />}
      {current === "notifications" && <CustomerNotifications />}
      {current === "routing" && (
        <SettingsForm
          title="Routing & privacy"
          note="These are configuration drafts. They do not affect live requests."
          storageKey="routing"
          defaults={defaultRouting}
          parse={(data) => ({
            priority: String(data.get("priority") ?? "balanced"),
            fallback: data.has("fallback"),
            retention: String(data.get("retention") ?? "provider"),
          })}
        >
          {(prefs) => (
            <>
              <div className="cw-fields">
                <label>
                  Routing priority
                  <select name="priority" defaultValue={prefs.priority}>
                    <option value="balanced">Balanced</option>
                    <option value="latency">Lowest latency</option>
                    <option value="cost">Lowest cost</option>
                  </select>
                </label>
                <label>
                  Data retention
                  <select name="retention" defaultValue={prefs.retention}>
                    <option value="provider">Provider default</option>
                    <option value="zero">Zero retention when available</option>
                  </select>
                </label>
              </div>
              <div className="cw-toggle-list">
                <label className="cw-checkbox">
                  <input name="fallback" type="checkbox" defaultChecked={prefs.fallback} />
                  <span>
                    <strong>Allow provider fallback</strong>
                    <small>
                      Permit another provider when the preferred provider is unavailable.
                    </small>
                  </span>
                </label>
              </div>
              <p className="cw-note">
                <CircleCheck size={16} /> No API keys or provider credentials are stored.
              </p>
            </>
          )}
        </SettingsForm>
      )}
    </>
  );
}
