
// --- STATE & INITIALIZATION ---

let state = {
    articles: [],
    categories: [],
    announcement: { text: '', active: false },
    view: 'home', // home, article, about, contact, category
    selectedArticleId: null,
    selectedCategory: null,
    darkMode: localStorage.getItem('mimos_theme') === 'dark',
    menuOpen: false
};

// --- DATA FETCHING (FROM SERVER API) ---
const initApp = async () => {
    try {
        // Fetch from API endpoint instead of direct file
        const response = await fetch('/api/data');
        
        if (!response.ok) {
            throw new Error(`HTTP Hata: ${response.status}`);
        }
        
        const data = await response.json();
        
        // State'i güncelle
        state.articles = data.articles || [];
        state.categories = data.categories || [];
        state.announcement = data.announcement || { text: '', active: false };
        
        // Uygulamayı başlat
        render();
        
    } catch (error) {
        console.error("Veri yükleme hatası:", error);
        // Fallback or Error Screen
        document.getElementById('app').innerHTML = `
            <div class="text-center py-20">
                <h2 class="text-xl font-bold mb-2">Sunucuya Bağlanılamadı</h2>
                <p class="text-gray-500 mb-4">Lütfen Node.js sunucusunun (server.js) çalıştığından emin olun.</p>
                <code class="bg-gray-100 p-2 rounded text-xs">npm start</code>
            </div>
        `;
    }
};

// --- DOM ELEMENTS ---
const app = document.getElementById('app');
const announcementContainer = document.getElementById('announcement-container');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebarCategories = document.getElementById('sidebar-categories');

