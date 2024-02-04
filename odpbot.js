const TelegramBot = require('node-telegram-bot-api');
const geolib = require('geolib');
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'db_kpro',
});

const botToken = '6508572505:AAHMKLTTRsWYL7FH-Hk_-PAu8JJDh4aFxmI';
const bot = new TelegramBot(botToken, { polling: true });

// Command to handle location
bot.onText(/\/odp_terdekat/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Kirimkan lokasi Anda untuk mencari lokasi terdekat.', { reply_markup: { keyboard: [[{ text: 'Kirim Lokasi', request_location: true }]], one_time_keyboard: true } });
});

// Handle location update
bot.onLocation((msg) => {
  const chatId = msg.chat.id;
  const latitude = msg.location.latitude;
  const longitude = msg.location.longitude;

  // Query database and find the nearest location
  connection.query('SELECT nama_lokasi, latitude, longitude FROM tb_lokasi', (error, results) => {
    if (error) {
      console.error('Error querying database:', error);
      bot.sendMessage(chatId, 'Terjadi kesalahan saat mencari lokasi terdekat.');
      return;
    }

    // Calculate distances
    const locationsWithDistances = results.map((location) => {
      const distance = geolib.getDistance(
        { latitude, longitude },
        { latitude: location.latitude, longitude: location.longitude }
      );
      return { ...location, distance };
    });

    // Sort by distance
    const sortedLocations = locationsWithDistances.sort((a, b) => a.distance - b.distance);

    // Send the nearest location to the user
    const nearestLocation = sortedLocations[0];
    bot.sendMessage(chatId, `Lokasi terdekat: ${nearestLocation.nama_lokasi} (Jarak: ${nearestLocation.distance} meter)`);
  });
});

// Connect to the database
connection.connect((error) => {
  if (error) {
    console.error('Error connecting to database:', error);
  } else {
    console.log('Connected to MySQL database');
  }
});
