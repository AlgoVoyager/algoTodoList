const mongoose = require("mongoose");

const TodoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  deadline: Date,
  time: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  todolistId: { type: mongoose.Schema.Types.ObjectId, ref: "Todolist", required: true }, // 👈 Link to todolist
});

const Todo = mongoose.model("Todo", TodoSchema);
module.exports = Todo;
