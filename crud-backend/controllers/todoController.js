const Todo = require("../models/todo");

exports.getTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user._id, todolistId: req.query.todolistId }).sort({ _id: -1 });
    res.json({ todos });
  } catch {
    res.status(500).json({ error: "Failed to fetch todos" });
  }
};

exports.createTodo = async (req, res) => {
  try {
    const todo = new Todo({ ...req.body, userId: req.user._id });
    await todo.save();
    res.json({ message: "Todo created", todo });
  } catch (e){
    console.log(e)
    res.status(500).json({ error: "Failed to create todo" });
  }
};

exports.updateTodo = async (req, res) => {
  try {
    const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: "Todo updated", todo });
  } catch {
    res.status(500).json({ error: "Failed to update todo" });
  }
};

exports.toggleCompletion = async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    todo.completed = !todo.completed;
    await todo.save();
    res.json({ message: "Todo completion toggled", todo });
  } catch {
    res.status(500).json({ error: "Failed to toggle completion" });
  }
};

exports.deleteTodo = async (req, res) => {
  try {
    await Todo.findByIdAndDelete(req.params.id);
    res.json({ message: "Todo deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete todo" });
  }
};

exports.deleteAllTodos = async (req, res) => {
  try {
    await Todo.deleteMany({ userId: req.user._id });
    res.json({ message: "All todos deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete all todos" });
  }
};
