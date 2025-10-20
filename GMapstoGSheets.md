# Google Maps Places Scraper to Google Sheets

This Google Apps Script searches for places using the Google Maps Places API (Text Search) and saves detailed information (Place Details) for each result directly into a Google Sheet.

The script is designed to be controlled from the spreadsheet itself, using a dedicated `Settings` sheet to define the search query, location, and the number of results to fetch.

## Features

-   **Dynamic Input**: Configure your search query, location, and result limit directly from cells in a `Settings` sheet.
-   **Fetches Detailed Data**: Uses the Place Details API to retrieve rich information for each location, including phone number, website, opening hours, and more.
-   **Prevents Duplicates**: The script checks the `Place ID` of existing entries in the sheet and skips any duplicates, allowing you to run the script multiple times to append new data.
-   **Pagination Handling**: Automatically handles the `next_page_token` from the API to fetch results beyond the initial page (up to your specified limit).
-   **Automatic Sheet Creation**: If the destination sheet (default: `Scraping`) doesn't exist, the script creates it and adds the correct headers.

## Prerequisites

1.  **Google Account**: You need a Google account to use Google Sheets and Google Apps Script.
2.  **Google Cloud Platform (GCP) Project**: You must have a GCP project.
3.  **Google Places API Key**: You need an API key from your GCP project with the **Places API** enabled.
    -   Go to your [Google Cloud Console](https://console.cloud.google.com/).
    -   Select your project.
    -   Go to **APIs & Services > Library**.
    -   Search for and **enable** the **Places API**.
    -   Go to **APIs & Services > Credentials** to create or find your API key.

## Setup Instructions

### 1. Create the Google Sheet

1.  Create a new Google Sheet.
2.  **Get the Sheet ID**: Look at the URL in your browser. The ID is the long string of characters between `/d/` and `/edit`.
    `https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit`
3.  Create a new sheet (tab) and name it **`Settings`**.
4.  In the `Settings` sheet, set up the following cells (the labels in column B are for your reference):

| | B | C |
| :--- | :--- | :--- |
| **3** | `Query` | `restaurant` |
| **4** | `Location` | `New York` |
| **5** | `Limit` | `50` |

* The script will read the values from cells `C3` (Query), `C4` (Location), and `C5` (Limit).

### 2. Set up the Google Apps Script

1.  In your Google Sheet, click **Extensions > Apps Script**.
2.  Delete any existing code in the `Code.gs` file and paste the entire `gmapstogsheet.gs` script.
3.  **IMPORTANT: Update the Spreadsheet ID**:
    Find this line in the script:
    ```javascript
    const spreadsheetId = '1jK0_9D9MEgwhJovDUzAjDFf5yM9WLE0ozLTziLtxhMc'; // Your Sheet Id
    ```
    Replace the ID with **your own** Google Sheet ID from Step 1.

### 3. Add Your API Key (Securely)

1.  In the Apps Script editor, click the **Project Settings** icon (⚙️) on the left sidebar.
2.  Scroll down to the **Script Properties** section.
3.  Click **Add script property**.
4.  Set the **Property** name to: `GOOGLE_PLACES_API_KEY`
5.  Set the **Value** to your actual Google Places API key (e.g., `AIzaSy...`).
6.  Click **Save script properties**.

Save the project. You may need to refresh your Google Sheet to see the new "Maps Scraper" menu.

## How to use

1. Open your Google Sheet.
2. Go to the Settings sheet.
3. Enter your desired Query in cell C3.
4. Enter your desired Location in cell C4.
5. Enter the Limit (max number of results) in cell C5.
6. Run the script by either:
    - Clicking the Run (►) button in the Apps Script editor (make sure gmapstogsheet is selected).
    - Using the custom menu: Maps Scraper > Fetch Places (if you added the onOpen function).
7. Grant Permissions: The first time you run the script, Google will ask you to authorize it. Follow the prompts to grant it permission to access your Google Sheets and make external requests.
8. The script will start fetching data. You can see toast notifications in the bottom-right corner of your sheet.
9. The results will appear in the Scraping sheet.


## Output Data
The script will populate the Scraping sheet with the following columns:
- Place ID
- Name
- Address
- Phone Number
- Opening Hours
- Website
- Rating
- Reviews Count
- Types
- Latitude
- Longitude
- Business Status

## Important Notes
- API Costs: The Google Places API is a paid service. Both Text Search and Place Details calls incur costs. Be mindful of the Limit you set to avoid unexpected charges.
- API Quotas: Google enforces API usage quotas. If you try to fetch thousands of results at once, you may hit your quota or the script may time out.
- Script Execution Time: Google Apps Script has a maximum execution time (6 minutes for standard accounts). If you set a very high limit, the script may time out before completion. If this happens, simply run the script again; it will skip duplicates and continue where it left off.
