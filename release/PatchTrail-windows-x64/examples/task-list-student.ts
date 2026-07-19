export interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export function toggleTodo(todos: Todo[], id: string): Todo[] {
  const todo = todos.find((item) => item.id === id);

  // BUG: a stale button can refer to an item that no longer exists.
  todo!.completed = !todo!.completed;
  return todos;
}

