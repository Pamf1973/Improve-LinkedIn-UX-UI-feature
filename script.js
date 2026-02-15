/**
 * MatchPoint — Live Job Discovery
 * Multi-source: Remotive + Jobicy + RemoteOK APIs (free, no auth)
 * Persistent: localStorage for saved, archived, preferences
 */

// ============================================
// Config
// ============================================
const CFG = {
    remotiveUrl: 'https://remotive.com/api/remote-jobs',
    jobicyUrl: 'https://jobicy.com/api/v2/remote-jobs',
    remoteOkUrl: 'https://remoteok.com/api',
    remotiveLimit: 50,
    jobicyLimit: 50,
    searchDebounce: 600
};

const CATEGORIES = [
    { id: 'software-dev', label: 'Software Dev', icon: 'fa-code' },
    { id: 'design', label: 'Design', icon: 'fa-palette' },
    { id: 'product', label: 'Product', icon: 'fa-box' },
    { id: 'marketing', label: 'Marketing', icon: 'fa-bullhorn' },
    { id: 'data', label: 'Data', icon: 'fa-database' },
    { id: 'devops', label: 'DevOps & Infra', icon: 'fa-server' },
    { id: 'customer-support', label: 'Support', icon: 'fa-headset' },
    { id: 'sales', label: 'Sales', icon: 'fa-handshake' },
    { id: 'finance-legal', label: 'Finance & Legal', icon: 'fa-scale-balanced' },
    { id: 'hr', label: 'Human Resources', icon: 'fa-users' },
    { id: 'qa', label: 'QA', icon: 'fa-bug' },
    { id: 'writing', label: 'Writing', icon: 'fa-pen' }
];

const JOB_TYPES = [
    { id: 'full_time', label: 'Full-time', icon: 'fa-briefcase' },
    { id: 'contract', label: 'Contract', icon: 'fa-file-contract' },
    { id: 'part_time', label: 'Part-time', icon: 'fa-clock' },
    { id: 'freelance', label: 'Freelance', icon: 'fa-laptop' },
    { id: 'internship', label: 'Internship', icon: 'fa-graduation-cap' }
];

const APP_STATUSES = [
    { id: 'saved', label: 'Saved', icon: 'fa-bookmark' },
    { id: 'applied', label: 'Applied', icon: 'fa-paper-plane' },
    { id: 'interviewing', label: 'Interviewing', icon: 'fa-comments' },
    { id: 'offered', label: 'Offered', icon: 'fa-gift' },
    { id: 'rejected', label: 'Rejected', icon: 'fa-times-circle' },
    { id: 'accepted', label: 'Accepted', icon: 'fa-check-circle' },
];

const SKIP_REASONS = [
    { id: 'not-relevant',  label: 'Not relevant to me',   icon: 'fa-bullseye'        },
    { id: 'low-salary',    label: 'Salary too low',        icon: 'fa-dollar-sign'     },
    { id: 'bad-location',  label: 'Wrong location',        icon: 'fa-map-marker-alt'  },
    { id: 'not-qualified', label: "Don't meet requirements", icon: 'fa-graduation-cap' },
    { id: 'bad-company',   label: 'Not interested in company', icon: 'fa-building'     },
    { id: 'other',         label: 'Other reason',          icon: 'fa-ellipsis-h'      },
];

// ============================================
// Helpers
// ============================================
const titleCase = s => s.replace(/\b\w/g, c => c.toUpperCase());
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function parseSalaryMin(s) {
    if (!s) return 0;
    const m = s.match(/[\d,]+/g);
    return m ? parseInt(m[0].replace(/,/g, ''), 10) : 0;
}

function daysAgo(d) {
    if (!d) return 999;
    return Math.max(0, Math.floor((Date.now() - new Date(d)) / 864e5));
}

function postedLabel(days) {
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days <= 30) return `${days}d ago`;
    if (days <= 365) return `${Math.floor(days / 30)}mo ago`;
    return 'Over a year ago';
}

function fmtType(t) {
    if (!t || t === 'undefined' || t === 'null') return 'Full-time';
    const map = {
        full_time: 'Full-time',
        part_time: 'Part-time',
        contract: 'Contract',
        freelance: 'Freelance',
        internship: 'Internship'
    };
    return map[t] || titleCase(t.replace(/_/g, ' '));
}

