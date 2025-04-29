// ✅ UPDATED useTodos.js with fixed local + logged-in todolist tracking
import { useEffect, useState } from "react";
import api from "./api";

const isUserLoggedIn = () => localStorage.getItem("token") !== null;

const useTodos = () => {
  const [todolist, settodolist] = useState([]);
  const [filteredTodos, setFilteredTodos] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [deadlineToggle, setdeadlineToggle] = useState(false);
  const [deadline, setdeadline] = useState(null);
  const [msg, setMsg] = useState("");
  const [updateId, setUpdateId] = useState(null);

  const resetForm = () => {
    setInput("");
    setdeadline(null);
    setdeadlineToggle(false);
    setUpdateId(null);
  };

  const [toggleMenu, settoggleMenu] = useState(true);
  const [todolists, settodolists] = useState(JSON.parse(localStorage.getItem("todolists")) || []);
  const [currentTodolist, setcurrentTodolist] = useState(todolists.length ? todolists[0] : null);

  useEffect(() => {
    settoggleTodolistRename(todolists.map(() => false));
    localStorage.setItem("todolists", JSON.stringify(todolists));
  }, [todolists]);

  useEffect(() => {
    if (!currentTodolist || !todolists.find(t => t._id === currentTodolist._id)) {
      setcurrentTodolist(todolists[0] || null);
    }
    
  }, [todolists]);


  useEffect(() => {
    if (!isUserLoggedIn()) {
      const existing = JSON.parse(localStorage.getItem("todos")) || [];
  
      // keep todos not in this list's current state (from other todolists)
      const otherTodos = existing.filter(todo =>
        !todolist.some(t => t._id === todo._id)
      );
  
      const merged = [...otherTodos, ...todolist];
      localStorage.setItem("todos", JSON.stringify(merged));
    }
  }, [todolist]);
  

  useEffect(() => {
    if (!currentTodolist || !Array.isArray(todolist)) return;
  
    setFilteredTodos(
      todolist.filter((todo) => todo.todolistId === currentTodolist._id)
    );
  }, [todolist, currentTodolist]);
  
  


  useEffect(() => {
    if (updateId) setUpdateId(null);
    if (search) setInput("");
    const delay = setTimeout(() => {
      if (search.trim()) {
        setFilteredTodos(prev =>
          prev.filter(todo => todo.title.toLowerCase().includes(search.toLowerCase()))
        );
      } else {
        setFilteredTodos(todolist.filter(t => t.todolist === currentTodolist?._id));
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  useEffect(() => {
    if (!msg) return;
    const timeout = setTimeout(() => setMsg(""), 5000);
    return () => clearTimeout(timeout);
  }, [msg]);

  
  // useEffect(() => {
  //   getTodos();
  // }, []);
  // const getTodos = () => {
  //   setLoading(true);
  //   if (isUserLoggedIn()) {
  //     api
  //       .get("/todos/")
  //       .then((res) => settodolist(res.data.todos))
  //       .catch(() => setMsg("Error fetching Todos"))
  //       .finally(() => setLoading(false));
  //   } else {
  //     const localTodos = JSON.parse(localStorage.getItem("todos")) || [];
  //     settodolist(localTodos);
  //     setLoading(false);
  //   }
  // };

  const saveLocalTodos = (todos) => {
    localStorage.setItem("todos", JSON.stringify(todos));
    settodolist(todos);
  };

  const addTodo = (e) => {
    e.preventDefault();
    setLoading(true);

    if (!currentTodolist) {
      const defaultList = { _id: Date.now(), title: "Todolist1" };
      settodolists([defaultList]);
      setcurrentTodolist(defaultList);
    }

    const targetTodolist = currentTodolist || { _id: Date.now(), title: "Todolist1" };

    if (isUserLoggedIn()) {
      api
        .post("/todos/create", { title: input, deadline, todolistId: targetTodolist._id })
        .then((res) => {
          setMsg(res.data.message);
          fetchTodos(currentTodolist._id)
        })
        .catch((e) =>{ 
          console.error(e)
          setMsg("Failed to add todo")})
        .finally(() => {
          setLoading(false);
          resetForm();
        });
    } else {
      const newTodo = {
        todolist: targetTodolist._id,
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

  const formatDateTimeLocal = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

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

  const handleEdit = (e) => {
    e.preventDefault();
    setLoading(true);

    if (isUserLoggedIn()) {
      api
        .patch(`/todos/update/${updateId}`, { title: input, deadline })
        .then((res) => {
          setMsg(res.data.message);
          const updatedTodos = todolist.map((todo) =>
            todo._id === updateId ? { ...todo, title: input, deadline } : todo
          );
          saveLocalTodos(updatedTodos);
        })
        .catch(() => setMsg("Failed to update todo"))
        .finally(() => {
          setLoading(false);
          resetForm();
          setUpdateId(null);

        });
    } else {
      const updatedTodos = todolist.map((todo) =>
        todo._id === updateId ? { ...todo, title: input, deadline } : todo
      );
      saveLocalTodos(updatedTodos);
      setMsg("Todo updated locally");
      setLoading(false);
      resetForm();
    }
  };

  const deleteTodo = (id) => {
    setLoading(true);
    if (isUserLoggedIn()) {
      api
        .delete(`/todos/delete/${id}`)
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

  const deleteAllTodos = () => {
    if (isUserLoggedIn()) {
      api
        .delete("/todos/delete-all")
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

  const toggleCompletion = (id, isCompleted) => {
    setMsg("Updating Todo Progress...");
    if (isUserLoggedIn()) {
      api
        .patch(`/todos/toggle/${id}`, { isCompleted })
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

  const copyAllTodos = () => {
    if (!filteredTodos.length) {
      alert("No todos to copy!");
      return;
    }

    const indexWidth = 5, statusWidth = 10, titleWidth = 30;
    const header = "No.  | Status     | Title\n" + "-".repeat(indexWidth + statusWidth + titleWidth);
    const toCopy = filteredTodos
      .map((todo, index) =>
        `${(index + 1).toString().padEnd(indexWidth)}| ` +
        `${(todo.completed ? "✅ Done" : "⏳ Pending").padEnd(statusWidth)}| ` +
        `${todo.title.padEnd(titleWidth)}`
      ).join("\n");

    navigator.clipboard.writeText(`${header}\n${toCopy}`)
      .then(() => setMsg("Todos copied to clipboard!"))
      .catch(err => alert("Failed to copy: " + err));
  };

  const [toggleCreateNewTodolist, settoggleCreateNewTodolist] = useState(true);
  const [toggleTodolistRename, settoggleTodolistRename] = useState(todolists.map(() => false));
  const [todolistTitle, settodolistTitle] = useState("");

  const fetchTodolists = async () => {
    setLoading(true);
    try {
      if (isUserLoggedIn()) {
        const res = await api.get("/todolists");
        const list = res.data.todolists || [];
        settodolists(list);
        setcurrentTodolist(list[0] || null);
        settoggleTodolistRename(list.map(() => false));
  
        if (list.length > 0) {
          await fetchTodos(list[0]._id);  // ✅ Fetch todos right here
        }
      } else {
        const local = JSON.parse(localStorage.getItem("todolists")) || [];
        settodolists(local);
        setcurrentTodolist(local[0] || null);
        settoggleTodolistRename(local.map(() => false));
  
        if (local.length > 0) {
          await fetchTodos(local[0]._id);  // ✅ Same here
        }
      }
    } catch (e) {
      setMsg("Error fetching todolists");
    } finally {
      setLoading(false);
    }
  };

  const fetchTodos = async (todolistId) => {
    setLoading(true);
    try {
      if (isUserLoggedIn()) {
        const res = await api.get("/todos", { params: { todolistId } });
        settodolist(res.data.todos); // ✅ fine, as backend filters
        console.log(res.data.todos)
        setMsg("Todos Fetched")
      } else {
        const allLocalTodos = JSON.parse(localStorage.getItem("todos")) || [];
        settodolist(allLocalTodos); // ✅ keep all todos, we will filter in display
      }

    } catch (e) {
      setMsg("Error fetching todos");
    } finally {
      setLoading(false);
    }
  };

  // On mount, load todolists
  useEffect(() => {
    fetchTodolists();
  }, []);

  // When current todolist changes
  useEffect(() => {
    if (currentTodolist?._id) {
      fetchTodos(currentTodolist._id);
    }
  }, [currentTodolist]);

  // Rename Todolist
  const renameTodolist = async (e, id) => {
    e.preventDefault();
    if (isUserLoggedIn()) {
      try {
        const res = await api.patch(`/todolists/update/${id}`, { title: todolistTitle });
        settodolists(prev => prev.map(t => t._id === id ? res.data.todolist : t));
      } catch (e) {
        setMsg("Rename failed");
      }
    } else {
      settodolists(prev => prev.map(t => t._id === id ? { ...t, title: todolistTitle } : t));
    }
    settoggleTodolistRename(prev => prev.map((_, i) => false));
    settodolistTitle("");
  };

  // Delete Todolist
  const deleteTodolist = async (id) => {
    if (isUserLoggedIn()) {
      try {
        await api.delete(`/todolists/${id}`);
        settodolists(prev => prev.filter(t => t._id !== id));
      } catch {
        setMsg("Failed to delete todolist");
      }
    } else {
      settodolists(prev => prev.filter(t => t._id !== id));
      settodolist(prev => prev.filter(todo => todo.todolist !== id));
    }
  };

  // Create Todolist
  const createTodolist = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isUserLoggedIn()) {
        const res = await api.post("/todolists/create", { title: todolistTitle });
        settodolists(prev => [res.data.todolist, ...prev]);
        setcurrentTodolist(res.data.todolist);
        setMsg(res.data.message);
      } else {
        const newList = { _id: Date.now(), title: todolistTitle };
        settodolists(prev => [newList, ...prev]);
        setcurrentTodolist(newList);
        localStorage.setItem("todolists", JSON.stringify([newList, ...todolists]));
        setMsg("Created Todolist");

      }
    } catch {
      setMsg("Failed to create todolist");
    } finally {
      settodolistTitle("");
      settoggleCreateNewTodolist(false);
      setLoading(false);
    }
  };


  return {
    isUserLoggedIn,
    todolist,
    filteredTodos,
    search, setSearch,
    loading, setLoading,
    input, setInput,
    deadlineToggle, setdeadlineToggle,
    deadline, setdeadline,
    updateId, setUpdateId,
    addTodo, handleEdit, editTodo,
    deleteTodo, deleteAllTodos, toggleCompletion,
    copyAllTodos,
    resetForm,
    msg, setMsg,
    toggleMenu, settoggleMenu,
    todolists, settodolists,
    toggleCreateNewTodolist, settoggleCreateNewTodolist,
    todolistTitle, settodolistTitle,
    renameTodolist, deleteTodolist, createTodolist,
    toggleTodolistRename, settoggleTodolistRename,
    currentTodolist, setcurrentTodolist
  };
};

export default useTodos;
