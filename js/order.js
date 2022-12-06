var order = {
    check: function (req, db, res) {
        room_id = req.body.room_id;
        check_start = req.body.start;
        check_duration = req.body.duration;
        check_end = check_start + check_duration;
        book_date = req.body.date;
        const query1 = `SELECT form_id FROM forms WHERE room_id = ${room_id}`;
        db.query(query1, (err, result) => {
            npm
            if (err) {
                console.log('Couldn\'t connect to database: from /check');
                res.end('Couldn\'t connect to daatabase: from /check');
            } else {
                const queryRoom = `SELECT availibility FROM books WHERE room_id = ${room_id}`;
                db.query(queryRoom, (err, resultRoom) => {
                    if (err) {
                        console.log('Cannot access database in availability check');
                        res.end('Cannot access database in availability check');
                    } else {
                        if (resultRoom[0].rows === 'AVAILABLE' || resultRoom[0].rows === 'available') {
                            i = 0;
                            while (result[i].rows) {
                                const query = `SELECT book_time_start, book_duration FROM books WHERE (book_date = ${book_date} && form_id = ${result[i].rows})`;
                                flag = 0;
                                db.query(query, (err, result1) => {
                                    if (err) {
                                        console.log('Cannot access database in booking system');
                                        res.end('Cannot access database in booking system');
                                    } else {
                                        book_start = result1[0].rows[0];
                                        book_duration = result1[0].rows[1];
                                        book_end = book_start + book_duration;
                                        //case 1: start when book not finished
                                        if (check_start > book_start && check_start < book_end) {
                                            console.log("Start before others end");
                                            flag = 1;
                                        }
                                        //case 2: end when book already started
                                        if (check_end > book_start && check_end < book_end) {
                                            console.log("End before others start");
                                            flag = 1;
                                        }
                                    }
                                })
                                if (flag == 1) {
                                    break;
                                } i++;
                            }
                        } else {
                            flag = 1;
                            res.end("Room under maintanance");
                        }
                    }
                })
                if (flag == 1) {
                    res.end(`Room Not Available That Time`);

                } else {
                    res.end(`Room Available from ${check_start}.00 WIB to ${check_end}.00 WIB`);
                }
            }
        })
    },

    form: function (req, db, res) {
        temp = req.session;
        temp.username = req.body.username;

        room_id = req.body.room_id;
        activity_name = req.body.activity;
        attendance = req.body.attendance;
        facility = req.body.facility;
        letter = req.body.letter;
        consumption = req.body.consumption;
        book_date = req.body.date;
        book_start = req.body.start;
        book_duration = req.body.duration;

        const query = `INSERT INTO forms VALUES ((SELECT count(form_id)+1 FROM forms), ${room_id}, '${activity_name}', ${attendance}, '${letter}', '${facility}', ${consumption});`;
        db.query(query, (err, res1) => {
            if (err) {
                console.log(query);
                res.end("ERROR1");
            }
            else {
                res.send("Form Successfully Registered");
                //generating booking details
                const query1 = `INSERT INTO books VALUES (SELECT count(book_id) FROM books)+1, SELECT user_id WHERE username = ${temp.username}, SELECT count(form_id) FROM forms, current_timestamp, ${book_date}, ${book_start}, ${book_duration};`
                db.query(query1, (err1, res2) => {
                    if (err1) {
                        res.end("ERROR");
                    }
                    else {
                        res.end("Booking Completed");
                    }
                })
            }
        })
    }
}

module.exports = order;