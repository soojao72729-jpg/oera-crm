// Shared State Key
const STORAGE_KEY = 'oera_state';

// Strict Auth Gate (Session Based)
if (sessionStorage.getItem('oera_auth') !== 'true') {
    window.location.href = 'login.html';
}

// Load Data
let data = JSON.parse(localStorage.getItem(STORAGE_KEY));

// Role/Permission Gate
const userPerms = data?.user?.permissions || [];
if (data?.user?.role !== 'Admin' && !userPerms.includes('database')) {
    alert("Access Denied: You do not have permission to access the Database.");
    window.location.href = 'index.html';
}

// Listen for updates from Main App
window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
        data = JSON.parse(e.newValue);
        renderTable();
    }
});

if (!data) {
    // If no data exists yet (app hasn't run), warn user
    alert('Please open the Main App index.html once to initialize the database.');
}

const tables = ['companies', 'deals', 'activities', 'users', 'pending_users'];
let currentTable = 'companies';

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    renderSidebar();
    renderTable();

    // Firebase Realtime Listener
    if (typeof db !== 'undefined' && db) {
        db.ref('oera_state').on('value', (snapshot) => {
            const cloudData = snapshot.val();
            if (cloudData) {
                console.log("Admin Panel: Cloud Update Received");

                // CRITICAL: Protect the local login session (do not let cloud overwrite who IS logged in)
                const currentUser = data.user;
                data = cloudData;
                data.user = currentUser;

                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                renderSidebar();
                renderTable();
            }
        });
    }
});

function renderSidebar() {
    const nav = document.getElementById('table-nav');
    const pendingCount = data.pending_users ? data.pending_users.length : 0;

    nav.innerHTML = tables.map(t => {
        const isRequests = t === 'pending_users';
        const label = isRequests ? 'Access Requests' : t.replace('_', ' ');
        const icon = isRequests ? 'user-plus' : 'database';
        const badge = isRequests && pendingCount > 0
            ? `<span class="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-auto">${pendingCount}</span>`
            : '';

        return `
        <button onclick="switchTable('${t}')" class="w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentTable === t ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}">
            <div class="flex items-center gap-3">
                <i data-lucide="${icon}" class="w-4 h-4"></i>
                <span class="capitalize">${label}</span>
                ${badge}
            </div>
        </button>
    `}).join('');
    lucide.createIcons();
}

function switchTable(table) {
    currentTable = table;
    renderSidebar();

    // Animate transition
    const container = document.getElementById('table-container');
    container.classList.remove('animate-soft-entry');
    void container.offsetWidth; // Trigger reflow
    container.classList.add('animate-soft-entry');

    renderTable();
}

function renderTable() {
    const container = document.getElementById('table-container');
    const tableData = data[currentTable];
    const isArray = Array.isArray(tableData);

    document.getElementById('table-title').textContent = currentTable.replace('_', ' ').toUpperCase();

    if (!isArray) {
        // Object Editor (e.g. for User settings)
        renderObjectEditor(tableData, container);
    } else {
        // Show Read-Only warning if not admin
        const warning = data.user.role !== 'Admin' ?
            `<div class="mb-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <i data-lucide="lock" class="w-4 h-4"></i> View Only Mode (Logged in as ${data.user.role})
             </div>` : '';

        // Array Table Editor
        renderArrayEditor(tableData, container, warning);
    }
}

function renderObjectEditor(obj, container) {
    const fields = Object.keys(obj).map(key => `
        <div class="mb-4">
            <label class="block text-xs font-medium text-slate-500 uppercase mb-1">${key}</label>
            <input type="text" onchange="updateObjectField('${key}', this.value)" value="${obj[key]}" class="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm">
        </div>
    `).join('');

    container.innerHTML = `
        <div class="bg-white p-6 rounded-xl border border-slate-200 max-w-lg shadow-sm">
            ${fields}
            <div class="mt-4 p-3 bg-blue-50 text-blue-600 rounded-lg text-xs flex items-center gap-2 border border-blue-100">
                <i data-lucide="info" class="w-4 h-4"></i> Changes autosave
            </div>
        </div>
    `;
    lucide.createIcons();
}

function updateObjectField(key, val) {
    // Try parse number
    if (!isNaN(val) && val !== '') val = Number(val);
    data[currentTable][key] = val;
    save();
}

