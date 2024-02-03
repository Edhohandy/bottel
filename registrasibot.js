// bot.js
const TelegramBot = require('node-telegram-bot-api');
const mysql = require('mysql');
const fetch = require('node-fetch');

// Ganti dengan token bot Telegram Anda
const botToken = '6508572505:AAHMKLTTRsWYL7FH-Hk_-PAu8JJDh4aFxmI';

// Konfigurasi koneksi MySQL
const dbConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'db_kpro',
};

// Membuat koneksi MySQL
const connection = mysql.createConnection(dbConfig);

// Inisialisasi bot
const bot = new TelegramBot(botToken, { polling: true });

// Admin Chat ID (gantilah dengan ID Telegram Anda)
const ADMIN_CHAT_ID = '1231733250';

// Mendengarkan perintah '/start'
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // Mengecek apakah pengguna sudah terdaftar dan di-approve
  connection.query(
    `SELECT * FROM tb_users WHERE telegram_id = ${chatId} AND approved = 1`,
    (error, results) => {
      if (error) {
        console.error('Error querying database:', error);
        bot.sendMessage(chatId, 'Terjadi kesalahan saat mengambil data dari database.');
        return;
      }

      if (results.length > 0) {
        // Pengguna sudah terdaftar dan di-approve
        bot.sendMessage(chatId, 'Selamat datang! Bot ini untuk memudahkan mengecek status progres temen" SF!');
      } else {
        // Pengguna belum terdaftar atau belum di-approve
        bot.sendMessage(chatId, 'Selamat datang! Bot ini untuk memudahkan mengecek status progres temen" SF!\n\nMaaf, Anda belum terdaftar. Silahkan melakukan proses registrasi terlebih dahulu. Gunakan perintah /registrasibot untuk mendaftar');
      }
    }
  );
});

// Handler untuk menerima perintah registrasi
bot.onText(/\/registrasibot/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 
`Silahkan kirimkan informasi registrasi dengan format dibawah ini\n
Nama Lengkap
Unit Kerja
Jabatan
Username Telegram\n
Example :
Mimiperi
SPXAYR97
CV. BALI MANDIRI
@mimiperi`);
});

// Handler untuk menerima informasi registrasi
bot.on('text', (msg) => {
  const chatId = msg.chat.id;
  const userData = msg.text.split('\n');

  if (userData.length === 4) {
    const [fullName, unitKerja, jabatan, username] = userData;

    // Perbarui informasi pengguna dengan data registrasi
    connection.query(
      `INSERT INTO tb_users (telegram_id, full_name, unit_kerja, jabatan, username, registration_completed, approved) 
       VALUES (${chatId}, '${fullName}', '${unitKerja}', '${jabatan}', '${username}', TRUE, FALSE)
       ON DUPLICATE KEY UPDATE 
         full_name = '${fullName}', 
         unit_kerja = '${unitKerja}', 
         jabatan = '${jabatan}', 
         username = '${username}', 
         telegram_id = '${chatId}',
         registration_completed = TRUE, 
         approved = FALSE`,
      (error) => {
        if (error) {
          console.error('Error updating database:', error);
          bot.sendMessage(chatId, 'Terjadi kesalahan saat menyimpan informasi registrasi.');
          return;
        }

        bot.sendMessage(chatId, 'Registrasi berhasil! Permintaan persetujuan akan segera diproses.');
        bot.sendMessage(ADMIN_CHAT_ID, // Mengirim pemberitahuan ke administrator (Anda) untuk memberikan persetujuan
`Pengguna baru meminta persetujuan :\n
Nama Lengkap : ${fullName}\n
Unit Kerja : ${unitKerja}\n
Jabatan : ${jabatan}\n
Username : ${username}\n
Telegram ID : ${chatId}`);
      }
    );
  } else {
    // bot.sendMessage(chatId, 'Format informasi registrasi tidak valid. Mohon masukkan informasi dengan format:\n\nNama Lengkap\nKode SF\nAgency\nID Telegram');
  }
});


module.exports = bot;// Export bot untuk digunakan di file lain

// bot.onText(/\/approve_registrasi/, (msg) => {
//   const chatId = msg.chat.id;

//   // Pastikan hanya admin yang dapat memberikan persetujuan
//   if (isAdminChat(chatId)) {
//     // Ambil daftar pengguna yang belum disetujui
//     connection.query(
//       `SELECT * FROM tb_users WHERE registration_completed = TRUE AND approved = FALSE`,
//       (error, results) => {
//         if (error) {
//           console.error('Error querying database:', error);
//           bot.sendMessage(chatId, 'Terjadi kesalahan saat mengambil data dari database.');
//           return;
//         }

