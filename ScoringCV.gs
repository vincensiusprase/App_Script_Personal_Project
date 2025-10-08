/**
 * @OnlyCurrentDoc
 *
 * Script ini digunakan untuk melakukan scoring kandidat secara otomatis
 * menggunakan Google Gemini API.
 *
 * Perbaikan utama:
 * ✅ Memperbaiki format URL yang menyebabkan error "Invalid argument".
 * ✅ Membatasi pembacaan data hanya pada baris yang berisi konten (menggunakan getLastRow).
 * 🌟 Mengganti Structured Output (yang menyebabkan error 400) dengan Prompt-Based Output + Pembersihan String.
 * ✅ Menangani error API & parsing JSON dengan aman
 * ✅ Menulis hasil langsung ke kolom U (scoring) dan V (summary)
 * ✅ Menampilkan error di sheet agar mudah dicek
 */

// ✅ Gunakan model Gemini terbaru
// 🚩 PERBAIKAN URL: Dihapus dari format Markdown Link (yang menyebabkan error Invalid argument)
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=";

// 🌟 DEFINISI SKEMA JSON UNTUK REFERENSI PROMPT (Skema ini HANYA digunakan sebagai instruksi, BUKAN di payload API)
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    scoring: {
      type: "NUMBER",
      description: "Total skor numerik kandidat dari 100."
    },
    summary: {
      type: "STRING",
      description: "Ringkasan evaluasi kekuatan dan kelemahan kandidat dalam 2-3 kalimat."
    }
  },
  required: ["scoring", "summary"]
};

/**
 * Mengambil data master dari sheet 'Masterdata' dan mengubahnya menjadi object
 * agar mudah diakses. Key dari object adalah 'Posisi Yang Dilamar'.
 */
function getMasterData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName("Masterdata");
  if (!masterSheet) {
    SpreadsheetApp.getUi().alert('Error: Sheet "Masterdata" tidak ditemukan.');
    return null;
  }

  const data = masterSheet.getDataRange().getValues();
  const headers = data.shift();
  const masterDataObject = {};

  data.forEach((row) => {
    const position = {};
    headers.forEach((header, index) => {
      position[header] = row[index];
    });

    const positionName = position["Posisi Yang Dilamar"];
    if (positionName && typeof positionName === "string") {
      // Menggunakan trim() untuk memastikan posisi sesuai dengan data respon
      masterDataObject[positionName.trim()] = position; 
    }
  });

  return masterDataObject;
}

/**
 * Memanggil Gemini API dengan prompt yang diberikan.
 * @param {string} prompt Teks prompt yang akan dikirim ke Gemini.
 * @returns {string|null} Respons teks JSON MURNI (setelah dibersihkan) dari Gemini API.
 */
function callGeminiAPI(prompt) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY belum diatur di Script Properties.");

  const url = GEMINI_API_URL + apiKey;
  
  // Menghapus generationConfig yang menyebabkan error 400
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode !== 200) {
      Logger.log(`❌ Error Gemini API: ${responseCode} | ${responseBody}`);
      // Jika API key invalid, responseBody akan berisi error yang spesifik.
      return `Error ${responseCode}: ${responseBody}`;
    }

    const json = JSON.parse(responseBody);
    
    // Ambil respons teks mentah
    const rawResponseText = json.candidates?.[0]?.content?.parts?.[0]?.text;

    if (rawResponseText) {
      // Membersihkan markdown fences yang sering ditambahkan model
      // saat Structured Output tidak digunakan.
      const cleanJsonText = rawResponseText.replace(/```json\n|```/g, "").trim();
      return cleanJsonText;
    } else {
      // Ini bisa terjadi jika model diblokir karena safety, dll.
      Logger.log(`⚠️ Respons Gemini tidak valid (null/empty text): ${responseBody}`);
      return `Error: Respons tidak valid atau kosong. Body: ${responseBody}`;
    }

  } catch (e) {
    // Menangkap error jika UrlFetchApp.fetch gagal (misal: URL malformed atau masalah koneksi)
    Logger.log(`💥 Exception Gemini API: ${e.message}`);
    return `Error: ${e.message}`;
  }
}

/**
 * Membuat teks prompt yang akan dikirim ke Gemini API berdasarkan data kandidat dan kriteria pekerjaan.
 */
