import React from 'react';

const readmeContent = `
# LogiTrack - Logistics Management System

LogiTrack is a comprehensive web application designed to digitize and streamline logistics operations. It replaces manual, spreadsheet-based tracking with a modern, intuitive, and powerful system for managing trips, financials, vendors, and customers.

---

## Getting Started: Logging In

To begin, you will need to log in with the credentials provided by your administrator. The application supports different roles (Admin, Manager, Supervisor), each with its own set of permissions.

**Step 1: Navigate to the Login Page**
Open the application URL in your web browser. You will be greeted by the login screen.

**Step 2: Enter Your Credentials**
For initial setup and testing, you can use the default administrator account:
-   **Username:** \`Admin User\`
-   **Password:** \`malli275\`

Click the "Sign in" button to access the application.

---

## Core Workflow: The Lifecycle of a Trip

This section covers the primary workflow for on-site supervisors.

### 1. Entering a New Trip

As a supervisor, your main task is to record trip details as they happen. Your dashboard is simplified to help you do this quickly.

**Step 1: Open the "Enter Trip" Form**
After logging in, you will land on the **"Enter Trips"** page. Click the **\`+ Enter Trip\`** button in the top-right corner.

**Step 2: Fill Out the Trip Details**
A form will appear. Fill in all the required information about the trip, such as the date, customer, quarry, vehicle, and the final net weight from the weighment slip.

**Step 3: Save the Trip**
Once all details are entered, click the **"Save Trip"** button. The trip will be added to your list with a status of "Pending Upload."

### 2. Uploading Documents

After saving the initial details, you need to upload the supporting documents.

**Step 1: Find the Trip and Click "Upload"**
In your "My Trip Entries" list, find the trip you just created. Click the blue **"Upload"** button for that row.

**Step 2: Attach Files and Save**
A new form will appear. Use the "Choose File" buttons to attach the relevant documents (like the E-Way Bill, Wayment Slip, etc.). Click **"Save & Send to Transit"**. The trip's status will update to "In Transit."

### 3. Receiving a Trip (Destination User)

Once a vehicle arrives at its destination, another user will log the receiving details.

**Step 1: Go to the "Received Trips" Page**
From the sidebar, navigate to the **"Received Trips"** page. This page lists all trips currently "In Transit."

**Step 2: Find the Trip and Click "Receive"**
Locate the correct trip in the table and click the green **"Receive"** button.

**Step 3: Enter Final Weighment Details**
A form will appear showing the trip's starting details. Enter the final weighment information from the destination's weighment slip. The form will automatically calculate any weight difference. Add a reason if there is a discrepancy. Click **"Confirm & Validate"** to complete the process.

---

## Admin & Manager Features

These features provide a high-level overview and control over the entire business operation.

### The Dashboard
The central hub for analytics. It provides a filterable, high-level view of business performance.

### Accounting
This is where your finance team will manage all payables and receivables.

### Master Data Management
The pages under this section (\`Customers\`, \`Transport\`, \`Quarries\`, \`Royalty\`) are where you manage your business partners and their associated rates.
`;

const HelpGuide: React.FC = () => {
    return (
        <div className="p-8 prose dark:prose-invert max-w-none">
            {/* Using a pre-wrap for now. In a real app with markdown, you'd parse it to HTML. */}
            <pre className="whitespace-pre-wrap font-sans text-sm">{readmeContent}</pre>
        </div>
    );
};

export default HelpGuide;
