let express = require('express');
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let fileUpload = require('express-fileupload');
let cors = require('cors');
let jwt = require('express-jwt');

let routes = require('./routes/routes.js');

let app = express();

// pour les cookies
const SECRET = process.env.SECRET_TOKEN || "dsoigsdgdsghdsgkds_fkgsdkuhfdh54644sdigshfhsdf";
// pour le token
const secretToken = process.env.SECRET_TOKEN || "osfdotg654468fd_g,fsdnbvff";

// middleware for express
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser(SECRET));
app.use(fileUpload());
app.use(logger('dev'));
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.statusCode = 404;
    next(err);
});

// SECURITY : IF SUCCESS => req.user NOT undefined
// ONLY 2 path that doesn't required token
app.use(jwt({secret: secretToken}).unless(
    {path: [
        '/api/UserloginsInfo/:matricule',
        '/api/signIn'
    ]}
));


// error handlers
// production error handler
app.use(function (err, req, res, next) {
    res.status(err.statusCode || 500)
        .json({
            status: 'error',
            message: err.message
        });
});

module.exports = app;