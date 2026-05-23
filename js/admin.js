// ============================================
// ADMIN DASHBOARD - NOTE & LEAD MANAGEMENT
// ============================================

(function() {
    'use strict';

    // ============ SUPABASE CONFIG ============
    const SUPABASE_URL = 'https://your-project-id.supabase.co';
    const SUPABASE_ANON_KEY = 'your-anon-key-here';
    
    let supabase;
    try {
        if (window.supabase) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
    } catch (e) {
        console.log('Supabase not configured');
    }

    // ============ NOTE GENERATOR ============
    function initNoteGenerator() {
        const form = document.getElementById('note-generator');
        const output = document.getElementById('generate-output');
        
        if (!form) return;
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const title = document.getElementById('gen-title').value;
            const filename = document.getElementById('gen-filename').value;
            const markdown = document.getElementById('gen-markdown').value;
            const lang = document.getElementById('gen-lang').value;
            
            const fullFilename = `${filename}-${lang}.md`;
            
            // Create downloadable file
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fullFilename;
            a.click();
            URL.revokeObjectURL(url);
            
            // Show success
            output.innerHTML = `
                <div class="success-message">
                    ✅ Generated: <strong>${fullFilename}</strong><br>
                    <small>Save this file in the /notes folder</small>
                </div>
            `;
            
            // Reset form
            form.reset();
        });
    }

    // ============ LINK GENERATOR ============
    function initLinkGenerator() {
        const input = document.getElementById('link-filename');
        const btn = document.getElementById('copy-link-btn');
        const output = document.getElementById('link-output');
        
        if (!btn) return;
        
        btn.addEventListener('click', function() {
            const filename = input.value.trim();
            if (!filename) {
                output.textContent = 'Please enter a filename';
                return;
            }
            
            const link = `notes.html?note=${filename}`;
            const fullLink = window.location.origin + '/' + link;
            
            navigator.clipboard.writeText(fullLink).then(() => {
                output.innerHTML = `
                    ✅ Link copied!<br>
                    <code>${fullLink}</code>
                `;
            });
        });
    }

    // ============ MARKDOWN PREVIEW ============
    function initMarkdownPreview() {
        const textarea = document.getElementById('preview-markdown');
        const preview = document.getElementById('live-preview');
        
        if (!textarea || !preview) return;
        
        if (typeof marked !== 'undefined') {
            textarea.addEventListener('input', function() {
                preview.innerHTML = marked.parse(this.value);
            });
        }
    }

    // ============ LEADS MANAGEMENT ============
    async function loadLeads() {
        const tbody = document.getElementById('leads-tbody');
        const totalSpan = document.getElementById('total-leads');
        
        if (!tbody) return;
        
        tbody.innerHTML = '<tr><td colspan="5">Loading leads...</td></tr>';
        
        try {
            if (supabase) {
                const { data, error } = await supabase
                    .from('leads')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                
                renderLeadsTable(data || []);
                if (totalSpan) totalSpan.textContent = data?.length || 0;
            } else {
                // Demo: show local storage leads
                const localLeads = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith('bca_unlock_')) {
                        localLeads.push({
                            name: 'Local User',
                            mobile: 'N/A',
                            note_title: key.replace('bca_unlock_', ''),
                            created_at: new Date().toISOString()
                        });
                    }
                }
                renderLeadsTable(localLeads);
                if (totalSpan) totalSpan.textContent = localLeads.length;
            }
        } catch (error) {
            console.error('Error loading leads:', error);
            tbody.innerHTML = '<tr><td colspan="5">Error loading leads</td></tr>';
        }
    }

    function renderLeadsTable(leads) {
        const tbody = document.getElementById('leads-tbody');
        if (!tbody) return;
        
        if (leads.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No leads yet</td></tr>';
            return;
        }
        
        tbody.innerHTML = leads.map(lead => `
            <tr>
                <td>${escapeHtml(lead.name || 'N/A')}</td>
                <td>${escapeHtml(lead.mobile || 'N/A')}</td>
                <td><span class="note-badge">${escapeHtml(lead.note_title || 'N/A')}</span></td>
                <td>${formatDate(lead.created_at)}</td>
                <td>
                    <button class="btn-small" onclick="deleteLead('${lead.id}')">🗑️</button>
                </td>
            </tr>
        `).join('');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // ============ EXPORT CSV ============
    async function exportCSV() {
        try {
            let leads = [];
            
            if (supabase) {
                const { data } = await supabase.from('leads').select('*');
                leads = data || [];
            } else {
                // Fallback
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith('bca_unlock_')) {
                        leads.push({
                            name: 'User',
                            mobile: 'N/A',
                            note_title: key.replace('bca_unlock_', ''),
                            created_at: new Date().toISOString()
                        });
                    }
                }
            }
            
            if (leads.length === 0) {
                alert('No leads to export');
                return;
            }
            
            const csvContent = [
                ['Name', 'Mobile', 'Note Title', 'Date'],
                ...leads.map(l => [l.name, l.mobile, l.note_title, l.created_at])
            ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `leads-export-${Date.now()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Export error:', error);
            alert('Error exporting leads');
        }
    }

    // ============ SEARCH LEADS ============
    function initLeadSearch() {
        const searchInput = document.getElementById('lead-search');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const rows = document.querySelectorAll('#leads-tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }

    // ============ INIT ============
    function init() {
        initNoteGenerator();
        initLinkGenerator();
        initMarkdownPreview();
        initLeadSearch();
        loadLeads();
        
        // Refresh leads button
        document.getElementById('refresh-leads')?.addEventListener('click', loadLeads);
        
        // Export CSV button
        document.getElementById('export-csv')?.addEventListener('click', exportCSV);
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

// Global delete function
window.deleteLead = async function(id) {
    if (!confirm('Delete this lead?')) return;
    // Implementation would go here
    alert('Lead deletion would be implemented with Supabase RLS');
};
