 /**
 * Auto-populate Question options in Google Forms
 * from values in Google Spreadsheet
 **/

const populateGoogleForms = () => {
  const GOOGLE_SHEET_NAME = "Masterdata"; // Sheet Name untuk sumber Google Forms
  const GOOGLE_FORM_IDS = [ "xxxxx",
                           "xxxxx"]; // ID Google Forms
  
  // Access the Google Sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Get header and data from the sheet
  const [header, ...data] = ss
    .getSheetByName(GOOGLE_SHEET_NAME)
    .getDataRange()
    .getDisplayValues();

  // Prepare choices object
  const choices = {};
  header.forEach((title, i) => {
    choices[title] = data.map((d) => d[i]).filter((e) => e);
  });

  // Update each form in the list
  GOOGLE_FORM_IDS.forEach((formId) => {
    const form = FormApp.openById(formId);
    form.getItems()
      .map((item) => ({
        item,
        values: choices[item.getTitle()],
      }))
      .filter(({ values }) => values)
      .forEach(({ item, values }) => {
        switch (item.getType()) {
          case FormApp.ItemType.CHECKBOX:
            item.asCheckboxItem().setChoiceValues(values);
            break;
          case FormApp.ItemType.LIST:
            item.asListItem().setChoiceValues(values);
            break;
          case FormApp.ItemType.MULTIPLE_CHOICE:
            item.asMultipleChoiceItem().setChoiceValues(values);
            break;
          default:
          // ignore item
        }
      });
  });

  // Notify the user
  ss.toast("All Google Forms Updated!");
};
