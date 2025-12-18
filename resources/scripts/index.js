document.addEventListener('DOMContentLoaded', loadTasks);
const taskList = document.getElementById('taskList');

function getTasks() {
    return JSON.parse(localStorage.getItem('tasks')) || [];
}

function saveTasks(tasks) {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const tasks = getTasks();
    
    tasks.forEach(taskObj => {
        addTaskElement(taskObj);
    });
}

const clearBtn = document.getElementById("clear-btn");


function addTask() {
    const taskInput = document.getElementById('taskInput');
    const task = taskInput.value.trim();

    // Validate task input
    if (!task) {
        alert("Task cannot be empty!");
        return;
    }

    if (/[^a-zA-Z0-9\s]/.test(task)) {
        alert("Task cannot contain special characters!");
        return;
    }

    if (task.length > 100) {
        alert("Task cannot exceed 100 characters!");
        return;
    }

    const now = new Date();
    const options = {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    const dateString = now.toLocaleString('en-US', options);

    const tasks = getTasks();

    // Check for duplicate task
if (tasks.some(taskObj => taskObj.task.toLowerCase() === task.toLowerCase())) {
    alert("This task already exists!");
    return;
}


    const taskId = crypto.randomUUID();

    const taskObj = {
        id: taskId,
        task: task,
        date: dateString,
        completed: false
    };

    addTaskElement(taskObj);

    tasks.push(taskObj);
    saveTasks(tasks);

    taskInput.value = '';
}

function addTaskElement(taskObj) {
    
    const taskDiv = document.createElement('div');
    taskDiv.classList.add('task-container');
    taskDiv.dataset.id = taskObj.id;
    if (taskObj.completed) {
        taskDiv.classList.add('completed');
    }

    const taskContent = document.createElement('div');
    taskContent.classList.add('task-content');

    const taskText = document.createElement('span');
    taskText.classList.add('task-text');
    taskText.textContent = taskObj.task;

    const taskActions = document.createElement('div');
    taskActions.classList.add('task-actions');

    const taskDate = document.createElement('span');
    taskDate.classList.add('task-date');
    taskDate.textContent = ` (${taskObj.date})`;

    if (taskObj.completed) {
        const checkIcon = document.createElement('i');
        checkIcon.classList.add('fas', 'fa-check-circle');
        checkIcon.style.color = 'green';
        checkIcon.style.marginLeft = '5px';
        taskDate.appendChild(checkIcon);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('action-btn', 'delete-btn');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        removeTask(taskDiv, taskObj.id);
    });

    taskActions.appendChild(taskDate);
    taskActions.appendChild(deleteBtn);

    taskContent.appendChild(taskText);
    taskContent.appendChild(taskActions);

    taskDiv.appendChild(taskContent);
    
    taskContent.addEventListener('click', () => markAsCompleted(taskDiv, taskObj.id));

    taskList.appendChild(taskDiv);
}

function markAsCompleted(taskDiv, taskId) {
    const tasks = getTasks();
    const task = tasks.find(taskObj => taskObj.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks(tasks);

        const taskDate = taskDiv.querySelector('.task-date');

        if (task.completed) {
            taskDiv.classList.add('completed');
            const checkIcon = document.createElement('i');
            checkIcon.classList.add('fas', 'fa-check-circle');
            checkIcon.style.color = 'green';
            checkIcon.style.marginLeft = '5px';
            taskDate.appendChild(checkIcon);
        } else {
            taskDiv.classList.remove('completed');
            const checkIcon = taskDate.querySelector('.fa-check-circle');
            if (checkIcon) {
                checkIcon.remove();
            }
        }
    }
}

function removeTask(taskDiv, taskId) {
    taskDiv.classList.add('fade-out');
    setTimeout(() => {
        let tasks = getTasks();
        tasks = tasks.filter(taskObj => taskObj.id !== taskId);
        saveTasks(tasks);

        taskDiv.remove();
    }, 500);
}

document.getElementById('taskInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addTask();
    }
});

clearBtn.addEventListener("click", function () {
    if (!confirm("Are you sure you want to clear all tasks?")) return;
    taskList.innerHTML = "";
    localStorage.removeItem("tasks");
});

// --------------------
// Pomodoro state
// --------------------
let pomodoroInterval = null;
let remainingSeconds = 0;
let pomodoroMode = "idle"; // "idle" | "focus" | "break"




function updatePomodoroDisplay() {
    const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
    const seconds = String(remainingSeconds % 60).padStart(2, "0");
    document.getElementById("timerDisplay").textContent = `${minutes}:${seconds}`;
}

function playAlarm() {
    alarmSound.currentTime = 0;
    alarmSound.play().catch(err => {
        console.log("Audio playback blocked:", err);
    });
}


