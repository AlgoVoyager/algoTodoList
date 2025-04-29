require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const connectDB = require("./utils/db");

const app = express();
connectDB();

require("./utils/passportConfig");

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Google Auth
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get("/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    successRedirect: process.env.FRONTEND_URL,
  })
);
app.get("/logout", (req, res) => {
  req.logout(() => res.json({ message: "Logged out" }));
});
app.get("/profile", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  res.json({ user: req.user });
});

// Routes
const todoRoutes = require("./routes/todoRoutes");
const todolistRoutes = require("./routes/todolistRoutes");

app.use("/todos", todoRoutes);
app.use("/todolists", todolistRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

// require('dotenv').config();
// const express = require("express")
// const cors = require("cors")
// const connectDB = require('./utils/db');
// connectDB()
// const passport = require("passport");
// const session = require("express-session");
// require("./utils/passportConfig");
// const Todo = require("./models/todo")
// const TodoList = require("./models/Todolist")
// const app = express()

// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     cookie: { secure: false },
//   })
// );
// app.use(passport.initialize());
// app.use(passport.session());

// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL,
//     credentials: true,
//   })
// );

// app.use(express.json()); 
// app.use(express.urlencoded({ extended: true }));
// app.use((req, res, next) => {
//   res.locals.user = req.user; 
//   next();
// });

// //auth
// // Google Auth Routes
// app.get(
//   "/auth/google",
//   passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account" })
// );

// app.get(
//   "/auth/google/callback",
//   passport.authenticate("google", {
//     failureRedirect: "/login",
//     successRedirect: process.env.FRONTEND_URL,
//   })
// );

// // Logout Route
// app.get("/logout", (req, res, next) => {
//   req.logout(function (err) {
//     if (err) {
//       return next(err);
//     }
//     req.session.destroy(() => {
//       res.json({ message: "Logged out successfully" });
//     });
//   });
// });

// // Protected Route Example
// app.get("/profile", (req, res) => {
//   if (!req.user) return res.status(401).json({ error: "Not authenticated" });
//   res.json({ user: req.user });
// });

// // get todolists
// app.get("/todolists", async (req, res) => {
//   try {
//     if (!req.isAuthenticated()) {
//       return res.status(401).json({ message: "Not authenticated" });
//     }
//       const todolists = (await TodoList.find({ userId: req.user._id })).reverse(); // Await the database query
      
//       if (todolists.length > 0) {
//           res.json({ todolists });
//       } else {
//           res.json({ message: "No Todos Added" });
//       }
//   } catch (error) {
//       console.error("Error fetching todos:", error);
//       res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // create todolist
// app.post("/create-todolist", async (req,res)=>{
//   try{
//     if (!req.isAuthenticated()) {
//       return res.status(401).json({ message: "Not authenticated" });
//     }
//       const {title} = req.body
//       const newTodo = new TodoList({
//         title,
//         userId: req.user._id,
//       })
//       await newTodo.save()
//       res.json({ message: "Todolist Created", todolist: newTodo });
//   }
//   catch(e){
//       res.status(500).json({ error: "Error creating todolist" });
//   }
// })

// // delete todolist
// app.delete("/delete-todolist/:id", async (req, res) => {
//   try {
//     const result = await TodoList.findByIdAndDelete(req.params.id);
//     if (result) {
//       res.json({ message: "TodoList deleted successfully!" });
//     } else {
//       res.status(404).json({ message: "TodoList not found" });
//     }
//   } catch (e) {
//     res.status(500).json({ error: "Error Deleting Todolist" });
//   }
// }); 

// // get todos
// app.get("/todos", async (req, res) => {
//     try {
//       if (!req.isAuthenticated()) {
//         return res.status(401).json({ message: "Not authenticated" });
//       }
//         const todos = (await Todo.find({ userId: req.user._id })).reverse(); // Await the database query
        
//         if (todos.length > 0) {
//             res.json({ todos });
//         } else {
//             res.json({ message: "No Todos Added" });
//         }
//     } catch (error) {
//         console.error("Error fetching todos:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

// // create todo
// app.post("/create-todo", async (req,res)=>{
//     try{
//       if (!req.isAuthenticated()) {
//         return res.status(401).json({ message: "Not authenticated" });
//       }
//         const {title,deadline} = req.body
//         const newTodo = new Todo({
//           title,
//           deadline:deadline?deadline:"",
//           userId: req.user._id,
//         })
//         await newTodo.save()
//         res.json({ message: "Todo added", todo: newTodo });
//     }
//     catch(e){
//         console.error("Error creating todos:", error);
//         res.status(500).json({ error: "Error adding todo" });
//     }
// })

// // update todo
// app.patch("/update-todo/:id", async (req, res) => {
//     try {
//       const { title,deadline } = req.body;
      
//       const updatedTodo = await Todo.findByIdAndUpdate(
//         req.params.id, 
//         { title,
//           deadline:deadline?deadline:"", },  
//         { new: true } 
//       );
  
//       if (!updatedTodo) {
//         return res.status(404).json({ message: "Todo not found" });
//       }
  
//       res.json({ message: "Todo updated successfully!", updatedTodo });
//     } catch (error) {
//       console.error("Error updating todo:", error);
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   });  
  
//   // update todo Progress
// app.patch("/update-todo-completion/:id", async (req, res) => {
//       try {
//         const { isCompleted } = req.body;
//         const updatedTodo = await Todo.findByIdAndUpdate(
//           req.params.id, 
//           { completed:!isCompleted },  
//           { new: true } 
//         );
    
//         if (!updatedTodo) {
//           return res.status(404).json({ message: "Todo not found" });
//         }
    
//         res.json({ message: "Todo Progress updated successfully!", updatedTodo });
//       } catch (error) {
//         console.error("Error updating todo Progress:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//       }
//     }); 

// //delete todo
// app.delete("/delete-todo/:id", async (req, res) => {
//     try {
//       const result = await Todo.findByIdAndDelete(req.params.id);
//       if (result) {
//         res.json({ message: "Todo deleted successfully!" });
//       } else {
//         res.status(404).json({ message: "Todo not found" });
//       }
//     } catch (e) {
//       console.error("Error deleting todo:", e);
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   });  

// //delete all todos
// app.delete("/delete-todos", async (req, res) => {
//     try {
//         const result = await Todo.deleteMany({}); 
//         if (result.deletedCount > 0) {
//             res.json({ message: "All todos deleted successfully!" });
//         } else {
//             res.json({ message: "No todos to delete." });
//         }
//     } catch (e) {
//         console.error("Error deleting todos:", e);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

// app.get("/",(req,res)=>{
//     console.log("get request" + req.body)
//     res.redirect(process.env.FRONTEND_URL)
// })

// const PORT = process.env.PORT || 5000
// app.listen(PORT,()=>{
//     console.log("server running on http://localhost:"+PORT)
// })