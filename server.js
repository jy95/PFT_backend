let express = require('express');
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let fileUpload = require('express-fileupload');

let routes = require('./routes/routes.js');

let app = express();

const SECRET =  process.env.SECRET_TOKEN || "dsoigsdgdsghdsgkds_fkgsdkuhfdh54644sdigshfhsdf";

// middleware for express
app.use(bodyParser.json());
app.use(cookieParser(SECRET));
app.use(fileUpload());
app.use(logger('dev'));
app.use('/', routes);

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', false);
    res.header('Access-Control-Max-Age', '86400');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
    next();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status( err.code || 500 )
            .json({
                status: 'error',
                message: err
            });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500)
        .json({
            status: 'error',
            message: err.message
        });
});

module.exports = app;