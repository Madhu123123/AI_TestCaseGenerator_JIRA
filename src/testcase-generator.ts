import { JiraStoryDetails } from './jira-service';

export interface TestOption {
    id: string;
    label: string;
    enabled: boolean;
}

export interface GeneratedTestCase {
    testId: string;
    category: string;
    title: string;
    preconditions: string;
    steps: string[];
    expectedResult: string;
    priority: string;
}

export const DEFAULT_TEST_OPTIONS: TestOption[] = [
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

function generateFunctionalTests(story: JiraStoryDetails, prefix: string): GeneratedTestCase[] {
    const tests: GeneratedTestCase[] = [];
    const desc = story.description.toLowerCase();

    tests.push({
        testId: `${prefix}-FUNC-001`,
        category: 'Functional',
        title: `Verify ${story.summary} - Happy Path`,
        preconditions: `User is logged in. Story ${story.key} feature is accessible.`,
        steps: [
            'Navigate to the feature area',
            'Perform the primary action described in the story',
            'Enter valid data for all required fields',
            'Submit/Save the action',
        ],
        expectedResult: 'The feature works as described in the story. All expected outcomes are achieved successfully.',
        priority: 'High',
    });

    tests.push({
        testId: `${prefix}-FUNC-002`,
        category: 'Functional',
        title: `Verify ${story.summary} - Data Validation`,
        preconditions: `User is logged in. Feature from ${story.key} is accessible.`,
        steps: [
            'Navigate to the feature area',
            'Attempt to submit with all required fields filled correctly',
            'Verify data is saved/processed correctly',
            'Verify confirmation message is displayed',
        ],
        expectedResult: 'Data is processed and stored correctly. Appropriate confirmation is shown to the user.',
        priority: 'High',
    });

    if (desc.includes('list') || desc.includes('display') || desc.includes('view') || desc.includes('show')) {
        tests.push({
            testId: `${prefix}-FUNC-003`,
            category: 'Functional',
            title: `Verify data display/listing for ${story.key}`,
            preconditions: `Relevant data exists in the system.`,
            steps: [
                'Navigate to the listing/display area',
                'Verify all expected data columns/fields are visible',
                'Verify data is correctly formatted',
                'Verify sorting and filtering work if applicable',
            ],
            expectedResult: 'Data is displayed correctly with proper formatting and all expected fields visible.',
            priority: 'Medium',
        });
    }

    if (desc.includes('edit') || desc.includes('update') || desc.includes('modify')) {
        tests.push({
            testId: `${prefix}-FUNC-004`,
            category: 'Functional',
            title: `Verify edit/update functionality for ${story.key}`,
            preconditions: `An existing record is available for editing.`,
            steps: [
                'Navigate to the record to edit',
                'Click Edit/Modify button',
                'Update the fields with new valid data',
                'Save the changes',
                'Verify changes are reflected correctly',
            ],
            expectedResult: 'Record is updated successfully. Changes persist after page refresh.',
            priority: 'High',
        });
    }

    if (desc.includes('delete') || desc.includes('remove')) {
        tests.push({
            testId: `${prefix}-FUNC-005`,
            category: 'Functional',
            title: `Verify delete/remove functionality for ${story.key}`,
            preconditions: `An existing record is available for deletion.`,
            steps: [
                'Navigate to the record to delete',
                'Click Delete/Remove button',
                'Confirm the deletion in the confirmation dialog',
                'Verify the record is removed from the list',
            ],
            expectedResult: 'Record is deleted successfully. Confirmation dialog appears before deletion. Record no longer appears in the list.',
            priority: 'High',
        });
    }

    return tests;
}

function generateNegativeTests(story: JiraStoryDetails, prefix: string): GeneratedTestCase[] {
    return [
        {
            testId: `${prefix}-NEG-001`,
            category: 'Negative',
            title: `Verify ${story.summary} with empty/missing required fields`,
            preconditions: `User is on the feature page for ${story.key}.`,
            steps: [
                'Navigate to the feature area',
                'Leave all required fields empty',
                'Attempt to submit/save',
            ],
            expectedResult: 'Appropriate validation error messages are shown. Form is not submitted. No data is saved.',
            priority: 'High',
        },
        {
            testId: `${prefix}-NEG-002`,
            category: 'Negative',
            title: `Verify ${story.summary} with invalid data input`,
            preconditions: `User is on the feature page for ${story.key}.`,
            steps: [
                'Navigate to the feature area',
                'Enter invalid data (special characters, SQL injection strings, XSS payloads)',
                'Attempt to submit/save',
            ],
            expectedResult: 'Input is properly sanitized. Validation errors shown for invalid data. No data corruption occurs.',
            priority: 'High',
        },
        {
            testId: `${prefix}-NEG-003`,
            category: 'Negative',
            title: `Verify ${story.summary} with unauthorized access`,
            preconditions: `User is NOT logged in or lacks required permissions.`,
            steps: [
                'Attempt to access the feature without proper authentication',
                'Attempt to perform the action without required permissions',
            ],
            expectedResult: 'Access is denied. User is redirected to login page or shown permission error.',
            priority: 'Medium',
        },
    ];
}

function generateBoundaryTests(story: JiraStoryDetails, prefix: string): GeneratedTestCase[] {
    return [
        {
            testId: `${prefix}-BVA-001`,
            category: 'Boundary Value',
            title: `Verify ${story.summary} with minimum boundary values`,
            preconditions: `User is on the feature page for ${story.key}.`,
            steps: [
                'Navigate to the feature area',
                'Enter minimum allowed values for all input fields',
                'Submit the form',
                'Verify the result with minimum values',
            ],
            expectedResult: 'System accepts minimum boundary values and processes them correctly.',
            priority: 'Medium',
        },
        {
            testId: `${prefix}-BVA-002`,
            category: 'Boundary Value',
            title: `Verify ${story.summary} with maximum boundary values`,
            preconditions: `User is on the feature page for ${story.key}.`,
            steps: [
                'Navigate to the feature area',
                'Enter maximum allowed values (max length strings, max numbers)',
                'Submit the form',
                'Verify the result with maximum values',
            ],
            expectedResult: 'System accepts maximum boundary values or shows appropriate truncation/limit messages.',
            priority: 'Medium',
        },
        {
            testId: `${prefix}-BVA-003`,
            category: 'Boundary Value',
            title: `Verify ${story.summary} with values exceeding boundaries`,
            preconditions: `User is on the feature page for ${story.key}.`,
            steps: [
                'Navigate to the feature area',
                'Enter values exceeding maximum limits',
                'Attempt to submit',
            ],
            expectedResult: 'System prevents submission or truncates input. Proper error messages are shown.',
            priority: 'Medium',
        },
    ];
}

function generateUIUXTests(story: JiraStoryDetails, prefix: string): GeneratedTestCase[] {
    return [
        {
            testId: `${prefix}-UI-001`,
            category: 'UI/UX',
            title: `Verify UI layout and design for ${story.key}`,
            preconditions: `Feature page is accessible.`,
            steps: [
                'Navigate to the feature page',
                'Verify all UI elements are properly aligned',
                'Check font sizes, colors, and spacing match the design',
                'Verify responsive behavior on different screen sizes',
            ],
            expectedResult: 'UI matches the design specifications. All elements are properly aligned and responsive.',
            priority: 'Medium',
        },
        {
            testId: `${prefix}-UI-002`,
            category: 'UI/UX',
            title: `Verify user feedback and notifications for ${story.key}`,
            preconditions: `User is on the feature page.`,
            steps: [
                'Perform successful action - verify success message',
                'Perform failed action - verify error message',
                'Check loading indicators during async operations',
                'Verify tooltip texts and help icons',
            ],
            expectedResult: 'Appropriate feedback (success/error/loading) is shown to the user at all times.',
            priority: 'Low',
        },
    ];
}

function generatePerformanceTests(story: JiraStoryDetails, prefix: string): GeneratedTestCase[] {
    return [
        {
            testId: `${prefix}-PERF-001`,
            category: 'Performance',
            title: `Verify response time for ${story.summary}`,
            preconditions: `System is running under normal load.`,
            steps: [
                'Navigate to the feature area',
                'Perform the primary action',
                'Measure the response time',
                'Repeat 5 times and calculate average',
            ],
            expectedResult: 'Response time is within acceptable limits (< 3 seconds for UI, < 1 second for API).',
            priority: 'Medium',
        },
        {
            testId: `${prefix}-PERF-002`,
            category: 'Performance',
            title: `Verify ${story.key} under concurrent user load`,
            preconditions: `Performance testing tools are configured.`,
            steps: [
                'Configure load test with 50+ concurrent users',
                'Execute the primary workflow',
                'Monitor response times and error rates',
                'Check server resource utilization',
            ],
            expectedResult: 'System handles concurrent users without degradation. Error rate < 1%. CPU/Memory within limits.',
            priority: 'Low',
        },
    ];
}

function generateSecurityTests(story: JiraStoryDetails, prefix: string): GeneratedTestCase[] {
    return [
        {
            testId: `${prefix}-SEC-001`,
            category: 'Security',
            title: `Verify XSS protection for ${story.key}`,
            preconditions: `User is on the feature page.`,
            steps: [
                'Enter XSS payloads (e.g., <script>alert(1)</script>) in all input fields',
                'Submit the form',
                'Verify the output page does not execute scripts',
            ],
            expectedResult: 'XSS payloads are sanitized. No script execution occurs. Input is escaped properly.',
            priority: 'High',
        },
        {
            testId: `${prefix}-SEC-002`,
            category: 'Security',
            title: `Verify SQL injection protection for ${story.key}`,
            preconditions: `User is on the feature page.`,
            steps: [
                'Enter SQL injection strings in input fields (e.g., \'; DROP TABLE users; --)',
                'Submit the form',
                'Verify database integrity',
            ],
            expectedResult: 'SQL injection attempts are blocked. Database is not affected. Proper error handling is in place.',
            priority: 'High',
        },
    ];
}

function generateIntegrationTests(story: JiraStoryDetails, prefix: string): GeneratedTestCase[] {
    return [
        {
            testId: `${prefix}-INT-001`,
            category: 'Integration',
            title: `Verify ${story.key} integration with dependent modules`,
            preconditions: `All dependent services/modules are running.`,
            steps: [
                'Perform the primary action in the feature',
                'Verify data flows correctly to dependent systems',
                'Check that dependent modules reflect the changes',
                'Verify API contracts between modules are maintained',
            ],
            expectedResult: 'Data flows correctly between modules. All integrations work as expected.',
            priority: 'High',
        },
        {
            testId: `${prefix}-INT-002`,
            category: 'Integration',
            title: `Verify ${story.key} behavior when dependent service is down`,
            preconditions: `One or more dependent services are intentionally stopped.`,
            steps: [
                'Stop a dependent service',
                'Perform the primary action',
                'Verify error handling and fallback behavior',
                'Restart the service and verify recovery',
            ],
            expectedResult: 'System gracefully handles downstream failures with proper error messages and fallback behavior.',
            priority: 'Medium',
        },
    ];
}

function generateAccessibilityTests(story: JiraStoryDetails, prefix: string): GeneratedTestCase[] {
    return [
        {
            testId: `${prefix}-A11Y-001`,
            category: 'Accessibility',
            title: `Verify keyboard navigation for ${story.key}`,
            preconditions: `Feature page is accessible.`,
            steps: [
                'Navigate to the feature page using only keyboard (Tab, Enter, Esc)',
                'Verify all interactive elements are focusable',
                'Verify focus order is logical',
                'Verify focus indicators are visible',
            ],
            expectedResult: 'All interactive elements are keyboard accessible with visible focus indicators and logical tab order.',
            priority: 'Medium',
        },
        {
            testId: `${prefix}-A11Y-002`,
            category: 'Accessibility',
            title: `Verify screen reader compatibility for ${story.key}`,
            preconditions: `Screen reader is enabled (NVDA/JAWS/VoiceOver).`,
            steps: [
                'Navigate to the feature page with screen reader enabled',
                'Verify all elements have proper ARIA labels',
                'Verify form fields have associated labels',
                'Verify error messages are announced',
            ],
            expectedResult: 'All content is properly announced by screen reader. ARIA labels are meaningful.',
            priority: 'Low',
        },
    ];
}

function generateRegressionTests(story: JiraStoryDetails, prefix: string): GeneratedTestCase[] {
    return [
        {
            testId: `${prefix}-REG-001`,
            category: 'Regression',
            title: `Verify existing functionality after ${story.key} changes`,
            preconditions: `${story.key} changes are deployed. Existing test suite is available.`,
            steps: [
                'Run the existing test suite for the affected module',
                'Verify all previously passing tests still pass',
                'Check for any UI/API contract changes',
                'Validate data migration if applicable',
            ],
            expectedResult: 'No regression found. All existing functionality works as before.',
            priority: 'High',
        },
        {
            testId: `${prefix}-REG-002`,
            category: 'Regression',
            title: `Verify backward compatibility for ${story.key}`,
            preconditions: `Previous version behavior is documented.`,
            steps: [
                'Compare current behavior with previous version',
                'Verify API responses maintain backward compatibility',
                'Check that saved/existing data works with new changes',
            ],
            expectedResult: 'Backward compatibility is maintained. No breaking changes for existing users.',
            priority: 'Medium',
        },
    ];
}

export function generateTestCases(
    story: JiraStoryDetails,
    selectedOptions: string[]
): GeneratedTestCase[] {
    const prefix = story.key;
    let allTests: GeneratedTestCase[] = [];

    const generators: Record<string, (story: JiraStoryDetails, prefix: string) => GeneratedTestCase[]> = {
        functional: generateFunctionalTests,
        negative: generateNegativeTests,
        boundary: generateBoundaryTests,
        uiux: generateUIUXTests,
        performance: generatePerformanceTests,
        security: generateSecurityTests,
        integration: generateIntegrationTests,
        accessibility: generateAccessibilityTests,
        regression: generateRegressionTests,
    };

    for (const option of selectedOptions) {
        const generator = generators[option];
        if (generator) {
            allTests = allTests.concat(generator(story, prefix));
        }
    }

    return allTests;
}
