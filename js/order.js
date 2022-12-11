var order = {
    check: function (req, db, res, temp) {
        console.log(temp.username);
        console.log(temp.stats);
        if (temp.stats != 'ACCEPTED') {
            res.end('Tidak Dapat Membuat Pesanan: Akun Belum Aktif, Silahkan Hubungi Admin');
        } else {
            room_id = req.body.room_id;
            check_start = req.body.start;
            check_end = req.body.end;
            check_duration = check_end - check_start;
            book_date = req.body.date;
            flag = 0;
            //ada error: query gamau return yang diminta untuk ruangan dengan id tertentu
            const query = `SELECT rooms.availability AS avai, books.book_time_start AS start, books.book_duration AS duration FROM books NATURAL JOIN forms NATURAL JOIN rooms WHERE (books.book_date = '${book_date}' and rooms.room_id = ${room_id});`;
            db.query(query, (err, result) => {
                console.log(query);
                if (err) {
                    console.log('Couldn\'t connect to database: from /check');
                    res.end('Couldn\'t connect to database: from /check');
                } else {
                    if (result.rows.length == 0 || result.rows[0].avai === 'AVAILABLE') {
                        console.log("Room is available");
                        var i = 0;
                        while (i < result.rows.length) {
                            book_start = result.rows[i].start;
                            duration = result.rows[i].duration;
                            book_end = book_start + duration;
                            if (check_start > book_start && check_start < book_end) {
                                console.log("Start before others end");
                                flag = 1;
                                break;
                            }
                            if (check_end > book_start && check_end < book_end) {
                                console.log("End before others start");
                                flag = 1;
                                break;
                            }
                            i += 1;
                        }
                        if (flag == 1) {
                            res.end('NA');
                        } else {
                            res.end('AVAILABLE');
                        }
                    } else {
                        res.end('MAINTENANCE');
                    }
                }
            });
        }
        
    },

    timecheck: function (req, db, res) {
        room_id = req.body.room_id;
        check_start = req.body.start;
        check_end = req.body.end;
        check_duration = check_end - check_start;
        book_date = req.body.date;
        flag = 0;
        const query = `select rooms.availability as avai, books.book_time_start as start, books.book_duration as duration from books, rooms where (books.book_date = '${book_date}' and rooms.room_id = ${room_id});`;
        db.query(query, (err, result) => {
            if (err) {
                console.log('Couldn\'t connect to database: from /timecheck');
                res.end('Couldn\'t connect to database: from /timecheck');
            } else {
                var val = [];
                for (j = 0; j < 24; j++) {
                    val[j] = '0';
                }
                if (result.rows.length == 0) {
                    console.log("Room is available");
                    var timer = '';
                    for (i = 0; i < 24; i += 1) {
                        timer += val[i];
                    }
                    res.end(timer);
                } else {
                    var i = 0;
                    if (result.rows[0].avai === 'AVAILABLE') {
                        while (i < result.rows.length) {
                            book_start = result.rows[i].start;
                            duration = result.rows[i].duration;
                            book_end = book_start + duration;
                            for (x = book_start; x <= book_end; x += 1) {
                                val[x] = '1';
                            }
                            i += 1;
                        }
                        var timer = '';
                        for (i = 0; i < 24; i += 1) {
                            timer += val[i];
                        }
                        res.end(timer);
                    } else {
                        res.end('MAINTENANCE');
                    }
                }
            }
        });
    },

    form: function (req, db, res, usr) {
        room_id = req.body.room_id;
        activity_name = req.body.activity;
        attendance = req.body.attendance;
        facility = req.body.facility;
        letter = req.body.letter;
        consumption = req.body.consumption;
        book_date = req.body.date;
        book_start = req.body.start;
        book_end = req.body.end;
        book_duration = book_end - book_start;
        
        const query = `INSERT INTO forms VALUES ((SELECT count(form_id)+1 FROM forms), ${room_id}, '${activity_name}', ${attendance}, '${letter}', '${facility}', ${consumption});`;
        console.log(query);
        db.query(query, (err, res1) => {
            if (err) {
                console.log(query);
                res.end("ERROR1");
            }
            else {
                //generating booking details
                const querybooks = `INSERT INTO books VALUES ((SELECT count(book_id)+1 FROM books), (SELECT user_id FROM users WHERE username='${usr}'), (SELECT count(form_id) FROM forms), current_timestamp, '${book_date}',${book_start},${book_duration});`;
                db.query(querybooks, (err1, res2) => {
                    console.log(querybooks);
                    if (err1) {
                        res.end("ERROR");
                    }
                    else {
                        console.log("Booking COmpleted");
                        res.end("Booking Completed");
                    }
                })
            }
        })
    },

    getroom: function (req, db, res) {
        const query = `SELECT * FROM rooms;`;
        db.query(query, (err, result) => {
            if (err) {
                console.log(err);
                res.end('Something Error');
            } else {
                res.send(result.rows);
            }
        });
    },

    getroom: function (req, db, res) {
        const query = `SELECT * FROM rooms WHERE;`;
        db.query(query, (err, result) => {
            if (err) {
                console.log(err);
                res.end('Something Error');
            } else {
                res.send(result.rows);
            }
        });
    },
}

module.exports = order;