function logoUrl(name, raw) {
    if (raw && raw.startsWith('http')) return raw;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0a66c2&color=fff&size=100&bold=true`;
}

function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function isEnglish(text) {
    if (!text) return true;
    const nonAscii = text.replace(/[\x00-\x7F]/g, '').length;
    return nonAscii / text.length < 0.15;
}

// ============================================
// Local Storage
// ============================================
const Store = {
    get(k) { try { return JSON.parse(localStorage.getItem('mp_' + k)); } catch { return null; } },
    set(k, v) { localStorage.setItem('mp_' + k, JSON.stringify(v)); },
    del(k) { localStorage.removeItem('mp_' + k); }
};

// ============================================
// API — Multi Source
// ============================================
const apiCache = new Map();
let viewedCount = parseInt(Store.get('viewedCount')) || 0;

async function fetchAllJobs(query = '', categories = []) {
    const key = `${query}|${categories.sort().join(',')}`;
    if (apiCache.has(key)) return apiCache.get(key);

    const requests = [];

    // Remotive — one request per category (max 3)
    const cats = categories.length > 0 ? categories.slice(0, 3) : [''];
    for (const cat of cats) {
        requests.push(fetchRemotive(query, cat));
    }

    // Jobicy
    requests.push(fetchJobicy(query));

    // RemoteOK
    requests.push(fetchRemoteOK(query));

    const results = await Promise.allSettled(requests);
    let jobs = [];
    for (const r of results) {
        if (r.status === 'fulfilled') jobs.push(...r.value);
    }

    // Filter out non-English listings
    jobs = jobs.filter(j => isEnglish(j.title) && isEnglish(j.company));

    // Deduplicate by title + company
    const seen = new Set();
    jobs = jobs.filter(j => {
        const k = (j.title + j.company).toLowerCase().replace(/\s/g, '');
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });

    // Sort by match desc
    jobs.sort((a, b) => b.match - a.match);

    if (jobs.length === 0) jobs = fallbackJobs();
    apiCache.set(key, jobs);
    return jobs;
}

async function fetchRemotive(query, category) {
    const p = new URLSearchParams({ limit: String(CFG.remotiveLimit) });
    if (query) p.set('search', query);
    if (category) p.set('category', category);
    const res = await fetch(`${CFG.remotiveUrl}?${p}`);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    return (data.jobs || []).map(r => mapRemotive(r));
}

async function fetchJobicy(query) {
    const p = new URLSearchParams({ count: String(CFG.jobicyLimit), geo: 'usa' });
    if (query) p.set('tag', query);
    const res = await fetch(`${CFG.jobicyUrl}?${p}`);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    return (data.jobs || []).map(r => mapJobicy(r));
}

async function fetchRemoteOK(query) {
    const res = await fetch(CFG.remoteOkUrl);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    // First element is a legal notice, jobs start at index 1
    let jobs = (Array.isArray(data) ? data.slice(1) : []).map(r => mapRemoteOK(r));
    if (query) {
        const q = query.toLowerCase();
        jobs = jobs.filter(j =>
            j.title.toLowerCase().includes(q) ||
            j.company.toLowerCase().includes(q) ||
            j.skills.some(s => s.toLowerCase().includes(q))
        );
    }
    return jobs.slice(0, 30);
}

function getUserSkills() {
    const prefs = Store.get('prefs');
    if (prefs && prefs.skills && prefs.skills.length) return prefs.skills.map(s => s.toLowerCase());
    return ['javascript', 'react', 'design', 'figma', 'css', 'html', 'python', 'product', 'ui', 'ux',
        'typescript', 'node', 'marketing', 'data', 'analytics', 'devops', 'aws', 'docker',
        'sql', 'git', 'agile', 'management', 'engineering', 'frontend', 'backend', 'mobile'];
}

function scoreMatch(tags) {
    const skills = getUserSkills();
    const matched = tags.filter(t => skills.some(s => t.toLowerCase().includes(s)));
    if (!tags.length) return 70 + (Math.random() * 20 | 0);
    return clamp(Math.round((matched.length / tags.length) * 40 + Math.random() * 25 + 35), 60, 99);
}

function getMatched(tags) {
    const skills = getUserSkills();
    return tags.filter(t => skills.some(s => t.toLowerCase().includes(s)));
}

function mapRemotive(r) {
    const tags = (r.tags || []).map(t => titleCase(t.trim())).filter(Boolean);
    return {
        id: 'rm-' + r.id,
        title: (r.title || '').replace(/\s*\[.*?\]/g, '').trim() || 'Untitled',
        company: r.company_name || 'Unknown',
        logo: logoUrl(r.company_name || 'U', r.company_logo),
        location: r.candidate_required_location || 'Worldwide',
        locationType: 'remote',
        salary: r.salary || '',
        salaryMin: parseSalaryMin(r.salary),
        match: scoreMatch(tags),
        postedDays: daysAgo(r.publication_date),
        description: r.description || '',
        isHtml: true,
        skills: tags.slice(0, 6),
        userSkillMatch: getMatched(tags).slice(0, 6),
        url: r.url || '',
        jobType: fmtType(r.job_type),
        category: r.category || '',
        source: 'remotive'
    };
}

function mapJobicy(r) {
    const tags = [r.jobIndustry, ...(r.jobType || '').split(',')].map(t => titleCase((t || '').trim())).filter(Boolean);
    const salaryStr = (r.salaryMin && r.salaryMax) ? `$${(r.salaryMin / 1000).toFixed(0)}K–$${(r.salaryMax / 1000).toFixed(0)}K ${r.salaryCurrency || 'USD'}` : '';
    return {
        id: 'jc-' + r.id,
        title: (r.jobTitle || '').trim() || 'Untitled',
        company: r.companyName || 'Unknown',
        logo: logoUrl(r.companyName || 'U', r.companyLogo),
        location: r.jobGeo || 'Anywhere',
        locationType: 'remote',
        salary: salaryStr,
        salaryMin: r.salaryMin || 0,
        match: scoreMatch(tags),
        postedDays: daysAgo(r.pubDate),
        description: r.jobDescription || r.jobExcerpt || '',
        isHtml: true,
        skills: tags.slice(0, 6),
        userSkillMatch: getMatched(tags).slice(0, 6),
        url: r.url || '',
        jobType: fmtType((r.jobType || '').split(',')[0]?.trim().toLowerCase().replace(/[\s-]+/g, '_')),
        category: r.jobIndustry || '',
        source: 'jobicy'
    };
}

function mapRemoteOK(r) {
    const tags = (r.tags || []).map(t => titleCase(t.trim())).filter(Boolean);
    const salaryStr = (r.salary_min && r.salary_max) ? `$${(r.salary_min / 1000).toFixed(0)}K–$${(r.salary_max / 1000).toFixed(0)}K` : '';
    return {
        id: 'rok-' + r.id,
        title: (r.position || '').trim() || 'Untitled',
        company: r.company || 'Unknown',
        logo: logoUrl(r.company || 'U', r.company_logo),
        location: r.location || 'Worldwide',
        locationType: 'remote',
        salary: salaryStr,
        salaryMin: r.salary_min || 0,
        match: scoreMatch(tags),
        postedDays: daysAgo(r.date),
        description: r.description || '',
        isHtml: true,
        skills: tags.slice(0, 6),
        userSkillMatch: getMatched(tags).slice(0, 6),
        url: r.apply_url || r.url || '',
        jobType: 'Full-time',
        category: '',
        source: 'remoteok'
    };
}

function fallbackJobs() {
    const base = [
        { id: 'fb-1', title: 'Senior Product Designer', company: 'Stripe', location: 'San Francisco, CA', salary: '$140K–$180K', salaryMin: 140000, skills: ['Figma', 'Design Systems', 'Product Strategy'], jobType: 'Full-time', postedDays: 2, description: '<p>Lead end-to-end UI/UX design for flagship fintech products.</p><h3>Responsibilities</h3><ul><li>Design world-class fintech interfaces</li><li>Collaborate with PM and engineering</li><li>Lead design systems across 4 product lines</li></ul>' },
        { id: 'fb-2', title: 'Frontend Engineer', company: 'TikTok', location: 'Los Angeles, CA', salary: '$120K–$160K', salaryMin: 120000, skills: ['React', 'TypeScript', 'CSS', 'Performance'], jobType: 'Full-time', postedDays: 1, description: '<p>Build the future of digital entertainment at massive scale.</p><h3>Requirements</h3><ul><li>3+ years frontend experience</li><li>React and TypeScript proficiency</li><li>Performance optimization expertise</li></ul>' },
        { id: 'fb-3', title: 'Staff Product Designer', company: 'Figma', location: 'San Francisco, CA', salary: '$180K–$220K', salaryMin: 180000, skills: ['Systems Thinking', 'Design Tools', 'UX Research'], jobType: 'Full-time', postedDays: 5, description: '<p>Design the future of design tools used by millions worldwide.</p>' },
        { id: 'fb-4', title: 'Lead Product Designer', company: 'Netflix', location: 'Los Gatos, CA', salary: '$200K–$280K', salaryMin: 200000, skills: ['Team Leadership', 'Entertainment', 'Data-Driven Design'], jobType: 'Full-time', postedDays: 3, description: '<p>Reimagine how millions discover and enjoy content.</p>' },
        { id: 'fb-5', title: 'Product Designer', company: 'Airbnb', location: 'Seattle, WA', salary: '$150K–$190K', salaryMin: 150000, skills: ['Mobile Design', 'Figma', 'User Research'], jobType: 'Full-time', postedDays: 1, description: '<p>Design experiences that connect people around the world.</p>' },
        { id: 'fb-6', title: 'Senior UX Engineer', company: 'Google', location: 'Mountain View, CA', salary: '$160K–$200K', salaryMin: 160000, skills: ['JavaScript', 'Accessibility', 'Design Engineering'], jobType: 'Full-time', postedDays: 4, description: '<p>Bridge design and engineering on core products.</p>' },
    ];
    return base.map(j => ({
        ...j,
        logo: `https://logo.clearbit.com/${j.company.toLowerCase().replace(/\s+/g, '')}.com?size=100`,
        locationType: 'remote', match: 80 + Math.floor(Math.random() * 15), isHtml: true,
        userSkillMatch: j.skills.slice(0, 2),
        url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(j.title + ' ' + j.company)}`,
        category: 'Design', source: 'fallback'
    }));
}

// ============================================
// Toast
// ============================================
class ToastManager {
    constructor() { this.el = document.getElementById('toast-container'); }
    show(msg, type = 'default', ms = 2500) {
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        const icons = { success: 'fa-check', error: 'fa-times', archive: 'fa-archive', default: 'fa-info-circle' };
        t.innerHTML = `<i class="fas ${icons[type] || icons.default}"></i><span>${msg}</span>`;
        this.el.appendChild(t);
        if (navigator.vibrate) navigator.vibrate(type === 'success' ? [50, 30, 50] : 30);
        setTimeout(() => { t.classList.add('toast-exit'); setTimeout(() => t.remove(), 200); }, ms);
    }
}

// ============================================
// View Manager
// ============================================
class ViewManager {
    constructor() {
        this.current = 'stack';
        this.views = ['stack', 'saved', 'skipped', 'archived', 'preferences', 'home', 'network', 'messages'];
        // Sidebar links
        document.querySelectorAll('.sidebar-links li[data-view]').forEach(li => {
            li.addEventListener('click', () => this.switchTo(li.dataset.view));
        });
        // Top nav items
        document.querySelectorAll('.nav-item[data-view]').forEach(item => {
            item.addEventListener('click', () => this.switchTo(item.dataset.view));
        });
    }

    switchTo(name) {
        if (!this.views.includes(name)) return;
        this.views.forEach(v => {
            document.getElementById(`view-${v}`)?.classList.toggle('active', v === name);
            document.getElementById(`header-${v}`)?.classList.toggle('active', v === name);
        });
        document.querySelectorAll('.sidebar-links li[data-view]').forEach(li => {
            li.classList.toggle('active', li.dataset.view === name);
        });
        document.querySelectorAll('.nav-item[data-view]').forEach(item => {
            item.classList.toggle('active', item.dataset.view === name);
        });
        this.current = name;
        window.dispatchEvent(new CustomEvent('viewchange', { detail: name }));
    }
}

// ============================================
// Saved Jobs Manager
// ============================================
class SavedJobsManager {
    constructor() {
        this.jobs = (Store.get('saved') || []).map(j => ({
            ...j,
            appStatus: j.appStatus || 'saved',
            appStatusUpdatedAt: j.appStatusUpdatedAt || j.savedAt || Date.now(),
            notes: j.notes || '',
        }));
        this.listEl = document.getElementById('saved-jobs-list');
        this.countEl = document.getElementById('saved-count');
        this.footerEl = document.getElementById('panel-footer');
        this.gridEl = document.getElementById('saved-grid');
        this.sortBy = 'recent';
        this.statusFilter = 'all';

        document.getElementById('apply-all-btn')?.addEventListener('click', () => this.openNextLink());

        // Sort buttons
        document.querySelectorAll('.sort-pill[data-sort]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sort-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.sortBy = btn.dataset.sort;
                this.renderGrid();
            });
        });

        this.bindStatusFilters();
    }

    save() { Store.set('saved', this.jobs); }

    addJob(job) {
        if (this.jobs.find(j => j.id === job.id)) return;
        this.jobs.unshift({ ...job, opened: false, savedAt: Date.now(), appStatus: 'saved', appStatusUpdatedAt: Date.now(), notes: '' });
        this.save();
        this.render();
    }

    removeJob(id) {
        this.jobs = this.jobs.filter(j => j.id !== id);
        this.save();
        this.render();
    }

    markOpened(id) {
        const j = this.jobs.find(j => j.id === id);
        if (j) { j.opened = true; this.save(); setTimeout(() => this.render(), 300); }
        if (j) window.toast.show(`Opening ${j.company}...`, 'success');
    }

    openNextLink() {
        const next = this.jobs.find(j => j.url && !j.opened);
        if (!next) { window.toast.show('All links opened!', 'default'); return; }
        window.open(next.url, '_blank');
        next.opened = true;
        this.save();
        this.render();
        window.toast.show(`Opened ${next.company}`, 'success');
    }

    updateStatus(id, newStatus) {
        const j = this.jobs.find(j => j.id === id);
        if (!j) return;
        j.appStatus = newStatus;
        j.appStatusUpdatedAt = Date.now();
        if (newStatus !== 'saved') j.opened = true;
        this.save();
        this.render();
        const statusObj = APP_STATUSES.find(s => s.id === newStatus);
        window.toast.show(`Status: ${statusObj ? statusObj.label : newStatus}`, 'success');
    }

    updateNotes(id, text) {
        const j = this.jobs.find(j => j.id === id);
        if (!j) return;
        j.notes = text;
        this.save();
    }

    getMailtoUrl(job) {
        const subject = encodeURIComponent(`Follow-up: ${job.title} at ${job.company}`);
        const body = encodeURIComponent(`Hi,\n\nI recently applied for the ${job.title} position at ${job.company} and wanted to follow up on my application.\n\nI'm very interested in this opportunity and would love to discuss how my skills align with the role.\n\nThank you for your time.\n\nBest regards`);
        return `mailto:?subject=${subject}&body=${body}`;
    }

    getCompanySearchUrl(job) {
        const q = encodeURIComponent(`${job.company} careers contact`);
        return `https://www.google.com/search?q=${q}`;
    }

    bindStatusFilters() {
        const container = document.getElementById('status-filters');
        if (!container) return;
        container.addEventListener('click', e => {
            const pill = e.target.closest('.status-filter-pill');
            if (!pill) return;
            container.querySelectorAll('.status-filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            this.statusFilter = pill.dataset.status;
            this.renderGrid();
        });
    }

    getSorted() {
        let list = [...this.jobs];
        if (this.statusFilter && this.statusFilter !== 'all') {
            list = list.filter(j => j.appStatus === this.statusFilter);
        }
        if (this.sortBy === 'match') list.sort((a, b) => b.match - a.match);
        else if (this.sortBy === 'salary') list.sort((a, b) => b.salaryMin - a.salaryMin);
        return list;
    }

    render() {
        this.updateBadges();
        this.renderSidebar();
        this.renderGrid();
    }

    updateBadges() {
        const n = this.jobs.length;
        this.countEl.textContent = n;
        this.footerEl.style.display = n > 0 ? 'block' : 'none';
        document.getElementById('easy-apply-count').textContent = n;
        const badge = document.getElementById('badge-saved');
        const badgeMobile = document.getElementById('badge-saved-mobile');
        if (badge) badge.textContent = n || '';
        if (badgeMobile) badgeMobile.textContent = n || '';
        document.getElementById('saved-view-count').textContent = `${n} job${n !== 1 ? 's' : ''}`;
        document.getElementById('stat-saved').textContent = n;

        // Update status filter pill counts
        const allCount = document.querySelector('#status-filters .filter-count[data-status="all"]');
        if (allCount) allCount.textContent = n;
        APP_STATUSES.forEach(s => {
            const countEl = document.querySelector(`#status-filters .filter-count[data-status="${s.id}"]`);
            if (countEl) countEl.textContent = this.jobs.filter(j => j.appStatus === s.id).length;
        });
    }

    renderSidebar() {
        if (!this.jobs.length) {
            this.listEl.innerHTML = `<div class="empty-state"><i class="fas fa-arrow-left"></i><p>Swipe right on jobs you like</p></div>`;
            return;
        }
        const colors = ['teal', 'blue', 'purple', 'green', 'orange'];
        this.listEl.innerHTML = this.jobs.slice(0, 10).map((job, i) => {
            const color = colors[i % colors.length];
            const initial = (job.title || 'J').charAt(0).toUpperCase();
            const statusObj = APP_STATUSES.find(s => s.id === job.appStatus) || APP_STATUSES[0];
            return `
            <div class="saved-job-item" data-job-id="${job.id}">
                <div class="saved-job-header">
                    <div class="saved-job-initial ${color}">${initial}</div>
                    <div class="saved-job-info">
                        <h4>${escHtml(job.title)}</h4>
                        <span>${escHtml(job.company)}</span>
                    </div>
                </div>
                <div class="saved-job-meta">
                    ${job.salary ? `<span class="meta-tag salary">${job.salary}</span>` : ''}
                    <span class="meta-tag remote"><i class="fas fa-wifi"></i> Remote</span>
                    <span class="app-status-badge status-${job.appStatus}"><i class="fas ${statusObj.icon}"></i> ${statusObj.label}</span>
                </div>
                <div class="saved-job-actions">
                    <button class="remove-saved-btn" onclick="savedMgr.removeJob('${job.id}')"><i class="fas fa-times"></i></button>
                </div>
            </div>`;
        }).join('');
    }

    renderGrid() {
        if (!this.gridEl) return;
        const list = this.getSorted();
        if (!list.length) {
            this.gridEl.innerHTML = `<div class="grid-empty"><i class="fas fa-bookmark"></i><h3>No saved jobs yet</h3><p>Swipe right on jobs you like and they'll appear here.</p></div>`;
            return;
        }
        this.gridEl.innerHTML = list.map(job => gridCard(job, 'saved')).join('');
    }
}

