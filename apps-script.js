// IMPORTANT: Paste this ENTIRE code into Google Apps Script (Extensions > Apps Script in your Google Sheet)

const SHEET_NAME = "Guests";

function doPost(e) {
  // We use text/plain to avoid CORS preflight issues
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({error: "Sheet not found"})).setMimeType(ContentService.MimeType.JSON);
  }

  const action = data.action;
  const nameToFind = data.name;

  const rows = sheet.getDataRange().getValues();
  
  // Find the row with the given name (Assuming Name is in Column A)
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === nameToFind) { 
      rowIndex = i + 1; // 1-indexed for SpreadsheetApp
      break;
    }
  }

  if (rowIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({error: "Guest not found"})).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'updateRSVP') {
    // Column C is RSVP Status (index 3)
    sheet.getRange(rowIndex, 3).setValue(data.status);
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  } 
  else if (action === 'updateSent') {
    // Column D is Invite Sent (index 4)
    sheet.getRange(rowIndex, 4).setValue("Yes");
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({error: "Invalid action"})).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({error: "Sheet not found"})).setMimeType(ContentService.MimeType.JSON);

  const rows = sheet.getDataRange().getValues();
  const guests = [];

  // Start from row 1 (skipping header row 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0]) continue; // Skip empty names
    
    guests.push({
      name: row[0] || "",
      phone: row[1] || "",
      status: row[2] || "Pending",
      sent: row[3] === "Yes"
    });
  }

  // Return the data
  return ContentService.createTextOutput(JSON.stringify(guests))
    .setMimeType(ContentService.MimeType.JSON);
}
