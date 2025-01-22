const dbName = 'userDB';
let db;
const request = indexedDB.open(dbName, 2);
request.onupgradeneeded = function (event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains('users')) {
        const store = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
        store.createIndex('number', 'number', { unique: false });
        store.createIndex('name', 'name', { unique: false });
    }
};

request.onsuccess = function (event) {
    db = event.target.result;
    console.log('Database terbuka:', dbName);
    renderUsers();
};


function renderUsers(){
    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    let request = store.getAll();
    request.onsuccess = function () {
        let users = request.result;
        let totalTamu = users.length
        let totalHadir = users.filter(val => val.status == 1).length
        let totalBelumHadir = users.filter(val => val.status == 0).length
        window.totalHadirs = totalHadir
        window.totalBelumHadirs = totalBelumHadir
        document.getElementById('totalTamu').textContent = totalTamu
        document.getElementById('totalHadir').textContent = totalHadir
        document.getElementById('totalBelumHadir').textContent = totalBelumHadir
    }
}