// ============================================
// Archived Jobs Manager
// ============================================
class ArchivedJobsManager {
    constructor() {
        this.jobs = Store.get('archived') || [];
        this.gridEl = document.getElementById('archived-grid');

        document.getElementById('clear-archived-btn')?.addEventListener('click', () => {
            if (this.jobs.length === 0) return;
            this.jobs = [];
            this.save();
            this.render();
            window.toast.show('Archived jobs cleared', 'default');
        });
    }

    save() { Store.set('archived', this.jobs); }

    addJob(job) {
        if (this.jobs.find(j => j.id === job.id)) return;
        this.jobs.unshift({ ...job, archivedAt: Date.now() });
        this.save();
        this.render();
    }

    removeJob(id) {
        this.jobs = this.jobs.filter(j => j.id !== id);
        this.save();
        this.render();
    }

    restoreToSaved(id) {
        const job = this.jobs.find(j => j.id === id);
        if (job) {
            window.savedMgr.addJob(job);
            this.removeJob(id);
            window.toast.show(`Moved "${job.title}" to saved`, 'success');
        }
    }

    render() {
        const n = this.jobs.length;
        const badge = document.getElementById('badge-archived');
        if (badge) badge.textContent = n || '';
        document.getElementById('archived-view-count').textContent = `${n} job${n !== 1 ? 's' : ''}`;
        if (!this.gridEl) return;
        if (!n) {
            this.gridEl.innerHTML = `<div class="grid-empty"><i class="fas fa-archive"></i><h3>No archived jobs</h3><p>Swipe down on jobs to archive them for later.</p></div>`;
            return;
        }
        this.gridEl.innerHTML = this.jobs.map(job => gridCard(job, 'archived')).join('');
    }
}

