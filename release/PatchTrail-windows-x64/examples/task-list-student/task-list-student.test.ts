import { describe, expect, it } from "vitest";
import { toggleTodo, type Todo } from "./task-list-student";

const todos: Todo[] = [{ id: "todo-1", title: "Read the brief", completed: false }];

describe("todo toggle regression coverage", () => {
  it("toggles a known todo", () => {
    expect(toggleTodo(todos, "todo-1")[0].completed).toBe(true);
  });

  it("leaves the list unchanged when the todo was removed", () => {
    expect(toggleTodo(todos, "missing-id")).toEqual(todos);
  });
});

