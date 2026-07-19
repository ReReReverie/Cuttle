import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AlertTriangle, ArrowRight, Bug, Check, CheckCircle2, ChevronDown, ClipboardList,
  Clock3, Copy, FileCode2, FolderOpen, GitBranch, History, LoaderCircle, Monitor,
  Moon, PanelBottom, Play, Search, ShieldCheck, Sparkles, Sun, Terminal, TestTube2,
  UserRound, X,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

type Priority = "low" | "medium" | "high" | "critical";
type TaskStatus = "open" | "in_progress" | "done";
type Theme = "system" | "dark" | "light";
type EventType = "info" | "ai" | "success" | "warn";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  assignee: string;
  file: string;
  status: TaskStatus;
}

interface Commit {
  hash: string;
  shortHash: string;
  author: string;
  timestamp: string;
  subject: string;
}

interface ActivityEvent {
  id: string;
  type: EventType;
  message: string;
  timestamp: string;
}

const SAMPLE_CONTEXT = [
  "Standup — Checkout reliability",
  "@Mika: Checkout crashes when the coupon endpoint returns 204. Fix the response parsing in src/api/checkout.ts before release.",
  "@Noah: The retry banner stays visible after payment succeeds; investigate src/components/RetryBanner.tsx.",
  "QA: Add a regression test for a coupon with an empty response. This is release-blocking.",
].join("\n");

const FALLBACK_COMMITS: Commit[] = [
  { hash: "a73c918f4c29e20f", shortHash: "a73c918", author: "Mika Santos", timestamp: "2026-07-18T09:42:00+08:00", subject: "Guard checkout response parsing" },
  { hash: "fe12bc4992e4ad10", shortHash: "fe12bc4", author: "Noah Lim", timestamp: "2026-07-17T16:18:00+08:00", subject: "Refine retry banner state" },
  { hash: "8d91aa28b65fd708", shortHash: "8d91aa2", author: "Ari Flores", timestamp: "2026-07-16T11:04:00+08:00", subject: "Add payment regression fixtures" },
  { hash: "324bd84125e0cdaa", shortHash: "324bd84", author: "Mika Santos", timestamp: "2026-07-15T14:31:00+08:00", subject: "Initialize checkout flow" },
];

const FALLBACK_FILES = [
  "src/api/checkout.ts",
  "src/components/RetryBanner.tsx",
  "tests/checkout.test.ts",
];

const priorityRank: Record<Priority, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const isTauri = () => "__TAURI_INTERNALS__" in window;

function createEvent(type: EventType, message: string): ActivityEvent {
  return { id: crypto.randomUUID(), type, message, timestamp: new Date().toISOString() };
}

function inferPriority(text: string): Priority {
  const value = text.toLowerCase();
  if (/release.block|security|data loss|crash|critical/.test(value)) return "critical";
  if (/bug|error|fail|broken|urgent/.test(value)) return "high";
  if (/minor|copy|docs|polish/.test(value)) return "low";
  return "medium";
}

function makeTitle(text: string): string {
  return text
    .replace(/^[-*•\d.)\s]+/, "")
    .replace(/^(@[\w-]+|qa|dev|engineering)\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.?!]+$/, "")
    .slice(0, 78);
}

