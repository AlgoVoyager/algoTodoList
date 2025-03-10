import { useEffect, useState } from "react";
import api from "./api";

const isUserLoggedIn = () => localStorage.getItem("token") !== null;

const formatDateTimeLocal = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const localISOString = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 16);
  return localISOString;
};

const useTodos = () => {
  // Todos for current todolist
  const [todolist, settodolist] = useState([]);
  const [filteredTodos, setFilteredTodos] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [deadlineToggle, setdeadlineToggle] = useState(false);
  const [deadline, setdeadline] = useState(null);
  const [msg, setMsg] = useState("");
  const [updateId, setUpdateId] = useState(null);

  // Todolists management
  const [todolists, settodolists] = useState(() => {
    return JSON.parse(localStorage.getItem("todolists")) || [];
  });
  const [currentTodolist, setcurrentTodolist] = useState(() => {
    const lists = JSON.parse(localStorage.getItem("todolists")) || [];
    return lists.length ? lists[0] : null;
  });

  // Reset form inputs
  const resetForm = () => {
    setInput("");
    setdeadline(null);
    setdeadlineToggle(false);
    setUpdateId(null);
  };

  // Fetch todos when component mounts
  useEffect(() => {
    getTodos();
  }, []);

  // Save filtered todos (and update whenever todolist or currentTodolist changes)
  useEffect(() => {
    // If a current todolist exists, filter todos by it; otherwise, show all.
    if (currentTodolist) {
      setFilteredTodos(todolist.filter((tl) => tl.todolist === currentTodolist._id));
    } else {
      setFilteredTodos(todolist);
    }
    // Also store todos locally
    localStorage.setItem("todos", JSON.stringify(todolist));
  }, [todolist, currentTodolist]);

  // Debounce search filtering
  useEffect(() => {
    if (search) setInput("");
    const delay = setTimeout(() => {
      if (search.trim() !== "") {
        setFilteredTodos(
          todolist.filter((todo) =>
            todo.title.toLowerCase().includes(search.toLowerCase())
          )
        );
      } else if (currentTodolist) {
        setFilteredTodos(todolist.filter((tl) => tl.todolist === currentTodolist._id));
      } else {
        setFilteredTodos(todolist);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [search, todolist, currentTodolist]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (!msg) return;
    const timeout = setTimeout(() => setMsg(""), 5000);
    return () => clearTimeout(timeout);
  }, [msg]);

  // Get todos either from API (if logged in) or from localStorage (if guest)
  const getTodos = () => {
    setLoading(true);
    if (isUserLoggedIn()) {
      api
        .get("/todos")
        .then((res) => settodolist(res.data.todos))
        .catch(() => setMsg("Error fetching Todos"))
        .finally(() => setLoading(false));
    } else {
      const localTodos = JSON.parse(localStorage.getItem("todos")) || [];
      settodolist(localTodos);
      setLoading(false);
    }
  };

  // Helper to save todos to localStorage (for guest users)
  const saveLocalTodos = (todos) => {
    localStorage.setItem("todos", JSON.stringify(todos));
    settodolist(todos);
  };

  // Add a new todo
  const addTodo = (e) => {
    e.preventDefault();
    setLoading(true);
    if (isUserLoggedIn()) {
      const newTodo = {
        title: input,
        deadline,
      };
      api
        .post("/create-todo", newTodo)
        .then((res) => {
          setMsg(res.data.message);
          getTodos();
        })
        .catch(() => setMsg("Failed to add todo"))
        .finally(() => {
          setLoading(false);
          resetForm();
        });
    } else {
      // If no todolists exist or no currentTodolist is selected, create a default one.
      if (!todolists.length || !currentTodolist) {
        const defaultList = { _id: "1", title: "Todolist1" };
        settodolists([defaultList]);
        setcurrentTodolist(defaultList);
        localStorage.setItem("todolists", JSON.stringify([defaultList]));
      }
      const newTodo = {
        todolist: currentTodolist._id,
        _id: Date.now().toString(),
        title: input,
        completed: false,
        time: new Date(),
        deadline,
      };
      const updatedTodos = [...todolist, newTodo];
      saveLocalTodos(updatedTodos);
      setMsg("Todo added locally");
      setLoading(false);
      resetForm();
    }
  };

  // Set todo for editing
  const editTodo = (id) => {
    setUpdateId(id);
    const todoNow = todolist.find((item) => item._id === id);
    if (todoNow) {
      setInput(todoNow.title);
      if (todoNow.deadline) {
        setdeadlineToggle(true);
        setdeadline(formatDateTimeLocal(todoNow.deadline));
      } else {
        setdeadline(null);
        setdeadlineToggle(false);
      }
    }
  };

  // Handle update (edit) submission
  const handleEdit = (e) => {
    e.preventDefault();
    setLoading(true);
    if (isUserLoggedIn()) {
      const newTodo = {
        title: input,
        deadline,
      };
      api
        .patch(`/update-todo/${updateId}`, newTodo)
        .then((res) => {
          setMsg(res.data.message);
          settodolist((items) =>
            items.map((item) =>
              item._id === updateId ? { ...item, title: input, deadline } : item
            )
          );
        })
        .catch(() => setMsg("Failed to update todo"))
        .finally(() => {
          setLoading(false);
          resetForm();
        });
    } else {
      const updatedTodos = todolist.map((todo) =>
        todo._id === updateId ? { ...todo, title: input, deadline } : todo
      );
      localStorage.setItem("todos", JSON.stringify(updatedTodos));
      settodolist(updatedTodos);
      setMsg("Todo updated locally");
      setLoading(false);
      resetForm();
    }
  };

  // Delete a specific todo
  const deleteTodo = (id) => {
    setLoading(true);
    if (isUserLoggedIn()) {
      api
        .delete(`/delete-todo/${id}`)
        .then((res) => {
          setMsg(res.data.message);
          settodolist((items) => items.filter((item) => item._id !== id));
        })
        .catch(() => setMsg("Failed to delete todo"))
        .finally(() => setLoading(false));
    } else {
      const updatedTodos = todolist.filter((todo) => todo._id !== id);
      saveLocalTodos(updatedTodos);
      setMsg("Todo deleted locally");
      setLoading(false);
    }
  };

  // Delete all todos
  const deleteAllTodos = () => {
    if (isUserLoggedIn()) {
      api
        .delete("/delete-todos")
        .then((res) => {
          setMsg(res.data.message);
          settodolist([]);
        })
        .catch(() => setMsg("Failed to delete all todos"));
    } else {
      saveLocalTodos([]);
      setMsg("All todos deleted locally");
    }
  };

  // Toggle completion of a todo
  const toggleCompletion = (id, isCompleted) => {
    setMsg("Updating Todo Progress...");
    if (isUserLoggedIn()) {
      api
        .patch(`/update-todo-completion/${id}`, { isCompleted })
        .then((res) => {
          setMsg(res.data.message);
          settodolist((prev) =>
            prev.map((todo) =>
              todo._id === id ? { ...todo, completed: !todo.completed } : todo
            )
          );
        })
        .catch(() => setMsg("Failed to update todo Progress."));
    } else {
      const updatedTodos = todolist.map((todo) =>
        todo._id === id ? { ...todo, completed: !todo.completed } : todo
      );
      saveLocalTodos(updatedTodos);
      setMsg("Todo completion updated locally");
    }
  };

  // Copy all todos (formatted)
  const copyAllTodos = () => {
    if (!filteredTodos.length) {
      alert("No todos to copy!");
      return;
    }
    const indexWidth = 5;
    const statusWidth = 10;
    const titleWidth = 30;
    const header =
      "No.  | Status     | Title\n" +
      "-".repeat(indexWidth + statusWidth + titleWidth);
    const toCopy = filteredTodos
      .map((todo, index) =>
        `${(index + 1).toString().padEnd(indexWidth)}| ` +
        `${(todo.completed ? "✅ Done" : "⏳ Pending").padEnd(statusWidth)}| ` +
        `${todo.title.padEnd(titleWidth)}`
      )
      .join("\n");
    const formattedText = `${header}\n${toCopy}`;
    navigator.clipboard
      .writeText(formattedText)
      .then(() => setMsg("Todos copied to clipboard!"))
      .catch((err) => alert("Failed to copy: " + err));
  };

  // Todolists management

  // Update rename toggles and store todolists locally whenever todolists change
  useEffect(() => {
    settoggleTodolistRename(todolists.map(() => false));
    localStorage.setItem("todolists", JSON.stringify(todolists));
    console.log("Todolists:", todolists);
  }, [todolists]);

  // When currentTodolist changes, filter todos accordingly
  useEffect(() => {
    if (currentTodolist) {
      setFilteredTodos(todolist.filter((tl) => tl.todolist === currentTodolist._id));
    }
  }, [currentTodolist, todolist]);

  // On mount, load todolists from localStorage
  useEffect(() => {
    const storedLists = JSON.parse(localStorage.getItem("todolists")) || [];
    settodolists(storedLists);
  }, []);

  // Todolist rename and creation management
  const [toggleMenu, settoggleMenu] = useState(true);
  const [toggleCreateNewTodolist, settoggleCreateNewTodolist] = useState(true);
  const [toggleTodolistRename, settoggleTodolistRename] = useState(
    todolists.map(() => false)
  );
  const [todolistTitle, settodolistTitle] = useState("");

  const renameTodolist = (e, id) => {
    e.preventDefault();
    settodolists((prev) =>
      prev.map((tl) =>
        id === tl._id ? { ...tl, title: todolistTitle } : tl
      )
    );
    settoggleTodolistRename((prev) =>
      prev.map((t, index) =>
        todolists[index]._id === id ? false : t
      )
    );
    settodolistTitle("");
  };

  const deleteTodolist = (id) => {
    settodolists((prev) => prev.filter((item) => item._id !== id));
    // Also remove todos that belong to the deleted todolist
    settodolist((prev) => prev.filter((todo) => todo.todolist !== id));
  };

  useEffect(() => {
    console.log("Todos:", todolist);
    localStorage.setItem("todos", JSON.stringify(todolist));
    setcurrentTodolist(todolists[0] || null);
  }, [todolist, todolists]);

  const createTodolist = (e) => {
    e.preventDefault();
    setLoading(true);
    if (!isUserLoggedIn()) {
      const newTodolist = {
        _id: (todolists.length + 1).toString(),
        title: todolistTitle,
      };
      settodolists((prev) => [...prev, newTodolist]);
      settodolistTitle("");
      settoggleCreateNewTodolist(false);
    } else {
      api
        .post("/create-todolist", { title: todolistTitle })
        .then((res) => {
          settodolist((prev) => [...prev, res.data.todolist]);
          setMsg(res.data.message);
          console.log("Created todolist:", res.data);
        })
        .catch(() => setMsg("Failed to add todolist"))
        .finally(() => {
          resetForm();
        });
    }
    setLoading(false);
  };

  const getTodolists = () => {
    setLoading(true);
    if (isUserLoggedIn()) {
      api
        .get("/todolists")
        .then((res) => settodolists(res.data.todolists))
        .catch(() => setMsg("Error fetching todolists"))
        .finally(() => setLoading(false));
    } else {
      const localLists = JSON.parse(localStorage.getItem("todolists")) || [];
      settodolists(localLists);
      setLoading(false);
    }
  };

  return {
    isUserLoggedIn,
    todolist,
    filteredTodos,
    search,
    setSearch,
    loading,
    setLoading,
    input,
    setInput,
    deadlineToggle,
    setdeadlineToggle,
    deadline,
    setdeadline,
    updateId,
    setUpdateId,
    addTodo,
    handleEdit,
    editTodo,
    deleteTodo,
    deleteAllTodos,
    toggleCompletion,
    copyAllTodos,
    resetForm,
    msg,
    setMsg,
    toggleMenu,
    settoggleMenu,
    todolists,
    settodolist,
    toggleCreateNewTodolist,
    settoggleCreateNewTodolist,
    todolistTitle,
    settodolistTitle,
    renameTodolist,
    deleteTodolist,
    createTodolist,
    toggleTodolistRename,
    settoggleTodolistRename,
    currentTodolist,
    setcurrentTodolist,
  };
};

export default useTodos;
