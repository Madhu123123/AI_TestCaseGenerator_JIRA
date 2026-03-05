import axios, { AxiosError } from 'axios';

export interface JiraConfig {
    email: string;
    apiToken: string;
    domain: string;
    projectName: string;
}

export interface JiraIssue {
    id: string;
    key: string;
    summary: string;
    issueType: string;
}

export interface JiraStoryDetails {
    key: string;
    summary: string;
    description: string;
    acceptanceCriteria: string;
    issueType: string;
    status: string;
    priority: string;
    labels: string[];
    components: string[];
    assignee: string;
    reporter: string;
}

function getBaseUrl(domain: string): string {
    return `https://${domain}.atlassian.net`;
}

function getAuthHeaders(email: string, apiToken: string) {
    const token = Buffer.from(`${email}:${apiToken}`).toString('base64');
    return {
        'Authorization': `Basic ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
}

function extractTextFromADF(node: any): string {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (node.type === 'text') return node.text || '';

    let text = '';
    if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
            const childText = extractTextFromADF(child);
            if (node.type === 'paragraph' || node.type === 'heading') {
                text += childText + '\n';
            } else if (node.type === 'listItem') {
                text += '• ' + childText + '\n';
            } else if (node.type === 'bulletList' || node.type === 'orderedList') {
                text += childText;
            } else {
                text += childText;
            }
        }
    }
    return text;
}

// Use Atlassian API for authenticating/testing credentials
export async function testJiraConnection(config: JiraConfig): Promise<boolean> {
    const baseUrl = getBaseUrl(config.domain);
    const headers = getAuthHeaders(config.email, config.apiToken);

    try {
        const url = `${baseUrl}/rest/api/3/myself`;

        console.log(`[JIRA] Testing connection...`);
        console.log(`[JIRA] URL: ${url}`);

        await axios.get(url, { headers });

        console.log(`[JIRA] ✅ Connection test successful for ${config.email}`);
        return true;
    } catch (error) {
        const axiosErr = error as AxiosError;
        if (axiosErr.response) {
            const data = axiosErr.response.data as any;
            const errorMessages = data?.errorMessages?.join(', ') || data?.message || JSON.stringify(data);
            console.error(`[JIRA] ❌ Connection Test failed (${axiosErr.response.status}): ${errorMessages}`);
            throw new Error(`Jira Authentication Error: Check your Email, API Token, or Domain. (${axiosErr.response.status})`);
        }
        console.error(`[JIRA] ❌ Connection Error: ${(error as Error).message}`);
        throw new Error(`Failed to reach Jira: ${(error as Error).message}`);
    }
}

export async function fetchProjectIssues(config: JiraConfig): Promise<JiraIssue[]> {
    const baseUrl = getBaseUrl(config.domain);
    const headers = getAuthHeaders(config.email, config.apiToken);

    try {
        // Use project key without quotes — works for both key and name
        const jql = `project = ${config.projectName} ORDER BY created DESC`;
        const url = `${baseUrl}/rest/api/3/search/jql`;

        console.log(`[JIRA] Fetching issues...`);
        console.log(`[JIRA] URL: ${url}`);
        console.log(`[JIRA] JQL: ${jql}`);
        console.log(`[JIRA] Domain: ${config.domain}`);
        console.log(`[JIRA] Email: ${config.email}`);

        const response = await axios.post(url, {
            jql,
            maxResults: 50,
            fields: ['summary', 'issuetype'],
        }, {
            headers
        });

        console.log(`[JIRA] ✅ Found ${response.data.issues?.length || 0} issues`);

        return (response.data.issues || []).map((issue: any) => ({
            id: issue.id,
            key: issue.key,
            summary: issue.fields.summary,
            issueType: issue.fields.issuetype?.name || 'Unknown',
        }));
    } catch (error) {
        const axiosErr = error as AxiosError;
        if (axiosErr.response) {
            const data = axiosErr.response.data as any;
            const errorMessages = data?.errorMessages?.join(', ') || data?.message || JSON.stringify(data);
            console.error(`[JIRA] ❌ API Error (${axiosErr.response.status}): ${errorMessages}`);
            throw new Error(`Jira API Error (${axiosErr.response.status}): ${errorMessages}`);
        }
        console.error(`[JIRA] ❌ Connection Error: ${(error as Error).message}`);
        throw new Error(`Failed to connect to Jira: ${(error as Error).message}`);
    }
}

export async function fetchIssueDetails(config: JiraConfig, issueKey: string): Promise<JiraStoryDetails> {
    const baseUrl = getBaseUrl(config.domain);
    const headers = getAuthHeaders(config.email, config.apiToken);

    try {
        const url = `${baseUrl}/rest/api/3/issue/${issueKey}`;
        console.log(`[JIRA] Fetching issue details: ${url}`);

        const response = await axios.get(url, {
            headers,
            params: {
                fields: 'summary,description,issuetype,status,priority,labels,components,assignee,reporter,customfield_10016',
            },
        });

        console.log(`[JIRA] ✅ Fetched details for ${issueKey}`);

        const fields = response.data.fields;
        const description = fields.description ? extractTextFromADF(fields.description) : 'No description provided';

        // Try to extract acceptance criteria from description or custom field
        let acceptanceCriteria = '';
        const descText = description.toLowerCase();
        const acIndex = descText.indexOf('acceptance criteria');
        if (acIndex !== -1) {
            acceptanceCriteria = description.substring(acIndex);
        } else if (fields.customfield_10016) {
            acceptanceCriteria = typeof fields.customfield_10016 === 'string'
                ? fields.customfield_10016
                : extractTextFromADF(fields.customfield_10016);
        }

        return {
            key: response.data.key,
            summary: fields.summary || '',
            description: description.trim(),
            acceptanceCriteria: acceptanceCriteria.trim(),
            issueType: fields.issuetype?.name || 'Unknown',
            status: fields.status?.name || 'Unknown',
            priority: fields.priority?.name || 'Medium',
            labels: fields.labels || [],
            components: (fields.components || []).map((c: any) => c.name),
            assignee: fields.assignee?.displayName || 'Unassigned',
            reporter: fields.reporter?.displayName || 'Unknown',
        };
    } catch (error) {
        const axiosErr = error as AxiosError;
        if (axiosErr.response) {
            const data = axiosErr.response.data as any;
            const errorMessages = data?.errorMessages?.join(', ') || data?.message || JSON.stringify(data);
            console.error(`[JIRA] ❌ API Error (${axiosErr.response.status}): ${errorMessages}`);
            throw new Error(`Jira API Error (${axiosErr.response.status}): ${errorMessages}`);
        }
        console.error(`[JIRA] ❌ Connection Error: ${(error as Error).message}`);
        throw new Error(`Failed to fetch issue details: ${(error as Error).message}`);
    }
}
