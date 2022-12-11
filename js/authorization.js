const bcrypt = require('bcrypt');

var confirmationCode;

var auth = {
    login: function (req, db, res) {
        var temp = req.session;
        /**
         * Database Access : Collecting Login Information
         */
        const query = `SELECT * FROM users WHERE username = '${req.body.username}'`;
        db.query(query, (err, result) => {
            if (err || !result.rows[0]) {
                console.log('Username doesn\'t exist');
                res.end('fail');
            }
            else if (result.rows[0].stats === "REJECTED") {
                res.end('fail1');
            } else {
                bcrypt.compare(req.body.password, result.rows[0].password, (err, ress) => {
                    if (err) {
                        console.log(err);
                        code = err;
                    } else {
                        console.log(ress);
                        if (!ress) {
                            res.send('fail2');
                        } else {
                            temp.user_id = result.rows[0].user_id;
                            temp.stats = result.rows[0].status;
                            temp.admin = result.rows[0].admin;
                            console.log(temp.stats);
                            temp.username = req.body.username;
                            res.end('done');
                            console.log(temp);
                        }
                    }
                });
            }
        });
        return temp;
    },

    register: function (req, db, res) {
        temp = req.session;
        /**
         * Password hashing
         */
        const code = confirmationCode;
        if (req.body.verificationCode == code) {
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if (err) {
                    return res.status(500).json({
                        error: err
                    });
                }
                usr = req.body.username;
                email = req.body.email;
                whatsapp = req.body.whatsapp;
                stats = 'PENDING';    //default PENDING
                adm = false;       //default 0
                role = req.body.role;
                const query = `INSERT INTO users VALUES ((SELECT count(user_id) + 1 FROM users), '${usr}', '${hash}', '${email}', '${whatsapp}', '${stats}', '${adm}', '${role}');`;
                console.log(query);
                db.query(query, (err, result) => {
                    if (err) {
                        console.log('Gagal Registrasi');
                        console.log(query);
                        res.end('fail');
                    } else {
                        res.end('done');
                    }
                });
            })
        } else {
            console.log('Verification Failed');
            console.log('code generated: ', code);
            console.log('code input: ', req.body.verificationCode);
            res.end('Verification failed');
        }
    },

    validate: function (req, db, res, transport) {
        if (ValidateEmail(req.body.email)) {
            temp = req.session;
            temp.username = req.body.username;
            temp.email = req.body.email;
            temp.whatsapp = req.body.whatsapp;
            /**
             * DO VERIFICATION 
             */
            const query = `SELECT user_id FROM users WHERE username = '${req.body.username}';`;
            const query1 = `SELECT user_id FROM users WHERE email = '${req.body.email}';`;
            const query2 = `SELECT user_id FROM users WHERE whatsapp = '${req.body.whatsapp}';`;
            db.query(query, (err, result) => {
                if (err) {
                    console.log('Gagal Akses Database');
                    res.end('Verification 0 Failed in Accessing Database');
                } else if (result[0]) {
                    console.log('Username sudah terdaftar, silahkan gunakan username lain');
                    res.end('Duplicate Username');
                } else {
                    db.query(query1, (err1, result1) => {
                        if (err1) {
                            console.log('Gagal Akses Database');
                            res.end('Verification 1 Failed in Accessing Database');
                        } else if (result1[0]) {
                            console.log('Email sudah terdaftar, silahkan gunakan email lain');
                            res.end('Duplicate email');
                        } else {
                            db.query(query2, (err2, result2) => {
                                if (err2) {
                                    console.log('Gagal Akses Database');
                                    res.end('Verification 2 Failed in Accessing Database');
                                } else if (result2[0]) {
                                    console.log('Nomor Whatsapp sudah terdaftar, silahkan gunakan nomor lain');
                                    res.end('Duplicate Whatsapp Number');
                                } else {
                                    res.send('Check Your Email!');
                                    confirmationCode = Math.floor(Math.random() * 1000000);
                                    if (confirmationCode < 100000) { confirmationCode += 100000; }
                                    var mailOptions = {
                                        from: `${temp.username}`,
                                        to: `${temp.email}`,
                                        subject: "Please confirm your account",
                                        html: `<h1>Email Confirmation</h1>
                                        <h2>Hello ${temp.username}</h2>
                                        <p>Thank you for Registering. Please confirm your email by insert this code</p>
                                        <h1><center><b>${confirmationCode}</b></center></h1>
                                        </div>`
                                    };
                                    transport.sendMail(mailOptions, function (error, info) {
                                        if (error) {
                                            console.log(error);
                                        } else {
                                            console.log(`Email sent: ` + info.response);
                                        }
                                    })
                                }
                            });
                        }
                    });
                }
            });
        } else {
            console.log("Invalid email address");
            res.end("Invalid email address");
        }
    },

    logout: function (req, res) {
        req.session.destroy(err => {
            if (err) {
                return console.log(err);
            }
            res.redirect('/');
        });
    }
}

function ValidateEmail(input) {
    var validRegex = "[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}";
    if (input.match(validRegex)) {
        console.log("Valid email address!");
        return true;
    } else {
        console.log("Invalid email address!");
        return false;
    }
}


module.exports = auth;