//         if (results.length > 0) {
//           let approvalMessage = 'Pilih pengguna yang akan disetujui:\n\n';
//           results.forEach((user, index) => {
//             approvalMessage += `${index + 1}. ${user.full_name} (${user.kode_sf}) - ${user.agency}\n`;
//           });

//           bot.sendMessage(chatId, approvalMessage);
//         } else {
//           bot.sendMessage(chatId, 'Tidak ada pengguna yang menunggu persetujuan.');
//         }
//       }
//     );
//   } else {
//     bot.sendMessage(chatId, 'Anda tidak memiliki izin untuk memberikan persetujuan.');
//   }
// });

// // Handler untuk memberikan persetujuan
// bot.onText(/\/setujui_user (.+)/, (msg, match) => {
//   const chatId = msg.chat.id;

//   // Pastikan hanya admin yang dapat memberikan persetujuan
//   if (isAdminChat(chatId)) {
//     const selectedIndex = parseInt(match[1]) - 1;

//     // Ambil daftar pengguna yang belum disetujui
//     connection.query(
//       `SELECT * FROM tb_users WHERE registration_completed = TRUE AND approved = FALSE`,
//       (error, results) => {
//         if (error) {
//           console.error('Error querying database:', error);
//           bot.sendMessage(chatId, 'Terjadi kesalahan saat mengambil data dari database.');
//           return;
//         }

//         if (selectedIndex >= 0 && selectedIndex < results.length) {
//           const selectedUser = results[selectedIndex];

//           // Setujui pengguna
//           connection.query(
//             `UPDATE tb_users SET approved = TRUE WHERE chat_id = ${selectedUser.chat_id}`,
//             (updateError) => {
//               if (updateError) {
//                 console.error('Error updating database:', updateError);
//                 bot.sendMessage(chatId, 'Terjadi kesalahan saat memberikan persetujuan.');
//               } else {
//                 bot.sendMessage(chatId, `Pengguna ${selectedUser.full_name} (${selectedUser.kode_sf}) - ${selectedUser.agency} telah disetujui.`);
//                 // Kirim pemberitahuan ke pengguna yang disetujui
//                 bot.sendMessage(selectedUser.chat_id, 'Selamat! Registrasi Anda telah disetujui.')
//                   .catch((err) => {
//                     console.error('Error sending message to user:', err);
//                   });
//               }
//             }
//           );
//         } else {
//           bot.sendMessage(chatId, 'Pilihan pengguna tidak valid.');
//         }
//       }
//     );
//   } else {
//     bot.sendMessage(chatId, 'Anda tidak memiliki izin untuk memberikan persetujuan.');
//   }
// });

// // Handler untuk menerima perintah tertentu yang hanya dapat digunakan oleh pengguna yang sudah di-approve
// bot.onText(/\/fitur_lainnya/, (msg) => {
//   const chatId = msg.chat.id;

//   // Pastikan pengguna sudah di-approve sebelum memungkinkan akses
//   connection.query(
//     `SELECT approved FROM tb_users WHERE chat_id = ${chatId}`,
//     (error, results) => {
//       if (error) {
//         console.error('Error querying database:', error);
//         bot.sendMessage(chatId, 'Terjadi kesalahan saat mengambil data dari database.');
//         return;
//       }

//       if (results.length > 0 && results[0].approved) {
//         // Pengguna sudah di-approve, izinkan akses ke fitur lainnya
//         bot.sendMessage(chatId, 'Selamat! Anda dapat menggunakan fitur lainnya.');
//       } else {
//         // Pengguna belum di-approve
//         bot.sendMessage(chatId, 'Maaf, Anda belum di-approve. Harap tunggu persetujuan admin.');
//       }
//     }
//   );
// });

