// Membuka atau membuat database IndexedDB
const dbName = 'userDB';
let db;

const request = indexedDB.open(dbName, 2);

// Menangani jika database dibuat atau perlu diperbarui
request.onupgradeneeded = function (event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains('users')) {
        const store = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
        store.createIndex('number', 'number', { unique: false });
        store.createIndex('name', 'name', { unique: false });
    }
};

// Menangani saat database terbuka dengan sukses
request.onsuccess = function (event) {
    db = event.target.result;
    renderUsers();
};

// Menangani error saat membuka database
request.onerror = function (event) {
    console.error('Error membuka database:', event.target.error);
};

// Menyimpan pengguna ke dalam IndexedDB
function saveUserToIndexedDB(number, name, address, memberType) {
    const transaction = db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');

    // Memastikan tidak ada duplikat berdasarkan 'number'
    const index = store.index('number'); // Mengakses index 'number'
    const request = index.get(number); // Cek apakah number sudah ada

    request.onsuccess = function (event) {
        const userExists = event.target.result;
        if (userExists) {
            // Tampilkan pesan kesalahan jika data sudah ada
            Swal.fire({
                title: "Gagal",
                text: "Data sudah terdaftar",
                icon: 'error',
            });
            document.getElementById('rfid-input').focus();
        } else {
            const user = { number, name, address, memberType , status : 0 };
            store.add(user);
            document.getElementById('rfid-input').focus();
        }
    };

    transaction.oncomplete = function () {
        console.log('Pengguna berhasil disimpan');
        renderUsers();
    };

    transaction.onerror = function () {
        console.error('Error menyimpan pengguna');
    };
}


// Menampilkan data pengguna dari IndexedDB
function renderUsers() {
    const userList = document.getElementById('user-list');
    userList.innerHTML = ''; // Kosongkan daftar pengguna sebelum render ulang

    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.getAll(); // Mendapatkan semua data pengguna

    request.onsuccess = function () {
        const users = request.result;
        document.getElementById('totalTamu').textContent = `Total Tamu: ${users.length}`
        users.forEach(user => {
            const tr = document.createElement('tr'); // Membuat elemen tr
            tr.innerHTML = `
          <td class="text-start">${user.number}</td>
          <td>${user.name}</td>
          <td>${user.address}</td>
          <td>${user.memberType}</td>
          <td>
            <span class="badge ${user.status == 0 ? 'bg-warning' : 'bg-primary'}">${user.status == 0 ? 'Belum Hadir' : 'Hadir'}</span>
          </td>
          <td>
            <div class="d-flex align-items-center justify-content-end">
              <button class="btn btn-sm btn-primary mr-2" onclick="editUser(${user.id})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">Delete</button>
            </div>
          </td>`;
            userList.appendChild(tr);
        });

        setTimeout(() => {
            $('#dataTable').DataTable();
        }, 500);
    };
}

// Menghapus pengguna dari IndexedDB
function deleteUser(id) {
    const transaction = db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    store.delete(id);
    document.getElementById('rfid-input').focus();
    transaction.oncomplete = function () {
        Swal.fire({
            title: "Berhasil",
            text: "Data berhasil di hapus",
            icon: "success"
        })
       
        renderUsers();
    };

    transaction.onerror = function () {
        console.error('Error menghapus pengguna');
    };
}

// Mengedit pengguna dalam IndexedDB
// Mengedit pengguna dalam IndexedDB
function editUser(id) {
    const transaction = db.transaction(['users'], 'readonly');  // Gunakan transaksi readonly untuk membaca data
    const store = transaction.objectStore('users');
    const request = store.get(id); // Mendapatkan pengguna berdasarkan ID

    request.onsuccess = function (event) {
        const user = event.target.result;

        // Isi form dengan data pengguna
        document.getElementById('rfid-input').value = user.number;
        document.getElementById('rfid-input').disabled = true
        document.getElementById('name').value = user.name;
        document.getElementById('address').value = user.address;
        document.getElementById('memberType').value = user.memberType;

        // Mengubah fungsi submit menjadi fungsi untuk update data
        const form = document.getElementById('crud-form');
        form.onsubmit = function (event) {
            event.preventDefault();

            // Memperbarui data pengguna
            user.name = document.getElementById('name').value;
            user.address = document.getElementById('address').value;
            user.memberType = document.getElementById('memberType').value;

            // Mulai transaksi baru untuk melakukan put()
            const updateTransaction = db.transaction(['users'], 'readwrite'); // Gunakan transaksi readwrite untuk update
            const updateStore = updateTransaction.objectStore('users');
            const updateRequest = updateStore.put(user); // Mengupdate data pengguna

            updateRequest.onsuccess = function () {
                Swal.fire({
                    title: "Berhasil",
                    text: "Data berhasil di ubah",
                    icon: "success"
                })
                document.getElementById('rfid-input').disabled = false
                document.getElementById('rfid-input').value = '';
                document.getElementById('name').value = '';
                document.getElementById('address').value = '';
                document.getElementById('memberType').value = '';
                document.getElementById('rfid-input').focus();
                renderUsers(); // Render ulang setelah berhasil memperbarui
            };

            updateRequest.onerror = function () {
                console.error('Error memperbarui pengguna');
            };

            // Mengembalikan fungsi form ke penambahan pengguna baru setelah update
            form.onsubmit = addNewUser;
        };
    };

    transaction.onerror = function () {
        console.error('Error mengambil data pengguna');
    };
}



// Fungsi untuk menambahkan pengguna baru
function addNewUser(event) {
    event.preventDefault();
    const number = document.getElementById('rfid-input').value;
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const memberType = document.getElementById('memberType').value;
    saveUserToIndexedDB(number, name, address, memberType);

    // Reset form
    document.getElementById('name').value = '';
    document.getElementById('rfid-input').value = '';
    document.getElementById('rfid-input').focus();
    document.getElementById('address').value = '';
    document.getElementById('memberType').value = '';

}

// Event listener untuk form
document.getElementById('crud-form').onsubmit = addNewUser;