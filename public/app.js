// ============================================
// JIRA AI TEST CASE GENERATOR - CLIENT APP
// ============================================

(function () {
    'use strict';

    // ======== STATE ========
    let currentConfig = { email: '', apiToken: '', domain: '', projectName: '' };
    let currentIssues = [];
    let currentStory = null;
    let testOptions = [
        { id: 'functional', label: 'Functional Testing', enabled: true },
        { id: 'negative', label: 'Negative Testing', enabled: true },
        { id: 'boundary', label: 'Boundary Value Analysis', enabled: true },
        { id: 'uiux', label: 'UI/UX Testing', enabled: true },
        { id: 'performance', label: 'Performance Testing', enabled: true },
        { id: 'security', label: 'Security Testing', enabled: true },
        { id: 'integration', label: 'Integration Testing', enabled: true },
        { id: 'accessibility', label: 'Accessibility Testing', enabled: true },
        { id: 'regression', label: 'Regression Testing', enabled: true },
    ];

    // ======== DOM REFS ========
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const elements = {
        jiraUrl: $('#jira-url'),
        email: $('#jira-email'),
        token: $('#jira-token'),
        domain: $('#jira-domain'),
        project: $('#jira-project'),
        issueSelect: $('#jira-issue'),
        btnTest: $('#btn-test'),
        btnFetch: $('#btn-fetch'),
        btnGenerate: $('#btn-generate'),
        btnReset: $('#btn-reset'),
        btnExportCsv: $('#btn-export-csv'),
        testCount: $('#test-count'),
        resultsPanel: $('#results-panel'),
        resultsContent: $('#results-content'),
        loadingOverlay: $('#loading-overlay'),
        loadingText: $('#loading-text'),
        connectionStatus: $('#connection-status'),
        toastContainer: $('#toast-container'),
    };

    // ======== INIT ========
    async function init() {
        await loadSavedConfig();
        bindEvents();
    }

    // ======== SAVED CONFIG ========
    async function loadSavedConfig() {
        try {
            const res = await fetch('/api/load-config');
            const data = await res.json();
            if (data.success && data.config) {
                const cfg = data.config;
                elements.email.value = cfg.email || '';
                elements.domain.value = cfg.domain || '';
                elements.project.value = cfg.projectName || '';
                if (cfg.hasApiToken) {
                    elements.token.value = cfg.apiToken || '';
                    elements.token.setAttribute('data-loaded', 'true');
                }
                currentConfig = {
                    email: cfg.email || '',
                    apiToken: cfg.apiToken || '',
                    domain: cfg.domain || '',
                    projectName: cfg.projectName || '',
                };
                showToast('Configuration loaded from saved settings', 'info');
            }
        } catch {
            // No saved config, that's fine
        }
    }

    // ======== EVENT BINDINGS ========
    function bindEvents() {
        if (elements.btnTest) elements.btnTest.addEventListener('click', handleTestConnection);
        elements.btnFetch.addEventListener('click', handleFetch);
        elements.btnGenerate.addEventListener('click', handleGenerate);
        elements.btnReset.addEventListener('click', handleReset);
        if (elements.btnExportCsv) {
            elements.btnExportCsv.addEventListener('click', handleExportCsv);
        }

        elements.issueSelect.addEventListener('change', handleIssueSelect);

        // Smart Jira URL parser
        if (elements.jiraUrl) {
            elements.jiraUrl.addEventListener('input', handleJiraUrlParse);
            elements.jiraUrl.addEventListener('paste', () => {
                setTimeout(handleJiraUrlParse, 100);
            });
        }

        // Auto-update config from inputs
        [elements.email, elements.token, elements.domain, elements.project].forEach(input => {
            if (input) input.addEventListener('input', updateConfigFromForm);
        });
    }

    function handleJiraUrlParse() {
        const url = elements.jiraUrl.value.trim();
        if (!url) return;

        // Extract domain from URL: https://DOMAIN.atlassian.net/...
        const domainMatch = url.match(/https?:\/\/([^.]+)\.atlassian\.net/i);
        if (domainMatch) {
            elements.domain.value = domainMatch[1];
            showToast('Domain extracted: ' + domainMatch[1], 'success');
        }

        // Extract project key from URL: /projects/PROJECTKEY/ or /project/PROJECTKEY/
        const projectMatch = url.match(/\/projects?\/([A-Za-z0-9]+)/i);
        if (projectMatch) {
            elements.project.value = projectMatch[1].toUpperCase();
            showToast('Project key extracted: ' + projectMatch[1].toUpperCase(), 'success');
        }

        updateConfigFromForm();
    }

    function updateConfigFromForm() {
        // Sanitize domain: strip .atlassian.net, https://, trailing slashes
        let domain = elements.domain?.value.trim() || '';
        domain = domain.replace(/^https?:\/\//i, '');
        domain = domain.replace(/\.atlassian\.net.*$/i, '');
        domain = domain.replace(/\/$/, '');

        currentConfig = {
            email: elements.email?.value.trim() || '',
            apiToken: elements.token?.value.trim() || '',
            domain: domain,
            projectName: elements.project?.value.trim().toUpperCase() || '',
        };
    }

    // ======== TEST CONNECTION ========
    async function handleTestConnection() {
        updateConfigFromForm();

        if (!currentConfig.email || !currentConfig.apiToken || !currentConfig.domain) {
            showToast('Please fill in email, token, and domain to test', 'error');
            return;
        }

        showLoading('Testing connection...');

        try {
            const res = await fetch('/api/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentConfig),
            });

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.message);
            }

            setConnected(true);
            showToast('Connection Test Successful!', 'success');
        } catch (err) {
            showToast(`Connection failed: ${err.message}`, 'error');
            setConnected(false);
        } finally {
            hideLoading();
        }
    }

    // ======== FETCH ISSUES ========
    async function handleFetch() {
        updateConfigFromForm();

        if (!currentConfig.email || !currentConfig.apiToken || !currentConfig.domain || !currentConfig.projectName) {
            showToast('Please fill in all connection fields', 'error');
            return;
        }

        showLoading('Connecting to Jira and fetching issues...');

        try {
            const res = await fetch('/api/fetch-issues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentConfig),
            });

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.message);
            }

            currentIssues = data.issues;
            populateIssueDropdown(data.issues);
            setConnected(true);
            showToast(`Found ${data.issues.length} issues in project "${currentConfig.projectName}"`, 'success');
        } catch (err) {
            showToast(`Fetch failed: ${err.message}`, 'error');
            setConnected(false);
        } finally {
            hideLoading();
        }
    }

    function populateIssueDropdown(issues) {
        elements.issueSelect.innerHTML = '<option value="">-- Select an Issue --</option>';
        issues.forEach(issue => {
            const option = document.createElement('option');
            option.value = issue.key;
            option.textContent = `${issue.key} - ${issue.summary} [${issue.issueType}]`;
            elements.issueSelect.appendChild(option);
        });
        elements.issueSelect.disabled = false;
    }

    // ======== ISSUE SELECTION ========
    async function handleIssueSelect() {
        const issueKey = elements.issueSelect.value;
        if (!issueKey) {
            elements.btnGenerate.disabled = true;
            currentStory = null;
            return;
        }

        showLoading('Fetching story details...');

        try {
            const res = await fetch('/api/fetch-story', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config: currentConfig, issueKey }),
            });

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.message);
            }

            currentStory = data.story;
            elements.btnGenerate.disabled = false;
            showToast(`Story ${issueKey} loaded successfully`, 'success');
        } catch (err) {
            showToast(`Failed to load story: ${err.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    function renderStoryPreview(story) {
        elements.storyPanel.style.display = 'block';
        elements.storyContent.innerHTML = `
      <div class="story-meta">
        <div class="meta-item">
          <span class="meta-label">Issue Key</span>
          <span class="meta-value">${story.key}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Type</span>
          <span class="meta-value">${story.issueType}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Status</span>
          <span class="meta-value">${story.status}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Priority</span>
          <span class="meta-value">${story.priority}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Assignee</span>
          <span class="meta-value">${story.assignee}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Reporter</span>
          <span class="meta-value">${story.reporter}</span>
        </div>
      </div>
      <div class="story-description">
        <h3>Summary</h3>
        <pre>${escapeHtml(story.summary)}</pre>
      </div>
      <div class="story-description">
        <h3>Description</h3>
        <pre>${escapeHtml(story.description)}</pre>
      </div>
      ${story.acceptanceCriteria ? `
        <div class="story-description">
          <h3>Acceptance Criteria</h3>
          <pre>${escapeHtml(story.acceptanceCriteria)}</pre>
        </div>
      ` : ''}
    `;
    }

    // ======== GENERATE TEST CASES ========
    async function handleGenerate() {
        if (!currentStory) {
            showToast('Please select a story first', 'error');
            return;
        }

        // Just use default all options since checkboxes were removed
        const selectedOptions = testOptions.map(o => o.id);

        showLoading('Generating test cases...');

        try {
            const res = await fetch('/api/generate-testcases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ story: currentStory, selectedOptions }),
            });

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.message);
            }

            renderTestCases(data.testCases);
            showToast(`Generated ${data.count} test cases successfully!`, 'success');
        } catch (err) {
            showToast(`Generation failed: ${err.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    function renderTestCases(testCases) {
        elements.resultsPanel.style.display = 'block';
        elements.testCount.textContent = `${testCases.length} tests`;

        // Group by category
        const groups = {};
        testCases.forEach(tc => {
            if (!groups[tc.category]) groups[tc.category] = [];
            groups[tc.category].push(tc);
        });

        let html = '';
        for (const [category, cases] of Object.entries(groups)) {
            const catClass = category.toLowerCase().replace(/[^a-z]/g, '').replace('boundaryvalue', 'boundary');
            html += `
        <div class="category-group">
          <div class="category-header">
            <span class="category-badge ${catClass}">${category}</span>
            <span class="category-count">${cases.length} test${cases.length > 1 ? 's' : ''}</span>
          </div>
          ${cases.map(tc => renderTestCard(tc)).join('')}
        </div>
      `;
        }

        elements.resultsContent.innerHTML = html;

        // Scroll to results
        elements.resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderTestCard(tc) {
        const priorityClass = tc.priority.toLowerCase();
        return `
      <div class="testcase-card">
        <div class="tc-header">
          <span class="tc-id">${tc.testId}</span>
          <span class="tc-priority ${priorityClass}">${tc.priority}</span>
        </div>
        <div class="tc-title">${escapeHtml(tc.title)}</div>
        <div class="tc-section">
          <div class="tc-section-label">Preconditions</div>
          <div class="tc-section-content">${escapeHtml(tc.preconditions)}</div>
        </div>
        <div class="tc-section">
          <div class="tc-section-label">Steps</div>
          <ol class="tc-steps">
            ${tc.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
          </ol>
        </div>
        <div class="tc-section">
          <div class="tc-section-label">Expected Result</div>
          <div class="tc-section-content">${escapeHtml(tc.expectedResult)}</div>
        </div>
      </div>
    `;
    }

    // ======== SAVE CONFIG ========
    async function handleSaveConfig() {
        updateConfigFromForm();

        if (!currentConfig.email && !currentConfig.domain) {
            showToast('Please fill in at least email and domain', 'error');
            return;
        }

        try {
            const res = await fetch('/api/save-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentConfig),
            });

            const data = await res.json();

            if (data.success) {
                showToast('Connection settings saved successfully!', 'success');
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            showToast(`Save failed: ${err.message}`, 'error');
        }
    }

    // ======== EXPORT CSV ========
    function handleExportCsv() {
        const cards = elements.resultsContent.querySelectorAll('.testcase-card');
        if (cards.length === 0) {
            showToast('No test cases to export', 'error');
            return;
        }

        // Rebuild from last generation data
        const rows = [['Test ID', 'Category', 'Title', 'Preconditions', 'Steps', 'Expected Result', 'Priority']];

        cards.forEach(card => {
            const testId = card.querySelector('.tc-id')?.textContent || '';
            const title = card.querySelector('.tc-title')?.textContent || '';
            const priority = card.querySelector('.tc-priority')?.textContent || '';
            const preconditions = card.querySelector('.tc-section-content')?.textContent || '';

            // Get parent category
            const group = card.closest('.category-group');
            const category = group?.querySelector('.category-badge')?.textContent || '';

            // Get steps
            const steps = Array.from(card.querySelectorAll('.tc-steps li'))
                .map((li, i) => `${i + 1}. ${li.textContent}`)
                .join(' | ');

            // Get expected result (last tc-section-content)
            const sections = card.querySelectorAll('.tc-section-content');
            const expectedResult = sections.length > 1 ? sections[sections.length - 1].textContent : '';

            rows.push([testId, category, title, preconditions, steps, expectedResult, priority]);
        });

        const csvContent = rows.map(row =>
            row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `testcases_${currentStory?.key || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('Test cases exported to CSV!', 'success');
    }

    // ======== RESET ========
    function handleReset() {
        if (elements.jiraUrl) elements.jiraUrl.value = '';
        elements.email.value = '';
        elements.token.value = '';
        elements.domain.value = '';
        elements.project.value = '';
        elements.issueSelect.innerHTML = '<option value="">-- Fetch issues first --</option>';
        elements.issueSelect.disabled = true;
        elements.btnGenerate.disabled = true;
        if (elements.resultsPanel) elements.resultsPanel.style.display = 'none';
        if (elements.resultsContent) elements.resultsContent.innerHTML = '';
        currentConfig = { email: '', apiToken: '', domain: '', projectName: '' };
        currentIssues = [];
        currentStory = null;
        setConnected(false);
        showToast('Form has been reset', 'info');
    }

    // ======== HELPERS ========
    function showLoading(text) {
        if (elements.loadingText) elements.loadingText.textContent = text || 'Loading...';
        if (elements.loadingOverlay) elements.loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        if (elements.loadingOverlay) elements.loadingOverlay.style.display = 'none';
    }

    function setConnected(connected) {
        if (elements.connectionStatus) elements.connectionStatus.textContent = connected ? 'Connected' : 'Disconnected';
        if (elements.badgeDot) elements.badgeDot.classList.toggle('connected', connected);
    }

    function showToast(message, type = 'info') {
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${escapeHtml(message)}`;
        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ======== START ========
    document.addEventListener('DOMContentLoaded', init);
})();
