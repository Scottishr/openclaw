#!/usr/bin/env node
const tasks = require("./tasks");
const args = process.argv.slice(2);
const cmd = args[0];
const get = (f) => { const i = args.indexOf(f); return i !== -1 ? args[i+1] : null; };
switch(cmd) {
  case "add": const t = tasks.addTask({ title: args[1], due: get("--due"), priority: get("--prio")||"normal" }); console.log(`✅ Added #${t.id}: "${t.title}"`); break;
  case "list": const all = tasks.listTasks(); all.length ? all.forEach(t => console.log(`[${t.status}] #${t.id} ${t.title} | due: ${t.due||"none"} | prio: ${t.priority}`)) : console.log("No tasks."); break;
  case "complete": const d = tasks.completeTask(args[1]); console.log(d ? `✅ Done: "${d.title}"` : "Not found."); break;
  default: console.log("Commands: add <title> --due <date> --prio <high|normal|low>\n          list\n          complete <id>");
}
