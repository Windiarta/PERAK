var admin = {
    get_adm: function (req, db, res) {
        const query = `UPDATE users SET admin = true WHERE user_id = ${req.body.user_id};`;
        db.query(query, (err, result) => {
            if (err) {
                res.end("Unable to access database");
            } else {
                console.log("Now, You are admin");
                res.end("Now, You are admin");
            }
        });
    },

    update_stat: function (req, db, res, user_id) {
        const query = `SELECT admin FROM users WHERE user_id = '${user_id}';`;
        db.query(query, (err, result) => {
            if (err) {
                console.log('Something Error');
                res.end('Something Error');
            }
            if (result.rows[0].admin) {
                if (req.body.accept == 1) {
                    stats = "ACCEPTED";
                } else if (req.body.accept == 0) {
                    stats = "REJECTED";
                }
                const query = `UPDATE users SET status = '${stats}' WHERE user_id = ${req.body.user_id};`;
                db.query(query, (err, result) => {
                    if (err) {
                        console.log("Something error");
                        res.end("Unable to connect database");
                    } else {
                        res.end("Account Status Updated")
                    }
                })
            } else {
                console.log("default user try to access admin pages");
                res.end("admin: failed");
                res.render("Homepage");
            }
        });
    },

    edit_fac: function (req, db, res) {
        temp = req.session;
        const query = `SELECT admin FROM users WHERE user_id = '${temp.user_id}';`;
        db.query(query, (err, result) => {
            if (err) {
                console.log('Something Error');
                res.end('Something Error');
            }
            if (result.rows[0].admin) {
                if (!req.body.photo) { photo = null; }
                else {
                    let text = req.body.photo;
                    const myArray = text.split("/d/");
                    const myId = myArray[1].split("/");
                    photo = myId[0];
                }
                const query = `UPDATE rooms SET room_name = '${req.body.room_name}', room_building = '${req.body.room_building}', room_photo = '${photo}', room_description = '${req.body.room_description}', availability = '${req.body.availability}' WHERE room_id = ${req.body.room_id};`;
                db.query(query, (err, result1) => {
                    if (err) {
                        console.log(query);
                        res.end('Something Error');
                    }
                    res.end('Facility Successfully Updated');
                    //res.render("facilities");
                });

            } else {
                console.log("default user try to access admin pages");
                res.end("admin: failed");
                res.render("Homepage");
            }
        });
    },

    add_fac: function (req, db, res) {
        temp = req.session;
        const query = `SELECT admin FROM users WHERE user_id = '${temp.user_id}';`;
        db.query(query, (err, result) => {
            if (err) {
                console.log('Something Error');
                res.end('Something Error');
            }
            if (result.rows[0].admin) {
                if (!req.body.photo) { photo = null; }
                else {
                    let text = req.body.photo;
                    const myArray = text.split("/d/");
                    const myId = myArray[1].split("/");
                    photo = myId[0];
                }
                const query1 = `INSERT INTO rooms VALUES ((SELECT count(room_id)+1 FROM rooms), '${req.body.room_name}', '${req.body.room_building}', '${photo}', '${req.body.room_description}', '${req.body.availability}');`
                db.query(query1, (err, result1) => {
                    if (err) {
                        console.log(query1);
                        res.end('Something Error');
                    }
                    res.end('New Facility Successfully Added');
                });

            } else {
                console.log("default user try to access admin pages");
                res.end("admin: failed");
            }
        });
    },

    get_order: function (req, db, res) {
        temp = req.session;
        const query = `SELECT admin FROM users WHERE user_id = '${temp.user_id}';`;
        db.query(query, (err, result) => {
            if (err) {
                console.log('Something Error');
                res.end('Something Error');
            } else {
                if (result.rows[0].admin) {
                    if (req.body.all == 0) {
                        query1 = `SELECT * FROM books NATURAL JOIN forms NATURAL JOIN rooms ORDER BY book_date ASC`;
                    } else {
                        query1 = `SELECT * FROM books NATURAL JOIN forms NATURAL JOIN rooms WHERE book_date > current_timestamp ORDER BY book_date ASC`;
                    }
                    db.query(query1, (err1, res1) => {
                        if (err1) {
                            console.log("Something error");
                        } else {
                            res.send(res1.rows);
                        }
                    });
                }
            }
        });
    },

    acc_order: function (req, db, res) {
        temp = req.session;
        const query = `SELECT admin FROM users WHERE user_id = '${temp.user_id}';`;
        db.query(query, (err, result) => {
            if (err) {
                console.log('Something Error');
                res.end('Something Error');
            } else {
                if (result.rows[0].admin) {
                    var acc = 'PENDING';
                    if (req.body.accept == false) {
                        acc = 'REJECTED';
                    } else if (req.body.accept == true) {
                        acc = 'ACCEPTED';
                    }
                    const query = `UPDATE books SET stats = '${acc}' WHERE book_id = ${req.body.book_id};`;
                    db.query(query, (err1, res1) => {
                        if (err1) {
                            console.log("Something error");
                        } else {
                            res.end(acc);
                        }
                    });
                }
            }
        });
    },
}

module.exports = admin;