function renderArrayEditor(rows, container, warning = '') {
    if (rows.length === 0) {
        container.innerHTML = `<div class="text-slate-500 italic">No records found. <button onclick="addRow()" class="text-blue-500 hover:underline">Add one</button></div>`;
        return;
    }

    const headers = Object.keys(rows[0]);

    const headerHtml = headers.map(h => `<th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200">${h}</th>`).join('');
    headerHtml + `<th class="px-4 py-3 bg-slate-50 border-b border-slate-200"></th>`; // Actions

    const rowsHtml = rows.map((row, index) => {
        const delayClass = `stagger-${(index % 5) + 1}`;
        const cells = headers.map(key => {
            const val = row[key];

            if (key === 'profile_pic') {
                return `
                    <td class="px-4 py-3 border-b border-slate-100 min-w-[120px]">
                        <div class="flex items-center gap-2">
                            <img src="${val || 'https://i.pravatar.cc/150?img=11'}" class="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-sm bg-slate-100">
                            <label class="p-1 hover:bg-blue-50 rounded cursor-pointer text-blue-500 transition-colors">
                                <i data-lucide="upload" class="w-3 h-3"></i>
                                <input type="file" class="hidden" onchange="handleRowImage(${index}, '${key}', this)" accept="image/*">
                            </label>
                        </div>
                    </td>
                `;
            }

            return `
                <td class="px-4 py-3 border-b border-slate-100">
                    <input type="text" value="${val}" onchange="updateRow(${index}, '${key}', this.value)" 
                    class="bg-transparent text-sm text-slate-700 w-full focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 transition-all">
                </td>
            `;
        }).join('');

        return `
            <tr class="animate-soft-entry ${delayClass} hover:bg-slate-50 transition-colors group">
                ${cells}
                <td class="px-4 py-3 border-b border-slate-100 text-right flex items-center justify-end gap-2">
                    ${currentTable === 'pending_users' ? `
                        <button onclick="approveUser(${index})" class="text-green-500 hover:bg-green-100 p-1.5 rounded" title="Approve"><i data-lucide="check" class="w-4 h-4"></i></button>
                        <button onclick="rejectUser(${index})" class="text-red-500 hover:bg-red-100 p-1.5 rounded" title="Reject"><i data-lucide="x" class="w-4 h-4"></i></button>
                    ` : `
                        <button onclick="deleteRow(${index})" class="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 p-1.5 rounded"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    `}
                    ${currentTable === 'users' ? `
                        <button onclick="editPermissions(${index})" class="text-purple-500 hover:bg-purple-100 p-1.5 rounded ml-1" title="Access Control"><i data-lucide="key" class="w-4 h-4"></i></button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        ${warning}
        <div class="overflow-x-auto border border-slate-200 rounded-xl shadow-lg bg-white">
            <table class="w-full text-left border-collapse">
                <thead><tr>${headerHtml}<th class="w-20 bg-slate-50 border-b border-slate-200"></th></tr></thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>
        ${currentTable !== 'pending_users' ? `
        <button onclick="addRow()" class="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500 px-4 py-2 hover:bg-blue-50 rounded-lg transition-colors">
            <i data-lucide="plus-circle" class="w-4 h-4"></i> Add New Record
        </button>` : ''}
    `;
    lucide.createIcons();
}

// Permissions Logic
window.approveUser = function (index) {
    // Open Modal instead of confirm
    openPermModal(index, 'approve');
};

window.editPermissions = function (index) {
    openPermModal(index, 'edit');
};

window.openPermModal = function (index, type) {
    const modal = document.getElementById('permission-modal');
    // Safety check if modal wasn't injected
    if (!modal) {
        alert('Error: Permission Modal HTML missing. Please refresh.');
        return;
    }

    const form = document.getElementById('perm-form');
    const title = document.getElementById('perm-modal-title');
    const desc = document.getElementById('perm-modal-desc');

    document.getElementById('perm-target-index').value = index;
    document.getElementById('perm-target-type').value = type;

    // Reset Checkboxes
    form.reset();

    if (type === 'approve') {
        const user = data.pending_users[index];
        title.textContent = `Approve ${user.name}`;
        desc.textContent = "Define what modules this new user can access upon activation.";
        // Default: Give all
        form.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
    } else {
        const user = data.users[index];
        title.textContent = `Access: ${user.name}`;
        desc.textContent = "Modify access rights for this active user.";
        // Load existing
        const perms = user.permissions || []; // Legacy support
        form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = perms.includes(cb.value);
        });
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closePermModal = function () {
    const modal = document.getElementById('permission-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

// Explicitly expose to window
window.handlePermSubmit = function (e) {
    if (e) e.preventDefault();
    console.log("Saving permissions..."); // Debug log for user visibility if they check

    const form = document.getElementById('perm-form');
    const indexStr = document.getElementById('perm-target-index').value;
    const type = document.getElementById('perm-target-type').value;

    if (indexStr === null || indexStr === '') {
        alert("Error: Invalid User Index");
        return;
    }

    const index = parseInt(indexStr);

    // Collect permissions manually for maximum reliability
    const checkboxes = form.querySelectorAll('input[name="permissions"]:checked');
    const perms = Array.from(checkboxes).map(cb => cb.value);

    if (type === 'approve') {
        const user = data.pending_users[index];
        if (!user) return;

        user.status = 'Active';
        user.permissions = perms;
        data.users.push(user);
        data.pending_users.splice(index, 1);
        showToast(`User ${user.name} Approved`);
    } else {
        const user = data.users[index];
        if (!user) return;

        user.permissions = perms;

        // CRITICAL SYNC: If we are editing OURSELF, update the session user too
        if (data.user && user.user_id === data.user.user_id) {
            data.user.permissions = perms;
        }

        showToast(`Permissions updated for ${user.name}`);
    }

    save(); // Saves to oera_state
    renderTable();
    renderSidebar();
    closePermModal();
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// --- UI Interactions ---
function toggleSidebar() {
    const sidebar = document.querySelector('aside');
    const overlay = document.getElementById('mobile-overlay');
    if (!sidebar) return;

    sidebar.classList.toggle('sidebar-open');
    if (overlay) overlay.classList.toggle('active');
}

// Close sidebar when clicking any link on mobile
document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('aside');
    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('sidebar-open')) {
        // Table nav buttons or overlay
        if (e.target.closest('#table-nav button') || e.target.closest('.mobile-overlay')) {
            toggleSidebar();
        }
    }
});

// Reset Function
function factoryReset() {
    if (confirm('This will wipe all data and return to defaults. Are you sure?')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

// --- DATABASE UTILITIES ---
function save() {
    const dataStr = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, dataStr);

    // Realtime Firebase Push (EXCLUDE SESSION)
    if (typeof db !== 'undefined' && db) {
        const cloudData = { ...data };
        delete cloudData.user;
        delete cloudData.currentTab;

        db.ref('oera_state').set(cloudData).then(() => {
            showToast('Database Synced to Cloud! ☁️');
        }).catch(err => console.error("Firebase Admin Push Failed:", err));
    } else {
        showToast('Saved locally (Offline)');
    }
}

// Auto-backup logic removed as per user request
function initAutoBackup() { }

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-2xl z-50 animate-soft-entry flex items-center gap-2';
    toast.style.zIndex = "9999";
    toast.innerHTML = `<i data-lucide='check-circle' class='w-5 h-5'></i> ${msg}`;
    document.body.appendChild(toast);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setTimeout(() => toast.remove(), 3000);
}

// --- TABLE MANIPULATION ---
window.handleRowImage = function (index, key, input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            data[currentTable][index][key] = reader.result;
            save();
            renderTable();
            showToast('Image uploaded');
        };
        reader.readAsDataURL(file);
    }
};

window.updateRow = function (index, key, value) {
    if (!isNaN(value) && value !== '' && !key.includes('email') && !key.includes('name')) {
        value = Number(value);
    }
    data[currentTable][index][key] = value;
    save();
    showToast('Row updated');
};

window.addRow = function () {
    const tableData = data[currentTable];
    if (!tableData || tableData.length === 0) {
        alert("Cannot add to empty table without schema.");
        return;
    }
    const newRow = { ...tableData[0] };
    Object.keys(newRow).forEach(k => {
        if (typeof newRow[k] === 'number') newRow[k] = 0;
        else newRow[k] = 'New ' + k;
    });

    // Auto ID
    if (newRow.user_id !== undefined) newRow.user_id = Date.now();
    if (newRow.company_id !== undefined) newRow.company_id = Date.now();
    if (newRow.deal_id !== undefined) newRow.deal_id = Date.now();

    tableData.push(newRow);
    save();
    renderTable();
    showToast('New row added');
};

window.deleteRow = function (index) {
    if (confirm('Are you sure you want to delete this record?')) {
        data[currentTable].splice(index, 1);
        save();
        renderTable();
        showToast('Record deleted');
    }
};

window.rejectUser = function (index) {
    if (confirm('Reject this registration request?')) {
        data.pending_users.splice(index, 1);
        save();
        renderTable();
        renderSidebar();
        showToast('Request rejected');
    }
};
