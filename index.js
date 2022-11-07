//Import packages
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();
const config = process.env;
const user = config.user;
const pass = config.pass;

module.exports = {
    secret: config.key,
    user: user, 
    pass: pass
};


const transport = nodemailer.createTransport({
    service: "Gmail",
    port:465,
    auth: {
        user: user,
        pass: pass,
    },
});


//Initialize the app as an express app
const app = express();
const router = express.Router();
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { route } = require('express/lib/application');

//Insiasi koneksi ke database
const db = new Client({
    user: config.dbuser,
    host: config.dbserver,
    database: config.dbdatabase,
    password: config.dbpass,
    port: config.dbport,
    sslmode: 'require',
    ssl: true
});

//Melakukan koneksi dan menunjukkan indikasi database terhubung
db.connect((err)=>{
    if(err){
        console.log(err)
        return
    }
    console.log('Database Successfully Connected')
});
 
//Middleware (session)
app.use(
    session({
        secret: 'This is The Secret',
        saveUninitialized: false,
        resave: false
    })
);
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

app.use(express.static(__dirname+'/public'));
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/img', express.static(__dirname + 'public/images'))

app.set('views', './views');
app.set('view engine', 'ejs');

var temp;

//ROUTERS GET
//Router 1: Menampilkan landing page (ada opsi login/register)
router.get('/', (req, res) => {
    temp = req.session;
    if (temp.username) { //jika user terdaftar maka akan masuk ke halaman utama
        //res.send('Mainpage');
        res.render('Mainpage');
    } else { //login / register page 
        //res.send('Home');
        res.render('HomePage');
    }
});

router.get('/login-page', (req, res) => {
    res.send('Login');
    //res.render('LoginPage');
})

router.get('/register-page', (req, res) => {
    res.send('Register');
    //res.render('RegisterPage');
})

router.get('/home', (req, res) => {
    res.send('Home');
    //res.render('HomePage');
})

router.get('/facilities', (req, res) => {
    res.send('Facilities');
    //res.render('FacilitiesPage');
})

router.get('/schedule', (req, res) => {
    res.send('Schedule');
    //res.render('Schedule');
})

router.get('/order-details', (req, res) => {
    res.send('OrderDetails');
    //res.render('OrderDetailsPage');
})

router.get('/order-resume', (req, res) => {
    res.send('OrderResume');
    //res.render('ResumePage')
})

/**
 * Router RoomCheck
 * Method Post
 * Usage: Check Room Availability
 */
router.post('/check', (req, res) => {
    if(temp){
        room_id = req.body.roomId;
        check_start = req.body.start;
        check_duration = req.body.duration;
        check_end = check_start + check_duration;
        book_date = req.body.date;
        const query1 = `SELECT form_id FROM forms WHERE room_id = ${room_id}`;
        db.query(query1, (err, result) => {
            if(err){
                console.log('Couldn\'t connect to database: from /check');
                res.end('Couldn\'t connect to daatabase: from /check');
            } else {
                const queryRoom = `SELECT availibility FROM books WHERE room_id = ${room_id}`;
                db.query(queryRoom, (err, resultRoom) => {
                    if (err){
                        console.log('Cannot access database in availability check');
                        res.end('Cannot access database in availability check');
                    } else {
                        if (resultRoom[0].rows === 'AVAILABLE' || resultRoom[0].rows === 'available'){
                           i = 0;
                            while (result[i].rows){
                                const query = `SELECT book_time_start, book_duration FROM books WHERE (book_date = ${book_date} && form_id = ${result[i].rows})`;
                                flag = 0;
                                db.query(query, (err, result1)=>{
                                    if(err){
                                        console.log('Cannot access database in booking system');
                                        res.end('Cannot access database in booking system');
                                    } else {
                                        book_start = result1[0].rows[0];
                                        book_duration = result1[0].rows[1];
                                        book_end = book_start + book_duration;
                                        //case 1: start when book not finished
                                        if (check_start > book_start && check_start < book_end){
                                            console.log("Start before others end");
                                            flag = 1;
                                        }
                                        //case 2: end when book already started
                                        if (check_end > book_start && check_end < book_end){
                                            console.log("End before others start");
                                            flag = 1;
                                        }
                                    }
                                })
                                if (flag == 1){
                                    break;
                                } i++;
                            } 
                        } else {
                            flag = 1;
                            res.end("Room under maintanance");
                        }
                    }
                })
                if (flag == 1){
                    res.end(`Room Not Available That Time`);

                } else {
                    res.end(`Room Available from ${check_start}.00 WIB to ${check_end}.00 WIB`);
                }
            }
        })
    }
})



/**
 * Router Login
 * Method: Post
 * Usage: Check username & password
 *        Creat login session
 */