function createPrompt(candidate, requirements) {
  // CATATAN: Karena kita kembali ke metode prompt-based, instruksi format JSON harus sangat jelas.
  return `
Anda adalah seorang asisten HR virtual yang ahli dalam menyeleksi kandidat.
Tugas Anda adalah memberikan skor dan ringkasan evaluasi berdasarkan data kandidat dan kriteria posisi yang dilamar.

**Data Kandidat:**
- Posisi yang Dilamar: ${candidate.posisi}
- Pendidikan Terakhir: ${candidate.pendidikanTerakhir}
- Total Pengalaman Kerja: ${candidate.pengalamanDurasi}
- Skill yang Dimiliki: ${candidate.keterampilan}
- Deskripsi Pengalaman Kerja: ${candidate.deskripsiPengalaman}

**Kriteria Posisi "${requirements["Posisi Yang Dilamar"]}":**
- Level Pendidikan yang Dibutuhkan: ${requirements["Level Pendidikan Posisi"]}
- Pengalaman Kerja yang Dibutuhkan: ${requirements["Pengalaman Kerja Posisi"]}
- Skill yang Dibutuhkan: ${requirements["Skill Posisi"]}
- Deskripsi Pekerjaan (Job Desc): ${requirements["Job Desc Posisi"]}

**Aturan Poin Scoring (Total Maksimal 100):**
1. Kecocokan Pengalaman Kerja (30 poin)
2. Kecocokan Pendidikan (20 poin)
3. Kecocokan Skill (15 poin)
4. Kecocokan Durasi Pengalaman (15 poin)
5. Kecocokan Deskripsi Pengalaman (20 poin)

**Instruksi:**
1. Hitung total skor numerik (0-100) berdasarkan aturan poin di atas.
2. Buat ringkasan singkat (2-3 kalimat) mengenai kekuatan dan kelemahan kandidat.

**Format Jawaban (HANYA JSON MURNI, TANPA TEKS LAIN, TANPA MARKDOWN FENCES \`\`\`):**
{
  "scoring": <nilai_total_skor_numerik>,
  "summary": "<teks_ringkasan_evaluasi>"
}
`;
}

/**
 * Fungsi utama untuk memproses dan melakukan scoring pada semua kandidat di sheet 'Respon'.
 */