bot.onText(/\/registrasipdd/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
`Silakan isi formulir registrasi Indihome dengan format berikut\n
Type Identitas (KITAS, KITAP, KTP) : 
Nomer Identitas : 
Tempat, Tanggal Lahir : 
Nama Pelanggan : 
Email Pelanggan : 
CP Pelanggan : 
CP Alternatif : 
Alamat Instalasi : 
Alpro Name : 
Titik Kordinat Lokasi Instalasi : 
Paket : 
Kode SF : 
Agency : `).then(() => {
    // Menunggu pengguna mengisi formulir
    bot.on('text', (response) => {
      const formData = response.text.split('\n');
      if (formData.length === 13) { // Ubah menjadi 14, sesuai jumlah pertanyaan
        const [
          typeIdentitas,
          noIdentitas,
          tmpttgllahir,
          namaPelanggan,
          emailPelanggan,
          cpPelanggan,
          cpAlternatif,
          alamatInstalasi,
          alproName,
          shareLokasi,
          paket,
          kodeSF,
          agency
        ] = formData;
        // Simpan data ke database
        const query = `INSERT INTO tb_pelanggan_pdd (
          TYPE_IDENTITAS, 
          NOMER_IDENTITAS, 
          TEMPAT_TANGGAL_LAHIR, 
          NAMA_PELANGGAN, 
          EMAIL_PELANGGAN, 
          CP_PELANGGAN, 
          CP_ALTERNATIF, 
          ALAMAT_INSTALASI, 
          ALPRO_NAME, 
          SHARE_LOKASI, 
          PAKET, 
          KODE_SALES, 
          AGENCY, 
          CHAT_ID_TELEGRAM) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const values = [
          typeIdentitas,
          noIdentitas,
          tmpttgllahir,
          namaPelanggan,
          emailPelanggan,
          cpPelanggan,
          cpAlternatif,
          alamatInstalasi,
          alproName,
          shareLokasi,
          paket,
          kodeSF,
          agency,
          chatId
        ];

        connection.query(query, values, (error) => {
          if (error) {
            console.error('Error updating database:', error);
            bot.sendMessage(chatId, 'Maaf proses registrasi gagal, karena Nomer Identitas sudah pernah didaftarkan');
          } else {
            // Kirim informasi registrasi ke admin
            const adminChatId = '1231733250'; // Ganti dengan ID Telegram admin
            bot.sendMessage(adminChatId, 
`*Input Order PDD*
=================================
Type Identitas : ${typeIdentitas.toUpperCase()}
Nomer ID Identitas : ${noIdentitas}
Tempat, Tanggal Lahir : ${tmpttgllahir.toUpperCase()}.
Nama Pelanggan : ${namaPelanggan.toUpperCase()}
Email : ${emailPelanggan}
CP Pelanggan : ${cpPelanggan}
CP Alternatif : ${cpAlternatif}
Alamat Instalasi : ${alamatInstalasi}
Titik Kordinat Lokasi Instalasi : ${shareLokasi}
Paket : ${paket.toUpperCase()}
Alpro : ${alproName.toUpperCase()}
Kode SF : ${kodeSF.toUpperCase()}
Agency : ${agency.toUpperCase()}
Marketing Info : ${kodeSF.toUpperCase()};${namaPelanggan.toUpperCase()};${cpPelanggan}`);
            bot.sendMessage(chatId, 'Silahkan uploud foto depan rumah untuk file pendukung.');
          }
        });
// Menunggu pengguna mengirimkan foto
bot.once('photo', (photo) => {
  const photoCaption = photo.caption || '';
  const photoId = photo.photo[photo.photo.length - 1].file_id;

  // Simpan informasi foto ke database
  const insertPhotoQuery = `INSERT INTO tb_pelanggan_pdd (NOMER_IDENTITAS, FILE_ID, CAPTION) VALUES (?, ?, ?)`;
  const photoValues = [noIdentitas, photoId, photoCaption];
  connection.query(insertPhotoQuery, photoValues, (photoError) => {
    if (photoError) {
      console.error('Error updating database:', photoError);
      bot.sendMessage(chatId, 'Maaf, terjadi kesalahan saat menyimpan informasi foto identitas.');
    } else {
      // Kirim konfirmasi bahwa foto identitas telah diterima
      bot.sendMessage(chatId, `Terima kasih! Foto Rumah Customer Anda dengan caption "${photoCaption}" telah diterima.`);
      // Kirim foto ke setiap adminChatId
      const adminChatIds = ['1231733250', 'admin_chat_id_lain']; // Ganti dengan daftar adminChatId
      adminChatIds.forEach((adminChatId) => {
      bot.sendPhoto(adminChatId, photoId, { caption: `Foto Depan Rumah dari pengguna dengan ID ${chatId}. Caption: "${photoCaption}"` })
          .catch((err) => {
            console.error('Error sending photo to admin:', err);
          });
      });   
            // Mengakhiri percakapan setelah semua proses berhasil
            bot.sendMessage(chatId, 'Registrasi berhasil! Terima kasih.');
            bot.stopPolling(); // Memberhentikan polling setelah pesan terakhir dikirim
            bot.startPolling();// Mulai polling kembali setelah proses registrasi selesai
    }
  });
});     
      } else {
        // bot.sendMessage(chatId, 'Format formulir tidak valid. Harap isi formulir dengan benar.');
      }
    });
  });
});

connection.connect((error) => {
  if (error) {
    console.error('Error connecting to database:', error);
  } else {
    console.log('Connected to MySQL database');
  }
});

// Menutup koneksi MySQL saat aplikasi berhenti
process.on('SIGINT', () => {
  connection.end();
  process.exit();
});