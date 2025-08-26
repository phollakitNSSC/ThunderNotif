// Redirect to notification.html if notification permission is default (not granted or denied)
if ('Notification' in window && Notification.permission === 'default') {
    window.location.href = 'notification.html';
}

// Check notifications every 1 minute
setInterval(() => {
    renderTasks();
    checkNotifications();
}, 60 * 1000); // 1 minute

// Play pop sound on any click anywhere
window.addEventListener('click', function() {
    var pop = document.getElementById('popSound');
    if (pop) { pop.currentTime = 0; pop.play(); }
});
// Schoolwork Alarm App
// Stores tasks in localStorage and notifies user when deadlines are near


const taskForm = document.getElementById('taskForm');
const taskSubject = document.getElementById('taskSubject');
const taskName = document.getElementById('taskName');
const taskDeadline = document.getElementById('taskDeadline');
const taskNote = document.getElementById('taskNote');

// Edit modal elements
const editModal = document.getElementById('editModal');
const editSubject = document.getElementById('editSubject');
const editName = document.getElementById('editName');
const editDeadline = document.getElementById('editDeadline');
const editNote = document.getElementById('editNote');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
let editingIdx = null;
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
    let countUnfinished = 0, countOverdue = 0, countFinished = 0;
    const now = new Date();
    tasks.forEach((task, idx) => {
        const li = document.createElement('li');
        let subjectText = task.subject ? `[${task.subject}] ` : '';
        let noteText = task.note ? `<br><span style='font-size:0.95em;color:#666;'>${task.note}</span>` : '';
        li.innerHTML = `<span>${subjectText}${task.name} <span style="font-size:0.95em;color:#888;">(กำหนดส่ง: ${new Date(task.deadline).toLocaleString('th-TH')})</span>${noteText}</span>`;

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.textContent = 'แก้ไข';
        editBtn.className = 'finish-btn';
        editBtn.style.background = '#6366f1';
        editBtn.style.marginLeft = '8px';
        editBtn.onclick = () => openEditModal(idx);
        li.appendChild(editBtn);

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'ลบ';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => deleteTask(idx);
        li.appendChild(deleteBtn);

        if (!task.finished) {
            const finishBtn = document.createElement('button');
            finishBtn.textContent = 'เสร็จสิ้น';
            finishBtn.className = 'finish-btn';
            finishBtn.onclick = () => finishTask(idx);
            li.appendChild(finishBtn);
            if (new Date(task.deadline) < now) {
                countOverdue++;
                overdueList.appendChild(li);
            } else {
                countUnfinished++;
                unfinishedList.appendChild(li);
            }
        } else {
            countFinished++;
            finishedList.appendChild(li);
        }
    });

    // Progress bar and stats
    const total = countUnfinished + countOverdue + countFinished;
    const barUnfinished = document.getElementById('barUnfinished');
    const barOverdue = document.getElementById('barOverdue');
    const barFinished = document.getElementById('barFinished');
    if (total > 0 && barUnfinished && barOverdue && barFinished) {
        barUnfinished.style.width = (countUnfinished/total*100) + '%';
        barOverdue.style.width = (countOverdue/total*100) + '%';
        barFinished.style.width = (countFinished/total*100) + '%';
    } else if (barUnfinished && barOverdue && barFinished) {
        barUnfinished.style.width = '0%';
        barOverdue.style.width = '0%';
        barFinished.style.width = '0%';
    }
    const statsText = document.getElementById('statsText');
    if (statsText) {
        statsText.innerHTML = `<span>ยังไม่เสร็จ: ${countUnfinished}</span><span>เลยกำหนด: ${countOverdue}</span><span>เสร็จแล้ว: ${countFinished}</span>`;
    }
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
        subject: taskSubject.value,
        name: taskName.value,
        deadline: taskDeadline.value,
        note: taskNote.value,
        finished: false,
        lastNotified: null
    });
    saveTasks();
    renderTasks();
    taskForm.reset();
};

// Edit modal logic
function openEditModal(idx) {
    editingIdx = idx;
    const task = tasks[idx];
    editSubject.value = task.subject || '';
    editName.value = task.name || '';
    editDeadline.value = task.deadline || '';
    editNote.value = task.note || '';
    editModal.style.display = 'flex';
}

if (saveEditBtn && cancelEditBtn) {
    saveEditBtn.onclick = function() {
        if (editingIdx !== null) {
            tasks[editingIdx].subject = editSubject.value;
            tasks[editingIdx].name = editName.value;
            tasks[editingIdx].deadline = editDeadline.value;
            tasks[editingIdx].note = editNote.value;
            saveTasks();
            renderTasks();
            editModal.style.display = 'none';
            editingIdx = null;
        }
    };
    cancelEditBtn.onclick = function() {
        editModal.style.display = 'none';
        editingIdx = null;
    };
}

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
