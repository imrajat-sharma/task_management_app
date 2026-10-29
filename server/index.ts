import express, { type Request, type Response } from "express";
import { randomUUID } from "node:crypto";

type Status = "todo" | "in-progress" | "done";
type Priority = "Low" | "Medium" | "High";

type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  category: string;
};

const app = express();
const port = Number(process.env.PORT) || 3001;
const tasks = new Map<string, Task>();
const statuses = new Set<Status>(["todo", "in-progress", "done"]);
const priorities = new Set<Priority>(["Low", "Medium", "High"]);

app.use(express.json());

function taskFrom(body: unknown, id = randomUUID()): Task | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Partial<Task>;
  if (
    typeof value.title !== "string" ||
    !value.title.trim() ||
    typeof value.description !== "string" ||
    typeof value.dueDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value.dueDate) ||
    !priorities.has(value.priority as Priority) ||
    !statuses.has(value.status as Status) ||
    typeof value.category !== "string" ||
    !value.category.trim()
  ) {
    return null;
  }

  return {
    id,
    title: value.title.trim(),
    description: value.description.trim(),
    dueDate: value.dueDate,
    priority: value.priority as Priority,
    status: value.status as Status,
    category: value.category.trim(),
  };
}

app.get("/api/tasks", (_request: Request, response: Response) => {
  response.json([...tasks.values()]);
});

app.post("/api/tasks", (request: Request, response: Response) => {
  const task = taskFrom(request.body);
  if (!task) {
    response.status(400).json({ error: "Provide valid task fields." });
    return;
  }
  tasks.set(task.id, task);
  response.status(201).json(task);
});

app.put("/api/tasks/:id", (request: Request, response: Response) => {
  const current = tasks.get(request.params.id);
  if (!current) {
    response.status(404).json({ error: "Task not found." });
    return;
  }
  const task = taskFrom({ ...current, ...request.body }, current.id);
  if (!task) {
    response.status(400).json({ error: "Provide valid task fields." });
    return;
  }
  tasks.set(task.id, task);
  response.json(task);
});

app.delete("/api/tasks/:id", (request: Request, response: Response) => {
  if (!tasks.delete(request.params.id)) {
    response.status(404).json({ error: "Task not found." });
    return;
  }
  response.status(204).end();
});

app.listen(port, () => {
  console.log(`Task API listening at http://localhost:${port}`);
});
