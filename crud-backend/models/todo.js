const mongoose = require("mongoose");

const TodoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    completed: {type: Boolean, default:false},
    deadline: { type: Date, default: null,null:true } ,
    time: { type: Date, default: Date.now } ,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const Todo = mongoose.model("Todo", TodoSchema);
module.exports = Todo;