// ============================================
// Skipped Jobs Manager
// ============================================
class SkippedJobsManager {
    constructor() {
        this.jobs = Store.get('skipped') || [];
        this.gridEl = document.getElementById('skipped-grid');

        document.getElementById('clear-skipped-btn')?.addEventListener('click', () => {
            if (this.jobs.length === 0) return;
            this.jobs = [];
            this.save();
            this.render();
            window.toast.show('Skipped jobs cleared', 'default');
        });
    }

    save() { Store.set('skipped', this.jobs); }

    addJob(job) {
        if (this.jobs.find(j => j.id === job.id)) return;
        this.jobs.unshift({ ...job, skippedAt: Date.now() });
        this.save();
        this.render();
    }

    removeJob(id) {
        const job = this.jobs.find(j => j.id === id);
        if (!job) return;
        this.showFeedbackModal(job);
    }

    confirmRemove(id, reason) {
        const job = this.jobs.find(j => j.id === id);
        this.jobs = this.jobs.filter(j => j.id !== id);
        this.save();
        this.render();
        const feedbackLog = Store.get('skipFeedback') || [];
        feedbackLog.push({ jobId: id, reason, at: Date.now() });
        Store.set('skipFeedback', feedbackLog);
        const label = SKIP_REASONS.find(r => r.id === reason)?.label || reason;
        window.toast.show(`Removed — ${label}`, 'default');
    }

    showFeedbackModal(job) {
        const modal = document.getElementById('skip-feedback-modal');
        if (!modal) return;
        const body = document.getElementById('skip-feedback-body');
        body.innerHTML = `
            <div class="feedback-job-header">
                <img src="${job.logo}" alt="" class="feedback-job-logo" onerror="this.src='${logoUrl(job.company)}'">
                <div>
                    <h4>${escHtml(job.title)}</h4>
                    <span>${escHtml(job.company)}</span>
                </div>
            </div>
            <p class="feedback-prompt">Why are you removing this job?</p>
            <div class="feedback-options">
                ${SKIP_REASONS.map(r => `
                    <button class="feedback-option" data-reason="${r.id}">
                        <i class="fas ${r.icon}"></i>
                        <span>${r.label}</span>
                    </button>
                `).join('')}
            </div>`;
        modal.classList.add('active');
        modal.dataset.jobId = job.id;

        // Bind option clicks (one-time via replacement)
        body.querySelectorAll('.feedback-option').forEach(btn => {
            btn.addEventListener('click', () => {
                this.confirmRemove(job.id, btn.dataset.reason);
                modal.classList.remove('active');
            });
        });
    }

    restoreToSaved(id) {
        const job = this.jobs.find(j => j.id === id);
        if (job) {
            window.savedMgr.addJob(job);
            this.jobs = this.jobs.filter(j => j.id !== id);
            this.save();
            this.render();
            window.toast.show(`Moved "${job.title}" to saved`, 'success');
        }
    }

    render() {
        const n = this.jobs.length;
        const badge = document.getElementById('badge-skipped');
        if (badge) badge.textContent = n || '';
        document.getElementById('skipped-view-count').textContent = `${n} job${n !== 1 ? 's' : ''}`;
        if (!this.gridEl) return;
        if (!n) {
            this.gridEl.innerHTML = `<div class="grid-empty"><i class="fas fa-times-circle"></i><h3>No skipped jobs</h3><p>Jobs you skip will appear here.</p></div>`;
            return;
        }
        this.gridEl.innerHTML = this.jobs.map(job => gridCard(job, 'skipped')).join('');
    }
}

// ============================================
// Shared Grid Card Renderer
// ============================================
function gridCard(job, context) {
    let actions;
    let extraSections = '';

    if (context === 'saved') {
        // Status dropdown
        const statusOptions = APP_STATUSES.map(s =>
            `<option value="${s.id}" ${job.appStatus === s.id ? 'selected' : ''}>${s.label}</option>`
        ).join('');
        const statusSection = `
            <div class="grid-card-section">
                <div class="status-select-wrapper">
                    <select class="status-select status-${job.appStatus}" onchange="savedMgr.updateStatus('${job.id}', this.value)">
                        ${statusOptions}
                    </select>
                </div>
            </div>`;

        // Contact row
        const contactSection = `
            <div class="grid-card-section grid-card-contact">
                <a href="${savedMgr.getMailtoUrl(job)}" class="contact-btn" title="Email follow-up"><i class="fas fa-envelope"></i> Email</a>
                <a href="${savedMgr.getCompanySearchUrl(job)}" target="_blank" rel="noopener" class="contact-btn" title="Find company contact"><i class="fas fa-search"></i> Contact</a>
            </div>`;

        // Notes section
        const notesSection = `
            <div class="grid-card-section grid-card-notes">
                <button class="notes-toggle" onclick="this.parentElement.classList.toggle('open')"><i class="fas fa-sticky-note"></i> Notes <i class="fas fa-chevron-down"></i></button>
                <textarea class="notes-textarea" maxlength="500" placeholder="Add notes (recruiter name, interview date...)" onblur="savedMgr.updateNotes('${job.id}', this.value)">${escHtml(job.notes || '')}</textarea>
            </div>`;

        extraSections = statusSection + contactSection + notesSection;

        actions = `${job.url ? `<a href="${job.url}" target="_blank" rel="noopener" class="grid-apply-btn" onclick="savedMgr.markOpened('${job.id}')"><i class="fas fa-external-link-alt"></i> Apply</a>` : ''}
           ${job.url ? `<a href="${job.url}" target="_blank" rel="noopener" class="grid-view-posting-btn"><i class="fas fa-eye"></i> View</a>` : ''}
           <button class="grid-action-btn remove" onclick="savedMgr.removeJob('${job.id}')"><i class="fas fa-trash-alt"></i></button>`;
    } else if (context === 'skipped') {
        actions = `<button class="grid-action-btn restore" onclick="skippedMgr.restoreToSaved('${job.id}')"><i class="fas fa-undo"></i> Restore</button>
           <button class="grid-action-btn remove" onclick="skippedMgr.removeJob('${job.id}')"><i class="fas fa-trash-alt"></i></button>`;
    } else {
        actions = `<button class="grid-action-btn restore" onclick="archivedMgr.restoreToSaved('${job.id}')"><i class="fas fa-undo"></i> Restore</button>
           <button class="grid-action-btn remove" onclick="archivedMgr.removeJob('${job.id}')"><i class="fas fa-trash-alt"></i></button>`;
    }

    return `
    <div class="grid-card">
        <div class="grid-card-top">
            <img src="${job.logo}" alt="" class="grid-card-logo" onerror="this.src='${logoUrl(job.company)}'">
            <div class="grid-card-match">${job.match}%</div>
        </div>
        <h3 class="grid-card-title">${escHtml(job.title)}</h3>
        <p class="grid-card-company">${escHtml(job.company)}</p>
        <div class="grid-card-meta">
            ${job.salary ? `<span class="meta-tag salary">${job.salary}</span>` : ''}
            <span class="meta-tag">${job.location}</span>
        </div>
        <div class="grid-card-skills">
            ${job.skills.slice(0, 3).map(s => `<span class="skill-chip ${job.userSkillMatch.includes(s) ? 'match' : ''}">${s}</span>`).join('')}
        </div>
        ${extraSections}
        <div class="grid-card-actions">${actions}</div>
    </div>`;
}

