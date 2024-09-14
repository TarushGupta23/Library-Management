const mysql = require('mysql');
const Config = require('./Config');

const db = mysql.createConnection({
    host: Config.gateHost,
    user: Config.gateDbUserName,
    password: Config.gateDbPassword,
    database: Config.gateDbName
})

const kohaDb = mysql.createConnection({
    host: Config.kohaHost,
    user: Config.kohaUserName,
    password: Config.kohaPassword,
    database: Config.kohaDbName
})

const getProfileImg = async (bNo) => {
    const kohaQuery = "SELECT imagefile FROM `patronimage` WHERE borrowernumber = ?";
    const kohaParams = [bNo];

    try {
        const data = await new Promise((resolve, reject) => {
            kohaDb.query(kohaQuery, kohaParams, (err, result) => {
                if (err) {
                    console.error('DATABASE QUERY ERROR:', err);
                    return resolve({});
                }
                resolve(result);
            });
        });

        if (data.length > 0 && data[0].imagefile) {
            const base64Image = Buffer.from(data[0].imagefile).toString('base64');
            return base64Image;
        }
        return {};
    } catch (err) {
        console.error('DATABASE QUERY ERROR:', err);
        return {};
    }
};

const getUserData = async (uId) => {
    const kohaQuery = "SELECT firstname, middle_name, surname, borrowernumber, categorycode, cardnumber, sex, phone, email FROM `borrowers` WHERE cardnumber = ?";
    const kohaParams = [uId];

    try {
        const kohaData = await new Promise((resolve, reject) => {
            kohaDb.query(kohaQuery, kohaParams, (err, result) => {
                if (err) {
                    console.error('DATABASE QUERY ERROR:', err);
                    return resolve({});
                }
                resolve(result);
            });
        });

        if (kohaData && kohaData[0].borrowernumber) {
            const profileImage = await getProfileImg(kohaData[0].borrowernumber);
            return { ...kohaData[0], profileImage };
        }
        return {};
    } catch (err) {
        console.error('DATABASE QUERY ERROR:', err);
        return {};
    }
};

const enterGateUser = (cardNo) => {
    const query = "INSERT INTO `gate_entries` (`uId`, `date`, `inTime`, `outTime`) VALUES (?, NOW(), NOW(), NULL);"
    const params = [cardNo]

    db.query(query, params, (err, result) => {})
}

const exitGateUser = (cardNo) => {
    const query = "UPDATE `gate_entries` SET outTime = NOW() WHERE uId = ? AND outTime IS NULL;"
    const params = [cardNo]

    db.query(query, params, (err, result) => {})
}

const enterGateVisitor = (contact, name, mail) => {
    const query = "INSERT INTO `visitor_entries` (`contact`, `name`, `mail`, `date`, `inTime`, `outTime`) VALUES (?, ?, ?, NOW(), NOW(), NULL);"
    const params = [contact, name, mail]

    db.query(query, params, (err, result) => {})
}

const exitGateVisitor = (contact) => {
    const query = "UPDATE `visitor_entries` SET outTime = NOW() WHERE `contact` = ? AND outTime IS NULL;"
    const params = [contact]

    db.query(query, params, (err, result) => {})
}

const getGateDisplayData = async () => {
    const query = `
        SELECT 
            ge.inTime, ge.outTime, b.cardnumber, b.firstname, b.middle_name, b.surname, b.sex, b.categorycode, b.branchcode
        FROM
            ${Config.gateDbName}.gate_entries AS ge 
        JOIN 
            ${Config.kohaDbName}.borrowers AS b 
        ON 
            ge.uId = b.borrowernumber
        WHERE 
            ge.date = CURDATE()
        ORDER BY 
            ge.inTime DESC`
    try {
        const gateData = await new Promise(resolve => {
            db.query(query, (err, result) => {
                if (err) {
                    console.error('DATABASE QUERY ERROR:', err);
                    return resolve({error: 'failed'})
                }
                resolve(result)
            });
        })
        const visitorData = await new Promise(resolve => {
            db.query("SELECT * FROM visitor_entries WHERE date = CURDATE() ORDER BY inTime DESC", (err, result) => {
                if (err) {
                    console.error('DATABASE QUERY ERROR:', err);
                    return resolve({error: 'failed'})
                }
                resolve(result)
            })
        })
        return {gateData, visitorData};
    } catch (err) {
        console.error('DATABASE QUERY ERROR:', err);
        return {error: 'failed'};
    }
}

