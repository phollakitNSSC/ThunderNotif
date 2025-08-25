// Check notifications every 1 minute
setInterval(() => {
    renderTasks();
    checkNotifications();
}, 60 * 1000); // 1 minute
// Play pop sound on any click
window.addEventListener('click', function(e) {
    const tag = e.target.tagName.toLowerCase();
    if (["button","input","select","label","a"].includes(tag)) {
        var pop = document.getElementById('popSound');
        if (pop) { pop.currentTime = 0; pop.play(); }
    }
});
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
    li.textContent = `${task.name} (กำหนดส่ง: ${new Date(task.deadline).toLocaleString('th-TH')})`;
        if (!task.finished) {
            if (new Date(task.deadline) < now) {
                // Overdue
                const finishBtn = document.createElement('button');
                finishBtn.textContent = 'เสร็จสิ้น';
                finishBtn.className = 'finish-btn';
                finishBtn.onclick = () => finishTask(idx);
                li.appendChild(finishBtn);
                overdueList.appendChild(li);
            } else {
                // Unfinished
                const finishBtn = document.createElement('button');
                finishBtn.textContent = 'เสร็จสิ้น';
                finishBtn.className = 'finish-btn';
                finishBtn.onclick = () => finishTask(idx);
                li.appendChild(finishBtn);
                unfinishedList.appendChild(li);
            }
        } else {
            // Finished
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'ลบ';
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
                // Notify every 1 minute
                const last = task.lastNotified ? new Date(task.lastNotified) : null;
                if (!last || (now - last) > 1000 * 60) {
                    const notif = new Notification('แจ้งเตือนงาน', {
                        body: `${task.name} กำลังจะถึงกำหนดส่ง! (${deadline.toLocaleString('th-TH')})`
                    });
                    notif.onclick = function(event) {
                        event.preventDefault();
                        // For most browsers, this will work:
                        window.open('https://phollakitnssc.github.io/ThunderNotif', '_blank');
                        // For Chrome/Edge, fallback for notification click from service worker:
                        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                            navigator.serviceWorker.controller.postMessage({ action: 'openThunderNotif' });
                        }
                    };
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

// Redirect to notification.html if notification permission is default (not granted or denied)
if ('Notification' in window && Notification.permission === 'default') {
    window.location.href = 'notification.html';
}

// Add pop sound and notification bell for each task (unfinished/overdue)
// (already handled in renderTasks in previous patch)
