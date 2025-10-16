# Google Form Auto-Populate from Google Sheet

## Description

This Google Apps Script automatically populates question options (Multiple Choice, Checkboxes, and Drop-down Lists) in multiple Google Forms using data from a single Google Sheet. This is incredibly useful for managing frequently changing master data, such as employee names, products, or categories, and ensuring that all connected forms are always up-to-date.

## How It Works

The script operates as follows:

1.  **Reads Data from Google Sheet**: The script accesses the active spreadsheet and reads all data from a specified sheet (e.g., "Masterdata").
2.  **Maps the Data**: The first row (header) of the sheet is treated as the question title in the Google Forms. Each column below that header is considered an answer option for the corresponding question.
3.  **Accesses Google Forms**: The script opens each Google Form whose ID is listed.
4.  **Updates Question Options**: The script matches the question titles in the form with the header names in the sheet. If a match is found, it updates the answer options (multiple choice, checkbox, or list) with the data from the corresponding column in the sheet.
5.  **Provides Notification**: After all forms have been successfully updated, a notification will appear in the Google Sheet to confirm that the process is complete.

## Setup and Installation

Follow the steps below to use this script in your project.

### 1. Prepare Your Google Sheet

Create a Google Sheet that will serve as your data source (database).
* The sheet name must match the one you set in the script (e.g., `Masterdata`).
* The first row **must** contain header names that are **exactly the same** as the question titles in your Google Forms.
* Fill each column below the header with the answer options you want to display in the form.

**Example Sheet Structure:**

| Employee Name  | Department | Office Location |
| :------------- | :--------- | :-------------- |
| Andi Wijaya    | IT         | Jakarta         |
| Budi Santoso   | Finance    | Surabaya        |
| Citra Lestari  | HRD        | Bandung         |
| Dewi Anggraini | Marketing  | Jakarta         |

### 2. Get Your Google Form IDs

Open each Google Form you want to update and copy its ID from the URL.
* **URL**: `https://docs.google.com/forms/d/THIS_IS_THE_FORM_ID/edit`
* **Example ID**: `1yoy0X7pAfGuOf0Z4KBJE4RspNMIMl7t2bn7394HR0m8`

### 3. Script Installation

1.  Open the Google Sheet you prepared.
2.  Click **Extensions** > **Apps Script**.
3.  Copy and paste the code from `populateGoogleForms.js` into the script editor.
4.  **Configure Variables**:
    * Change `GOOGLE_SHEET_NAME` to match your data source sheet name.
    ```javascript
    const GOOGLE_SHEET_NAME = "Masterdata"; // Change to your sheet name
    ```
    * Enter all your Google Form IDs into the `GOOGLE_FORM_IDS` array.
    ```javascript
    const GOOGLE_FORM_IDS = [
        "xxxxx", // Replace with your first Form ID
        "xxxxx"  // Replace with your second Form ID (add more if needed)
    ];
    ```
5.  Save the script project by clicking the save icon.

### 4. Running the Script

1.  Make sure you are in the Apps Script editor.
2.  Select the `populateGoogleForms` function from the dropdown menu next to the "Debug" button.
3.  Click **Run**.
4.  The first time you run it, you will be asked to grant permission for the script to access your Google Sheets and Google Forms. Click **Review permissions**, choose your Google account, and click **Allow**.
5.  After the script finishes, return to your Google Sheet. You will see a toast notification saying "All Google Forms Updated!".

## Supported Question Types

This script can update the following question types:
* **Multiple Choice** (`MULTIPLE_CHOICE`)
* **Checkboxes** (`CHECKBOX`)
* **Dropdown** (`LIST`)