// --- UTILS ---
const toggleTheme = () => {
    state.darkMode = !state.darkMode;
    if (state.darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('mimos_theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('mimos_theme', 'light');
    }
};

// Initialize Theme on load
if (state.darkMode) document.documentElement.classList.add('dark');

const toggleMenu = (force) => {
    state.menuOpen = force !== undefined ? force : !state.menuOpen;
    if (state.menuOpen) {
        sidebar.classList.remove('-translate-x-full');
        sidebarOverlay.classList.remove('opacity-0', 'pointer-events-none');
    } else {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('opacity-0', 'pointer-events-none');
    }
};

// --- RENDER FUNCTIONS ---

const renderAnnouncement = () => {
    if (!state.announcement.active) {
        announcementContainer.innerHTML = '';
        return;
    }
    announcementContainer.innerHTML = `
        <div class="bg-paper dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 relative transition-colors duration-300">
            <div class="max-w-7xl mx-auto flex items-center justify-center gap-3">
                <span class="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span class="text-sm font-serif italic text-gray-800 dark:text-gray-200">
                    ${state.announcement.text}
                </span>
            </div>
            <button onclick="closeAnnouncement()" class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                ×
            </button>
        </div>
    `;
};

const renderSidebarCategories = () => {
    // Only show Main categories and Years (Archives)
    const mainCats = state.categories.filter(c => c.type === 'main');
    const yearCats = state.categories.filter(c => c.type === 'year');

    const renderLink = (c, extraClass = "") => `
        <button onclick="routeToCategory('${c.name}')" class="text-left w-full hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${extraClass}">
            ${c.name}
        </button>
    `;

    sidebarCategories.innerHTML = `
        <div class="space-y-6">
            <div>
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ana Kategoriler</h4>
                <div class="flex flex-col gap-2">
                    ${mainCats.map(c => renderLink(c, "text-lg font-serif font-bold")).join('')}
                </div>
            </div>
            
            <div>
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Arşiv</h4>
                <div class="flex flex-wrap gap-2">
                    ${yearCats.map(c => `
                        <button onclick="routeToCategory('${c.name}')" class="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                            ${c.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
};

const renderHome = () => {
    let displayArticles = state.selectedCategory 
        ? state.articles.filter(a => a.categories && a.categories.includes(state.selectedCategory))
        : state.articles;

    const popular = [...displayArticles].sort((a, b) => b.views - a.views);
    
    // Pick random for "Discover"
    const topIds = popular.slice(0, 3).map(a => a.id);
    const others = state.articles.filter(a => !topIds.includes(a.id));
    const discovery = others.sort(() => 0.5 - Math.random()).slice(0, 5);

    const title = state.selectedCategory 
        ? `<div class="mb-12 border-b border-gray-200 dark:border-gray-700 pb-8">
            <span class="text-xs font-bold tracking-widest text-gray-400 uppercase">Kategori</span>
            <h1 class="text-5xl font-serif mt-2 mb-4">${state.selectedCategory}</h1>
            <button onclick="routeTo('home')" class="text-sm text-blue-600 hover:underline">← Tümünü Gör</button>
           </div>` 
        : '';

    return `
        ${title}
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <!-- Main Column: Popular -->
            <div class="lg:col-span-8 space-y-16">
                 ${!state.selectedCategory ? `
                 <div class="flex items-baseline justify-between border-b border-gray-200 dark:border-gray-800 pb-4 mb-8">
                    <h2 class="text-2xl font-serif font-bold">Popüler İçerikler</h2>
                 </div>` : ''}
                
                ${popular.length === 0 ? '<p class="text-gray-500 italic">Bu kategoride henüz içerik bulunmuyor.</p>' : popular.map((article) => `
                    <article class="group cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-6 items-start" onclick="routeToArticle(${article.id})">
                        <div class="md:col-span-5 order-2 md:order-1 overflow-hidden rounded-md">
                            <img src="${article.imageUrl}" alt="${article.title}" class="w-full h-64 md:h-56 object-cover transform group-hover:scale-105 transition-transform duration-700 grayscale-[20%] group-hover:grayscale-0">
                        </div>
                        <div class="md:col-span-7 order-1 md:order-2 flex flex-col h-full justify-center">
                            <div class="flex flex-wrap items-center gap-2 mb-3">
                                ${article.categories.map(cat => `
                                    <span class="text-[10px] font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">${cat}</span>
                                `).join('')}
                            </div>
                            <h3 class="text-2xl md:text-3xl font-serif font-bold mb-3 leading-tight group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                                ${article.title}
                            </h3>
                            <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-4 line-clamp-2 text-sm md:text-base">
                                ${article.excerpt}
                            </p>
                            <div class="text-xs text-gray-400 font-medium">
                                ${article.author} &bull; ${article.date}
                            </div>
                        </div>
                    </article>
                `).join('')}
            </div>

            <!-- Side Column: Discover -->
            <div class="lg:col-span-4 pl-0 lg:pl-12 lg:border-l border-gray-100 dark:border-gray-800">
                <div class="sticky top-24 space-y-12">
                    
                    <!-- Discover Widget -->
                    <div>
                        <h2 class="text-lg font-serif font-bold mb-6 border-b border-gray-200 dark:border-gray-800 pb-2">
                            Yeni Şeyler Keşfet
                        </h2>
                        <div class="space-y-8">
                            ${discovery.map(article => `
                                <div class="group cursor-pointer flex gap-4 items-start" onclick="routeToArticle(${article.id})">
                                    <div class="w-20 h-20 shrink-0 overflow-hidden rounded bg-gray-100">
                                        <img src="${article.imageUrl}" class="w-full h-full object-cover group-hover:scale-110 transition-transform">
                                    </div>
                                    <div>
                                        <div class="flex flex-wrap gap-1 mb-1">
                                            ${article.categories.slice(0, 1).map(cat => `
                                                <span class="text-[9px] font-bold uppercase tracking-wider text-gray-400 block">${cat}</span>
                                            `).join('')}
                                        </div>
                                        <h4 class="font-serif font-bold text-sm leading-snug group-hover:underline decoration-1 underline-offset-4">
                                            ${article.title}
                                        </h4>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Newsletter Box -->
                    <div class="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                        <h3 class="font-serif font-bold text-lg mb-2">Bültene Katılın</h3>
                        <p class="text-xs text-gray-500 mb-4 leading-relaxed">İlham verici içerikler her hafta kutunuzda.</p>
                        <input type="email" placeholder="E-posta adresiniz" class="w-full p-3 mb-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md outline-none focus:border-ink dark:focus:border-white transition-colors">
                        <button class="w-full bg-ink text-paper dark:bg-white dark:text-black py-3 text-xs font-bold uppercase tracking-widest rounded-md hover:opacity-90 transition">Abone Ol</button>
                    </div>
                    
                </div>
            </div>
        </div>
    `;
};

const renderArticle = () => {
    const article = state.articles.find(a => a.id === state.selectedArticleId);
    if (!article) return renderHome();

    const similar = state.articles.filter(a => 
        a.id !== article.id && 
        a.categories.some(c => article.categories.includes(c))
    ).slice(0, 2);

    return `
        <div class="max-w-4xl mx-auto py-8 animate-fade-in">
            <div class="flex justify-between items-center mb-12">
                <button onclick="routeTo('home')" class="flex items-center gap-2 text-sm text-gray-500 hover:text-ink dark:hover:text-white transition-colors">
                    ← Geri Dön
                </button>
                <div class="flex gap-2">
                    ${article.categories.map(c => `
                        <span class="text-xs font-bold uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
                            ${c}
                        </span>
                    `).join('')}
                </div>
            </div>
            
            <header class="text-center mb-12 max-w-2xl mx-auto">
                <h1 class="text-4xl md:text-6xl font-serif font-black mb-8 leading-tight text-ink dark:text-white">
                    ${article.title}
                </h1>
                <div class="flex justify-center items-center gap-4 text-sm font-medium border-t border-b border-gray-100 dark:border-gray-800 py-4">
                    <div class="flex flex-col items-center">
                         <span class="text-gray-400 text-xs uppercase tracking-widest mb-1">Yazar</span>
                         <span class="text-ink dark:text-white font-serif italic">${article.author}</span>
                    </div>
                    <div class="w-px h-8 bg-gray-200 dark:bg-gray-800 mx-4"></div>
                    <div class="flex flex-col items-center">
                         <span class="text-gray-400 text-xs uppercase tracking-widest mb-1">Tarih</span>
                         <span class="text-ink dark:text-white font-serif italic">${article.date}</span>
                    </div>
                </div>
            </header>

            <div class="mb-16">
                <img src="${article.imageUrl}" alt="${article.title}" class="w-full max-h-[600px] object-cover rounded-sm shadow-sm">
            </div>

            <div class="prose prose-lg md:prose-xl dark:prose-invert mx-auto font-serif leading-loose text-gray-800 dark:text-gray-300 first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:font-serif">
                ${article.content}
            </div>
            
            <div class="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
                <h3 class="font-sans font-bold text-sm text-gray-400 uppercase tracking-widest mb-6">Benzer İçerikler</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                     ${similar.length > 0 ? similar.map(a => `
                        <div class="cursor-pointer group" onclick="routeToArticle(${a.id})">
                             <h4 class="font-serif font-bold text-xl mb-2 group-hover:text-blue-600 transition-colors">${a.title}</h4>
                             <p class="text-sm text-gray-500 line-clamp-2">${a.excerpt}</p>
                        </div>
                     `).join('') : '<p class="text-gray-400 text-sm">Benzer içerik bulunamadı.</p>'}
                </div>
            </div>
        </div>
    `;
};

const renderPage = (title, content) => `
    <div class="max-w-2xl mx-auto py-24 text-center">
        <h1 class="text-4xl font-serif font-bold mb-8">${title}</h1>
        <div class="w-12 h-1 bg-black dark:bg-white mx-auto mb-8"></div>
        <p class="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-serif">${content}</p>
    </div>
`;

// --- MAIN RENDER LOOP ---
const render = () => {
    // 1. Render Announcement
    renderAnnouncement();
    
    // 2. Render Sidebar list
    renderSidebarCategories();

    // 3. Render Main View
    let content = '';
    switch (state.view) {
        case 'home':
        case 'category':
            content = renderHome();
            break;
        case 'article':
            content = renderArticle();
            break;
        case 'about':
            content = renderPage('Hakkımızda', 'MIMOS, modern dünyada sadeliği, estetiği ve derinliği arayanlar için dijital bir dergidir. <br><br> Amacımız, gürültülü bilgi akışı arasında sakin bir liman olmak.');
            break;
        case 'contact':
            content = renderPage('İletişim', 'Projeleriniz ve iş birlikleri için bize ulaşın.<br><br><span class="font-bold">info@mimos.com</span><br>İstanbul, Türkiye');
            break;
        default:
            content = renderHome();
    }
    
    app.innerHTML = content;
    window.scrollTo(0, 0);
};

// --- GLOBAL ACTIONS ---

window.routeTo = (view) => {
    state.view = view;
    state.selectedCategory = null;
    toggleMenu(false);
    render();
};

window.routeToCategory = (cat) => {
    state.selectedCategory = cat;
    state.view = 'category';
    toggleMenu(false);
    render();
};

window.routeToArticle = (id) => {
    state.selectedArticleId = id;
    state.view = 'article';
    render();
};

window.closeAnnouncement = () => {
    state.announcement.active = false;
    render();
};

// --- EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', initApp);

document.getElementById('menu-btn').addEventListener('click', () => toggleMenu(true));
document.getElementById('sidebar-close').addEventListener('click', () => toggleMenu(false));
document.getElementById('sidebar-overlay').addEventListener('click', () => toggleMenu(false));

document.getElementById('theme-btn').addEventListener('click', toggleTheme);
document.getElementById('logo-btn').addEventListener('click', () => window.routeTo('home'));

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.getAttribute('data-page');
        window.routeTo(page);
    });
});