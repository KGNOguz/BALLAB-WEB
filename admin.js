
// --- STATE ---
let state = {
    articles: [],
    categories: [],
    announcement: {},
    files: [],
    isAuthenticated: false
};

// --- INIT APP (Load from API) ---
const initApp = async () => {
    try {
        const response = await fetch('/api/data');
        if (!response.ok) throw new Error("Veri okunamadı");
        const data = await response.json();
        
        state.articles = data.articles || [];
        state.categories = data.categories || [];
        state.announcement = data.announcement || {};
        state.files = data.files || [];
        
        if(sessionStorage.getItem('admin_auth') === 'true') {
            state.isAuthenticated = true;
        }

        render();
    } catch (e) {
        console.error(e);
        document.getElementById('admin-app').innerHTML = `<div class="p-10 text-center text-red-500">Hata: Sunucuya bağlanılamadı. (npm start yaptınız mı?)</div>`;
    }
};

// --- DOM ELEMENT ---
const app = document.getElementById('admin-app');

// --- ACTIONS ---

window.handleLogin = (e) => {
    e.preventDefault();
    const pass = document.getElementById('admin-pass').value;
    if (pass === 'admin123') {
        state.isAuthenticated = true;
        sessionStorage.setItem('admin_auth', 'true');
        render();
    } else {
        alert('Hatalı şifre!');
    }
};

window.handleLogout = () => {
    state.isAuthenticated = false;
    sessionStorage.removeItem('admin_auth');
    render();
};

// NEW: Save directly to server
window.saveChanges = async () => {
    const exportData = {
        articles: state.articles,
        categories: state.categories,
        announcement: state.announcement,
        files: state.files
    };

    try {
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(exportData)
        });

        if (response.ok) {
            alert("Değişiklikler sunucuya kaydedildi!");
        } else {
            alert("Hata: Kaydedilemedi.");
        }
    } catch (error) {
        alert("Sunucu hatası.");
        console.error(error);
    }
};

// -- CRUD Operations --

window.handleAddArticle = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const selectedCategories = [];
    document.querySelectorAll('input[name="categories"]:checked').forEach((checkbox) => {
        selectedCategories.push(checkbox.value);
    });

    if (selectedCategories.length === 0) {
        alert("Lütfen en az bir kategori seçiniz.");
        return;
    }

    const newArticle = {
        id: Date.now(),
        title: formData.get('title'),
        author: formData.get('author'),
        categories: selectedCategories,
        imageUrl: formData.get('imageUrl') || "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
        content: formData.get('content'),
        excerpt: formData.get('content').replace(/<[^>]*>?/gm, '').substring(0, 100) + '...',
        date: new Date().toLocaleDateString('tr-TR'),
        views: 0
    };
    
    state.articles.unshift(newArticle);
    alert('Makale listeye eklendi. "KAYDET" butonuna basmayı unutmayın.');
    e.target.reset();
    render();
};

window.handleDeleteArticle = (id) => {
    if (confirm('Silmek istediğinize emin misiniz?')) {
        state.articles = state.articles.filter(a => a.id !== id);
        render();
    }
};

window.handleAddCategory = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('catName');
    const type = formData.get('catType');
    
    if (name) {
        state.categories.push({ id: Date.now(), name: name, type: type });
        render();
    }
};

window.handleDeleteCategory = (id) => {
    if (confirm('Kategori silinsin mi?')) {
        state.categories = state.categories.filter(c => c.id !== id);
        render();
    }
};

window.handleUpdateAnnouncement = (e) => {
    e.preventDefault();
    const text = document.getElementById('announcement-text').value;
    state.announcement.text = text;
    alert('Duyuru güncellendi. "KAYDET" butonuna basınız.');
    render();
};

window.toggleAnnouncementActive = () => {
    state.announcement.active = !state.announcement.active;
    render();
};