function parseContext(context: string): Task[] {
  const lines = context
    .split(/\n|(?<=[.!?])\s+(?=[A-Z@])/)
    .map((line) => line.trim())
    .filter((line) => line.length > 18);
  const actionable = lines.filter((line) =>
    /fix|bug|broken|issue|error|crash|fail|investigate|add|update|should|needs?|regression/i.test(line),
  );
  const source = actionable.length ? actionable : lines;

  return source.slice(0, 8).map((line, index) => {
    const assignee = line.match(/@([\w-]+)/)?.[1] ?? "Unassigned";
    const file =
      line.match(/(?:src|app|tests?|packages?)\/[\w./-]+\.[a-z0-9]+/i)?.[0] ??
      (line.toLowerCase().includes("test") ? "tests/regression.test.ts" : "src/unknown.ts");
    return {
      id: crypto.randomUUID(),
      title: makeTitle(line) || "Investigate item " + (index + 1),
      description: line,
      priority: inferPriority(line),
      assignee,
      file,
      status: "open",
    };
  });
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatCommitDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

function shortPath(path: string) {
  const parts = path.replace(/\\/g, "/").split("/");
  return parts.length > 2 ? "…/" + parts.slice(-2).join("/") : path;
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("patchtrail-theme") as Theme) || "system");
  const [context, setContext] = useState(SAMPLE_CONTEXT);
  const [contextFile, setContextFile] = useState("");
  const [contextOpen, setContextOpen] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedTaskIds, setAnalyzedTaskIds] = useState<Set<string>>(new Set());
  const [reviewTab, setReviewTab] = useState<"patch" | "tests">("patch");
  const [repoPath, setRepoPath] = useState(() => localStorage.getItem("patchtrail-repo") || "");
  const [commits, setCommits] = useState<Commit[]>(FALLBACK_COMMITS);
  const [selectedCommit, setSelectedCommit] = useState<Commit>(FALLBACK_COMMITS[0]);
  const [commitFiles, setCommitFiles] = useState<string[]>(FALLBACK_FILES);
  const [gitOpen, setGitOpen] = useState(false);
  const [gitLoading, setGitLoading] = useState(false);
  const [gitError, setGitError] = useState("");
  const [activityOpen, setActivityOpen] = useState(false);
  const [activity, setActivity] = useState<ActivityEvent[]>([createEvent("info", "Workspace ready")]);
  const [copied, setCopied] = useState("");
  const contextFileInput = useRef<HTMLInputElement>(null);

  const selectedTask = tasks.find((task) => task.id === selectedId) ?? null;
  const isAnalyzed = selectedTask ? analyzedTaskIds.has(selectedTask.id) : false;
  const taskCounts = useMemo(() => ({
    open: tasks.filter((task) => task.status !== "done").length,
    done: tasks.filter((task) => task.status === "done").length,
  }), [tasks]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
    };
    apply();
    media.addEventListener("change", apply);
    localStorage.setItem("patchtrail-theme", theme);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  useEffect(() => {
    if (!repoPath) return;
    localStorage.setItem("patchtrail-repo", repoPath);
    void loadGitHistory(repoPath);
  }, [repoPath]);

  const addActivity = (type: EventType, message: string) => {
    setActivity((events) => [createEvent(type, message), ...events].slice(0, 60));
  };

  const importContextFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      addActivity("warn", "Context file is larger than 2 MB");
      return;
    }
    try {
      setContext(await file.text());
      setContextFile(file.name);
      setContextOpen(true);
      addActivity("info", "Imported context from " + file.name);
    } catch {
      addActivity("warn", "Could not read " + file.name);
    }
  };

  const extractTasks = async () => {
    if (!context.trim() || extracting) return;
    const parsed = parseContext(context);
    if (!parsed.length) {
      addActivity("warn", "No actionable items found");
      return;
    }
    setExtracting(true);
    setTasks([]);
    setSelectedId(null);
    setAnalyzedTaskIds(new Set());
    for (const task of parsed) {
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      setTasks((current) => [...current, task]);
    }
    setSelectedId(parsed[0].id);
    setExtracting(false);
    setContextOpen(false);
    addActivity("ai", "Extracted " + parsed.length + " actionable task" + (parsed.length === 1 ? "" : "s"));
  };

  const updateTask = (id: string, patch: Partial<Task>) => {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...patch } : task)));
  };

  const analyzeTask = () => {
    if (!selectedTask || analyzing) return;
    const task = selectedTask;
    setAnalyzing(true);
    window.setTimeout(() => {
      setAnalyzedTaskIds((current) => new Set(current).add(task.id));
      setAnalyzing(false);
      addActivity("ai", "Analyzed " + task.file);
    }, 850);
  };

  const approveFix = () => {
    if (!selectedTask) return;
    updateTask(selectedTask.id, { status: "done" });
    addActivity("success", "Approved patch for " + selectedTask.file);
  };

  const copyText = async (label: string, value: string, type: EventType = "info") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1600);
      addActivity(type, "Copied " + label);
    } catch {
      addActivity("warn", "Could not copy " + label);
    }
  };

  const chooseRepository = async () => {
    if (!isTauri()) {
      setGitOpen(true);
      setGitError("Repository selection is available in the desktop window. Showing demo history here.");
      return;
    }
    const selected = await open({ directory: true, multiple: false, title: "Choose a Git repository" });
    if (typeof selected === "string") {
      setRepoPath(selected);
      addActivity("info", "Opened repository " + shortPath(selected));
    }
  };

  async function loadGitHistory(path: string) {
    if (!isTauri()) return;
    setGitLoading(true);
    setGitError("");
    try {
      const history = await invoke<Commit[]>("git_log", { repoPath: path });
      setCommits(history);
      if (history[0]) {
        setSelectedCommit(history[0]);
        const files = await invoke<string[]>("git_commit_files", { repoPath: path, hash: history[0].hash });
        setCommitFiles(files);
      }
    } catch (error) {
      setGitError(String(error));
      setCommits(FALLBACK_COMMITS);
      setSelectedCommit(FALLBACK_COMMITS[0]);
      setCommitFiles(FALLBACK_FILES);
    } finally {
      setGitLoading(false);
    }
  }

  const selectCommit = async (commit: Commit) => {
    setSelectedCommit(commit);
    if (!repoPath || !isTauri()) {
      setCommitFiles(FALLBACK_FILES);
      return;
    }
    try {
      setCommitFiles(await invoke<string[]>("git_commit_files", { repoPath, hash: commit.hash }));
    } catch (error) {
      setGitError(String(error));
    }
  };

  const cycleTheme = () => {
    setTheme((current) => current === "system" ? "dark" : current === "dark" ? "light" : "system");
  };

  const ThemeIcon = theme === "system" ? Monitor : theme === "dark" ? Moon : Sun;
  const recoveryFile = commitFiles[0] || selectedTask?.file || "src/file.ts";
  const commands = [
    {
      id: "branch recovery", title: "Branch recovery", note: "Recommended",
      command: "git switch -c recovery/" + selectedCommit.shortHash + " " + selectedCommit.hash, tone: "safe",
    },
    {
      id: "explore command", title: "Explore commit", note: "Detached, read-only",
      command: "git switch --detach " + selectedCommit.hash, tone: "neutral",
    },
    {
      id: "file restore command", title: "Restore one file", note: shortPath(recoveryFile),
      command: 'git restore --source=' + selectedCommit.hash + ' -- "' + recoveryFile + '"', tone: "neutral",
    },
    {
      id: "hard reset command", title: "Hard reset", note: "Destructive",
      command: "git reset --hard " + selectedCommit.hash, tone: "danger",
    },
  ] as const;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><GitBranch size={18} /></div>
          <div><strong>PatchTrail</strong><span>Local engineering workspace</span></div>
        </div>
        <div className="topbar-actions">
          <button className="quiet-button repo-button" onClick={chooseRepository} title="Choose repository">
            <FolderOpen size={16} /><span>{repoPath ? shortPath(repoPath) : "Choose repository"}</span>
          </button>
          <button className="quiet-button" onClick={() => setGitOpen(true)}>
            <History size={16} /><span>Git history</span>
          </button>
          <button className="icon-button" onClick={cycleTheme} title={"Theme: " + theme} aria-label={"Theme: " + theme}>
            <ThemeIcon size={17} />
          </button>
        </div>
      </header>

      <main>
        <section className="hero-row">
          <div>
            <div className="eyebrow"><span className="live-dot" /> Offline mode · Nothing leaves this device</div>
            <h1>Turn bug context into a reviewed patch.</h1>
            <p>Extract the work, inspect the likely fix, and keep recovery commands close—without giving up control.</p>
          </div>
          <div className="hero-stats" aria-label="Task summary">
            <div><strong>{String(taskCounts.open).padStart(2, "0")}</strong><span>Active</span></div>
            <div><strong>{String(taskCounts.done).padStart(2, "0")}</strong><span>Approved</span></div>
          </div>
        </section>

        <section className={"context-panel " + (contextOpen ? "is-open" : "")}>
          <button className="section-toggle" onClick={() => setContextOpen((openState) => !openState)} aria-expanded={contextOpen}>
            <span className="toggle-title">
              <ClipboardList size={17} />
              <span>
                <strong>Meeting & issue context</strong>
                <small>{tasks.length ? "Context captured · edit or re-run anytime" : "Paste a transcript, ticket, or stack trace"}</small>
              </span>
            </span>
            <ChevronDown size={18} />
          </button>
          {contextOpen && (
            <div className="context-content">
              <label htmlFor="context-input">Source context</label>
              <textarea id="context-input" value={context} onChange={(event) => setContext(event.target.value)}
                placeholder="Paste notes, a support ticket, or a stack trace…" />
              <div className="context-footer">
                <div className="context-tools">
                  <span><ShieldCheck size={14} /> Deterministic local parser</span>
                  {contextFile && <small title={contextFile}>Loaded: {contextFile}</small>}
                </div>
                <div className="context-actions">
                  <input ref={contextFileInput} className="visually-hidden" type="file"
                    accept=".txt,.md,.log,.json,.csv,text/plain,text/markdown,application/json,text/csv"
                    onChange={importContextFile} />
                  <button className="secondary-button" onClick={() => contextFileInput.current?.click()}>
                    <FolderOpen size={15} /> Import file
                  </button>
                  <button className="primary-button" onClick={extractTasks} disabled={extracting || !context.trim()}>
                    {extracting ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}
                    {extracting ? "Extracting…" : tasks.length ? "Extract again" : "Extract tasks"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="workspace-grid">
          <section className="task-panel panel">
            <div className="panel-heading">
              <div><span className="panel-kicker">Triage</span><h2>Action queue</h2></div>
              <span className="count-badge">{tasks.length}</span>
            </div>
            <div className="task-list">
              {!tasks.length && !extracting && (
                <div className="empty-state">
                  <div className="empty-icon"><Search size={20} /></div>
                  <strong>No tasks yet</strong>
                  <p>Open the context panel and extract actionable work.</p>
                  <button className="text-button" onClick={() => setContextOpen(true)}>Add context <ArrowRight size={14} /></button>
                </div>
              )}
              {extracting && !tasks.length && (
                <div className="loading-list">{[0, 1, 2].map((item) => <div className="skeleton-card" key={item} />)}</div>
              )}
              {tasks.slice().sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority]).map((task, index) => (
                <button key={task.id}
                  className={"task-card " + (task.id === selectedId ? "selected " : "") + (task.status === "done" ? "completed" : "")}
                  onClick={() => setSelectedId(task.id)} style={{ animationDelay: (index * 45) + "ms" }}>
                  <div className="task-card-top">
                    <span className={"priority-dot " + task.priority} />
                    <span className="task-file">{shortPath(task.file)}</span>
                    {task.status === "done" && <CheckCircle2 size={15} />}
                  </div>
                  <strong>{task.title}</strong>
                  <div className="task-card-meta">
                    <span><UserRound size={13} /> {task.assignee}</span>
                    <span className={"priority-label " + task.priority}>{task.priority}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="review-panel panel">
            {!selectedTask ? (
              <div className="review-empty">
                <div className="orb"><Bug size={26} /></div>
                <span className="panel-kicker">Bug detective</span>
                <h2>Select a task to begin</h2>
                <p>The suspected file, patch review, and regression tests will appear here.</p>
              </div>
            ) : (
              <>
                <div className="review-header">
                  <div className="file-identity">
                    <div className="file-icon"><FileCode2 size={18} /></div>
                    <div><span className="panel-kicker">Bug detective</span><h2>{selectedTask.file}</h2></div>
                  </div>
                  <select className="status-select" value={selectedTask.status}
                    onChange={(event) => updateTask(selectedTask.id, { status: event.target.value as TaskStatus })}
                    aria-label="Task status">
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div className="task-summary">
                  <div><h3>{selectedTask.title}</h3><p>{selectedTask.description}</p></div>
                  <div className="inline-fields">
                    <label><span>Owner</span><input value={selectedTask.assignee}
                      onChange={(event) => updateTask(selectedTask.id, { assignee: event.target.value })} /></label>
                    <label><span>Priority</span><select value={selectedTask.priority}
                      onChange={(event) => updateTask(selectedTask.id, { priority: event.target.value as Priority })}>
                      <option value="low">Low</option><option value="medium">Medium</option>
                      <option value="high">High</option><option value="critical">Critical</option>
                    </select></label>
                  </div>
                </div>

                {!isAnalyzed ? (
                  <div className="analysis-gate">
                    <div className="analysis-glyph"><Sparkles size={24} /></div>
                    <h3>Ready to inspect this issue</h3>
                    <p>PatchTrail will use the task context to produce a local, deterministic patch preview and test outline.</p>
                    <button className="primary-button" onClick={analyzeTask} disabled={analyzing}>
                      {analyzing ? <LoaderCircle className="spin" size={16} /> : <Play size={16} />}
                      {analyzing ? "Analyzing…" : "Analyze bug"}
                    </button>
                  </div>
                ) : (
                  <div className="analysis-results">
                    <div className="finding-banner">
                      <div className="finding-icon"><Bug size={17} /></div>
                      <div><span>Likely root cause · High confidence</span>
                        <p>The success path assumes every response has a JSON body. Empty responses reach the parser and throw before UI state can settle.</p>
                      </div>
                    </div>

                    <div className="segmented-control" role="tablist">
                      <button className={reviewTab === "patch" ? "active" : ""} onClick={() => setReviewTab("patch")} role="tab">
                        <FileCode2 size={15} /> Review patch
                      </button>
                      <button className={reviewTab === "tests" ? "active" : ""} onClick={() => setReviewTab("tests")} role="tab">
                        <TestTube2 size={15} /> Regression tests
                      </button>
                    </div>

                    {reviewTab === "patch" ? (
                      <div className="diff-card">
                        <div className="code-toolbar"><span>{selectedTask.file}</span><span>Suggested change</span></div>
                        <div className="diff-lines" aria-label="Suggested code diff">
                          <div className="context-line"><span>18</span><code>const response = await request(input);</code></div>
                          <div className="removed-line"><span>19</span><code>- return response.json();</code></div>
                          <div className="added-line"><span>19</span><code>+ if (response.status === 204) return null;</code></div>
                          <div className="added-line"><span>20</span><code>+ return await response.json();</code></div>
                          <div className="context-line"><span>21</span><code>{"}"}</code></div>
                        </div>
                        <div className="patch-actions">
                          <span><ShieldCheck size={14} /> Review required · no files changed yet</span>
                          <button className="approve-button" onClick={approveFix} disabled={selectedTask.status === "done"}>
                            {selectedTask.status === "done" ? <Check size={16} /> : <Sparkles size={16} />}
                            {selectedTask.status === "done" ? "Patch approved" : "Approve fix"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="tests-card">
                        <div className="test-item">
                          <div><CheckCircle2 size={16} /><span>handles an empty success response without throwing</span></div>
                          <button className="icon-button" onClick={() => copyText("regression test",
                            "it('handles an empty success response without throwing', async () => {\n  mockResponse(204);\n  await expect(runRequest()).resolves.toBeNull();\n});", "ai")}>
                            {copied === "regression test" ? <Check size={15} /> : <Copy size={15} />}
                          </button>
                        </div>
                        <div className="test-item">
                          <div><CheckCircle2 size={16} /><span>still parses a successful JSON response</span></div>
                          <button className="icon-button" onClick={() => copyText("success-path test",
                            "it('parses a successful JSON response', async () => {\n  mockJsonResponse({ ok: true });\n  await expect(runRequest()).resolves.toEqual({ ok: true });\n});", "ai")}>
                            {copied === "success-path test" ? <Check size={15} /> : <Copy size={15} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      <button className={"ledger-pill " + (activityOpen ? "open" : "")} onClick={() => setActivityOpen((openState) => !openState)}>
        <PanelBottom size={15} /><span>Activity</span><span className="ledger-count">{activity.length}</span>
        <span className={"event-dot " + (activity[0]?.type || "info")} />
      </button>

      {activityOpen && (
        <aside className="ledger-panel" aria-label="Workspace activity">
          <div className="drawer-heading">
            <div><span className="panel-kicker">Workspace</span><h2>Activity ledger</h2></div>
            <button className="icon-button" onClick={() => setActivityOpen(false)} aria-label="Close activity"><X size={17} /></button>
          </div>
          <div className="ledger-list">{activity.map((event) => (
            <div className="ledger-event" key={event.id}>
              <span className={"event-dot " + event.type} />
              <div><strong>{event.message}</strong><span>{formatTime(event.timestamp)}</span></div>
            </div>
          ))}</div>
        </aside>
      )}

      {gitOpen && (
        <div className="drawer-backdrop" onMouseDown={() => setGitOpen(false)}>
          <aside className="git-drawer" onMouseDown={(event) => event.stopPropagation()} aria-label="Git history">
            <div className="drawer-heading">
              <div><span className="panel-kicker">Codebase time machine</span><h2>Git history</h2></div>
              <button className="icon-button" onClick={() => setGitOpen(false)} aria-label="Close Git history"><X size={17} /></button>
            </div>
            <button className="repository-card" onClick={chooseRepository}>
              <div className="repo-icon"><GitBranch size={17} /></div>
              <div><span>Repository</span><strong>{repoPath ? shortPath(repoPath) : "Demo workspace"}</strong></div>
              <ChevronDown size={16} />
            </button>
            {gitError && <div className="inline-notice"><AlertTriangle size={15} /><span>{gitError}</span></div>}

            <div className="git-content">
              <div className="timeline-column">
                <div className="subheading"><span>Recent commits</span>{gitLoading && <LoaderCircle className="spin" size={14} />}</div>
                <div className="timeline">{commits.map((commit) => (
                  <button key={commit.hash} className={"commit-item " + (commit.hash === selectedCommit.hash ? "selected" : "")}
                    onClick={() => void selectCommit(commit)}>
                    <span className="commit-node" /><strong>{commit.subject}</strong>
                    <span>{commit.shortHash} · {formatCommitDate(commit.timestamp)}</span>
                  </button>
                ))}</div>
              </div>

              <div className="commit-detail">
                <div className="commit-meta">
                  <span className="hash-chip">{selectedCommit.shortHash}</span>
                  <h3>{selectedCommit.subject}</h3>
                  <p><UserRound size={13} /> {selectedCommit.author} <Clock3 size={13} /> {formatCommitDate(selectedCommit.timestamp)}</p>
                </div>
                <div className="changed-files">
                  <span className="subheading">Changed files</span>
                  {commitFiles.slice(0, 5).map((file) => <div key={file}><FileCode2 size={14} /> {file}</div>)}
                  {!commitFiles.length && <div>No changed files reported</div>}
                </div>
                <div className="terminal-helper">
                  <div className="terminal-title"><Terminal size={15} /><span>Recovery commands</span></div>
                  <p>Commands are copied only. PatchTrail never runs recovery actions for you.</p>
                  {commands.map((item) => (
                    <div className={"command-row " + item.tone} key={item.id}>
                      <div className="command-label"><strong>{item.title}</strong><span>{item.note}</span></div>
                      <code>{item.command}</code>
                      <button className="icon-button"
                        onClick={() => copyText(item.id, item.command, item.tone === "danger" ? "warn" : "info")}
                        aria-label={"Copy " + item.title}>
                        {copied === item.id ? <Check size={15} /> : <Copy size={15} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
