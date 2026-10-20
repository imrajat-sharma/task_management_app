import {
  ArrowDownWideNarrow,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ClipboardList,
  Clock3,
  FolderKanban,
  ListFilter,
  LogOut,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import "./App.css";

type Status = "todo" | "in-progress" | "done";
type Priority = "Low" | "Medium" | "High";
type View = "Today" | "Upcoming" | "All tasks" | "Completed";

type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  category: string;
};

type User = { name: string; email: string };

const today = () => new Date().toISOString().slice(0, 10);
const dateOffset = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const sessionKey = "taskflow:session";
const tasksKey = (email: string) => `taskflow:tasks:${email.toLowerCase()}`;

const starterTasks = (): Task[] => [
  {
    id: crypto.randomUUID(),
    title: "Plan the week ahead",
    description: "Pick the three outcomes that matter most this week.",
    dueDate: today(),
    priority: "High",
    status: "in-progress",
    category: "Personal",
  },
  {
    id: crypto.randomUUID(),
    title: "Share first design concepts",
    description: "Gather feedback from the team on the new direction.",
    dueDate: today(),
    priority: "Medium",
    status: "todo",
    category: "Work",
  },
  {
    id: crypto.randomUUID(),
    title: "Tidy up project notes",
    description: "Move loose notes into the shared project space.",
    dueDate: dateOffset(1),
    priority: "Low",
    status: "todo",
    category: "Work",
  },
  {
    id: crypto.randomUUID(),
    title: "Book a catch-up with Maya",
    description: "Find a time to review the launch checklist.",
    dueDate: dateOffset(3),
    priority: "Medium",
    status: "done",
    category: "Personal",
  },
];

