// Schoolwork Alarm App
// Stores tasks in localStorage and notifies user when deadlines are near

const taskForm = document.getElementById('taskForm');
const taskName = document.getElementById('taskName');
const taskDeadline = document.getElementById('taskDeadline');
const unfinishedList = document.getElementById('unfinishedList');
const overdueList = document.getElementById('overdueList');
const finishedList = document.getElementById('finishedList');

let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
    unfinishedList.innerHTML = '';
    overdueList.innerHTML = '';
    finishedList.innerHTML = '';
    const now = new Date();
    tasks.forEach((task, idx) => {
        const li = document.createElement('li');
        li.textContent = `${task.name} (Due: ${new Date(task.deadline).toLocaleString()})`;
        if (!task.finished) {
            if (new Date(task.deadline) < now) {
                // Overdue
                const finishBtn = document.createElement('button');
                finishBtn.textContent = 'Finish';
                finishBtn.className = 'finish-btn';
                finishBtn.onclick = () => finishTask(idx);
                li.appendChild(finishBtn);
                overdueList.appendChild(li);
            } else {
                // Unfinished
                const finishBtn = document.createElement('button');
                finishBtn.textContent = 'Finish';
                finishBtn.className = 'finish-btn';
                finishBtn.onclick = () => finishTask(idx);
                li.appendChild(finishBtn);
                unfinishedList.appendChild(li);
            }
        } else {
            // Finished
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'delete-btn';
            deleteBtn.onclick = () => deleteTask(idx);
            li.appendChild(deleteBtn);
            finishedList.appendChild(li);
        }
    });
}

function finishTask(idx) {
    tasks[idx].finished = true;
    saveTasks();
    renderTasks();
}

function deleteTask(idx) {
    tasks.splice(idx, 1);
    saveTasks();
    renderTasks();
}

taskForm.onsubmit = function(e) {
    e.preventDefault();
    tasks.push({
        name: taskName.value,
        deadline: taskDeadline.value,
        finished: false,
        lastNotified: null
    });
    saveTasks();
    renderTasks();
    taskForm.reset();
};

function checkNotifications() {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    const now = new Date();
    tasks.forEach((task, idx) => {
        if (!task.finished) {
            const deadline = new Date(task.deadline);
            const diff = deadline - now;
            if (diff > 0 && diff < 1000 * 60 * 60 * 24) { // within 24 hours
                // Notify every hour
                const last = task.lastNotified ? new Date(task.lastNotified) : null;
                if (!last || (now - last) > 1000 * 60 * 60) {
                    new Notification('Schoolwork Reminder', {
                        body: `${task.name} is due soon! (${deadline.toLocaleString()})`
                    });
                    tasks[idx].lastNotified = now.toISOString();
                    saveTasks();
                }
            }
        }
    });
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
}

renderTasks();

// Redirect to notification.html if permission not granted or denied
if ('Notification' in window) {
    if (Notification.permission === 'default') {
        window.location.href = 'notification.html';
    }
}

setInterval(() => {
    renderTasks();
    checkNotifications();
}, 60 * 1000); // check every minute for demo (change to 60*60*1000 for 1 hour)