router.post('/login', (req, res) =>{
    temp = req.session;
    temp.username = req.body.username;
    temp.password = req.body.pass;
    
    /**
     * Database Access : Collecting Login Information
     */
    const query = `SELECT password FROM users WHERE username = '${temp.username}'`;
    db.query(query, (err, result)=>{
        if(err || !result.rows[0]){
            console.log('Username doesn\'t exist');
            res.end('Login Username Fail')
        } else {
            /**
             * Checking Password
             */
            bcrypt.compare(temp.password, result.rows[0].password, (err, result)=>{
                if(err || !result){
                    console.log('Incorrect password');
                    res.end('Login Password Fail')
                } 
                res.end('Login Success');
            });
        }
    });
});

var confirmationCode;

/**
 * Router Validation
 * Method: Post
 * Usage: Validate user using (EMAIL/PHONE NUMBER)
 */
router.post('/validation', (req, res)=>{
    if(ValidateEmail(req.body.email)){
        temp = req.session;
        temp.email = req.body.email;
        temp.whatsapp = req.body.whatsapp;
        /**
         * DO VERIFICATION 
         */
        const query = `SELECT user_id FROM users WHERE username = '${req.body.username}';`;
        const query1 = `SELECT user_id FROM users WHERE email = '${req.body.email}';`;
        const query2 = `SELECT user_id FROM users WHERE whatsapp = '${req.body.whatsapp}';`;
        db.query(query, (err, result)=>{
            if(err){
                console.log('Gagal Akses Database');
                res.end('Verification 0 Failed in Accessing Database');
            } else if (result[0]){
                console.log('Username sudah terdaftar, silahkan gunakan username lain');
                res.end('Duplicate Username');
            } else {
                db.query(query1, (err1, result1)=>{
                    if(err){
                        console.log('Gagal Akses Database');
                        res.end('Verification 1 Failed in Accessing Database');
                    } else if (result[0]){
                        console.log('Email sudah terdaftar, silahkan gunakan email lain');
                        res.end('Duplicate email');
                    } else {
                        db.query(query2, (err2, result2)=>{
                            if(err){
                                console.log('Gagal Akses Database');
                                res.end('Verification 2 Failed in Accessing Database');
                            } else if (result[0]){
                                console.log('Nomor Whatsapp sudah terdaftar, silahkan gunakan nomor lain');
                                res.end('Duplicate Whatsapp Number');
                            } else {
                                res.send('Check Your Email!');
                                confirmationCode = Math.floor(Math.random()*1000000);
                                if(confirmationCode < 100000) {confirmationCode += 100000;}
                                temp.code = confirmationCode;
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
                                transport.sendMail(mailOptions, function(error, info){
                                    if(error){
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
});

/**
 * Router Register
 * Method: Post
 * Usage: Create email verification
 *        Export new user to database
 */
router.post('/register', (req, res)=>{
    temp = req.session;
    /**
     * Password hashing
     */
    if(req.confirmationCode == temp.code){
        bcrypt.hash(req.body.password, 10, (err, hash)=>{
            if(err){
                return res.status(500).json({
                    error: err
                });
            }
            usr = req.body.username;
            email = req.body.email;
            whatsapp = req.body.whatsapp;
            stats = req.body.status;    //default PENDING
            adm = req.body.admin;       //default 0
            role = req.body.role;
            verif = req.body.verificationCode;
            if(verif == confirmationCode){
                const reqQuery = `SELECT MAX(user_id) FROM users;`;
                db.query(reqQuery, (err, result)=>{
                    if(err){
                        console.log('Gagal Registrasi');
                        res.end('Registration Failed in Accessing Database');
                    } else {
                        userId = result.rows[0].max + 1;
                        const query = `INSERT INTO users VALUES (${userId}, '${usr}', '${hash}', '${email}', '${whatsapp}', '${stats}', '${adm}', '${role}');`;

                        db.query(query, (err, result)=>{
                            if(err){
                                console.log('Gagal Registrasi');
                                console.log(query);
                                res.end('Registration Failed: Duplicate Input');
                            } else {
                                res.end('Registration Success, Please Login');
                                res.redirect('/login');
                            }
                        });
                    }
                });
            }
            
        })
    } else {
        req.send('Verification Failed');
        console.log('code generated: ', temp.code);
        console.log('code input: ', req.confirmationCode);
        req.redirect('/register');
    }
})


//Router 32: Menghapus Session (logout)
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/');
    });
});

app.use('/', router);
app.listen(process.env.PORT || 5230, () => {
    console.log(`App Started on PORT ${process.env.PORT || 5230}`);
});

// Src: https://www.simplilearn.com/tutorials/javascript-tutorial/email-validation-in-javascript
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

