const Todolist = require("../models/Todolist");

exports.getTodolists = async (req, res) => {
  try {
    const todolists = await Todolist.find({ userId: req.user._id }).sort({ _id: -1 });
    res.json({ todolists });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch todolists" });
  }
};

exports.createTodolist = async (req, res) => {
  try {
    const newList = new Todolist({ title: req.body.title, userId: req.user._id });
    await newList.save();
    res.json({ message: "Todolist Created", todolist: newList });
  } catch {
    res.status(500).json({ error: "Failed to create todolist" });
  }
};

exports.updateTodolist = async (req, res) => {
  try {
    const todolist = await Todolist.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: "Todolist Name Updated", todolist });
  } catch {
    res.status(500).json({ error: "Failed to update todolist" });
  }
};

exports.deleteTodolist = async (req, res) => {
  try {
    await Todolist.findByIdAndDelete(req.params.id);
    res.json({ message: "Todolist deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete todolist" });
  }
};
