let promise = require('bluebird');
let scriptManager = require("../script_manager/script_manager.js");
const csv = require('csvtojson');

let options = {
    // Initialization Options
    promiseLib: promise
};

let pgp = require('pg-promise')(options);

let connectionOptions = {
    host: process.env.DB_TFE_HOST || "localhost",
    port: process.env.DB_TFE_PORT || 5432,
    database: process.env.DB_TFE_DB || "custom_db",
    user: process.env.DB_TFE_USER || "custom_user",
    password: process.env.DB_TFE_PASS || "custom_pass"
};

let db = pgp(connectionOptions);

const cookieName = "SuperCookie";

function signIn(req, res, next) {

    db.one('SELECT id_user, user_type FROM Users u WHERE u.login = $1 AND u.admin_password = $2', [req.body.login, req.body.password])
        .then(function (data) {

            let options = {
                maxAge: 1000 * 60 * 60, // would expire after 60 minutes
                httpOnly: true, // The cookie only accessible by the web server
                signed: true // Indicates if the cookie should be signed
            };

            let cookie = {USER_TYPE: data["user_type"], USER_ID: data.id};

            // Set cookie
            res.status(200).cookie(cookieName, cookie, options);
        })
        .catch(function (err) {
            return next(err);
        });
}

function scriptGenerator(req, res, next) {
    let software = req.params.name;
    db.many("SELECT * FROM XXX WHERE software = $1", software)
        .then(function (data) {
            scriptManager.handleRequest(data, software, function (err, filePath, fileName) {
                if (err) {
                    return next(err);
                } else {
                    res.download("../script_manager" + filePath, fileName);
                }
            });
        })
        .catch(function (err) {
            return next(err);
        });
}

function userloginsInfo(req, res, next) {
    let userId = parseInt(req.params.id);
    db.many("SELECT * FROM Users.access u WHERE u.id_user = $1", userId)
        .then(function (data) {
            res.status(200).json({
                status: 'success',
                data: data,
                message: 'GET YOUR DATA NOW'
            });
        })
        .catch(function (err) {
            return next(err);
        });
}

function addSoftware(req, res, next) {

    db.none('insert into pups(name)' +
        'values($1)', req.body.name)
        .then(function () {
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Inserted one software'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function removeSoftware(req, res, next) {
    db.result('delete from sofware where id = $1', parseInt(req.body.id))
        .then(function (result) {

            res.status(200)
                .json({
                    status: 'success',
                    message: `Removed ${result.rowCount} sofware`
                });

        })
        .catch(function (err) {
            return next(err);
        });
}

function updateSoftware(req, res, next) {

    db.none('update software set name=$1 where id=$2',
        [req.body.name, parseInt(req.body.id)])
        .then(function () {
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Updated software'
                });
        })
        .catch(function (err) {
            return next(err);
        });

}

function registerStudents(req, res, next) {
    let sampleFile;

    if (!req.files) {
        return next(new Error('No files were uploaded.'));
    }
    // nom dans form
    sampleFile = req.files.sampleFile;

    csv
        .fromString(sampleFile.data.toString())
        .on('json',(jsonObj)=>{
            // combine csv header row and csv line to a json object
            // jsonObj.a ==> 1 or 4
        })
        .on('done', () => {
            //parsing finished
        })

}

function createUserProfil(req, res, next) {

}

function useUserProfilOnStudents(req, res, next) {

}

module.exports = {
    signIn: signIn,
    scriptGenerator: scriptGenerator,
    userloginsInfo: userloginsInfo,
    updateSoftware: updateSoftware,
    removeSoftware: removeSoftware,
    addSoftware: addSoftware,
    registerStudents: registerStudents,
    createUserProfil: createUserProfil,
    useUserProfilOnStudents: useUserProfilOnStudents
};