const mergeCountArrays = (userDaysCount, visitorDaysCount) => {
    const mergedCounts = {};

    userDaysCount.forEach(entry => {
        const day = entry.day;
        if (!mergedCounts[day]) {
            mergedCounts[day] = entry.distinct_entries;
        } else {
            mergedCounts[day] += entry.distinct_entries;
        }
    });

    visitorDaysCount.forEach(entry => {
        const day = entry.day;
        if (!mergedCounts[day]) {
            mergedCounts[day] = entry.distinct_entries;
        } else {
            mergedCounts[day] += entry.distinct_entries;
        }
    });

    const mergedArray = Object.keys(mergedCounts).map(day => ({
        day,
        total_entries: mergedCounts[day]
    }));

    return mergedArray
}

const getAdminGateStatsData = async () => {
    const query = `
        SELECT 
            SUM(CASE WHEN b.sex = 'M' AND b.categorycode != 'STAFF' THEN 1 ELSE 0 END) AS male_count,
            SUM(CASE WHEN b.sex = 'F' AND b.categorycode != 'STAFF' THEN 1 ELSE 0 END) AS female_count,
            SUM(CASE WHEN b.categorycode = 'STAFF' THEN 1 ELSE 0 END) AS staff_count
        FROM
            (SELECT DISTINCT ge.uId, ge.date
            FROM ${Config.gateDbName}.gate_entries AS ge
            WHERE ge.date = CURDATE()) AS unique_entries
        JOIN
            ${Config.kohaDbName}.borrowers AS b
        ON
            unique_entries.uId = b.borrowernumber;`
    try {
        const {male_count, female_count, staff_count} = await new Promise(resolve => {
            db.query(query, (err, result) => {
                if (err) {
                    console.error('DATABASE QUERY ERROR:', err);
                    return resolve({error: 'failed'})
                }
                resolve(result[0])
            });
        })
        const visitor_count = await new Promise(resolve => {
            db.query("SELECT COUNT(DISTINCT contact) AS visitor_count FROM visitor_entries WHERE date = CURDATE();", (err, result) => {
                if (err) {
                    console.error('DATABASE QUERY ERROR:', err);
                    return resolve({error: 'failed'})
                }
                resolve(result[0].visitor_count)
            })
        })
        const userDaysCount = await new Promise(resolve => {
            const query = `SELECT 
                DATE_FORMAT(ge.date, '%Y-%m-%d') AS day, 
                COUNT(DISTINCT ge.uId) AS distinct_entries 
            FROM 
                ${Config.gateDbName}.gate_entries AS ge 
            WHERE 
                DATE(ge.date) >= CURDATE() - INTERVAL 7 DAY
            GROUP BY 
                day
            ORDER BY 
                day DESC;`
            db.query(query, (err, result) => {
                if (err) {
                    console.error('DATABASE QUERY ERROR:', err);
                    return resolve({error: 'failed'})
                }
                resolve(result)
            })
        })
        const visitorDaysCount = await new Promise(resolve => {
            const query = `SELECT 
                DATE_FORMAT(ve.date, '%Y-%m-%d') AS day, 
                COUNT(DISTINCT ve.contact) AS distinct_entries 
            FROM 
                visitor_entries AS ve 
            WHERE 
                DATE(ve.date) >= CURDATE() - INTERVAL 7 DAY
            GROUP BY 
                day
            ORDER BY 
                day DESC;`
            db.query(query, (err, result) => {
                if (err) {
                    console.error('DATABASE QUERY ERROR:', err);
                    return resolve({error: 'failed'})
                }
                resolve(result)
            })
        })
        const history_count = mergeCountArrays(userDaysCount, visitorDaysCount)
        return {
            male_count: male_count || 0, 
            female_count: female_count || 0, 
            staff_count: staff_count || 0, 
            visitor_count, history_count
        }
    } catch (err) {
        console.error('DATABASE QUERY ERROR:', err);
        return {error: 'failed'};
    }
}