function startFocusTimer() {
    updateModeIndicator("focus");
    clearInterval(pomodoroInterval);
    pomodoroMode = "focus";
    updatePomodoroDisplay();

    pomodoroInterval = setInterval(() => {
        remainingSeconds--;
        updatePomodoroDisplay();
        savePomodoroState();

        if (remainingSeconds <= 0) {
            clearInterval(pomodoroInterval);
            console.log("Focus session completed");
            playAlarm();
            startBreakTimer();
        }
    }, 1000);
}

function startBreakTimer() {
    updateModeIndicator("break");
    clearInterval(pomodoroInterval);
    pomodoroMode = "break";

    const breakMinutes = parseInt(document.getElementById("breakTime").value);

    if (isNaN(breakMinutes) || breakMinutes <= 0) {
        alert("Please enter a valid break time.");
        pomodoroMode = "idle";
        return;
    }

    remainingSeconds = breakMinutes * 60;
    updatePomodoroDisplay();

    pomodoroInterval = setInterval(() => {
        remainingSeconds--;
        updatePomodoroDisplay();
        savePomodoroState();

        if (remainingSeconds <= 0) {
            clearInterval(pomodoroInterval);
            pomodoroMode = "idle";
            remainingSeconds = 0;
            updatePomodoroDisplay();
            console.log("Break session completed");
            playAlarm();
        }
    }, 1000);
}

function updateModeIndicator(mode) {
    const indicator = document.getElementById("modeIndicator");

    indicator.classList.remove("mode-focus", "mode-break", "mode-idle");

    if (mode === "focus") {
        indicator.textContent = "FOCUS";
        indicator.classList.add("mode-focus");
    } else if (mode === "break") {
        indicator.textContent = "BREAK";
        indicator.classList.add("mode-break");
    } else {
        indicator.textContent = "IDLE";
        indicator.classList.add("mode-idle");
    }
}

const POMODORO_STORAGE_KEY = "pomodoroState";

function savePomodoroState() {
    const state = {
        mode: pomodoroMode,
        remainingSeconds,
        lastUpdated: Date.now()
    };
    localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(state));
}

function loadPomodoroState() {
    const raw = localStorage.getItem(POMODORO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
}

const display = document.getElementById("timerDisplay");
display.classList.add("pulse");
setTimeout(() => display.classList.remove("pulse"), 200);


// --------------------
// Pomodoro audio
// --------------------
const alarmSound = new Audio("resources/audio/alarm.mp3");
alarmSound.volume = 0.7;


// --------------------
// Pomodoro UI wiring
// --------------------

document.querySelectorAll(".focus-btn").forEach(button => {
    button.addEventListener("click", () => {
        const minutesToAdd = parseInt(button.dataset.time);

        remainingSeconds += minutesToAdd * 60;

        updatePomodoroDisplay();
        console.log(`Added ${minutesToAdd} minutes`);
    });
});


document.getElementById("stopTimer").addEventListener("click", () => {
    document.getElementById("startTimer").disabled = false;
    clearInterval(pomodoroInterval);
    pomodoroMode = "idle";
    savePomodoroState();
    updateModeIndicator("idle");
});


document.getElementById("startTimer").addEventListener("click", () => {
    document.getElementById("startTimer").disabled = true;
    updateModeIndicator("focus");
    if (remainingSeconds <= 0) {
        alert("Please add time before starting the timer.");
        return;
    }

    if (pomodoroMode === "focus" || pomodoroMode === "break") return;

    startFocusTimer();
});

document.getElementById("resetTimer").addEventListener("click", () => {
    clearInterval(pomodoroInterval);
    pomodoroMode = "idle";
    remainingSeconds = 0;
    updatePomodoroDisplay();
    updateModeIndicator("idle");
    localStorage.removeItem(POMODORO_STORAGE_KEY);
});

document.addEventListener("DOMContentLoaded", () => {
    const saved = loadPomodoroState();

    if (!saved) {
        updateModeIndicator("idle");
        updatePomodoroDisplay();
        return;
    }

    const elapsedSeconds = Math.floor((Date.now() - saved.lastUpdated) / 1000);
    const restoredRemaining = saved.remainingSeconds - elapsedSeconds;

    if (restoredRemaining <= 0) {
        localStorage.removeItem(POMODORO_STORAGE_KEY);
        pomodoroMode = "idle";
        remainingSeconds = 0;
        updateModeIndicator("idle");
        updatePomodoroDisplay();
        return;
    }

    pomodoroMode = saved.mode;
    remainingSeconds = restoredRemaining;
    updatePomodoroDisplay();
    updateModeIndicator(pomodoroMode);

    if (pomodoroMode === "focus") {
        startFocusTimer();
    } else if (pomodoroMode === "break") {
        startBreakTimer();
    }
});

updateModeIndicator("idle");




