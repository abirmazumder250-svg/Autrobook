const pageCache = {}; 
let currentPage = '../pages/01-feed.html'; 

// Execute scripts dynamically inside loaded HTML fragments
function executeScripts(container) { 
    const scripts = container.querySelectorAll('script'); 
    scripts.forEach(oldScript => { 
        const newScript = document.createElement('script'); 
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value)); 
        newScript.appendChild(document.createTextNode(oldScript.innerHTML)); 
        oldScript.parentNode.replaceChild(newScript, oldScript); 
    }); 
} 

// Single Page Application (SPA) Navigation Handler
function navigateTo(page, addToHistory = true, forceRefresh = false) { 
    const loader = document.getElementById('page-loader'); 
    const container = document.getElementById('app-container'); 
    currentPage = page; 
    
    if (pageCache[page] && !forceRefresh) { 
        container.innerHTML = pageCache[page]; 
        executeScripts(container); 
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
        if (addToHistory) history.pushState({ page: page }, '', '#' + page); 
        updateActiveNav(page); 
        return; 
    } 
    
    loader.style.display = 'block'; 
    fetch(page) 
        .then(res => { 
            if (!res.ok) throw new Error('Page not found: ' + page); 
            return res.text(); 
        }) 
        .then(html => { 
            pageCache[page] = html; 
            container.innerHTML = html; 
            executeScripts(container); 
            window.scrollTo({ top: 0, behavior: 'smooth' }); 
            if (addToHistory) { 
                history.pushState({ page: page }, '', '#' + page); 
            } 
            updateActiveNav(page); 
        }) 
        .catch(err => { 
            console.error('Page load error:', err); 
            container.innerHTML = `
                <div style="text-align:center; padding:60px 20px;">
                    <h2>⚠️ Page Not Found</h2>
                    <p style="color:var(--sub); margin:10px 0;">Unable to load path: <code>${page}</code></p>
                    <button onclick="navigateTo('../pages/01-feed.html')" style="background:var(--brand); color:#fff; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">Back to Feed</button>
                </div>`; 
        }) 
        .finally(() => { 
            loader.style.display = 'none'; 
        }); 
} 

window.refreshCurrentPage = function() { 
    navigateTo(currentPage, false, true); 
    showToast('Refreshed ✨'); 
}; 

function loadComponent(containerId, file) { 
    const container = document.getElementById(containerId); 
    fetch(file) 
        .then(res => { 
            if (!res.ok) throw new Error(`Failed to load ${file}`); 
            return res.text(); 
        }) 
        .then(html => { 
            container.innerHTML = html; 
            executeScripts(container); 
        }) 
        .catch(err => console.error('Component load error:', err)); 
} 

function updateActiveNav(page) { 
    document.querySelectorAll('#bottom-nav-container [data-page]').forEach(el => { 
        el.classList.toggle('active', el.getAttribute('data-page') === page); 
    }); 
} 

window.toggleZenMode = function() { 
    const isZen = document.body.classList.toggle('zen-active'); 
    localStorage.setItem('autrobook_zen', isZen ? 'on' : 'off'); 
    showToast(isZen ? '🧘 Zen Mode Enabled' : 'Zen Mode Disabled'); 
}; 

window.toggleTheme = function() { 
    const isLight = document.body.classList.toggle('light'); 
    localStorage.setItem('theme', isLight ? 'light' : 'dark'); 
    showToast(isLight ? '☀️ Light Theme' : '🌙 Dark Green Theme'); 
}; 

window.logoutUser = function() { 
    if (!confirm('Are you sure you want to log out of Autrobook?')) return; 
    localStorage.removeItem('autrobook_user'); 
    window.location.replace('../login.html'); 
}; 

window.playLikeSound = function() { 
    const audio = document.getElementById('like-sound'); 
    if (audio) { 
        audio.currentTime = 0; 
        audio.play().catch(() => {}); 
    } 
}; 

window.showToast = function(msg) { 
    const t = document.getElementById('global-toast'); 
    t.textContent = msg; 
    t.style.display = 'block'; 
    setTimeout(() => { t.style.display = 'none'; }, 2500); 
}; 

// Network Online/Offline Listeners
window.addEventListener('offline', () => { 
    const banner = document.getElementById('network-banner'); 
    banner.className = 'net-offline'; 
    banner.textContent = '⚠️ You are currently offline. Check your internet connection.'; 
    banner.style.display = 'block'; 
}); 

window.addEventListener('online', () => { 
    const banner = document.getElementById('network-banner'); 
    banner.className = 'net-online'; 
    banner.textContent = '✅ Back online!'; 
    banner.style.display = 'block'; 
    setTimeout(() => { banner.style.display = 'none'; }, 3000); 
}); 

window.addEventListener('popstate', (e) => { 
    if (e.state && e.state.page) { 
        navigateTo(e.state.page, false); 
    } 
}); 

// Initial Load on Startup
window.onload = function() { 
    if (localStorage.getItem('theme') === 'light') document.body.classList.add('light'); 
    if (localStorage.getItem('autrobook_zen') === 'on') document.body.classList.add('zen-active'); 
    
    loadComponent('header-container', '../pages/47-header.html'); 
    loadComponent('bottom-nav-container', '../pages/48-bottom-nav.html'); 
    
    const initialPage = window.location.hash ? window.location.hash.substring(1) : '../pages/01-feed.html'; 
    navigateTo(initialPage, false); 
};