const getLongUserHistoryData = async (formData) => {
    const { dateFrom, dateTo, timeFrom, timeTo, name, id, category } = formData;

    const query = `
        SELECT 
            b.cardnumber, 
            CONCAT(
                TRIM(b.firstname), 
                CASE 
                    WHEN b.middle_name IS NOT NULL AND TRIM(b.middle_name) <> '' THEN CONCAT(' ', TRIM(b.middle_name))
                    ELSE ''
                END,
                CASE 
                    WHEN b.surname IS NOT NULL AND TRIM(b.surname) <> '' THEN CONCAT(' ', TRIM(b.surname))
                    ELSE ''
                END
            ) AS name,
            b.branchcode, 
            b.categorycode, 
            b.sex,
            b.email,
            DATE_FORMAT(ge.date, '%Y-%m-%d') AS date, 
            ge.inTime, 
            ge.outTime, 
            TIMEDIFF(ge.outTime, ge.inTime) AS totalTime
        FROM 
            ${Config.gateDbName}.gate_entries AS ge
        JOIN 
            ${Config.kohaDbName}.borrowers AS b 
        ON 
            ge.uId = b.borrowernumber
        WHERE 
            (IFNULL(?, '') = '' OR ge.date >= ?)
            AND (IFNULL(?, '') = '' OR ge.date <= ?)
            AND (IFNULL(?, '') = '' OR ge.inTime >= ?)
            AND (IFNULL(?, '') = '' OR ge.outTime <= ?)
            AND (IFNULL(?, '') = '' OR CONCAT(
                TRIM(b.firstname), 
                CASE 
                    WHEN b.middle_name IS NOT NULL AND TRIM(b.middle_name) <> '' THEN CONCAT(' ', TRIM(b.middle_name))
                    ELSE ''
                END,
                CASE 
                    WHEN b.surname IS NOT NULL AND TRIM(b.surname) <> '' THEN CONCAT(' ', TRIM(b.surname))
                    ELSE ''
                END
            ) LIKE CONCAT('%', ?, '%'))
            AND (IFNULL(?, '') = '' OR b.borrowernumber = ?)
            AND (IFNULL(?, '') = '' OR b.categorycode = ?)
        ORDER BY 
            ge.date DESC, ge.inTime DESC;

    `;

    const results = await new Promise((resolve, reject) => {
        db.query(query, [
            dateFrom, dateFrom, dateTo, dateTo, timeFrom, timeFrom, timeTo, timeTo, name, name, id, id, category, category
        ], (err, results) => {
            if (err) { return reject(err); }
            resolve(results);
        });
    });

    return results;
}

const getShortUserHistoryData = async (formData) => {
    const { dateFrom, dateTo, timeFrom, timeTo, name, id, category } = formData;

    const query = `
        SELECT 
            b.cardnumber, 
            CONCAT(
                TRIM(b.firstname), 
                CASE 
                    WHEN b.middle_name IS NOT NULL AND TRIM(b.middle_name) <> '' THEN CONCAT(' ', TRIM(b.middle_name))
                    ELSE ''
                END,
                CASE 
                    WHEN b.surname IS NOT NULL AND TRIM(b.surname) <> '' THEN CONCAT(' ', TRIM(b.surname))
                    ELSE ''
                END
            ) AS name,
            DATE_FORMAT(ge.date, '%Y-%m-%d') AS date, 
            TIMEDIFF(ge.outTime, ge.inTime) AS totalTime
        FROM 
            ${Config.gateDbName}.gate_entries AS ge
        JOIN 
            ${Config.kohaDbName}.borrowers AS b 
        ON 
            ge.uId = b.borrowernumber
        WHERE 
            (IFNULL(?, '') = '' OR ge.date >= ?)
            AND (IFNULL(?, '') = '' OR ge.date <= ?)
            AND (IFNULL(?, '') = '' OR ge.inTime >= ?)
            AND (IFNULL(?, '') = '' OR ge.outTime <= ?)
            AND (IFNULL(?, '') = '' OR CONCAT(
                TRIM(b.firstname), 
                CASE 
                    WHEN b.middle_name IS NOT NULL AND TRIM(b.middle_name) <> '' THEN CONCAT(' ', TRIM(b.middle_name))
                    ELSE ''
                END,
                CASE 
                    WHEN b.surname IS NOT NULL AND TRIM(b.surname) <> '' THEN CONCAT(' ', TRIM(b.surname))
                    ELSE ''
                END
            ) LIKE CONCAT('%', ?, '%'))
            AND (IFNULL(?, '') = '' OR b.cardnumber = ?)
            AND (IFNULL(?, '') = '' OR b.categorycode = ?)
        ORDER BY 
            ge.date DESC, ge.inTime DESC;
    `;

    const results = await new Promise((resolve, reject) => {
        db.query(query, [
            dateFrom, dateFrom, dateTo, dateTo, timeFrom, timeFrom, timeTo, timeTo, name, name, id, id, category, category
        ], (err, results) => {
            if (err) { return reject(err); }
            resolve(results);
        });
    });

    return results;
}