// ============================================
// Preferences Manager
// ============================================
class PreferencesManager {
    constructor() {
        this.prefs = Store.get('prefs') || {
            skills: ['JavaScript', 'React', 'Design', 'Figma', 'CSS', 'Python'],
            categories: ['software-dev', 'design'],
            minSalary: 0,
            jobTypes: ['full_time', 'contract']
        };
        this.render();
        this.bindEvents();
    }

    save() { Store.set('prefs', this.prefs); }

    render() {
        // Skills
        const skillsEl = document.getElementById('user-skills-tags');
        if (skillsEl) {
            skillsEl.innerHTML = this.prefs.skills.map(s =>
                `<span class="editable-tag">${escHtml(s)}<button onclick="prefsMgr.removeSkill('${escHtml(s)}')"><i class="fas fa-times"></i></button></span>`
            ).join('');
        }

        // Categories
        const catGrid = document.getElementById('category-grid');
        if (catGrid) {
            catGrid.innerHTML = CATEGORIES.map(c =>
                `<label class="cat-option ${this.prefs.categories.includes(c.id) ? 'selected' : ''}">
                    <input type="checkbox" value="${c.id}" ${this.prefs.categories.includes(c.id) ? 'checked' : ''}>
                    <i class="fas ${c.icon}"></i>
                    <span>${c.label}</span>
                </label>`
            ).join('');
        }

        // Salary
        const slider = document.getElementById('salary-slider');
        const display = document.getElementById('salary-display');
        if (slider) {
            slider.value = this.prefs.minSalary;
            if (display) display.textContent = this.prefs.minSalary > 0 ? `$${(this.prefs.minSalary / 1000).toFixed(0)}K+` : 'Any salary';
        }

        // Job types
        const typesGrid = document.getElementById('job-types-grid');
        if (typesGrid) {
            typesGrid.innerHTML = JOB_TYPES.map(t =>
                `<label class="type-option ${this.prefs.jobTypes.includes(t.id) ? 'selected' : ''}">
                    <input type="checkbox" value="${t.id}" ${this.prefs.jobTypes.includes(t.id) ? 'checked' : ''}>
                    <i class="fas ${t.icon}"></i>
                    <span>${t.label}</span>
                </label>`
            ).join('');
        }
    }

    bindEvents() {
        // Skill input
        document.getElementById('skill-input')?.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const v = e.target.value.trim();
                if (v && !this.prefs.skills.includes(v)) {
                    this.prefs.skills.push(titleCase(v));
                    this.save();
                    this.render();
                }
                e.target.value = '';
            }
        });

        // Category checkboxes
        document.getElementById('category-grid')?.addEventListener('change', e => {
            if (e.target.type === 'checkbox') {
                const val = e.target.value;
                if (e.target.checked) this.prefs.categories.push(val);
                else this.prefs.categories = this.prefs.categories.filter(c => c !== val);
                this.save();
                this.render();
            }
        });

        // Salary slider
        document.getElementById('salary-slider')?.addEventListener('input', e => {
            this.prefs.minSalary = parseInt(e.target.value);
            this.save();
            const d = document.getElementById('salary-display');
            if (d) d.textContent = this.prefs.minSalary > 0 ? `$${(this.prefs.minSalary / 1000).toFixed(0)}K+` : 'Any salary';
        });

        // Job type checkboxes
        document.getElementById('job-types-grid')?.addEventListener('change', e => {
            if (e.target.type === 'checkbox') {
                const val = e.target.value;
                if (e.target.checked) this.prefs.jobTypes.push(val);
                else this.prefs.jobTypes = this.prefs.jobTypes.filter(t => t !== val);
                this.save();
                this.render();
            }
        });

        // Save button
        document.getElementById('save-prefs-btn')?.addEventListener('click', async () => {
            this.save();
            window.toast.show('Preferences saved! Refreshing jobs...', 'success');
            // Reload jobs with new prefs
            apiCache.clear();
            window.viewMgr.switchTo('stack');
            await reloadStack();
        });
    }

    removeSkill(s) {
        this.prefs.skills = this.prefs.skills.filter(sk => sk !== s);
        this.save();
        this.render();
    }
}

// ============================================
// Filter Manager
// ============================================
class FilterManager {
    constructor(jobs, onChange) {
        this.allJobs = jobs;
        this.active = new Set(['all']);
        this.onChange = onChange;
        document.querySelectorAll('.filter-pill').forEach(p =>
            p.addEventListener('click', () => this.toggle(p)));
    }

    toggle(pill) {
        const f = pill.dataset.filter;
        if (f === 'all') { this.active.clear(); this.active.add('all'); }
        else {
            this.active.delete('all');
            this.active.has(f) ? this.active.delete(f) : this.active.add(f);
            if (!this.active.size) this.active.add('all');
        }
        document.querySelectorAll('.filter-pill').forEach(p =>
            p.dataset.active = this.active.has(p.dataset.filter));
        this.onChange(this.filtered());
    }

    setJobs(jobs) {
        this.allJobs = jobs;
        this.active.clear();
        this.active.add('all');
        document.querySelectorAll('.filter-pill').forEach(p =>
            p.dataset.active = p.dataset.filter === 'all');
    }

    filtered() {
        if (this.active.has('all')) return [...this.allJobs];
        return this.allJobs.filter(j => {
            if (this.active.has('fulltime') && j.jobType !== 'Full-time') return false;
            if (this.active.has('salary') && !j.salary) return false;
            if (this.active.has('recent') && j.postedDays > 7) return false;
            return true;
        });
    }
}

// ============================================
// Card Stack
// ============================================
class CardStack {
    constructor(el, jobs) {
        this.el = el;
        this.jobs = [...jobs];
        this.total = jobs.length;
        this.idx = 0;
        this.modalOpen = false;
        this.current = null;
        this.init();
    }

    init() {
        this.render();
        this.updateProgress();
        this.initModal();
        this.initButtons();
        this.initKeys();
    }

    setJobs(jobs) {
        this.jobs = [...jobs];
        this.total = jobs.length;
        this.idx = 0;
        this.render();
        this.updateProgress();
    }

