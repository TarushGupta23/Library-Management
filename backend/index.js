const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken');
const Utils = require('./util');
const { SECRET_KEY, serverPort } = require('./Config');

const app = express()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())

app.get('/', (req, res) => {
    return res.send('Hello from Library Management Server - Tarush Gupta')
})

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = `SELECT adminId, password FROM library_admin WHERE adminId = '${username}'`
    Utils.db.query(query, (err, data) => {
        if (err) {
            console.error('DATABASE QUERY ERROR:', err)
            return res.json({ message: 'error' });
        }
        
        if (data[0] && data[0].password === password) {
            const token = jwt.sign({ username, role: 'admin' }, SECRET_KEY, { expiresIn: '1d' });
            return res.json({ message: 'success', token, role: 'admin' });
        }

        console.log(data)
        
        return res.json({ message: 'failed' });
    })
})

app.get('/varify', (req, res) => {
    const token = req.headers['x-access-token'];

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.json({ message: 'failed' });
        }
        
        const { role } = decoded;
        
        if (role === 'admin') {
            return res.json({ message: 'admin' });
        } else if (role === 'student') {
            return res.json({ message: 'student' });
        } else {
            return res.json({ message: 'failed' });
        }
    });
})

app.post('/submit-gate-entry', async (req, res) => {
    if (req.body.type === 'user') {
        const userData = await Utils.getUserData(req.body.userId);
        if (!userData || userData.borrowernumber === undefined) { 
            return res.json({ message: 'user not found' }) 
        }

        const query = "SELECT * FROM `gate_entries` WHERE uId = ? AND outTime IS NULL"
        const params = [userData.borrowernumber]
        
        Utils.db.query(query, params, (err, data) => {
            if (err) {
                console.error('DATABASE QUERY ERROR:', err)
                return res.json({ message: 'error' });
            } else {
                if (data[0]) { // user already inside
                    Utils.exitGateUser(userData.borrowernumber)
                    res.json({ ...userData, message: 'exited' })
                } else { // user is now entering
                    Utils.enterGateUser(userData.borrowernumber)
                    res.json({ ...userData, message: 'entered' })
                }
            }
        }) 
    } else { // visitor
        const query = "SELECT * FROM `visitor_entries` WHERE `contact` = ? AND outTime IS NULL"
        const params = [req.body.contact]
        
        Utils.db.query(query, params, (err, data) => {
            if (err) {
                console.error('DATABASE QUERY ERROR:', err)
                return res.json({ message: 'error' });
            } else {
                if (data[0]) { // visitor already inside
                    Utils.exitGateVisitor(req.body.contact)
                    return res.json({ message: 'exited', name: data[0].name, contact: data[0].contact, mail: data[0].mail  })
                } else { // visitor is now entering
                    if (!req.body.name || !req.body.mail) {
                        return res.json({ message: 'insufficient data' })
                    }
                    Utils.enterGateVisitor(req.body.contact, req.body.name, req.body.mail)
                    return res.json({ message: 'entered', name: req.body.name, contact: req.body.contact, mail: req.body.mail })
                }
            }
        }) 
    }
})

app.get('/gate-display-data', (req, res) => {
    const token = req.headers['x-access-token'];
    
    jwt.verify(token, SECRET_KEY, async (err, decoded) => {
        if (err) {
            return res.json({ message: 'failed' });
        }
        const { role } = decoded;
        if (role === 'admin') {
            const data = await Utils.getGateDisplayData()
            return res.json({ message: 'authorised', ...data });
        } else if (role === 'student') {
            return res.json({ message: 'unauthorised' });
        } else {
            return res.json({ message: 'failed' });
        }
    });
})

app.get('/admin-gate-stats', (req, res) => {
    const token = req.headers['x-access-token'];
    jwt.verify(token, SECRET_KEY, async (err, decoded) => {
        if (err) {
            return res.json({ message: 'failed' });
        }
        const { role } = decoded;
        if (role === 'admin') {
            const data = await Utils.getAdminGateStatsData()
            return res.json({ message: 'authorised', ...data });
        } else if (role === 'student') {
            return res.json({ message: 'unauthorised' });
        } else {
            return res.json({ message: 'failed' });
        }
    });
})

app.get('/admin-entry-history', (req, res) => {
    const token = req.headers['x-access-token'];
    jwt.verify(token, SECRET_KEY, async (err, decoded) => {
        if (err) {
            return res.json({ message: 'failed' });
        }
        const { role } = decoded;
        if (role === 'admin') {
            const data = await Utils.getAdminGateHistoryData(req.query)
            return res.json({ message: 'authorised', ...data });
        } else if (role === 'student') {
            return res.json({ message: 'unauthorised' });
        } else {
            return res.json({ message: 'failed' });
        }
    });
})

app.post('/add-admin', (req, res) => {
    const token = req.headers['x-access-token'];
    jwt.verify(token, SECRET_KEY, async (err, decoded) => {
        if (err) {
            return res.json({ message: 'failed' });
        }
        const { role } = decoded;
        if (role === 'admin') {
            const data = await Utils.addAdmin(req.body)
            if (data && data.borrowernumber) {
                return res.json({ message: 'authorised', ...data });
            }
            return res.json({ message: 'authorised', error: 'Admin cant be added' });
        } else if (role === 'student') {
            return res.json({ message: 'unauthorised' });
        } else {
            return res.json({ message: 'failed' });
        }
    })
})

app.post('/remove-admin', (req, res) => {
    const token = req.headers['x-access-token'];
    jwt.verify(token, SECRET_KEY, async (err, decoded) => {
        if (err) {
            return res.json({ message: 'failed' });
        }
        const { role } = decoded;
        if (role === 'admin') {
            Utils.removeAdmin(req.body)
            return res.json({ message: 'authorised' });
        } else if (role === 'student') {
            return res.json({ message: 'unauthorised' });
        } else {
            return res.json({ message: 'failed' });
        }
    })
})

app.get('/admin-list', (req, res) => {
    const token = req.headers['x-access-token'];
    jwt.verify(token, SECRET_KEY, async (err, decoded) => {
        if (err) {
            return res.json({ message: 'failed' });
        }
        const { role } = decoded;
        if (role === 'admin') {
            const adminList = await Utils.getAdminList(req.body)
            return res.json({ message: 'authorised', adminList });
        } else if (role === 'student') {
            return res.json({ message: 'unauthorised' });
        } else {
            return res.json({ message: 'failed' });
        }
    })
})

app.get('/my-info', (req, res) => {
    const token = req.headers['x-access-token'];
    jwt.verify(token, SECRET_KEY, async (err, decoded) => {
        if (err) {
            return res.json({ message: 'failed' });
        }
        const { username, role } = decoded;
        if (role === 'admin' || role === 'student') {
            const userData = await Utils.getUserData(username)
            return res.json({ message: 'authorised', userData });
        } else {
            return res.json({ message: 'failed' });
        }
    })
})

app.get('/change-password', (req, res) => {
    const token = req.headers['x-access-token'];
    jwt.verify(token, SECRET_KEY, async (err, decoded) => {
        if (err) {
            return res.json({ message: 'failed' });
        }
        const { role } = decoded;
        if (role === 'admin') {
            const query = `UPDATE library_admin SET password = ? WHERE adminId = ?;`
            Utils.db.query(query, [req.query.password, req.query.id], (err, result) => {
                if (err) {
                    console.log(err)
                    return res.json({ message: 'failed' });
                }
                return res.json({ message: 'success' });
            })
        } else {
            return res.json({ message: 'failed' });
        }
    })
})

app.listen(serverPort, () => {
    console.log('listening on port :', serverPort)
})