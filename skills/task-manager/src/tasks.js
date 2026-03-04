const fs = require("fs");
const FILE = "./tasks.json";
function load() { if (!fs.existsSync(FILE)) return []; return JSON.parse(fs.readFileSync(FILE)); }
function save(tasks) { fs.writeFileSync(FILE, JSON.stringify(tasks, null, 2)); }
function addTask({ title, due, priority = "normal", labels = [] }) { const tasks = load(); const task = { id: Date.now(), title, due, priority, labels, status: "open" }; tasks.push(task); save(tasks); return task; }
function listTasks() { return load(); }
function completeTask(id) { const tasks = load(); const task = tasks.find(t => t.id == id); if (!task) return null; task.status = "done"; save(tasks); return task; }
module.exports = { addTask, listTasks, completeTask };
