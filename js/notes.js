// ============================================
// NOTES READER - MARKDOWN RENDERING & UNLOCK
// ============================================

(function() {
    'use strict';

    // ============ SUPABASE CONFIG ============
    const SUPABASE_URL = 'https://your-project-id.supabase.co';
    const SUPABASE_ANON_KEY = 'your-anon-key-here';
    
    let supabase;
    try {
        if (window.supabase && SUPABASE_URL.includes('supabase')) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
    } catch (e) {
        console.log('Supabase not configured - using local storage fallback');
    }

    // ============ STATE ============
    let currentNote = '';
    let currentLang = 'en';
    let isUnlocked = false;

    // ============ DOM ELEMENTS ============
    const markdownBody = document.getElementById('markdown-body');
    const noteTitle = document.getElementById('note-title');
    const tocList = document.getElementById('toc-list');
    const previewLock = document.getElementById('preview-lock');
    const progressBar = document.getElementById('progress-bar');
    const langToggle = document.getElementById('lang-toggle');
    const langText = document.querySelector('.lang-text');
    const langIndicator = document.getElementById('lang-indicator');
    const unlockModal = document.getElementById('unlock-modal');
    const imageModal = document.getElementById('image-modal');
    const imageModalImg = document.getElementById('image-modal-img');
    const copyToast = document.getElementById('copy-toast');

    // ============ INIT ============
    function init() {
        const params = new URLSearchParams(window.location.search);
        currentNote = params.get('note') || 'c-basics';
        
        // Check unlock state
        isUnlocked = localStorage.getItem(`bca_unlock_${currentNote}`) === 'true';
        
        // Set up language toggle
        currentLang = localStorage.getItem('bca_lang') || 'en';
        updateLangUI();
        
        // Load note
        loadNote();
        
        // Event listeners
        setupEventListeners();
        
        // Progress bar
        window.addEventListener('scroll', updateProgressBar);
    }

    // ============ LOAD NOTE ============
    async function loadNote() {
        try {
            markdownBody.innerHTML = '<div class="loading-spinner">⏳ Loading notes...</div>';
            
            const fileName = getNoteFileName();
            const response = await fetch(`notes/${fileName}`);
            
            if (!response.ok) {
                throw new Error('Note not found');
            }
            
            const markdown = await response.text();
            renderMarkdown(markdown);
            
            // Update title
            if (noteTitle) {
                noteTitle.textContent = currentNote.replace(/-/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());
            }
            
            // Handle lock
            if (!isUnlocked) {
                applyPreviewLock();
            } else {
                previewLock.classList.add('hidden');
            }
            
            // Generate TOC
            generateTableOfContents();
            
        } catch (error) {
            markdownBody.innerHTML = `
                <div style="text-align:center; padding: 2rem;">
                    <p>😔 Note not found</p>
                    <p style="color: var(--text-secondary);">The requested note doesn't exist yet.</p>
                </div>
            `;
        }
    }

    function getNoteFileName() {
        return `${currentNote}-${currentLang}.md`;
    }

    function renderMarkdown(md) {
        // Configure marked
        marked.setOptions({
            breaks: true,
            gfm: true,
            highlight: function(code, lang) {
                if (window.hljs && lang && hljs.getLanguage(lang)) {
                    return hljs.highlight(code, { language: lang }).value;
                }
                return code;
            }
        });
        
        const html = marked.parse(md);
        markdownBody.innerHTML = html;
        
        // Add copy buttons to code blocks
        addCopyButtons();
        
        // Make images clickable
        makeImagesZoomable();
        
        // Highlight code
        if (window.hljs) {
            document.querySelectorAll('pre code').forEach(block => {
                hljs.highlightElement(block);
            });
        }
    }

    // ============ PREVIEW LOCK ============
    function applyPreviewLock() {
        // Show only first 30% of content
        const allElements = markdownBody.children;
        const totalElements = allElements.length;
        const visibleCount = Math.ceil(totalElements * 0.3);
        
        if (totalElements <= visibleCount) {
            previewLock.classList.add('hidden');
            return;
        }
        
        // Hide elements beyond 30%
        for (let i = visibleCount; i < totalElements; i++) {
            allElements[i].style.display = 'none';
        }
        
        previewLock.classList.remove('hidden');
    }

    async function unlockNote(name, mobile) {
        try {
            // Save to Supabase if configured
            if (supabase) {
                const { error } = await supabase
                    .from('leads')
                    .insert([{
                        name: name,
                        mobile: mobile,
                        note_title: currentNote,
                        created_at: new Date().toISOString()
                    }]);
                
                if (error) throw error;
            }
            
            // Unlock locally
            localStorage.setItem(`bca_unlock_${currentNote}`, 'true');
            isUnlocked = true;
            
            // Show all content
            markdownBody.querySelectorAll('*').forEach(el => {
                el.style.display = '';
            });
            
            previewLock.classList.add('hidden');
            unlockModal.classList.remove('active');
            
            showToast('✅ Notes unlocked successfully!');
            
        } catch (error) {
            console.error('Error saving lead:', error);
            // Still unlock locally even if Supabase fails
            localStorage.setItem(`bca_unlock_${currentNote}`, 'true');
            isUnlocked = true;
            markdownBody.querySelectorAll('*').forEach(el => el.style.display = '');
            previewLock.classList.add('hidden');
            unlockModal.classList.remove('active');
            showToast('✅ Notes unlocked!');
        }
    }

    // ============ TABLE OF CONTENTS ============
    function generateTableOfContents() {
        const headings = markdownBody.querySelectorAll('h2, h3');
        tocList.innerHTML = '';
        
        headings.forEach((heading, index) => {
            const id = `heading-${index}`;
            heading.id = id;
            
            const li = document.createElement('li');
            li.textContent = heading.textContent;
            li.style.paddingLeft = heading.tagName === 'H3' ? '1.5rem' : '0';
            li.addEventListener('click', () => {
                heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Close mobile TOC
                document.getElementById('toc-sidebar')?.classList.remove('mobile-open');
            });
            
            tocList.appendChild(li);
        });
        
        // Highlight active TOC item on scroll
        highlightActiveTocItem();
    }

    function highlightActiveTocItem() {
        const headings = markdownBody.querySelectorAll('h2, h3');
        const tocItems = tocList.querySelectorAll('li');
        
        window.addEventListener('scroll', () => {
            let current = '';
            headings.forEach(heading => {
                const top = heading.getBoundingClientRect().top;
                if (top < 100) {
                    current = heading.id;
                }
            });
            
            tocItems.forEach((item, index) => {
                item.classList.toggle('active', headings[index]?.id === current);
            });
        });
    }

    // ============ CODE COPY ============
    function addCopyButtons() {
        document.querySelectorAll('pre').forEach(pre => {
            const btn = document.createElement('button');
            btn.className = 'copy-code-btn';
            btn.textContent = '📋 Copy';
            btn.addEventListener('click', () => {
                const code = pre.querySelector('code')?.textContent || pre.textContent;
                navigator.clipboard.writeText(code).then(() => {
                    btn.textContent = '✅ Copied!';
                    setTimeout(() => btn.textContent = '📋 Copy', 2000);
                });
            });
            pre.style.position = 'relative';
            pre.appendChild(btn);
        });
    }

    // ============ IMAGE ZOOM ============
    function makeImagesZoomable() {
        markdownBody.querySelectorAll('img').forEach(img => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', () => {
                imageModalImg.src = img.src;
                imageModal.classList.add('active');
            });
        });
    }

    // ============ LANGUAGE TOGGLE ============
    function toggleLanguage() {
        currentLang = currentLang === 'en' ? 'hi' : 'en';
        localStorage.setItem('bca_lang', currentLang);
        updateLangUI();
        loadNote();
    }

    function updateLangUI() {
        if (langText) {
            langText.textContent = currentLang === 'en' ? 'हिन्दी' : 'English';
        }
        if (langIndicator) {
            langIndicator.textContent = currentLang === 'en' ? '🇬🇧 English' : '🇮🇳 हिन्दी';
        }
    }

    // ============ EVENT LISTENERS ============
    function setupEventListeners() {
        // Language toggle
        langToggle?.addEventListener('click', toggleLanguage);
        
        // Unlock trigger
        document.getElementById('unlock-trigger')?.addEventListener('click', () => {
            document.getElementById('lead-note-title').value = currentNote;
            unlockModal.classList.add('active');
        });
        
        // Lead form submit
        document.getElementById('lead-form')?.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('lead-name').value.trim();
            const mobile = document.getElementById('lead-mobile').value.trim();
            
            if (name && mobile && mobile.length >= 10) {
                unlockNote(name, mobile);
            }
        });
        
        // Close modals
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').classList.remove('active');
            });
        });
        
        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
        
        // TOC mobile toggle
        document.getElementById('toc-toggle')?.addEventListener('click', () => {
            document.getElementById('toc-sidebar')?.classList.toggle('mobile-open');
        });
        
        document.getElementById('toc-close')?.addEventListener('click', () => {
            document.getElementById('toc-sidebar')?.classList.remove('mobile-open');
        });
    }

    // ============ UTILITIES ============
    function updateProgressBar() {
        if (!progressBar) return;
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = Math.min((scrollTop / docHeight) * 100, 100);
        progressBar.style.width = progress + '%';
    }

    function showToast(message) {
        if (!copyToast) return;
        copyToast.textContent = message;
        copyToast.classList.add('show');
        setTimeout(() => copyToast.classList.remove('show'), 3000);
    }

    // ============ START ============
    init();

})();