window.handleFileUpload = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('file-input');
    const fileNameInput = document.getElementById('file-name');
    
    if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const fileName = fileNameInput.value || file.name;
        
        // Use FormData to send file to server
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if(res.ok) {
                const result = await res.json();
                state.files.push({
                    id: Date.now(),
                    name: fileName,
                    data: result.url // The server URL (e.g., /uploads/image.jpg)
                });
                alert('Dosya sunucuya yüklendi! "KAYDET" butonuna basınız.');
                render();
            } else {
                alert("Yükleme başarısız.");
            }
        } catch (err) {
            console.error(err);
            alert("Yükleme hatası.");
        }
    }
};

window.handleDeleteFile = (id) => {
    if(confirm("Dosya listeden kaldırılsın mı?")) {
        state.files = state.files.filter(f => f.id !== id);
        render();
    }
};

window.copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        alert("URL Kopyalandı!");
    });
};

// --- RENDER ---

const renderLogin = () => `
    <div class="flex items-center justify-center min-h-screen bg-paper dark:bg-gray-900">
        <form onsubmit="handleLogin(event)" class="w-full max-w-md p-10 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-serif font-bold mb-2">Yönetici Paneli</h2>
                <p class="text-sm text-gray-500">İçerik yönetimi için giriş yapın.</p>
            </div>
            <div class="mb-6">
                <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Şifre</label>
                <input type="password" id="admin-pass" class="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all" placeholder="••••••">
            </div>
            <button type="submit" class="w-full bg-ink text-paper dark:bg-white dark:text-black py-4 rounded-lg font-bold tracking-wide hover:opacity-90 transition transform active:scale-95">
                GİRİŞ YAP
            </button>
        </form>
    </div>
`;

