interface Task {
  id: number;
  task: (id: number) => Promise<void>;
  isRunning: boolean;
  completed: boolean;
}

class TaskTracker {
  taskList: Task[];
  maxConcurrency: number;

  constructor(tasks: Array<(id: number) => Promise<void>>, maxConcurrency: number) {
    this.maxConcurrency = maxConcurrency;
    this.taskList = tasks.map((t, index) => {
      return {
        id: index,
        task: t,
        isRunning: false,
        completed: false,
      };
    });
  }

  get hasFinishedTasks() {
    return this.taskList.every((t) => t.completed);
  }

  async throttleQ() {
    while (!this.hasFinishedTasks) {
      let count = this.taskList.filter(tl => tl.isRunning).length;
      const promises = [];
      for (const t of this.taskList) {
        if (count >= this.maxConcurrency) {
          continue;
        }
        
        if (t.completed || t.isRunning) {
          continue;
        }
  
        count++;
        t.isRunning = true;
        //console.log(`Processing: ${t.id}`);
        promises.push(t.task(t.id).then(() => {
          t.completed = true;
          t.isRunning = false;
          //console.log(`Processed: ${t.id}`);
        }));
      }

      if (promises.length <= 0) {
        break;
      }

      await Promise.race(promises); // start looking for more tasks ASAP
      
    }
  }
}

async function WriteLineWithDelay(id: number) {
  let delay = Math.floor(Math.random() * 40) + 1; // Random delay between 1 and 4 seconds
  console.log("Start " + id);
  return new Promise<void>((resolve) => setTimeout(() => {
    console.log("End " + id);
    resolve();
  }, delay * 100));
}

async function main() {
  const taskCmds = [
    WriteLineWithDelay,
    WriteLineWithDelay,
    WriteLineWithDelay,
    WriteLineWithDelay,
    WriteLineWithDelay,
    WriteLineWithDelay,
  ];
  
  // Initialize task tracker
  let taskTracker: TaskTracker = new TaskTracker(taskCmds, 2);
  await taskTracker.throttleQ(); // Run with max concurrency of 2
}

main();