function processAllCandidates() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responseSheet = ss.getSheetByName("Respon");

  if (!responseSheet) {
    ui.alert('Error: Sheet "Respon" tidak ditemukan.');
    return;
  }

  ss.toast("Memulai proses scoring kandidat...", "Status", -1);

  try {
    const masterData = getMasterData();
    if (!masterData) return;

    // 🚩 PERBAIKAN BATAS EKSEKUSI: Ambil data hanya sampai baris terakhir yang digunakan
    const lastRow = responseSheet.getLastRow();
    if (lastRow < 2) { // Hanya header atau kosong
        ui.alert("Info", "Tidak ada data kandidat baru untuk diproses (hanya header atau kosong).", ui.ButtonSet.OK);
        ss.toast("Proses selesai.", "Selesai");
        return;
    }
    const numColumns = responseSheet.getLastColumn();
    const dataRange = responseSheet.getRange(1, 1, lastRow, numColumns);
    const data = dataRange.getValues();
    
    // Header selalu ada di baris pertama
    const headers = data.shift();

    const colIdx = {
      posisi: headers.indexOf("Posisi Yang Dilamar"),
      pengalamanKerja: headers.indexOf("Pengalaman Kerja"),
      pendidikan: headers.indexOf("Pendidikan Terakhir"),
      skill: headers.indexOf("Skill"),
      // Mencari header tanpa atau dengan spasi ekstra di akhir
      deskripsi: headers.indexOf("Deskripsi Pengalaman Pekerjaan"), 
      scoring: 20, // kolom U (Index 0 = A, Index 20 = U)
      summary: 21, // kolom V (Index 21 = V)
    };
    
    // Alternatif untuk "Deskripsi Pengalaman Pekerjaan " (dengan spasi)
    if (colIdx.deskripsi === -1) {
        const altIndex = headers.indexOf("Deskripsi Pengalaman Pekerjaan "); 
        if (altIndex > -1) {
            colIdx.deskripsi = altIndex;
        }
    }


    // Validasi kolom input
    for (const key in colIdx) {
      if (key !== "scoring" && key !== "summary" && colIdx[key] === -1) {
          ui.alert(`Error: Kolom "${key}" tidak ditemukan di sheet "Respon". Pastikan penamaan kolom sudah benar.`);
          ss.toast("Proses dibatalkan.", "Error");
          return;
      }
    }

    let processedCount = 0;
    
    // Menentukan baris awal (setelah header, yaitu baris 2)
    const startRow = 2; 

    data.forEach((row, index) => {
      // index adalah index baris data (0-based) setelah header dihilangkan
      const rowNumber = index + startRow; 
      
      // Catatan: Karena kita sudah menggunakan getLastRow(), pemeriksaan ini
      // lebih bertujuan untuk menangkap baris yang benar-benar kosong di tengah-tengah data.
      if (row.join("").trim() === "") return; // Lewati baris kosong

      // Ambil nilai yang sudah ada di kolom scoring dan summary
      const scoreValue = row[colIdx.scoring];
      const summaryValue = row[colIdx.summary];
      
      // Jika kolom scoring dan summary sudah terisi, lewati (menghindari proses berulang)
      if ((scoreValue !== "" && scoreValue !== null) && (summaryValue !== "" && summaryValue !== null)) return;

      const posisiDilamarValue = row[colIdx.posisi];
      
      // Tambahkan log / pesan jika posisi dilamar tidak valid
      if (!posisiDilamarValue || typeof posisiDilamarValue !== "string" || posisiDilamarValue.trim() === "") {
        responseSheet.getRange(rowNumber, colIdx.summary + 1).setValue(
          `Error Data: Kolom 'Posisi Yang Dilamar' (Kolom ${String.fromCharCode(colIdx.posisi + 65)}) kosong atau tidak valid.`
        );
        return; // Lewati baris ini dan catat error
      }

      const posisiDilamar = posisiDilamarValue.trim();
      const jobRequirements = masterData[posisiDilamar];

      if (!jobRequirements) {
        responseSheet.getRange(rowNumber, colIdx.summary + 1).setValue(
          `Kriteria untuk posisi "${posisiDilamar}" tidak ditemukan di Masterdata. (Periksa spasi/typo di sheet Masterdata).`
        );
        return;
      }

      const candidateData = {
        posisi: posisiDilamar,
        pengalamanDurasi: row[colIdx.pengalamanKerja],
        pendidikanTerakhir: row[colIdx.pendidikan],
        keterampilan: row[colIdx.skill],
        deskripsiPengalaman: row[colIdx.deskripsi],
      };

      const prompt = createPrompt(candidateData, jobRequirements);
      const geminiResponse = callGeminiAPI(prompt);

      // Cek apakah respons adalah JSON murni dan bukan pesan error
      if (geminiResponse && !geminiResponse.startsWith("Error")) {
        try {
          // Pembersihan string sudah dilakukan di callGeminiAPI
          const result = JSON.parse(geminiResponse);

          // Pastikan nilai 'scoring' adalah angka dan 'summary' adalah string
          if (typeof result.scoring === 'number' && typeof result.summary === 'string') {
            responseSheet.getRange(rowNumber, colIdx.scoring + 1).setValue(result.scoring);
            responseSheet.getRange(rowNumber, colIdx.summary + 1).setValue(result.summary);
            processedCount++;
            ss.toast(`Berhasil memproses kandidat ke-${processedCount} (Baris ${rowNumber})`, "Status");
            // Menambahkan delay agar tidak melebihi batas rate limit API
            Utilities.sleep(1000); 
          } else {
             responseSheet.getRange(rowNumber, colIdx.summary + 1).setValue(
               `Error validasi: Scoring bukan angka atau Summary bukan string.\nRespon: ${geminiResponse}`
             );
          }
        } catch (e) {
          responseSheet
            .getRange(rowNumber, colIdx.summary + 1)
            .setValue(`Error parsing JSON: ${e.message}\nRespon Mentah: ${geminiResponse}`);
        }
      } else {
        // Tulis pesan error (dari callGeminiAPI) ke kolom summary
        responseSheet
          .getRange(rowNumber, colIdx.summary + 1)
          .setValue(`Gagal memanggil Gemini: ${geminiResponse}`);
      }
    });

    if (processedCount > 0) {
      ui.alert("Selesai!", `Berhasil melakukan scoring untuk ${processedCount} kandidat.`, ui.ButtonSet.OK);
    } else {
      ui.alert(
        "Info",
        "Tidak ada kandidat baru yang perlu di-scoring (atau sudah di-scoring) atau posisi tidak ditemukan di Masterdata.",
        ui.ButtonSet.OK
      );
    }

    ss.toast("Proses selesai.", "Selesai");
  } catch (e) {
    ui.alert("Terjadi Kesalahan Kritis", e.message, ui.ButtonSet.OK);
    Logger.log(e);
    ss.toast("Proses gagal total.", "Error");
  }
}
