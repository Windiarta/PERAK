/**
 * PERAK FTUI
 * @author Windiarta
 * @author M. Darrel Tristan
 * 
 * @version 0.1
 * 
 */

//Import packages
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

// Import local files
const admin = require('./js/admin.js');
const auth = require('./js/authorization.js');
const order = require('./js/order.js');

// Environment variables
const dotenv = require('dotenv');
dotenv.config();
const config = process.env;
const user = config.user;
const pass = config.pass;

//Initialize the app as an express app
const app = express();
const router = express.Router();
const { Client } = require('pg');
const { route } = require('express/lib/application');

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


//Insiasi koneksi ke database
const db = new Client({
    user: config.dbuser,
    host: config.dbserver,
    database: config.dbdatabase,
    password: config.dbpass,
    port: config.dbport,
    sslmode: 'require',
    ssl: true,

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

//ROUTERS GET
//Router 1: Menampilkan landing page (ada opsi login/register)
router.get('/', (req, res) => {
    temp = req.session;
    if (temp.username) { //jika user terdaftar maka akan masuk ke halaman utama
        //res.send('Mainpage');
        res.render('Mainpage');
    } else { //login / register page 
        //res.send('Home');
        res.render('Login');
    }
});

router.get('/details', (req, res)=>{
    res.render('DetailsPage');
    /*
    if (req.session.username) {
        res.render('DetailsPage');
    } else {
        res.redirect('/');
        //res.redirect("/err403page");
    }
    */
})

//nanti ganti jadi facility aja routenya
router.get('/rent', (req, res) => {
    res.render('RentPage');
    /*
    if (req.session.username) {
        res.render('RentPage');
    } else {
        res.redirect('/');
        //res.redirect("/err403page");
    }
    */
})

router.get('/login', (req, res) => {
    res.render('Login');
})

router.get('/register', (req, res) => {
    res.render('register');
})

router.get('/home', (req, res) => {
    res.render('Mainpage');
})

router.get('/order-details', (req, res) => {
    res.render('OrderDetails');
    //res.render('OrderDetailsPage');
    /*
    if (req.session.username) {
        res.render('OrderDetailsPage');
    } else {
        res.redirect('/');
        //res.redirect("/err403page");
    }
    */
})

router.get('/order-resume', (req, res) => {
    res.send('OrderResume');
    //res.render('ResumePage');
    /*
    if (req.session.username) {
        res.render('ResumePage');
    } else {
        res.redirect('/');
        //res.redirect("/err403page");
    }
    */
})

router.post('/getroom', (req, res) => {
    const query = `SELECT * FROM rooms;`;
    db.query(query, (err, result) => {
        if (err) {
            console.log(err);
            res.end('Something Error');
        } else {
            res.send(result.rows);
            data = result.rows;
        }
    });
})


/**
 * Router RoomCheck
 * Method Post
 * Usage: Check Room Availability
 */
router.post('/check', (req, res) => {
    order.check(req, db, res);
})

router.post('/timecheck', (req, res) => {
    order.timecheck(req, db, res);
})

/**
 * Router Form
 * Method Post
 * Usage: Create Form
 */
router.post('/form', (req, res) => {
    temp = req.session;
    order.form(req, db, res, temp.username);
})


/**
 * Router Login
 * Method: Post
 * Usage: Check username & password
 *        Creat login session
 */
router.post('/login', (req, res) =>{
    auth.login(req, db, res);
});

/**
 * Router Validation
 * Method: Post
 * Usage: Validate user using (EMAIL/PHONE NUMBER)
 */
router.post('/validation', (req, res) => {
    auth.validate(req, db, res, user, pass, transport);
});

/**
 * Router Register
 * Method: Post
 * Usage: Create email verification
 *        Export new user to database
 */
router.post('/register', (req, res) => {
    auth.register(req, db, res);
})

/**
 * Router get_admin
 * Usage: Make the user be an admin
 */
router.post("/get_admin", (req, res) => {
    admin.get_adm(req, db, res);
})

/** 
 * Router update_status
 * Method: Post
 * Param: req.body.accept
 * Usage: update user status
 */
router.post('/update_status', (req, res) => {
    admin.update_stat(req, db, res);
});


/** 
 * Router add_facilities
 * Method: Post
 * Usage: add facilities to database
 * Next Update: operational hours
 */
router.post('/add_facility', (req, res) => {
    admin.add_fac(req, db, res);
});

/** 
 * Router remove_facility
 * Method: Post
 * Usage: remove facility to database
 */
router.post('/remove_facility', (req, res) => {
    admin.rm_fac(req, db, res);
});

/** 
 * Router edit_facility
 * Method: Post
 * Usage: edit facility to database
 */
router.post('/edit_facility', (req, res) => {
    admin.edit_fac(req, db, res);
});


/** 
 * Router logout
 * Method: Get
 * Usage: end session
 */
router.get('/logout', (req, res) => {
    auth.logout(req, res);
});

/** 
 * Router default route
 * Method: get
 * Usage: redirect all route to home
 */
router.get('*', (req, res) => {
    res.redirect('/');
    //res.redirect('err404page');
})

app.use('/', router);
app.listen(process.env.PORT || 5230, () => {
    console.log(`App Started on PORT ${process.env.PORT || 5230}`);
});


