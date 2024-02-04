const TelegramBot = require('node-telegram-bot-api');
const mysql = require('mysql');
const fetch = require('node-fetch');
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
const bot = new TelegramBot(botToken, { polling: true });
const ADMIN_CHAT_ID = '1231733250';

// Mendengarkan perintah '/start'
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  connection.query(
    `SELECT * FROM tb_users WHERE telegram_id = ${chatId} AND approved = 1`,
    (error, results) => {
      if (error) {
        console.error('Error querying database:', error);
        bot.sendMessage(chatId, 'Terjadi kesalahan saat mengambil data dari database.');
        return;
      }
      if (results.length > 0) {
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
        bot.sendMessage(ADMIN_CHAT_ID,
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
      bot.on('text', (response) => {
        const formData = response.text.split('\n');
        if (formData.length === 13) {
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
              const adminChatId = '1231733250';
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
          bot.once('photo', (photo) => {
            const photoCaption = photo.caption || '';
            const photoId = photo.photo[photo.photo.length - 1].file_id;
            const insertPhotoQuery = `INSERT INTO tb_pelanggan_pdd (NOMER_IDENTITAS, FILE_ID, CAPTION) VALUES (?, ?, ?)`;
            const photoValues = [noIdentitas, photoId, photoCaption];
            connection.query(insertPhotoQuery, photoValues, (photoError) => {
              if (photoError) {
                console.error('Error updating database:', photoError);
                bot.sendMessage(chatId, 'Maaf, terjadi kesalahan saat menyimpan informasi foto identitas.');
              } else {
                bot.sendMessage(chatId, `Terima kasih! Foto Rumah Customer Anda dengan caption "${photoCaption}" telah diterima.`);
                const adminChatIds = ['1231733250', 'admin_chat_id_lain'];
                adminChatIds.forEach((adminChatId) => {
                  bot.sendPhoto(adminChatId, photoId, { caption: `Foto Depan Rumah dari pengguna dengan ID ${chatId}. Caption: "${photoCaption}"` })
                    .catch((err) => {
                      console.error('Error sending photo to admin:', err);
                    });
                });
                bot.sendMessage(chatId, 'Registrasi berhasil! Terima kasih.');
                bot.stopPolling();
                bot.startPolling();
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
process.on('SIGINT', () => {
  connection.end();
  process.exit();
});