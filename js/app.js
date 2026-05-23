// ============================================
// BCA NOTES - MAIN APPLICATION
// ============================================

(function() {
    'use strict';

    // ============ DATA STORE ============
    const semesters = [
        { id: 1, name: 'Semester 1', icon: '📘', subjects: 5 },
        { id: 2, name: 'Semester 2', icon: '📙', subjects: 6 },
        { id: 3, name: 'Semester 3', icon: '📗', subjects: 5 },
        { id: 4, name: 'Semester 4', icon: '📕', subjects: 6 },
        { id: 5, name: 'Semester 5', icon: '📓', subjects: 5 },
        { id: 6, name: 'Semester 6', icon: '📔', subjects: 4 }
    ];

    const subjectsBySemester = {
        1: [
            { id: 'c-programming', name: 'C Programming', icon: '💻', units: 5 },
            { id: 'mathematics-1', name: 'Mathematics I', icon: '🔢', units: 4 },
            { id: 'digital-electronics', name: 'Digital Electronics', icon: '⚡', units: 4 },
            { id: 'communication-skills', name: 'Communication Skills', icon: '💬', units: 3 },
            { id: 'computer-fundamentals', name: 'Computer Fundamentals', icon: '🖥️', units: 4 }
        ],
        2: [
            { id: 'data-structures', name: 'Data Structures', icon: '🏗️', units: 5 },
            { id: 'mathematics-2', name: 'Mathematics II', icon: '📐', units: 4 },
            { id: 'dbms', name: 'Database Management', icon: '🗄️', units: 5 },
            { id: 'oop-cpp', name: 'OOP with C++', icon: '🎯', units: 5 },
            { id: 'os-basics', name: 'Operating Systems', icon: '⚙️', units: 4 },
            { id: 'web-tech', name: 'Web Technologies', icon: '🌐', units: 4 }
        ],
        3: [
            { id: 'java', name: 'Java Programming', icon: '☕', units: 5 },
            { id: 'computer-networks', name: 'Computer Networks', icon: '🔗', units: 5 },
            { id: 'software-engineering', name: 'Software Engineering', icon: '🛠️', units: 4 },
            { id: 'python', name: 'Python Programming', icon: '🐍', units: 4 },
            { id: 'discrete-math', name: 'Discrete Mathematics', icon: '🧮', units: 4 }
        ]
    };

    const unitsBySubject = {
        'c-programming': [
            { id: 'unit1', name: 'Unit 1: Introduction to C', notes: ['c-basics', 'c-history'] },
            { id: 'unit2', name: 'Unit 2: Data Types & Operators', notes: ['c-datatypes', 'operators'] },
            { id: 'unit3', name: 'Unit 3: Control Structures', notes: ['control-flow', 'loops'] },
            { id: 'unit4', name: 'Unit 4: Arrays & Strings', notes: ['arrays', 'strings'] },
            { id: 'unit5', name: 'Unit 5: Pointers & Functions', notes: ['pointers', 'functions'] }
        ],
        'data-structures': [
            { id: 'unit1', name: 'Unit 1: Introduction to DS', notes: ['ds-intro'] },
            { id: 'unit2', name: 'Unit 2: Arrays & Linked Lists', notes: ['ds-arrays', 'linked-list'] },
            { id: 'unit3', name: 'Unit 3: Stacks & Queues', notes: ['stacks', 'queues'] },
            { id: 'unit4', name: 'Unit 4: Trees', notes: ['trees', 'binary-tree'] },
            { id: 'unit5', name: 'Unit 5: Graphs', notes: ['graphs'] }
        ]
    };

    // ============ UTILITY FUNCTIONS ============
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    function getCurrentPage() {
        const path = window.location.pathname.split('/').pop() || 'index.html';
        return path.replace('.html', '');
    }

    // ============ PAGE RENDERERS ============
    function renderSemesters(containerId = 'semester-grid') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = semesters.map(sem => `
            <a href="subject.html?sem=${sem.id}" class="card semester-card">
                <span class="card-icon">${sem.icon}</span>
                <h3>${sem.name}</h3>
                <p>${sem.subjects} Subjects</p>
                <span class="card-arrow">→</span>
            </a>
        `).join('');
    }

    function renderSubjects() {
        const semId = getQueryParam('sem');
        const container = document.getElementById('subject-grid');
        const heading = document.getElementById('subject-heading');
        
        if (!container || !semId) return;

        const subjects = subjectsBySemester[parseInt(semId)] || [];
        const semName = semesters.find(s => s.id === parseInt(semId))?.name || `Semester ${semId}`;
        
        if (heading) {
            heading.textContent = `${semName} - Subjects`;
        }

        container.innerHTML = subjects.map(sub => `
            <a href="unit.html?subject=${sub.id}&sem=${semId}" class="card subject-card">
                <span class="card-icon">${sub.icon}</span>
                <h3>${sub.name}</h3>
                <p>${sub.units} Units</p>
            </a>
        `).join('');
    }

    function renderUnits() {
        const subjectId = getQueryParam('subject');
        const semId = getQueryParam('sem');
        const container = document.getElementById('unit-grid');
        const heading = document.getElementById('unit-heading');
        
        if (!container || !subjectId) return;

        const units = unitsBySubject[subjectId] || [];
        
        if (heading) {
            const subjectName = Object.values(subjectsBySemester)
                .flat()
                .find(s => s.id === subjectId)?.name || subjectId;
            heading.textContent = subjectName + ' - Units';
        }

        container.innerHTML = units.map(unit => `
            <div class="card unit-card">
                <h3>${unit.name}</h3>
                <div class="note-links">
                    ${unit.notes.map(note => `
                        <a href="notes.html?note=${note}&subject=${subjectId}" class="note-link">
                            📝 ${note.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </a>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    function renderTrendingSubjects() {
        const container = document.getElementById('trending-grid');
        if (!container) return;

        const trendingSubjects = [
            { id: 'c-programming', name: 'C Programming', icon: '💻', sem: 'Sem 1' },
            { id: 'data-structures', name: 'Data Structures', icon: '🏗️', sem: 'Sem 2' },
            { id: 'java', name: 'Java Programming', icon: '☕', sem: 'Sem 3' },
            { id: 'python', name: 'Python', icon: '🐍', sem: 'Sem 3' },
            { id: 'dbms', name: 'DBMS', icon: '🗄️', sem: 'Sem 2' }
        ];

        container.innerHTML = trendingSubjects.map(sub => `
            <a href="unit.html?subject=${sub.id}" class="card trending-card">
                <span class="card-icon">${sub.icon}</span>
                <h3>${sub.name}</h3>
                <span class="sem-badge">${sub.sem}</span>
            </a>
        `).join('');
    }

    function renderLatestNotes() {
        const container = document.getElementById('latest-notes');
        if (!container) return;

        const notes = [
            { file: 'c-basics', title: 'C Programming Basics', subject: 'C Programming' },
            { file: 'arrays', title: 'Arrays in C', subject: 'C Programming' },
            { file: 'pointers', title: 'Pointers Deep Dive', subject: 'C Programming' },
            { file: 'ds-intro', title: 'Data Structures Introduction', subject: 'Data Structures' }
        ];

        container.innerHTML = notes.map(note => `
            <a href="notes.html?note=${note.file}" class="card note-preview-card">
                <h3>${note.title}</h3>
                <p>📚 ${note.subject}</p>
            </a>
        `).join('');
    }

    // ============ SEARCH FUNCTIONALITY ============
    function initSearch() {
        const searchInput = document.getElementById('global-search');
        const searchResults = document.getElementById('search-results');
        
        if (!searchInput || !searchResults) return;

        // Build search index
        const searchIndex = [];
        
        Object.values(subjectsBySemester).forEach(subjects => {
            subjects.forEach(sub => {
                searchIndex.push({
                    type: 'subject',
                    name: sub.name,
                    id: sub.id,
                    route: `unit.html?subject=${sub.id}`
                });
            });
        });

        Object.values(unitsBySubject).forEach(units => {
            units.forEach(unit => {
                unit.notes.forEach(note => {
                    searchIndex.push({
                        type: 'note',
                        name: note.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        id: note,
                        route: `notes.html?note=${note}`
                    });
                });
            });
        });

        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            
            if (query.length < 2) {
                searchResults.classList.remove('active');
                searchResults.innerHTML = '';
                return;
            }

            const matches = searchIndex.filter(item => 
                item.name.toLowerCase().includes(query)
            );

            if (matches.length > 0) {
                searchResults.innerHTML = matches.map(item => `
                    <a href="${item.route}" class="search-result-item">
                        <span class="result-type">${item.type === 'subject' ? '📚' : '📝'}</span>
                        <span>${item.name}</span>
                    </a>
                `).join('');
                searchResults.classList.add('active');
            } else {
                searchResults.innerHTML = '<p class="no-results">No results found</p>';
                searchResults.classList.add('active');
            }
        });

        // Close search on click outside
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.remove('active');
            }
        });
    }

    // ============ ACCORDION ============
    function initAccordion() {
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', function() {
                const item = this.parentElement;
                item.classList.toggle('active');
            });
        });
    }

    // ============ PROGRESS BAR ============
    function initProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        if (!progressBar) return;

        window.addEventListener('scroll', function() {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            progressBar.style.width = Math.min(progress, 100) + '%';
        });
    }

    // ============ MOBILE MENU ============
    function initMobileMenu() {
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');
        
        if (!menuBtn || !navLinks) return;

        menuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('mobile-active');
        });
    }

    // ============ INITIALIZATION ============
    function init() {
        const page = getCurrentPage();

        switch(page) {
            case 'index':
                renderSemesters();
                renderTrendingSubjects();
                renderLatestNotes();
                initSearch();
                break;
            case 'semester':
                renderSemesters('semester-grid');
                break;
            case 'subject':
                renderSubjects();
                break;
            case 'unit':
                renderUnits();
                initAccordion();
                break;
        }

        initProgressBar();
        initMobileMenu();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
