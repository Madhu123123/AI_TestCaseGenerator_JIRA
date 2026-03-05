import express from 'express';
import path from 'path';
import fs from 'fs';
import {
    fetchProjectIssues,
    fetchIssueDetails,
    testJiraConnection,
    type JiraConfig
} from './jira-service';
import { generateTestCases, DEFAULT_TEST_OPTIONS } from './testcase-generator';

const app = express();
const PORT = 4200;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Request logging middleware
app.use((req, _res, next) => {
    if (req.path.startsWith('/api/')) {
        console.log(`\n[SERVER] ${req.method} ${req.path} `);
    }
    next();
});

const CONFIG_DIR = path.join(__dirname, '..', 'config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'jira-config.json');

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Serve main page
app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Get default test options
app.get('/api/test-options', (_req, res) => {
    res.json(DEFAULT_TEST_OPTIONS);
});

// Save Jira config
app.post('/api/save-config', (req, res) => {
    try {
        const config = req.body;
        // Don't store the raw API token - mask it for display, but keep it encrypted-ish
        const configToSave = {
            email: config.email || '',
            apiToken: config.apiToken || '',
            domain: config.domain || '',
            projectName: config.projectName || '',
        };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(configToSave, null, 2), 'utf-8');
        res.json({ success: true, message: 'Configuration saved successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: `Failed to save config: ${(error as Error).message} ` });
    }
});

// Load Jira config
app.get('/api/load-config', (_req, res) => {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
            // Mask the API token for display
            const maskedConfig = {
                ...config,
                apiTokenMasked: config.apiToken ? '•'.repeat(20) : '',
                hasApiToken: !!config.apiToken,
            };
            res.json({ success: true, config: maskedConfig });
        } else {
            res.json({ success: true, config: null });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: `Failed to load config: ${(error as Error).message} ` });
    }
});

// Test Jira Connection
app.post('/api/test-connection', async (req, res) => {
    try {
        const config: JiraConfig = req.body;

        if (!config.email || !config.apiToken || !config.domain) {
            return res.status(400).json({ success: false, message: 'Missing essential Jira config' });
        }

        await testJiraConnection(config);
        res.json({ success: true, message: 'Connection verified successfully.' });
    } catch (error) {
        console.error('Error testing connection:', error);
        res.status(500).json({ success: false, message: (error as Error).message || 'Server error' });
    }
});

// Fetch Jira issues
app.post('/api/fetch-issues', async (req, res) => {
    try {
        const config: JiraConfig = req.body;
        if (!config.email || !config.apiToken || !config.domain || !config.projectName) {
            res.status(400).json({ success: false, message: 'All connection fields are required' });
            return;
        }
        const issues = await fetchProjectIssues(config);
        res.json({ success: true, issues });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
});

// Fetch story details
app.post('/api/fetch-story', async (req, res) => {
    try {
        const { config, issueKey } = req.body;
        if (!issueKey) {
            res.status(400).json({ success: false, message: 'Issue key is required' });
            return;
        }
        const details = await fetchIssueDetails(config, issueKey);
        res.json({ success: true, story: details });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
});

// Generate test cases
app.post('/api/generate-testcases', async (req, res) => {
    try {
        const { story, selectedOptions } = req.body;
        if (!story) {
            res.status(400).json({ success: false, message: 'Story details are required' });
            return;
        }
        if (!selectedOptions || selectedOptions.length === 0) {
            res.status(400).json({ success: false, message: 'At least one test option must be selected' });
            return;
        }
        const testCases = generateTestCases(story, selectedOptions);
        res.json({ success: true, testCases, count: testCases.length });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
});

export function startServer(): Promise<void> {
    return new Promise((resolve) => {
        app.listen(PORT, () => {
            console.log(`\n🚀 Jira AI Test Case Generator is running!`);
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log(`\nPress Ctrl+C to stop the server.\n`);
            resolve();
        });
    });
}

// If running directly (not imported)
if (require.main === module) {
    startServer();
}
