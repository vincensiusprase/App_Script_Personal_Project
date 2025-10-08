# 🧠 Gemini Auto Scoring for Recruitment (Google Apps Script)

Script ini digunakan untuk melakukan **scoring kandidat secara otomatis** menggunakan **Google Gemini API**, langsung dari **Google Sheets**.  
Didesain untuk tim HR agar dapat menilai kesesuaian kandidat dengan posisi kerja berdasarkan data dari dua sheet utama:  
- **Respon** → berisi data kandidat (input dari Google Form)  
- **Masterdata** → berisi kriteria posisi yang dilamar  

---

## 🚀 Fitur Utama

- ✅ **Integrasi Gemini API** (model `gemini-2.5-flash`)  
- ✅ **Scoring otomatis** dengan total maksimum 100 poin  
- ✅ **Ringkasan evaluasi otomatis (summary)**  
- ✅ **Menulis hasil ke kolom U (scoring) dan V (summary)**  
- ✅ **Error ditampilkan langsung di sheet** untuk debugging  
- ✅ **Aman dari error 400 & Invalid argument**  
- 🌟 **Prompt-based JSON Output** tanpa Structured Schema  

---

## 🧩 Struktur Sheet yang Dibutuhkan

### 1️⃣ Sheet: `Respon`  
Berisi data kandidat, dengan kolom utama berikut:
| Kolom | Nama Header | Deskripsi |
|:--|:--|:--|
| A | Posisi Yang Dilamar | Nama posisi sesuai di Masterdata |
| B | Pengalaman Kerja | Total pengalaman kandidat |
| C | Pendidikan Terakhir | Level pendidikan terakhir |
| D | Skill | Daftar skill kandidat |
| E | Deskripsi Pengalaman Pekerjaan | Penjelasan pengalaman kerja |
| U | Scoring | (otomatis diisi oleh script) |
| V | Summary | (otomatis diisi oleh script) |

> 📝 **Catatan:** Nama header harus persis sama (huruf besar/kecil diperhatikan).  
Jika kolom “Deskripsi Pengalaman Pekerjaan” memiliki spasi ekstra di akhir, script tetap akan menyesuaikan secara otomatis.

---

### 2️⃣ Sheet: `Masterdata`  
Berisi daftar posisi kerja dan kriteria yang harus dipenuhi, dengan kolom utama:
| Kolom | Nama Header | Deskripsi |
|:--|:--|:--|
| A | Posisi Yang Dilamar | Nama posisi |
| B | Level Pendidikan Posisi | Kualifikasi pendidikan minimal |
| C | Pengalaman Kerja Posisi | Pengalaman kerja yang dibutuhkan |
| D | Skill Posisi | Skill wajib posisi tersebut |
| E | Job Desc Posisi | Deskripsi pekerjaan |

---

## ⚙️ Instalasi & Konfigurasi

1. Buka **Google Sheets** Anda.  
2. Masuk ke **Extensions → Apps Script**.  
3. Tempelkan seluruh kode script ke dalam editor.  
4. Simpan project dengan nama misalnya: `Gemini Auto Scoring`.  
5. Buka menu:  
   **Project Settings → Script Properties → Add Property**
   - **Key:** `GEMINI_API_KEY`  
   - **Value:** `API_KEY_GEMINI_ANDA`  
6. Simpan perubahan.

---

## ▶️ Cara Menjalankan

1. Pastikan sheet `Respon` dan `Masterdata` sudah siap.  
2. Buka menu Apps Script → Jalankan fungsi:  
   ```js
   processAllCandidates() ```
3. Izinkan akses pertama kali (Sheets + Fetch API).
4. Tunggu hingga proses selesai.
   Hasilnya akan otomatis muncul di kolom U (scoring) dan V (summary).
   🔁 Script akan melewati baris yang sudah memiliki nilai di kolom U & V agar tidak diproses ulang.

## 🧠 Skema Penilaian (Total 100 poin)
| Aspek                          | Bobot |
| :----------------------------- | :---: |
| Kecocokan Pengalaman Kerja     |   30  |
| Kecocokan Pendidikan           |   20  |
| Kecocokan Skill                |   15  |
| Kecocokan Durasi Pengalaman    |   15  |
| Kecocokan Deskripsi Pengalaman |   20  |

## 💡 Format Jawaban yang Diminta dari Gemini
Gemini diminta untuk mengembalikan JSON murni, tanpa Markdown atau teks lain:
{
  "scoring": 87,
  "summary": "Kandidat memiliki pengalaman dan skill yang relevan, namun kurang di aspek kepemimpinan proyek."
}

## 🧰 Debugging & Error Handling
| Jenis Error                            | Penyebab                         | Solusi                                |
| :------------------------------------- | :------------------------------- | :------------------------------------ |
| `GEMINI_API_KEY belum diatur`          | Script Properties belum diset    | Tambahkan API key di Project Settings |
| `Sheet "Masterdata" tidak ditemukan`   | Nama sheet salah                 | Pastikan sheet bernama “Masterdata”   |
| `Posisi tidak ditemukan di Masterdata` | Data posisi typo / spasi berbeda | Samakan nama posisi di kedua sheet    |
| `Error parsing JSON`                   | Respons Gemini tidak valid       | Coba ulang, periksa format prompt     |

## 🧾 Log Perubahan Utama
| Versi | Perubahan                                                 |
| :---- | :-------------------------------------------------------- |
| v2.5  | Mengganti structured output → prompt-based JSON           |
| v2.4  | Menambahkan error handling & auto skip baris sudah terisi |
| v2.3  | Perbaikan URL Gemini API & batas eksekusi (getLastRow)    |
| v2.2  | Penulisan hasil langsung ke kolom U & V                   |
| v2.1  | Pembersihan markdown fences (```json) dari respons        |

## 🧑‍💻 Kontributor
Vincensius Prasetyo Adi
Pengembang Apps Script & Integrasi AI untuk sistem rekrutmen otomatis.

