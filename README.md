# Sentinel - API Security Scanner

Sentinel is a developer-centric SaaS platform designed to provide comprehensive API security. It automatically scans APIs during development, detects a wide range of vulnerabilities, monitors live traffic for anomalies, and leverages the power of AI to provide actionable, code-level remediation suggestions.

This application is a feature-rich frontend prototype built with React, TypeScript, and the Google Gemini API to demonstrate the core functionalities of such a platform.

![Sentinel Screenshot]
<img width="1467" height="973" alt="image" src="https://github.com/user-attachments/assets/70453d27-a7d3-4c35-b172-6be212605d7b" />


---

## ✨ Key Features

This platform is built around four core goals:

1.  **CI/CD Integration**: Scans APIs during build/deploy stages with integrations for GitHub, GitLab, and Bitbucket.
2.  **OWASP Top 10 Detection**: Detects vulnerabilities mapped to the latest OWASP API Security Top 10.
3.  **Runtime Monitoring**: Deploys a lightweight runtime agent that observes live traffic for anomalies, authentication flaws, and injection attempts.
4.  **AI-Powered Fixes**: Provides actionable fixes with AI-generated code-level remediation suggestions.

### Feature Breakdown

*   **Interactive Dashboard**: Get a high-level overview of your security posture with real-time stats, live traffic monitoring, and an interactive vulnerability breakdown chart.
*   **Advanced Vulnerability Management**:
    *   Live search, sort (by severity, date, assignee), and filter (by severity, status) a list of all detected vulnerabilities.
    *   A detailed view for each vulnerability, including its description, endpoint, and discovery details.
    *   Manage the vulnerability lifecycle by changing its status (`New`, `Acknowledged`, `Fixed`).
    *   Track all status changes with an activity timeline.
*   **AI-Powered Intelligence (via Google Gemini API)**:
    *   **Code-Level Remediation**: Generate detailed, actionable steps and code snippets to fix vulnerabilities.
    *   **CVE Analysis**: Use Google Search grounding to find related public CVEs for any vulnerability.
    *   **CVE Details**: Fetch structured details for any CVE ID, including its CVSS score, vector, affected software, and official references.
*   **Team Collaboration**:
    *   Assign vulnerabilities to specific team members from a dynamic list.
    *   Manage your team roster directly from the settings page (add, edit, remove members).
*   **Simulated Scans**:
    *   Launch new scans from a modal with advanced configuration (scan depth, regex for endpoints, minimum severity).
    *   View a summary of scan results upon completion.
*   **Responsive UI**: A fully responsive, toggleable navigation sidebar for a seamless experience on all screen sizes.

---

## 🛠️ Technology Stack

*   **Frontend Framework**: React
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **AI Integration**: Google Gemini API (`@google/genai`)
*   **Data Visualization**: Recharts

---

## 📂 Application Structure

The application is organized into several key directories and files:

*   **`App.tsx`**: The root component that manages global state, such as the active page, vulnerability list, team members, and modal visibility. It also handles the main layout and routing logic.
*   **`components/`**: Contains all the reusable React components.
    *   `Dashboard.tsx`: The main overview page.
    *   `VulnerabilitiesView.tsx`: The core UI for listing, viewing, and managing security issues.
    *   `IntegrationsView.tsx`: The page for managing CI/CD connections.
    *   `SettingsView.tsx`: Houses all application and team settings.
    *   `Sidebar.tsx` & `Header.tsx`: The main navigation elements.
    *   `NewScanModal.tsx`: The modal for initiating new scans.
*   **`services/geminiService.ts`**: A dedicated module for all interactions with the Google Gemini API. This includes generating remediation, searching for CVEs, and fetching CVE details.
*   **`constants.ts`**: Contains static data, UI configuration objects (like colors for severity levels), and the mock data generation function.
*   **`types.ts`**: Defines all shared TypeScript interfaces and enums (`Vulnerability`, `Severity`, etc.).
*   **`index.html` & `index.tsx`**: The entry point for the web application.

---

## 🚀 Getting Started

This is a self-contained web application that runs entirely in the browser.

### Prerequisites

The application requires a **Google Gemini API key** to power its AI features (remediation and CVE analysis).

### Configuration

The API key must be available as an environment variable named `API_KEY`. The application is coded to read this key directly from `process.env.API_KEY`.

```bash
# Example of setting the environment variable before running
export API_KEY="YOUR_GEMINI_API_KEY"
```

Once the API key is configured, simply open the `index.html` file in a web browser.

---

## 📖 How to Use

1.  **Dashboard Overview**: Start at the Dashboard to get a quick summary of your API security health. Click on a severity in the pie chart to navigate to a pre-filtered list of vulnerabilities.
2.  **Explore Vulnerabilities**: Navigate to the "Vulnerabilities" page.
    *   Use the search bar, status filter, and sort dropdowns to find specific issues.
    *   Click on any vulnerability in the list to view its details on the right.
3.  **Get AI Assistance**: In the details pane:
    *   Click **"Get Code-Level Fix"** to have the Gemini API generate a detailed remediation plan with code examples.
    *   Click **"Search for CVEs"** to find related public exploits.
    *   Click on any discovered CVE ID to fetch and display its full details.
4.  **Manage Workflow**:
    *   Change a vulnerability's **status** using the dropdown in the details pane.
    *   Assign the vulnerability to a team member using the **Assignee** dropdown.
5.  **Run a New Scan**:
    *   Click the **"New Scan"** button in the header.
    *   Configure the scan target and advanced options, then click **"Start Scan"**.
    *   A new vulnerability will be added to the top of the list upon completion.
6.  **Manage Settings**:
    *   Go to the "Settings" page to manage your team. Add, edit, or remove members. The changes will instantly appear in the assignee dropdowns.