function loadTasks(email: string): Task[] {
  try {
    const saved = localStorage.getItem(tasksKey(email));
    return saved ? (JSON.parse(saved) as Task[]) : starterTasks();
  } catch {
    return starterTasks();
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (value === today()) return "Today";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(sessionKey);
      return saved ? (JSON.parse(saved) as User) : null;
    } catch {
      return null;
    }
  });
  const [tasks, setTasks] = useState<Task[]>(() =>
    user ? loadTasks(user.email) : [],
  );
  const [view, setView] = useState<View>("Today");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All status");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [displayDates] = useState(() => {
    const date = new Date();
    return {
      topbar: new Intl.DateTimeFormat("en", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(date),
      heading: new Intl.DateTimeFormat("en", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
        .format(date)
        .toUpperCase(),
    };
  });

  useEffect(() => {
    if (user) localStorage.setItem(tasksKey(user.email), JSON.stringify(tasks));
  }, [tasks, user]);

  const visibleTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tasks
      .filter((task) => {
        if (
          view === "Today" &&
          (task.dueDate !== today() || task.status === "done")
        )
          return false;
        if (
          view === "Upcoming" &&
          (task.dueDate <= today() || task.status === "done")
        )
          return false;
        if (view === "Completed" && task.status !== "done") return false;
        if (statusFilter !== "All status" && task.status !== statusFilter)
          return false;
        return (
          !normalizedQuery ||
          `${task.title} ${task.description} ${task.category}`
            .toLowerCase()
            .includes(normalizedQuery)
        );
      })
      .sort((first, second) => first.dueDate.localeCompare(second.dueDate));
  }, [query, statusFilter, tasks, view]);

  const completeCount = tasks.filter((task) => task.status === "done").length;
  const activeCount = tasks.filter((task) => task.status !== "done").length;
  const todayCount = tasks.filter(
    (task) => task.dueDate === today() && task.status !== "done",
  ).length;
  const progress = tasks.length
    ? Math.round((completeCount / tasks.length) * 100)
    : 0;

  function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email")).trim().toLowerCase();
    const name = String(formData.get("name")).trim() || email.split("@")[0];
    if (!email) return;
    const nextUser = { name, email };
    const nextTasks = loadTasks(email);
    localStorage.setItem(sessionKey, JSON.stringify(nextUser));
    localStorage.setItem(tasksKey(email), JSON.stringify(nextTasks));
    setUser(nextUser);
    setTasks(nextTasks);
    setView("Today");
  }

  function signOut() {
    localStorage.removeItem(sessionKey);
    setUser(null);
    setTasks([]);
    setMenuOpen(false);
  }

  function saveTask(task: Task) {
    setTasks((current) => {
      const exists = current.some((item) => item.id === task.id);
      return exists
        ? current.map((item) => (item.id === task.id ? task : item))
        : [task, ...current];
    });
    setEditingTask(null);
    setIsCreating(false);
  }

  function removeTask(taskId: string) {
    setTasks((current) => current.filter((task) => task.id !== taskId));
  }

  if (!user) {
    return <SignIn onSubmit={signIn} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="Daymark home">
          <span className="brand-mark">
            <CheckCheck size={19} strokeWidth={2.4} />
          </span>
          <span>
            daymark<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Task views">
          <button
            className={`nav-item ${view === "Today" ? "selected" : ""}`}
            onClick={() => setView("Today")}
          >
            <Target size={18} />
            <span>Today</span>
            <span className="nav-count">{todayCount}</span>
          </button>
          <button
            className={`nav-item ${view === "Upcoming" ? "selected" : ""}`}
            onClick={() => setView("Upcoming")}
          >
            <CalendarDays size={18} />
            <span>Upcoming</span>
          </button>
          <button
            className={`nav-item ${view === "All tasks" ? "selected" : ""}`}
            onClick={() => setView("All tasks")}
          >
            <ClipboardList size={18} />
            <span>All tasks</span>
            <span className="nav-count">{activeCount}</span>
          </button>
          <button
            className={`nav-item ${view === "Completed" ? "selected" : ""}`}
            onClick={() => setView("Completed")}
          >
            <Check size={18} />
            <span>Completed</span>
            <span className="nav-count">{completeCount}</span>
          </button>
        </nav>
        <div className="sidebar-divider" />
        <div className="workspace-label projects-label">YOUR FOCUS</div>
        <button className="project-item">
          <span className="project-dot coral" />
          Work
          <span className="project-count">
            {
              tasks.filter(
                (task) => task.category === "Work" && task.status !== "done",
              ).length
            }
          </span>
        </button>
        <button className="project-item">
          <span className="project-dot mint" />
          Personal
          <span className="project-count">
            {
              tasks.filter(
                (task) =>
                  task.category === "Personal" && task.status !== "done",
              ).length
            }
          </span>
        </button>
        <div className="sidebar-bottom">
          <div className="weekly-card">
            <div className="weekly-title">
              <span>Weekly rhythm</span>
              <Sparkles size={16} />
            </div>
            <div className="weekly-track">
              <span style={{ width: `${progress}%` }} />
            </div>
            <p>
              {completeCount} of {tasks.length} tasks wrapped up
            </p>
          </div>
          <div className="user-row">
            <span className="avatar">{initials(user.name)}</span>
            <span className="user-info">
              <strong>{user.name}</strong>
              <small>Personal workspace</small>
            </span>
            <button
              className="icon-button user-menu-button"
              aria-label="Account menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreHorizontal size={19} />
            </button>
            {menuOpen && (
              <div className="user-menu">
                <span className="menu-email">{user.email}</span>
                <button onClick={signOut}>
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="crumb-slash">/</span>
            <strong>{view}</strong>
          </div>
          <div className="topbar-actions">
            <span className="date-stamp">
              <CalendarDays size={15} />
              {displayDates.topbar}
            </span>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <i />
            </button>
            <span className="avatar top-avatar">{initials(user.name)}</span>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">{displayDates.heading}</p>
              <h1>
                {view === "Today"
                  ? `A good day, ${user.name.split(" ")[0]}.`
                  : view}
              </h1>
              <p className="welcome-copy">
                A little progress adds up. Here’s what’s on your plate.
              </p>
            </div>
            <button
              className="primary-button"
              onClick={() => setIsCreating(true)}
            >
              <Plus size={18} />
              New task
            </button>
          </section>

          <section className="summary-grid" aria-label="Task summary">
            <article className="summary-card summary-lilac">
              <div className="summary-icon lilac-icon">
                <Target size={19} />
              </div>
              <span className="summary-label">On your list today</span>
              <div className="summary-number">
                {todayCount}
                <span> tasks</span>
              </div>
              <div className="summary-foot">
                <span className="tiny-dot lilac-dot" />A focused day starts here
              </div>
            </article>
            <article className="summary-card summary-peach">
              <div className="summary-icon peach-icon">
                <Clock3 size={19} />
              </div>
              <span className="summary-label">Still in motion</span>
              <div className="summary-number">
                {tasks.filter((task) => task.status === "in-progress").length}
                <span> tasks</span>
              </div>
              <div className="summary-foot">
                <span className="tiny-dot peach-dot" />
                Keep your momentum
              </div>
            </article>
            <article className="summary-card summary-green">
              <div className="summary-icon green-icon">
                <CheckCheck size={19} />
              </div>
              <span className="summary-label">Already done</span>
              <div className="summary-number">
                {completeCount}
                <span> tasks</span>
              </div>
              <div className="summary-foot">
                <span className="tiny-dot green-dot" />
                {progress}% of your list complete
              </div>
            </article>
          </section>

          <section className="task-section">
            <div className="section-heading">
              <div>
                <div className="section-title-line">
                  <h2>{view === "Today" ? "Today’s tasks" : view}</h2>
                  <span className="task-count">{visibleTasks.length}</span>
                </div>
                <p>
                  {view === "Today"
                    ? "Make room for what matters."
                    : "A clear view of everything in this list."}
                </p>
              </div>
              <button
                className="text-button"
                onClick={() => setView("All tasks")}
              >
                View all <ArrowUpRight size={15} />
              </button>
            </div>
            <div className="task-toolbar">
              <label className="search-field">
                <Search size={17} />
                <input
                  aria-label="Search tasks"
                  placeholder="Search your tasks"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {query && (
                  <button
                    aria-label="Clear search"
                    onClick={() => setQuery("")}
                  >
                    <X size={15} />
                  </button>
                )}
              </label>
              <div className="toolbar-right">
                <label className="filter-select">
                  <ListFilter size={16} />
                  <select
                    aria-label="Filter by status"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option>All status</option>
                    <option value="todo">To do</option>
                    <option value="in-progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                  <ChevronDown size={14} />
                </label>
                <button
                  className="icon-button sort-button"
                  aria-label="Sorted by due date"
                  title="Sorted by due date"
                >
                  <ArrowDownWideNarrow size={17} />
                </button>
              </div>
            </div>

            <div className="task-list">
              {visibleTasks.length ? (
                visibleTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onChangeStatus={(status) =>
                      setTasks((current) =>
                        current.map((item) =>
                          item.id === task.id ? { ...item, status } : item,
                        ),
                      )
                    }
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => removeTask(task.id)}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">
                    <FolderKanban size={22} />
                  </span>
                  <strong>
                    {query
                      ? "No tasks match that search"
                      : "Nothing on this list yet"}
                  </strong>
                  <span>
                    {query
                      ? "Try another word or clear the search."
                      : "Add a task and give your day some shape."}
                  </span>
                  {!query && (
                    <button
                      className="text-button"
                      onClick={() => setIsCreating(true)}
                    >
                      <Plus size={15} />
                      Add your first task
                    </button>
                  )}
                </div>
              )}
            </div>
            {visibleTasks.length > 0 && (
              <button
                className="add-task-row"
                onClick={() => setIsCreating(true)}
              >
                <Plus size={17} />
                Add a task
              </button>
            )}
          </section>
          <footer className="page-footer">
            <span>
              <span className="footer-sparkle">✳</span> Small steps, lovely
              things.
            </span>
            <span>Saved in this browser</span>
          </footer>
        </div>
      </main>
      {(isCreating || editingTask) && (
        <TaskDialog
          task={editingTask}
          onClose={() => {
            setIsCreating(false);
            setEditingTask(null);
          }}
          onSave={saveTask}
        />
      )}
    </div>
  );
}