    updateRemaining() {
        const r = Math.max(0, this.jobs.length - this.idx);
        const badge = document.getElementById('badge-stack');
        if (badge) badge.textContent = r || '';
        // Update counter in header
        const currentEl = document.getElementById('jobs-current');
        const totalEl = document.getElementById('jobs-total');
        if (currentEl) currentEl.textContent = Math.min(this.idx + 1, this.total);
        if (totalEl) totalEl.textContent = this.total;
    }

    updateProgress() {
        const pct = this.total > 0 ? (this.idx / this.total) * 100 : 0;
        document.getElementById('stack-progress').style.width = `${pct}%`;
        // Update reviewed text
        const reviewedCount = document.getElementById('reviewed-count');
        const reviewedTotal = document.getElementById('reviewed-total');
        const progressPct = document.getElementById('progress-pct');
        if (reviewedCount) reviewedCount.textContent = this.idx;
        if (reviewedTotal) reviewedTotal.textContent = this.total;
        if (progressPct) progressPct.textContent = `${Math.round(pct)}%`;
        this.updateRemaining();
    }

    initModal() {
        const modal = document.getElementById('details-modal');
        const close = () => { modal.classList.remove('active'); this.modalOpen = false; };
        document.querySelector('.close-modal').addEventListener('click', close);
        document.querySelector('.modal-overlay').addEventListener('click', close);
        document.getElementById('modal-skip').addEventListener('click', () => { close(); this.swipe('left'); });
        document.getElementById('modal-save').addEventListener('click', () => { close(); this.swipe('right'); });
        document.getElementById('modal-apply')?.addEventListener('click', () => {
            if (this.current) window.toast.show(`Opening ${this.current.company}...`, 'success');
        });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && this.modalOpen) close(); });
    }

    initButtons() {
        document.getElementById('btn-left').addEventListener('click', () => this.swipe('left'));
        document.getElementById('btn-right').addEventListener('click', () => this.swipe('right'));
        document.getElementById('btn-down').addEventListener('click', () => this.swipe('down'));
    }

    initKeys() {
        document.addEventListener('keydown', e => {
            if (this.modalOpen || window.viewMgr?.current !== 'stack') return;
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
            switch (e.key) {
                case 'ArrowRight': this.swipe('right'); break;
                case 'ArrowLeft': this.swipe('left'); break;
                case 'ArrowDown': this.swipe('down'); break;
                case ' ': e.preventDefault(); if (this.current) this.openDetails(this.current); break;
            }
        });
    }

    openDetails(job) {
        const modal = document.getElementById('details-modal');
        const body = document.getElementById('modal-body');
        const applyBtn = document.getElementById('modal-apply');

        if (applyBtn) {
            applyBtn.href = job.url || '#';
            applyBtn.style.display = job.url ? '' : 'none';
        }

        const desc = job.isHtml ? job.description :
            job.description.replace(/\n\n/g, '<br><br>').replace(/### (.*)/g, '<h3>$1</h3>');

        body.innerHTML = `
            <div class="modal-company-header">
                <img src="${job.logo}" alt="" class="modal-company-logo" onerror="this.src='${logoUrl(job.company)}'">
                <div class="modal-company-info">
                    <h1>${escHtml(job.title)}</h1>
                    <span>${escHtml(job.company)}</span>
                </div>
            </div>
            <div class="modal-meta">
                ${job.salary ? `<span class="meta-tag salary"><i class="fas fa-dollar-sign"></i> ${job.salary}</span>` : ''}
                <span class="meta-tag"><i class="fas fa-map-marker-alt"></i> ${escHtml(job.location)}</span>
                <span class="meta-tag remote"><i class="fas fa-wifi"></i> Remote</span>
                <span class="meta-tag job-type-tag"><i class="fas fa-briefcase"></i> ${job.jobType}</span>
                ${job.category ? `<span class="meta-tag category-tag"><i class="fas fa-tag"></i> ${job.category}</span>` : ''}
                <span class="meta-tag source-tag"><i class="fas fa-globe"></i> ${job.source || 'live'}</span>
            </div>
            ${job.url ? `
            <div class="modal-apply-banner">
                <div class="apply-banner-info">
                    <i class="fas fa-external-link-alt"></i>
                    <div><strong>Real job listing</strong><span>Apply directly to ${escHtml(job.company)}</span></div>
                </div>
                <a href="${job.url}" target="_blank" rel="noopener" class="apply-banner-btn">Apply Now <i class="fas fa-arrow-right"></i></a>
            </div>` : ''}
            <div class="modal-section">
                <div class="modal-section-title">Match Score</div>
                <div class="match-bar-row">
                    <div class="match-score" style="width:64px;height:64px;"><span class="score">${job.match}%</span><span class="label">Match</span></div>
                    <div class="match-bar-col">
                        <div class="match-bar-track"><div class="match-bar-fill" style="width:${job.match}%"></div></div>
                        <p>${job.userSkillMatch.length} of ${job.skills.length} skills match your profile</p>
                    </div>
                </div>
            </div>
            <div class="modal-section">
                <div class="modal-section-title">About the Role</div>
                <div class="modal-description job-description-html">${desc}</div>
            </div>
            ${job.skills.length ? `
            <div class="modal-section">
                <div class="modal-section-title">Skills & Tags</div>
                <div class="skills-tags">${job.skills.map(s => `<span class="skill-tag ${job.userSkillMatch.includes(s) ? 'match' : ''}">${s}</span>`).join('')}</div>
            </div>` : ''}
            ${job.url ? `
            <div class="modal-section modal-cta-section">
                <a href="${job.url}" target="_blank" rel="noopener" class="modal-full-apply-btn">
                    <i class="fas fa-external-link-alt"></i> View Full Listing & Apply
                </a>
                <p class="modal-cta-note">Opens the full job posting where you can apply directly.</p>
            </div>` : ''}`;

        modal.classList.add('active');
        this.modalOpen = true;
        body.scrollTop = 0;
    }

    render() {
        this.el.innerHTML = '';

        if (this.idx >= this.jobs.length) {
            this.el.innerHTML = `
                <div class="stack-placeholder">
                    <i class="fas fa-check-circle"></i>
                    <h3>You've reviewed all ${this.total} jobs!</h3>
                    <p>Search for more or change categories in Preferences.</p>
                    <button class="retry-btn" onclick="reloadStack()"><i class="fas fa-sync-alt"></i> Load More Jobs</button>
                </div>`;
            this.current = null;
            return;
        }

        const end = Math.min(this.idx + 3, this.jobs.length);
        for (let i = end - 1; i >= this.idx; i--) this.createCard(this.jobs[i], i === this.idx);
    }

    createCard(job, isTop) {
        const card = document.createElement('div');
        card.className = 'job-card';
        const depth = this.jobs.indexOf(job) - this.idx;
        card.style.zIndex = 100 - depth;
        card.style.setProperty('--entrance-delay', String(depth * 0.07));
        card.style.setProperty('--stack-y', `${depth * 12}px`);
        card.style.setProperty('--stack-scale', String(1 - depth * 0.04));
        card.style.setProperty('--card-opacity', String(1 - depth * 0.25));

        if (!isTop) {
            card.style.pointerEvents = 'none';
            card.classList.add('stack-bg');
            card.addEventListener('animationend', () => {
                card.style.transform = `translateY(${depth * 12}px) scale(${1 - depth * 0.04})`;
                card.style.opacity = 1 - depth * 0.25;
            }, { once: true });
        }

        // Clean values
        const company = escHtml(job.company || 'Unknown');
        const title = escHtml(job.title || 'Untitled');
        const location = escHtml(job.location || 'Remote');
        const type = job.jobType || 'Full-time';

        // Strip HTML for description preview
        const descText = job.description ? job.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
        const previewText = descText.length > 200 ? descText.slice(0, 197) + '...' : descText;

        card.innerHTML = `
            <div class="card-header">
                <div class="company-info">
                    <img src="${job.logo}" alt="" class="company-logo" onerror="this.src='${logoUrl(job.company)}'">
                    <div class="company-details"><h4>${company}</h4><span>${location}</span></div>
                </div>
                <div class="match-score"><span class="score">${job.match}%</span><span class="label">Match</span></div>
            </div>
            <div class="card-body">
                <h2 class="job-title">${title}</h2>
                <div class="job-meta">
                    ${job.salary ? `<span class="meta-tag salary"><i class="fas fa-dollar-sign"></i> ${escHtml(job.salary)}</span>` : ''}
                    ${job.locationType === 'remote' ? '<span class="meta-tag remote"><i class="fas fa-wifi"></i> Remote</span>' : ''}
                    <span class="meta-tag job-type-tag"><i class="fas fa-briefcase"></i> ${escHtml(type)}</span>
                    <span class="job-info-pill" title="View details">?</span>
                </div>
                ${previewText ? `<p class="job-desc-preview">${escHtml(previewText)}</p>` : ''}
                <div class="skills-container">
                    <div class="skills-label">Skills & Match</div>
                    <div class="skills-tags">
                        ${job.skills.map(s => `<span class="skill-tag ${job.userSkillMatch.includes(s) ? 'match' : ''}">${escHtml(s)}</span>`).join('')}
                        ${!job.skills.length ? '<span class="skill-tag">No tags listed</span>' : ''}
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <span class="posted-time"><i class="fas fa-clock"></i> ${postedLabel(job.postedDays)}</span>
                <div class="card-footer-actions">
                    ${job.url ? `<span class="live-badge"><i class="fas fa-circle"></i> Live</span>` : ''}
                </div>
            </div>
            <button class="card-details-toggle"><span>Details</span><i class="fas fa-chevron-down"></i></button>`;

        this.el.appendChild(card);

        // Stagger skill tag reveals
        card.querySelectorAll('.skill-tag').forEach((tag, i) => {
            tag.style.setProperty('--tag-delay', String(0.3 + i * 0.06));
        });

        if (isTop) {
            this.current = job;
            this.topCard = card;
            // Details toggle at bottom of card
            const detailsToggle = card.querySelector('.card-details-toggle');
            if (detailsToggle) {
                detailsToggle.addEventListener('click', e => {
                    e.stopPropagation();
                    this.openDetails(job);
                });
            }
            // Info pill
            const infoPill = card.querySelector('.job-info-pill');
            if (infoPill) {
                infoPill.addEventListener('click', e => {
                    e.stopPropagation();
                    this.openDetails(job);
                });
            }
            this.makeDraggable(card, job);
        }
    }

    makeDraggable(card, job) {
        let dragging = false, sx, sy, cx, cy;
        const T = 100, DT = 80;

        const start = e => {
            if (this.modalOpen || e.target.closest('.view-details-btn') || e.target.closest('.card-details-toggle') || e.target.closest('.job-info-pill')) return;
            dragging = true;
            sx = cx = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            sy = cy = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            card.style.transition = 'border-color .2s, box-shadow .2s';
        };
        const move = e => {
            if (!dragging) return;
            cx = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            cy = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            const dx = cx - sx, dy = cy - sy;
            card.style.transform = `translate(${dx}px,${dy}px) rotate(${dx / 20}deg)`;
            this.showHints(dx, dy);
        };
        const end = () => {
            if (!dragging) return;
            dragging = false;
            const dx = cx - sx, dy = cy - sy, total = Math.abs(dx) + Math.abs(dy);
            this.hideHints();
            if (Math.abs(dx) > T) this.swipe(dx > 0 ? 'right' : 'left');
            else if (dy > DT) this.swipe('down');
            else if (total < 6) { card.style.transition = ''; card.style.transform = ''; }
            else { card.style.transition = 'transform .3s cubic-bezier(.175,.885,.32,1.275)'; card.style.transform = ''; }
        };

        card.addEventListener('mousedown', start);
        card.addEventListener('touchstart', start, { passive: true });
        window.addEventListener('mousemove', move);
        window.addEventListener('touchmove', move, { passive: true });
        window.addEventListener('mouseup', end);
        window.addEventListener('touchend', end);
    }

    showHints(dx, dy) {
        const t = 50;
        document.querySelector('.swipe-hint-left').style.opacity = dx < -t ? Math.min(Math.abs(dx) / 150, 1) : 0;
        document.querySelector('.swipe-hint-right').style.opacity = dx > t ? Math.min(dx / 150, 1) : 0;
        document.querySelector('.swipe-hint-down').style.opacity = dy > t ? Math.min(dy / 150, 1) : 0;
        // Drag direction feedback on card
        if (this.topCard) {
            this.topCard.classList.toggle('drag-left', dx < -t);
            this.topCard.classList.toggle('drag-right', dx > t);
            this.topCard.classList.toggle('drag-down', dy > t && Math.abs(dx) <= t);
        }
    }

    hideHints() {
        document.querySelectorAll('.swipe-hint').forEach(h => h.style.opacity = 0);
        if (this.topCard) {
            this.topCard.classList.remove('drag-left', 'drag-right', 'drag-down');
        }
    }

    swipe(dir) {
        const card = this.topCard, job = this.current;
        if (!card || !job) return;
        let tf, msg, type;
        switch (dir) {
            case 'right': tf = 'translate(150%,0) rotate(30deg)'; msg = `Saved ${job.title}`; type = 'success'; window.savedMgr.addJob(job); break;
            case 'left': tf = 'translate(-150%,0) rotate(-30deg)'; msg = `Skipped ${job.company}`; type = 'error'; window.skippedMgr.addJob(job); break;
            case 'down': tf = 'translate(0,150%)'; msg = 'Archived'; type = 'archive'; window.archivedMgr.addJob(job); break;
        }
        card.style.transition = 'transform .4s ease-out, opacity .4s';
        card.style.transform = tf;
        card.style.opacity = '0';
        window.toast.show(msg, type);
        viewedCount++;
        Store.set('viewedCount', viewedCount);
        document.getElementById('stat-viewed').textContent = viewedCount;
        if (navigator.vibrate) navigator.vibrate(dir === 'right' ? [40, 20, 40] : 25);
        setTimeout(() => { this.idx++; this.render(); this.updateProgress(); }, 250);
    }
}

