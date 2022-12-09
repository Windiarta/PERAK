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

const db = new Client({
    user: config.dbuser,
    host: config.dbserver,
    database: config.dbdatabase,
    password: config.dbpass,
    port: config.dbport,
    sslmode: 'require',
    ssl: true,

});

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
    if (temp.username) { 
        res.redirect('/home');
    } else {
        res.redirect('/login');
    }
});

router.get('/details', (req, res) => {
    res.render('DetailsPage');
    /*
    if (temp.username) {
        res.render('DetailsPage');
    } else {
        res.redirect('/home');
    }
    */
})

//nanti ganti jadi facility aja routenya
router.get('/rent', (req, res) => {
    res.render('RentPage');
   /* if (temp.username) {
        res.render('RentPage');
    } else {
        res.redirect('/home');
    }*/
})

router.get('/login', (req, res) => {
    res.render('Login');
})

router.get('/login2', (req, res) => {
    res.render('Login2');
})

router.get('/admin', (req, res) => {
    res.render('AdminPage');
    if (temp.admin) {
        res.render('AdminPage');
    } else {
        res.redirect('/');
    }
})

router.get('/register', (req, res) => {
    res.render('register');
})

router.get('/adminpage', (req, res) => {
    res.render ('AdminPage');
})
router.get('/aboutus', (req, res) => {
    res.render('AboutUs');
})

router.get('/home', (req, res) => {
    res.render('Mainpage');
})

router.get('/aboutus', (req, res) => {
    res.render('AboutUs');
})

router.get('/order-details', (req, res) => { 
    if (temp.username) {
        res.render('OrderDetailsPage');
    } else {
        res.redirect('/home');
    }  
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
    order.getroom(req, db, res);
})

router.post('/check', (req, res) => {
    order.check(req, db, res, temp);
})

router.post('/timecheck', (req, res) => {
    order.timecheck(req, db, res);
})

router.post('/form', (req, res) => {
    temp = req.session;
    order.form(req, db, res, temp.username);
})

router.post('/login', (req, res) =>{
    temp = auth.login(req, db, res);
});

router.post('/validation', (req, res) => {
    auth.validate(req, db, res, transport);
});

router.post('/register', (req, res) => {
    auth.register(req, db, res);
})

router.post("/get_admin", (req, res) => {
    admin.get_adm(req, db, res);
})

router.post("/get_order", (req, res) => {
    admin.get_order(req, db, res);
})

router.post('/acc_order', (req, res) => {
    admin.acc_order(req, db, res);
})

router.post('/update_status', (req, res) => {
    admin.update_stat(req, db, res);
});

router.post('/add_facility', (req, res) => {
    admin.add_fac(req, db, res);
});

router.post('/remove_facility', (req, res) => {
    admin.rm_fac(req, db, res);
});

router.post('/edit_facility', (req, res) => {
    admin.edit_fac(req, db, res);
});

router.get('/logout', (req, res) => {
    auth.logout(req, res);
});

/** 
 * Router default route
 * Method: get
 * Usage: redirect all route to home
 */
router.get('*', (req, res) => {
    res.redirect('/home');
    //res.redirect('err404page');
})

app.use('/', router);
app.listen(process.env.PORT || 5230, () => {
    console.log(`App Started on PORT ${process.env.PORT || 5230}`);
});


