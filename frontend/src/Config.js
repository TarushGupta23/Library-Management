// ================== SERVER SETTINGS ==================
const serverPort = 8081; // port at which this server will run
const serverIp = 'localhost'; // ip of your server : localhost

// ================== WEBSITE SETTINGS ==================
const webTitle = 'Library Management System' // title of web page
const inOutDisplayTime = 4 // time (in seconds) for how long will the information of person entering/exiting at gate will be displayed

const instituteLogo = 'temp/logo.png' // logo of your institute - png file without background
const instituteName = 'Tarush Institute' // short name of your institiute, eg 'NIT Jalandhar' - needs to be short
const instituteFullName = 'Tarush Gupta Institute' // full name of your institiute, eg 'Dr BR Ambedkar National Institute of Technology Jalandhar' - needs to be short
const defaultUserImage = 'icons/user.png' // image to be displayed if profile pic is not found - path needs to be from public folder
const instituteImage1 = 'temp/building.jpeg' // image of institute - path needs to be from public folder
const instituteImage2 = 'temp/flex.png' // image of institute - path needs to be from public folder


// ================== DO NOT EDIT THIS ==================
module.exports = { 
    serverPort, serverIp, inOutDisplayTime, webTitle, defaultUserImage, instituteName, instituteImage1, instituteLogo, instituteImage2, instituteFullName
};