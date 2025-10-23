import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface Todo {
    id: string;
    text: string;
    completed: boolean;
    created_at: string;
}

export default function TodoList() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [newTodo, setNewTodo] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTodos();
    }, []);

    const fetchTodos = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("todos")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setTodos(data || []);
        } catch (error) {
            console.error("Error fetching todos:", error);
        } finally {
            setLoading(false);
        }
    };

    const addTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim()) return;

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("todos")
                .insert([
                    {
                        text: newTodo.trim(),
                        user_id: user.id,
                        completed: false,
                    },
                ])
                .select();

            if (error) throw error;
            setTodos([data[0], ...todos]);
            setNewTodo("");
        } catch (error) {
            console.error("Error adding todo:", error);
        }
    };

    const toggleTodo = async (id: string, completed: boolean) => {
        try {
            const { error } = await supabase
                .from("todos")
                .update({ completed: !completed })
                .eq("id", id);

            if (error) throw error;
            setTodos(
                todos.map((todo) =>
                    todo.id === id ? { ...todo, completed: !completed } : todo
                )
            );
        } catch (error) {
            console.error("Error updating todo:", error);
        }
    };

    const deleteTodo = async (id: string) => {
        try {
            const { error } = await supabase
                .from("todos")
                .delete()
                .eq("id", id);

            if (error) throw error;
            setTodos(todos.filter((todo) => todo.id !== id));
        } catch (error) {
            console.error("Error deleting todo:", error);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    if (loading) {
        return <div className="loading">Loading todos...</div>;
    }

    return (
        <div className="todo-container">
            <div className="todo-header">
                <h1>My Todo List</h1>
                <button onClick={signOut} className="sign-out-btn">
                    Sign Out
                </button>
            </div>

            <form onSubmit={addTodo} className="add-todo-form">
                <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="Add a new todo..."
                    className="todo-input"
                />
                <button type="submit" className="add-btn">
                    Add Todo
                </button>
            </form>

            <div className="todos-list">
                {todos.length === 0 ? (
                    <p className="no-todos">No todos yet. Add one above!</p>
                ) : (
                    todos.map((todo) => (
                        <div
                            key={todo.id}
                            className={`todo-item ${
                                todo.completed ? "completed" : ""
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={todo.completed}
                                onChange={() =>
                                    toggleTodo(todo.id, todo.completed)
                                }
                                className="todo-checkbox"
                            />
                            <span className="todo-text">{todo.text}</span>
                            <button
                                onClick={() => deleteTodo(todo.id)}
                                className="delete-btn"
                            >
                                Delete
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