const getVisitorHistoryData = async (formData) => {
    const { dateFrom, dateTo, timeFrom, timeTo, name, length, id } = formData;

    const selectFields = length === 'short' 
        ? "ve.contact, ve.name, DATE_FORMAT(ve.date, '%Y-%m-%d') AS date, TIMEDIFF(ve.outTime, ve.inTime) AS totalTime"
        : "ve.contact, ve.name, ve.mail, DATE_FORMAT(ve.date, '%Y-%m-%d') AS date, ve.inTime, ve.outTime, TIMEDIFF(ve.outTime, ve.inTime) AS totalTime";

    const query = `
        SELECT 
            ${selectFields}
        FROM 
            ${Config.gateDbName}.visitor_entries AS ve
        WHERE 
            (IFNULL(?, '') = '' OR ve.date >= ?)
            AND (IFNULL(?, '') = '' OR ve.date <= ?)
            AND (IFNULL(?, '') = '' OR ve.inTime >= ?)
            AND (IFNULL(?, '') = '' OR ve.outTime <= ?)
            AND (IFNULL(?, '') = '' OR ve.name LIKE CONCAT('%', ?, '%'))
            AND (IFNULL(?, '') = '' OR ve.contact = ?)
        ORDER BY 
            ve.date DESC, ve.inTime DESC;
    `;

    const results = await new Promise((resolve, reject) => {
        db.query(query, [
            dateFrom, dateTo, dateFrom, dateTo, timeFrom, timeFrom, timeTo, timeTo, name, name, id, id
        ], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });

    return results;
};

const getAdminGateHistoryData = async (formData) => {
    const { length, type } = formData;

    let result = undefined;
    if (type === 'user') {
        if (length === 'long') {
            result = await getLongUserHistoryData(formData)
            result = result.map(item => ([
                item.cardnumber, item.name, item.branchcode, item.email, item.categorycode, item.sex, item.date, item.inTime, item.outTime, item.totalTime, 
            ]))
            return { title: ['User Id', 'Name', 'Branch', 'Email', 'Category', 'Gender', 'Date', 'In Time', 'Out Time', 'Total Time'], body: result };
        } else {
            result = await getShortUserHistoryData(formData)
            result = result.map(item => ([
                item.cardnumber, item.name, item.date, item.totalTime, 
            ]))
            return { title: ['User Id', 'Name', 'Date', 'Total Time'], body: result };
        }
    } else {
        result = await getVisitorHistoryData(formData)
        let title = [] 
        if (length==='short') {
            title = ['Contact', 'Name', 'Date', 'Total Time']
            result = result.map(item => ([
                item.contact, item.name, item.date, item.totalTime, 
            ]))
        } else { 
            title = ['Contact', 'Name', 'Mail', 'Date', 'In Time', 'Out Time', 'Total Time']
            result = result.map(item => ([
                item.contact, item.name, item.mail, item.date, item.inTime, item.outTime, item.totalTime, 
            ]))
        }
        return {title, body: result}
    }
}

const addAdmin = async ({ id, password }) => {
    const existingAdmin = await new Promise((resolve, reject) => {
        const query = "SELECT COUNT(*) AS count FROM `library_admin` WHERE `adminid` = ?";
        db.query(query, [id], (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result[0].count > 0);
        });
    });

    if (existingAdmin) {
        return {};
    }

    const userData = await getUserData(id);
    if (userData && userData.borrowernumber) {
        const query = "INSERT INTO `library_admin` (`adminid`, `password`) VALUES (?, ?);";
        const params = [id, password];
        db.query(query, params, (_, __) => {});
    }

    return userData;
};


const removeAdmin = ({ id }) => {
    const query = "DELETE FROM `library_admin` WHERE `adminid` = ?;";
    const params = [id];
    db.query(query, params, (err, result) => {})
}

const getAdminList = async () => {
    const query = `
        SELECT 
            la.adminid, 
            kb.firstname, 
            kb.surname 
        FROM 
            library_admin AS la
        JOIN 
            ${Config.kohaDbName}.borrowers AS kb 
        ON 
            la.adminid COLLATE utf8mb4_general_ci = kb.cardnumber COLLATE utf8mb4_general_ci
    `;

    return new Promise((resolve, reject) => {
        db.query(query, (err, result) => {
            if (err) { return reject(err); }
            resolve(result);
        });
    });
};


module.exports = {
    db, kohaDb,
    getProfileImg, getUserData,
    enterGateUser, exitGateUser,
    enterGateVisitor, exitGateVisitor,
    getGateDisplayData, 
    getAdminGateStatsData, getAdminGateHistoryData,
    addAdmin, removeAdmin, getAdminList
};