// ============================================
// Loading UI
// ============================================
function showLoader() { document.getElementById('stack-loader').style.display = 'flex'; }
function hideLoader() { document.getElementById('stack-loader').style.display = 'none'; }

// ============================================
// App Init
// ============================================
let stack, filterMgr;

async function reloadStack() {
    showLoader();
    document.getElementById('card-stack').innerHTML = '';
    try {
        const prefs = Store.get('prefs') || { categories: [] };
        const jobs = await fetchAllJobs('', prefs.categories || []);
        if (filterMgr) filterMgr.setJobs(jobs);
        if (stack) stack.setJobs(jobs);
        else {
            stack = new CardStack(document.getElementById('card-stack'), jobs);
            filterMgr = new FilterManager(jobs, f => stack.setJobs(f));
        }
    } catch (e) {
        console.error(e);
        document.getElementById('card-stack').innerHTML = `
            <div class="stack-placeholder error-state">
                <i class="fas fa-exclamation-triangle"></i><h3>Couldn't load jobs</h3>
                <p>Please check your connection and try again.</p>
                <button class="retry-btn" onclick="reloadStack()"><i class="fas fa-sync-alt"></i> Retry</button>
            </div>`;
    }
    hideLoader();
}

document.addEventListener('DOMContentLoaded', async () => {
    // Core managers
    window.toast = new ToastManager();
    window.savedMgr = new SavedJobsManager();
    window.archivedMgr = new ArchivedJobsManager();
    window.skippedMgr = new SkippedJobsManager();
    window.prefsMgr = new PreferencesManager();
    window.viewMgr = new ViewManager();

    // Header action buttons
    document.getElementById('header-skip')?.addEventListener('click', () => { if (stack) stack.swipe('left'); });
    document.getElementById('header-save')?.addEventListener('click', () => { if (stack) stack.swipe('right'); });
    document.getElementById('header-archive')?.addEventListener('click', () => { if (stack) stack.swipe('down'); });

    // Stats
    document.getElementById('stat-viewed').textContent = viewedCount;

    // View change handler
    window.addEventListener('viewchange', e => {
        if (e.detail === 'saved') window.savedMgr.renderGrid();
        if (e.detail === 'skipped') window.skippedMgr.render();
        if (e.detail === 'archived') window.archivedMgr.render();
        if (e.detail === 'preferences') window.prefsMgr.render();
    });

    // Initial renders
    window.savedMgr.render();
    window.archivedMgr.render();
    window.skippedMgr.render();

    // Load jobs
    await reloadStack();

    // Search
    const searchInput = document.getElementById('search-input');
    let searchTimer;
    if (searchInput) {
        const run = async () => {
            const q = searchInput.value.trim();
            window.viewMgr.switchTo('stack');
            showLoader();
            // Don't clear manually, CardStack.setJobs will render and hide it
            try {
                const prefs = Store.get('prefs') || { categories: [] };
                const jobs = await fetchAllJobs(q, prefs.categories || []);
                filterMgr.setJobs(jobs);
                stack.setJobs(jobs);
                if (q) window.toast.show(`Found ${jobs.length} jobs for "${q}"`, 'default');
            } catch (e) {
                console.error(e);
                window.toast.show('Search failed', 'error');
            }
            hideLoader();
        };
        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); clearTimeout(searchTimer); run(); }
        });
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(run, CFG.searchDebounce);
        });
    }

    // Mobile Toggles
    const menuToggle = document.getElementById('menu-toggle');
    const savedToggle = document.getElementById('saved-toggle');
    const sidebarLeft = document.querySelector('.sidebar-left');
    const sidebarRight = document.querySelector('.sidebar-right');
    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    document.body.appendChild(overlay);

    const closeSidebars = () => {
        sidebarLeft?.classList.remove('open');
        sidebarRight?.classList.remove('open');
        overlay.classList.remove('active');
    };

    menuToggle?.addEventListener('click', () => {
        sidebarLeft?.classList.toggle('open');
        overlay.classList.toggle('active');
    });

    savedToggle?.addEventListener('click', () => {
        sidebarRight?.classList.toggle('open');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', closeSidebars);

    // Sidebar section header click
    document.querySelector('.panel-header')?.addEventListener('click', () => {
        window.viewMgr.switchTo('saved');
        closeSidebars();
    });

    // Handle view change to close sidebars
    window.addEventListener('viewchange', () => {
        closeSidebars();
    });

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle?.querySelector('i');
    const storedTheme = Store.get('theme') || 'light';

    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        Store.set('theme', theme);
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            themeToggle.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
        }
    };

    setTheme(storedTheme);

    themeToggle?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
    });

    // Pricing Modal
    const pricingModal = document.getElementById('pricing-modal');
    const upgradeBtn = document.getElementById('upgrade-btn');
    const pricingClose = pricingModal?.querySelector('.pricing-close');
    const modalOverlay = pricingModal?.querySelector('.modal-overlay');

    if (pricingModal && upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
            pricingModal.style.display = 'flex';
            setTimeout(() => pricingModal.classList.add('open'), 10);
        });

        const closePricing = () => {
            pricingModal.classList.remove('open');
            setTimeout(() => pricingModal.style.display = 'none', 300);
        };

        pricingClose?.addEventListener('click', closePricing);
        modalOverlay?.addEventListener('click', closePricing);

        pricingModal.querySelectorAll('.plan-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.toast.show('Redirecting to payment...', 'success');
                setTimeout(closePricing, 1500);
            });
        });
    }

    // Entrance
    document.body.style.opacity = '0';
    requestAnimationFrame(() => {
        document.body.style.transition = 'opacity .3s ease';
        document.body.style.opacity = '1';
    });
});