function SignIn({
  onSubmit,
}: {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <main className="auth-page">
      <div className="auth-panel">
        <a className="brand auth-brand" href="#home">
          <span className="brand-mark">
            <CheckCheck size={19} strokeWidth={2.4} />
          </span>
          <span>
            daymark<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="auth-illustration">
          <div className="sun-shape" />
          <div className="auth-note note-one">
            <span className="note-check">
              <Check size={13} />
            </span>
            <span>Make space for the good stuff</span>
          </div>
          <div className="auth-note note-two">
            <span className="note-star">✳</span>
            <span>One thing at a time</span>
          </div>
          <div className="auth-orbit">
            <div className="orbit-center">
              <CheckCheck size={35} />
            </div>
            <span className="orbit-dot orbit-dot-one" />
            <span className="orbit-dot orbit-dot-two" />
          </div>
        </div>
        <div className="auth-copy">
          <p className="eyebrow">YOUR DAY, WITH A LITTLE MORE CLARITY</p>
          <h1>
            Make today
            <br />a good one.
          </h1>
          <p>Keep your plans close and your mind a little lighter.</p>
        </div>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Your name
            <input
              name="name"
              placeholder="What should we call you?"
              autoComplete="name"
            />
          </label>
          <label>
            Email address
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <button className="primary-button auth-submit" type="submit">
            Continue to your workspace <ArrowUpRight size={17} />
          </button>
        </form>
        <p className="local-notice">
          Demo sign-in only. Your tasks stay in this browser.
        </p>
      </div>
      <div className="auth-side">
        <div className="auth-side-copy">
          <span className="side-caption">A softer way to get things done</span>
          <h2>
            Clear your head.
            <br />
            Find your rhythm.
          </h2>
          <p>
            A thoughtful little space for all the things you want to make
            happen.
          </p>
        </div>
        <div className="side-sticker">
          <Sparkles size={21} />
          <span>
            MAKE IT
            <br />
            MATTER
          </span>
        </div>
        <span className="side-footer">
          A fresh start, whenever you need one.
        </span>
      </div>
    </main>
  );
}

