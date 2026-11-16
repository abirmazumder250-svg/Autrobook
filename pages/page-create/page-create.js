/* ==========================================================
   AUTROBOOK - ADVANCED PAGE CREATION SCRIPT
   ========================================================== */

function createAdvancedPage() {
    const pageName = document.getElementById('pageName').value.trim();
    const pageHandle = document.getElementById('pageHandle').value.trim();
    const pageCategory = document.getElementById('pageCategory').value;
    const pageBio = document.getElementById('pageBio').value.trim();
    const aiModeration = document.getElementById('aiModeration').value;
    const ghostModeActive = document.getElementById('adminGhostMode').checked;

    if (!pageName) {
        alert('Please enter a valid Page Name!');
        document.getElementById('pageName').focus();
        return;
    }

    if (!pageHandle) {
        alert('Please enter a unique page handle/username!');
        document.getElementById('pageHandle').focus();
        return;
    }

    // Creating page package object
    const newPageData = {
        name: pageName,
        handle: pageHandle,
        category: pageCategory,
        bio: pageBio,
        aiModerationLevel: aiModeration,
        ghostMode: ghostModeActive,
        createdAt: Date.now()
    };

    // Save configuration locally
    localStorage.setItem('autrobook_created_page', JSON.stringify(newPageData));

    alert(`Success! Page "${pageName}" (@${pageHandle}) created successfully with AI Moderation (${aiModeration})! 🎉`);
    
    // Redirect to main newsfeed or dashboard
    window.location.href = '../01-feed.html';
}