function gridCard(job, viewType) {
    const colors = ['teal', 'blue', 'purple', 'green', 'orange'];
    const id = job.id || 'job-0';
    const color = colors[id.charCodeAt(id.length - 1) % colors.length];
    const initial = (job.title || 'J').charAt(0).toUpperCase();

    const stop = 'event.stopPropagation()';

    // Status Select Options
    let statusSelect = '';
    if (viewType === 'saved') {
        const options = APP_STATUSES.map(s =>
            `<option value="${s.id}" ${job.appStatus === s.id ? 'selected' : ''}>${s.label}</option>`
        ).join('');
        statusSelect = `
            <div class="status-select-wrapper" onclick="${stop}" style="flex:1">
                <select onchange="window.savedMgr.updateStatus('${job.id}', this.value)" class="status-select" style="width:100%;padding:4px;border-radius:4px;border:1px solid #ccc;font-size:0.8rem">
                    ${options}
                </select>
            </div>
        `;
    }

    let actions = '';
    if (viewType === 'saved') {
        actions = `
            ${statusSelect}
            <button class="remove-saved-btn" onclick="window.savedMgr.removeJob('${job.id}'); ${stop}" title="Remove">
                <i class="fas fa-times"></i>
            </button>
        `;
    } else if (viewType === 'archived') {
        actions = `
             <button class="remove-saved-btn" onclick="window.archivedMgr.restoreToSaved('${job.id}'); ${stop}" title="Move to Saved" style="color:var(--success)"><i class="fas fa-heart"></i></button>
             <button class="remove-saved-btn" onclick="window.archivedMgr.removeJob('${job.id}'); ${stop}" title="Delete"><i class="fas fa-times"></i></button>
        `;
    } else if (viewType === 'skipped') {
        actions = `
             <button class="remove-saved-btn" onclick="window.skippedMgr.restoreToSaved('${job.id}'); ${stop}" title="Move to Saved" style="color:var(--success)"><i class="fas fa-heart"></i></button>
             <button class="remove-saved-btn" onclick="window.skippedMgr.removeJob('${job.id}'); ${stop}" title="Delete"><i class="fas fa-times"></i></button>
        `;
    }

    return `
    <div class="grid-card ${viewType}-card" onclick="window.open('${job.url}', '_blank'); window.savedMgr?.markOpened('${job.id}')">
        <div class="grid-card-top">
            <div class="saved-job-initial ${color}" style="width:40px;height:40px;font-size:1.1rem">${initial}</div>
            <div class="grid-card-match">${job.match}%</div>
        </div>
        
        <div class="grid-card-title" style="margin-top:.5rem">${escHtml(job.title)}</div>
        <div class="grid-card-company">${escHtml(job.company)}</div>
        
        <div class="grid-card-meta">
            ${job.salary ? `<span class="meta-tag"><i class="fas fa-dollar-sign"></i> ${escHtml(job.salary)}</span>` : ''}
            <span class="meta-tag"><i class="fas fa-map-marker-alt"></i> ${escHtml(job.location)}</span>
            <span class="meta-tag"><i class="fas fa-clock"></i> ${postedLabel(job.postedDays)}</span>
        </div>

        <div class="grid-card-skills" style="margin-top:auto">
             ${job.userSkillMatch.map(s => `<span class="skill-chip match">${s}</span>`).join('')}
        </div>
        
        <div class="grid-card-actions">
            ${actions} 
        </div>
    </div>`;
}

