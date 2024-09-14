// ================== TOKEN SETTINGS ==================
const SECRET_KEY = 'your_secret_key'

// ================== DATABASE SETTINGS ==================
const kohaDbName = 'koha_library' // name of koha database
const kohaHost = 'localhost' // ip of koha database without port number
const kohaUserName = 'root' // koha username
const kohaPassword = '' // koha password

const gateDbName = 'nitjLibraryGate' // name of gate database
const gateHost = 'localhost' // ip of gate database without port number
const gateDbUserName = 'root' // gate db username
const gateDbPassword = '' // gate db password

// ================== SERVER SETTINGS ==================
const serverPort = 8081; // port at which this server is running

// ================== DO NOT EDIT THIS ==================
module.exports = { 
    SECRET_KEY, kohaDbName, kohaHost, kohaUserName, kohaPassword, gateDbName, gateHost, gateDbUserName, gateDbPassword, serverPort
};