const renderDashboard = () => `
    <div class="max-w-7xl mx-auto py-8">
        <!-- HEADER WITH SERVER SAVE ACTION -->
        <header class="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-200 dark:border-gray-700 pb-6 gap-4">
            <div>
                <h1 class="text-4xl font-serif font-bold mb-2">Admin Paneli</h1>
                <p class="text-gray-500">Hoş geldin. Düzenlemeleri yaptıktan sonra <span class="font-bold text-black dark:text-white">KAYDET</span> butonuna bas.</p>
            </div>
            <div class="flex flex-wrap gap-4 items-center">
                 <button onclick="saveChanges()" class="flex items-center gap-2 px-6 py-3 bg-black text-white dark:bg-white dark:text-black rounded shadow hover:opacity-90 transition font-bold tracking-wide">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                    DEĞİŞİKLİKLERİ KAYDET
                 </button>
                 <button onclick="handleLogout()" class="px-4 py-3 border border-red-200 text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition">Çıkış</button>
            </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            <!-- Left Column: Content Creation & List -->
            <div class="lg:col-span-2 space-y-12">
                
                <!-- New Article Section -->
                <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 class="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
                        <span class="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black text-sm">1</span>
                        Makale Oluştur
                    </h2>
                    
                    <form onsubmit="handleAddArticle(event)" class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Başlık</label>
                                <input name="title" required class="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded focus:border-black dark:focus:border-white outline-none transition">
                            </div>
                            <div>
                                <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Yazar</label>
                                <input name="author" required class="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded focus:border-black dark:focus:border-white outline-none transition">
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Kategoriler</label>
                                <div class="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded h-32 overflow-y-auto custom-scrollbar">
                                    ${state.categories.map(c => `
                                        <label class="flex items-center space-x-2 mb-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded">
                                            <input type="checkbox" name="categories" value="${c.name}" class="rounded border-gray-300 text-black focus:ring-black">
                                            <span class="text-sm">${c.name}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Kapak Görseli URL</label>
                                <input name="imageUrl" placeholder="https://..." class="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded focus:border-black dark:focus:border-white outline-none transition">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 flex justify-between">
                                <span>İçerik (HTML)</span>
                            </label>
                            <textarea name="content" required rows="6" class="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded font-mono text-sm focus:border-black dark:focus:border-white outline-none transition"></textarea>
                        </div>

                        <button class="w-full bg-black text-white dark:bg-white dark:text-black py-4 rounded font-bold uppercase tracking-widest hover:opacity-90 transition">
                            Listeye Ekle
                        </button>
                    </form>
                </div>

                 <!-- Article List Section -->
                 <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 class="text-xl font-serif font-bold mb-6">Mevcut Makaleler</h2>
                    <div class="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                        ${state.articles.map(article => `
                            <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
                                <div>
                                    <h3 class="font-bold text-lg">${article.title}</h3>
                                    <div class="text-xs text-gray-500 mt-1">
                                        ${article.date} • ${article.author}
                                    </div>
                                </div>
                                <button onclick="handleDeleteArticle(${article.id})" class="text-xs bg-red-100 text-red-600 px-3 py-2 rounded hover:bg-red-200 transition">
                                    Sil
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Right Column: Tools & Categories -->
            <div class="lg:col-span-1 space-y-8">
                
                <!-- Announcement -->
                 <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 class="text-lg font-serif font-bold mb-4">Duyuru Ayarı</h2>
                    <form onsubmit="handleUpdateAnnouncement(event)">
                        <div class="flex flex-col gap-3">
                            <input id="announcement-text" value="${state.announcement.text || ''}" class="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded outline-none">
                            <div class="flex gap-2">
                                <button type="button" onclick="toggleAnnouncementActive()" class="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded text-xs font-bold ${state.announcement.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}">
                                    ${state.announcement.active ? 'AKTİF' : 'PASİF'}
                                </button>
                                <button type="submit" class="flex-1 py-2 bg-black text-white dark:bg-white dark:text-black rounded text-xs font-bold">LİSTEYİ GÜNCELLE</button>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- File Manager (Server Upload) -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 class="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
                        <span class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm">🛠</span>
                        Dosyalar (Sunucu)
                    </h2>
                    <div class="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                        <form onsubmit="handleFileUpload(event)" class="space-y-3">
                            <input type="text" id="file-name" placeholder="Görünür İsim (opsiyonel)" class="w-full p-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded outline-none">
                            <input type="file" id="file-input" accept="image/*" class="w-full text-xs text-gray-500">
                            <button class="w-full py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 transition">Sunucuya Yükle</button>
                        </form>
                    </div>

                    <div class="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                        ${state.files.map(f => `
                            <div class="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-100 dark:border-gray-700">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-bold truncate w-24">${f.name}</span>
                                    <button onclick="handleDeleteFile(${f.id})" class="text-xs text-red-500 hover:underline">Sil</button>
                                </div>
                                <img src="${f.data}" class="w-full h-24 object-cover rounded mb-2 bg-gray-200">
                                <button onclick="copyToClipboard('${f.data}')" class="w-full py-1 bg-gray-200 dark:bg-gray-700 text-[10px] uppercase font-bold rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                                    URL Kopyala
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                 <!-- Categories -->
                 <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 class="text-lg font-serif font-bold mb-4">Kategoriler</h2>
                    <form onsubmit="handleAddCategory(event)" class="mb-4 space-y-2">
                        <input name="catName" required placeholder="Adı" class="w-full p-2 bg-gray-50 dark:bg-gray-900 border rounded text-sm">
                        <select name="catType" class="w-full p-2 bg-gray-50 dark:bg-gray-900 border rounded text-sm">
                            <option value="main">Ana Kategori</option>
                            <option value="sub">Alt Kategori</option>
                            <option value="year">Yıl</option>
                        </select>
                        <button class="w-full py-2 bg-blue-600 text-white rounded text-sm font-bold">Ekle</button>
                    </form>
                    <div class="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                        ${state.categories.map(c => `
                            <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm">
                                <span>${c.name} <small class="text-gray-400">(${c.type})</small></span>
                                <button onclick="handleDeleteCategory(${c.id})" class="text-red-400">×</button>
                            </div>
                        `).join('')}
                    </div>
                 </div>
            </div>
        </div>
    </div>
`;

// --- START ---
document.addEventListener('DOMContentLoaded', initApp);