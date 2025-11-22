# LogiTrack - Logistics Management System

LogiTrack is a comprehensive web application designed to digitize and streamline logistics operations. It replaces manual, spreadsheet-based tracking with a modern, intuitive, and powerful system for managing trips, financials, vendors, and customers.

---

## Getting Started: Logging In

To begin, you will need to log in with the credentials provided by your administrator. The application supports different roles (Admin, Manager, Supervisor), each with its own set of permissions.

**Step 1: Navigate to the Login Page**
Open the application URL in your web browser. You will be greeted by the login screen.

*[Screenshot of the LogiTrack login page with fields for Username and Password.]*

**Step 2: Enter Your Credentials**
For initial setup and testing, you can use the default administrator account:
-   **Username:** `Admin User`
-   **Password:** `malli275`

Click the "Sign in" button to access the application.

---

## Core Workflow: The Lifecycle of a Trip

This section covers the primary workflow for on-site supervisors.

### 1. Entering a New Trip

As a supervisor, your main task is to record trip details as they happen. Your dashboard is simplified to help you do this quickly.

**Step 1: Open the "Enter Trip" Form**
After logging in, you will land on the **"Enter Trips"** page. Click the **`+ Enter Trip`** button in the top-right corner.

*[Screenshot of the Supervisor's "Enter Trips" page, highlighting the "+ Enter Trip" button.]*

**Step 2: Fill Out the Trip Details**
A form will appear. Fill in all the required information about the trip, such as the date, customer, quarry, vehicle, and the final net weight from the weighment slip.

*[Screenshot of the "Enter New Trip" form, showing the various fields like Customer, Quarry, and Net Weight.]*

**Step 3: Save the Trip**
Once all details are entered, click the **"Save Trip"** button. The trip will be added to your list with a status of "Pending Upload."

### 2. Uploading Documents

After saving the initial details, you need to upload the supporting documents.

**Step 1: Find the Trip and Click "Upload"**
In your "My Trip Entries" list, find the trip you just created. Click the blue **"Upload"** button for that row.

*[Screenshot of the supervisor's trip list, with an arrow pointing to the "Upload" button on a "Pending Upload" trip.]*

**Step 2: Attach Files and Save**
A new form will appear. Use the "Choose File" buttons to attach the relevant documents (like the E-Way Bill, Wayment Slip, etc.). Click **"Save & Send to Transit"**. The trip's status will update to "In Transit."

### 3. Receiving a Trip (Destination User)

Once a vehicle arrives at its destination, another user will log the receiving details.

**Step 1: Go to the "Received Trips" Page**
From the sidebar, navigate to the **"Received Trips"** page. This page lists all trips currently "In Transit."

**Step 2: Find the Trip and Click "Receive"**
Locate the correct trip in the table and click the green **"Receive"** button.

*[Screenshot of the "Received Trips" page, highlighting the "Receive" button for a specific trip.]*

**Step 3: Enter Final Weighment Details**
A form will appear showing the trip's starting details. Enter the final weighment information from the destination's weighment slip. The form will automatically calculate any weight difference. Add a reason if there is a discrepancy. Click **"Confirm & Validate"** to complete the process.

---

## Admin & Manager Features

These features provide a high-level overview and control over the entire business operation.

### The Dashboard
The central hub for analytics. It provides a filterable, high-level view of business performance.
-   **KPIs:** At-a-glance cards for Total Trips, Tonnage, Royalty Used, and Reduction, with comparisons to the previous period.
-   **Recent Trips:** A paginated table showing the 30 most recent trips that match your filters.
-   **Charts:** Visualizations for daily trip counts and a breakdown of trips by transporter, quarry, or customer.

*[Screenshot of the main Admin Dashboard, showing the four KPI cards, the recent trips table, and the charts.]*

### Accounting
This is where your finance team will manage all payables and receivables.
-   **Tabbed Interface:** Easily switch between Vendor Payables, Vendor Receivables, Customer Receivables, and Aged Balances.
-   **Drill-Down Ledgers:** Click on any vendor or customer row to instantly see a detailed transaction ledger showing every trip and payment that contributes to their balance. This is perfect for verification.

*[Screenshot of the Accounting page, showing the tabbed view with the "Vendor Payables" tab active and one vendor's transaction ledger expanded.]*

### Master Data Management
The pages under this section (`Customers`, `Transport`, `Quarries`, `Royalty`) are where you manage your business partners and their associated rates.
-   **Rate History:** Add new rates for any vendor or customer with an "Effective From" date. The system maintains a complete history, ensuring that financial calculations for past trips are always accurate.
-   **Active Rate View:** The main table on each page cleanly displays only the currently active rate for easy reference.
-   **Old Rates Popover:** Click the "Old Rates" button on any row to view a complete history of past rates.

*[Screenshot of the "Transport" page, showing the main table with active rates and the "Old Rates" popover visible for one entry.]*

---

## Automated Deployment

This application is configured for a professional, automated deployment pipeline using **Terraform** and **Google Cloud Platform (GCP)**.

-   **Infrastructure as Code:** Terraform files (`.tf`) define all the necessary cloud resources (Cloud Run, Artifact Registry).
-   **Continuous Deployment:** A GitHub Actions workflow (`deploy.yml`) automatically builds the application into a Docker container and deploys it to Cloud Run whenever code is pushed to the `main` branch. This ensures a seamless, zero-downtime update process.
