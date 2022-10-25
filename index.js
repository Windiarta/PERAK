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


app.set('views', './views');
app.set('view engine', 'ejs');
 
var temp;

//ROUTERS GET
//Router 1: Menampilkan landing page (login/register)
router.get('/', (req, res) => {
    temp = req.session;
    if (temp.username) { //jika user terdaftar maka akan masuk ke halaman utama
        return res.send('mainpage');
    } else { //login / register page
        res.send('login');
    }
});

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

/**
 * Router Validation
 * Method: Post
 * Usage: Validate user using (EMAIL/PHONE NUMBER)
 */
router.post('/validation', (req, res)=>{
    if(ValidateEmail(req.body.email)){
        temp = req.session;
        temp.email = req.body.email;
        temp.username = req.body.username;
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
                                /**
                                 * VERIFIKASI EMAIL/Nomor WA
                                 * Src: https://betterprogramming.pub/how-to-create-a-signup-confirmation-email-with-node-js-c2fea602872a
                                 */
                                res.send('Check Your Email!');
                                confirmationCode = Math.floor(Math.random()*1000000);
                                temp.code = confirmationCode;
                                //nodemailer.sendConfirmationMail(temp.username, temp.email, confirmationCode);
                                var mailOptions = {
                                    from: `${temp.username}`,
                                    to: `${temp.email}`,
                                    subject: "Please confirm your account",
                                    html: `<h1>Email Confirmation</h1>
                                        <h2>Hello ${temp.username}</h2>
                                        <p>Thank you for subscribing. Please confirm your email by insert this code</p>
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
            stats = req.body.status;
            adm = req.body.admin;
            role = req.body.role;
            
            const query = `INSERT INTO users VALUES (1,'${usr}', '${hash}', '${email}', '${whatsapp}', '${stats}', '${adm}', '${role}');`;

            db.query(query, (err, result)=>{
                if(err){
                    console.log('Gagal Registrasi');
                    console.log(query);
                    res.end('Registration Failed in Accessing Database');
                } else {
                    console.log(result);
                    res.end('Registration Success, Please Login');
                    res.redirect('/login');
                }
            });
            res.end('Done');
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