function TaskRow({
  task,
  onChangeStatus,
  onEdit,
  onDelete,
}: {
  task: Task;
  onChangeStatus: (status: Status) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      className={`task-row ${task.status === "done" ? "task-done" : ""}`}
    >
      <button
        className={`check-task ${task.status === "done" ? "checked" : ""}`}
        aria-label={task.status === "done" ? "Mark as to do" : "Mark as done"}
        onClick={() => onChangeStatus(task.status === "done" ? "todo" : "done")}
      >
        {task.status === "done" && <Check size={14} />}
      </button>
      <div className="task-main">
        <button className="task-title" onClick={onEdit}>
          {task.title}
        </button>
        {task.description && (
          <span className="task-description">{task.description}</span>
        )}
        <div className="task-meta-mobile">
          <span className={`category-tag ${task.category.toLowerCase()}`}>
            {task.category}
          </span>
          <span
            className={`priority-tag priority-${task.priority.toLowerCase()}`}
          >
            {task.priority}
          </span>
        </div>
      </div>
      <span
        className={`category-tag task-category ${task.category.toLowerCase()}`}
      >
        {task.category}
      </span>
      <span
        className={`priority-tag task-priority priority-${task.priority.toLowerCase()}`}
      >
        <span />
        {task.priority}
      </span>
      <span
        className={`task-date ${task.dueDate < today() && task.status !== "done" ? "overdue" : ""}`}
      >
        <CalendarDays size={14} />
        {formatDate(task.dueDate)}
      </span>
      <div className="task-status">
        <select
          aria-label={`Status for ${task.title}`}
          value={task.status}
          onChange={(event) => onChangeStatus(event.target.value as Status)}
        >
          <option value="todo">To do</option>
          <option value="in-progress">In progress</option>
          <option value="done">Done</option>
        </select>
        <ChevronDown size={13} />
      </div>
      <div className="task-actions">
        <button
          className="icon-button"
          aria-label={`Edit ${task.title}`}
          title="Edit task"
          onClick={onEdit}
        >
          <MoreHorizontal size={18} />
        </button>
        <button
          className="icon-button delete-action"
          aria-label={`Delete ${task.title}`}
          title="Delete task"
          onClick={onDelete}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
}

function TaskDialog({
  task,
  onClose,
  onSave,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: (task: Task) => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? today());
  const [priority, setPriority] = useState<Priority>(
    task?.priority ?? "Medium",
  );
  const [status, setStatus] = useState<Status>(task?.status ?? "todo");
  const [category, setCategory] = useState(task?.category ?? "Work");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: task?.id ?? crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      dueDate,
      priority,
      status,
      category,
    });
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="task-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <header className="dialog-header">
          <div>
            <p className="eyebrow">A SMALL STEP FORWARD</p>
            <h2 id="dialog-title">{task ? "Edit task" : "Add a task"}</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </header>
        <form onSubmit={submit}>
          <label className="form-field">
            Task name
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What needs doing?"
              required
              maxLength={90}
            />
          </label>
          <label className="form-field">
            A few details <span className="optional-label">OPTIONAL</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add a note to your future self"
              rows={3}
              maxLength={220}
            />
          </label>
          <div className="form-grid">
            <label className="form-field">
              Due date
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                required
              />
            </label>
            <label className="form-field">
              Priority
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as Priority)
                }
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label className="form-field">
              List
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option>Work</option>
                <option>Personal</option>
              </select>
            </label>
            <label className="form-field">
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as Status)}
              >
                <option value="todo">To do</option>
                <option value="in-progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </label>
          </div>
          <div className="dialog-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="primary-button">
              <Plus size={17} />
              {task ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default App;
