const express = require("express");
const router = express.Router();
const {
  getTodos, createTodo, updateTodo,
  toggleCompletion, deleteTodo, deleteAllTodos
} = require("../controllers/todoController");

router.get("/", getTodos);
router.post("/create", createTodo);
router.patch("/update/:id", updateTodo);
router.patch("/toggle/:id", toggleCompletion);
router.delete("/delete/:id", deleteTodo);
router.delete("/delete-all", deleteAllTodos);

module.exports = router;