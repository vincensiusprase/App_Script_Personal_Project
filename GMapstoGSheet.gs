function gmapstogsheet() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GOOGLE_PLACES_API_KEY');
  const spreadsheetId = '1jK0_9D9MEgwhJovDUzAjDFf5yM9WLE0ozLTziLtxhMc'; // Your Sheet Id
  const ss = SpreadsheetApp.openById(spreadsheetId);

  // --- MODIFICATION START ---
  // Get settings from the 'Settings' sheet
  const settingsSheet = ss.getSheetByName('Settings');
  if (!settingsSheet) {
    ss.toast('Sheet "Settings" tidak ditemukan. Harap buat sheet tersebut.', 'Error', 5);
    Logger.log('Sheet "Settings" tidak ditemukan.');
    return;
  }

  const query = settingsSheet.getRange('C3').getValue();    // Get Query from cell C3
  const location = settingsSheet.getRange('C4').getValue(); // Get Location from cell C4
  const limit = settingsSheet.getRange('C5').getValue();    // Get Limit from cell C5
  const sheetName = 'Scraping'; // Your Sheet Destination
  
  // Check if inputs are empty
  if (!query || !location || !limit) {
    ss.toast('Harap isi Query, Location, dan Limit di sheet "Settings".', 'Input Diperlukan', 5);
    Logger.log('Input values are missing in the Settings sheet.');
    return;
  }
  // --- MODIFICATION END ---

  let sheet;
  const cleanText = (text) => text ? text.toString().replace(/[\n\r]+/g, ' ').replace(/"/g, "'") : 'Not available';

  Logger.log('--- Starting getPlaceDetailsToSheet ---');
  ss.toast(`Memulai pencarian untuk "${query}" di "${location}"...`, 'Proses Dimulai', 5);

  try {
    sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow([
        'Place ID', 'Name', 'Address', 'Phone Number', 'Opening Hours',
        'Website', 'Rating', 'Reviews Count', 'Types',
        'Latitude', 'Longitude', 'Business Status'
      ]);
    }
  } catch (e) {
    Logger.log(`Error accessing or creating sheet: ${e.message}`);
    ss.toast(`Error: ${e.message}`, 'Gagal', 5);
    return;
  }

  let existingPlaceIds = new Set();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const existingData = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
    existingPlaceIds = new Set(existingData);
  }

  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}+in+${encodeURIComponent(location)}&key=${apiKey}`;
  let resultsFetched = 0;

  while (url && resultsFetched < limit) {
    try {
      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      const data = JSON.parse(response.getContentText());

      if (data.status === 'OK') {
        for (const place of data.results) {
          if (resultsFetched >= limit) break;

          const placeId = place.place_id;
          if (existingPlaceIds.has(placeId)) continue;

          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`;
          try {
            const detailsResponse = UrlFetchApp.fetch(detailsUrl, { muteHttpExceptions: true });
            const detailsData = JSON.parse(detailsResponse.getContentText());

            if (detailsData.status === 'OK' && detailsData.result) {
              const result = detailsData.result;
              const name = cleanText(result.name);
              const address = cleanText(result.formatted_address);
              const phoneNumber = cleanText(result.formatted_phone_number);
              const openingHours = result.opening_hours ? cleanText(result.opening_hours.weekday_text.join(', ')) : 'Not available';
              const website = result.website || 'Not available';
              const rating = result.rating || 'Not available';
              const reviewsCount = result.user_ratings_total || 0;
              const types = result.types ? result.types.map(t => t.replace(/_/g, ' ').toUpperCase()).join(', ') : 'Not available';
              const latitude = result.geometry?.location?.lat || 'Not available';
              const longitude = result.geometry?.location?.lng || 'Not available';
              const businessStatus = place.business_status || 'Not available';

              sheet.appendRow([
                placeId, name, address, phoneNumber, openingHours,
                website, rating, reviewsCount, types,
                latitude, longitude, businessStatus
              ]);

              resultsFetched++;
              existingPlaceIds.add(placeId);
              Logger.log(`Added ${name} (Total: ${resultsFetched})`);
            }
          } catch (err) {
            Logger.log(`Error fetching details for Place ID ${placeId}: ${err.message}`);
          }
        }

        if (data.next_page_token) {
          Logger.log('Waiting 3 seconds for next_page_token...');
          Utilities.sleep(3000);
          url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${data.next_page_token}&key=${apiKey}`;
        } else {
          url = null;
        }
      } else {
        Logger.log(`Google Places API status: ${data.status} | ${data.error_message || ''}`);
        ss.toast(`API Error: ${data.status}`, 'Gagal', 5);
        url = null;
      }
    } catch (e) {
      Logger.log(`Error fetching URL: ${e.message}`);
      ss.toast(`Error: ${e.message}`, 'Gagal', 5);
      url = null;
    }
  }

  Logger.log(`--- Process finished. Total new places added: ${resultsFetched} ---`);
  ss.toast(`Proses selesai! ${resultsFetched} data baru ditambahkan.`, 'Selesai', 5);
}
