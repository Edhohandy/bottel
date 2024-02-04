const TelegramBot = require('node-telegram-bot-api');
const mysql = require('mysql');

// Ganti dengan token bot Telegram Anda
const botToken = '6867015263:AAGf5ojW1Lg1f0Ix-wlSUe31eP8O_wQ23wk';

// =================================>DETAIL UPDATE PROGRES ORDER<=================================>
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

// Mendengarkan perintah '/start'
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome To Bot Kerja-In !!!');
});

// Mendengarkan nomor pesanan
bot.onText(/\/get_details_sc (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const orderNumber = match[1];

  // Query pertama: mencari di tb_kpro
  const queryKpro = `SELECT ORDER_ID_NEW, KCONTACT, LAST_ORDER_DATE, INS_ADDRESS, LOC_ID, ISI_COMMENT, DETAIL_KENDALA, STATUS_RESUME, PACKAGE_NAME FROM tb_kpro WHERE ORDER_ID_NEW = ${orderNumber}`;

  connection.query(queryKpro, (errorKpro, resultsKpro) => {
    if (errorKpro) {
      console.error('Error querying tb_kpro:', errorKpro);
      bot.sendMessage(chatId, 'Terjadi kesalahan saat mengambil data dari database.');
      return;
    }

    // Jika ditemukan di tb_kpro, tampilkan detail pesanan
    if (resultsKpro.length > 0) {
      const orderDetails = resultsKpro[0];
      const formattedDate = orderDetails.LAST_ORDER_DATE;
      const alproValue = orderDetails.LOC_ID.split(' ')[0];
      const formattedAppointment = orderDetails.ISI_COMMENT.replace(/;/g, ', ');
      const message =
        `Detail Order

No Order : 
SC-${orderDetails.ORDER_ID_NEW}

Order Date : 
${formattedDate}

K.Contact : 
${orderDetails.KCONTACT}

Alamat Instalasi : 
${orderDetails.INS_ADDRESS}

Package : 
${orderDetails.PACKAGE_NAME}

Appoitment : 
${formattedAppointment}

Alpro : 
${alproValue}

Status Order : 
${orderDetails.STATUS_RESUME}

Detail Kendala: 
${orderDetails.DETAIL_KENDALA}

Terima kasih semoga bermanfaat 🙏🏻`;
      bot.sendMessage(chatId, message);
    } else {
      // Jika tidak ditemukan di tb_kpro, coba di tb_kprounsc
      const queryKprounsc = `SELECT ORDER_ID, KCONTACT, order_date, INS_ADDRESS, LOC_ID, STATUS_MESSAGE, STATUS_RESUME, PACKAGE_NAME FROM tb_kprounsc WHERE ORDER_ID = ${orderNumber}`;

      connection.query(queryKprounsc, (errorKprounsc, resultsKprounsc) => {
        if (errorKprounsc) {
          console.error('Error querying tb_kprounsc:', errorKprounsc);
          bot.sendMessage(chatId, 'Terjadi kesalahan saat mengambil data dari database.');
          return;
        }

        // Jika ditemukan di tb_kprounsc, tampilkan detail pesanan
        if (resultsKprounsc.length > 0) {
          const orderDetailsKprounsc = resultsKprounsc[0];
          const formattedDate = orderDetailsKprounsc.order_date;
          const alproValue = orderDetailsKprounsc.LOC_ID.split(' ')[0];
          const message =
            `Detail Order

No Order : 
SC-${orderDetailsKprounsc.ORDER_ID}

Order Date : 
${formattedDate}

K.Contact : 
${orderDetailsKprounsc.KCONTACT}

Alamat Instalasi : 
${orderDetailsKprounsc.INS_ADDRESS}

Package : 
${orderDetailsKprounsc.PACKAGE_NAME}

Alpro : 
${alproValue}

Status Order : 
${orderDetailsKprounsc.STATUS_RESUME}

Detail Kendala: 
${orderDetailsKprounsc.STATUS_MESSAGE}

Terima kasih semoga bermanfaat 🙏🏻`;
          bot.sendMessage(chatId, message);
        } else {
          // Jika tidak ditemukan di tb_kprounsc, coba di tb_kpro_tot
          const queryKproTot = `SELECT ORDER_ID, KCONTACT, order_date, INS_ADDRESS, LOC_ID, STATUS_MESSAGE, STATUS_RESUME, PACKAGE_NAME FROM tb_kpro_tot WHERE ORDER_ID = ${orderNumber}`;

          connection.query(queryKproTot, (errorKproTot, resultsKproTot) => {
            if (errorKproTot) {
              console.error('Error querying tb_kpro_tot:', errorKproTot);
              bot.sendMessage(chatId, 'Terjadi kesalahan saat mengambil data dari database.');
              return;
            }

            // Jika ditemukan di tb_kpro_tot, tampilkan detail pesanan
            if (resultsKproTot.length > 0) {
              const orderDetailsKproTot = resultsKproTot[0];
              const formattedDate = orderDetailsKproTot.order_date;
              const alproValue = orderDetailsKproTot.LOC_ID.split(' ')[0];
              const message =
                `Detail Order

No Order : 
SC-${orderDetailsKproTot.ORDER_ID}

Order Date : 
${formattedDate}

K.Contact : 
${orderDetailsKproTot.KCONTACT}

Alamat Instalasi : 
${orderDetailsKproTot.INS_ADDRESS}

Package : 
${orderDetailsKproTot.PACKAGE_NAME}

Alpro : 
${alproValue}

Status Order : 
${orderDetailsKproTot.STATUS_RESUME}

Terima kasih semoga bermanfaat 🙏🏻`;
              bot.sendMessage(chatId, message);
            } else {
              // Jika tidak ditemukan di semua tabel, informasikan bahwa pesanan tidak ditemukan
              bot.sendMessage(chatId, 'Order tidak ditemukan. Silakan hubungi admin.');
            }
          });
        }
      });
    }
  });
});

// ... (Sisanya tetap seperti kode sebelumnya)

// Menangani kesalahan koneksi MySQL
connection.connect((error) => {
  if (error) {
    console.error('Error connecting to database:', error); // aktifin xampp
  } else {
    console.log('Connected to MySQL database');
  }
});

// Menutup koneksi MySQL saat aplikasi berhenti
process.on('SIGINT', () => {
  connection.end();
  process.exit();
});
// ============================================> E - N - D <==================================================
