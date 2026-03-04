const tasks = require("../src/tasks");
const t = tasks.addTask({ title: "Test", due: "2026-03-10", priority: "high" });
console.assert(t.title === "Test", "Add failed");
console.assert(tasks.listTasks().length > 0, "List failed");
console.assert(tasks.completeTask(t.id).status === "done", "Complete failed");
console.log("✅ All tests passed!");
