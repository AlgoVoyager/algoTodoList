const express = require("express");
const router = express.Router();
const { getTodolists, createTodolist, updateTodolist, deleteTodolist } = require("../controllers/todolistController");

router.get("/", getTodolists);
router.post("/create", createTodolist);
router.patch("/update/:id", updateTodolist);
router.delete("/:id", deleteTodolist);

module.exports = router;
