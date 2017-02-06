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
                    res.download(filePath, fileName);
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

    db.none('insert into Softwares(name)' +
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
    sampleFile = req.files.csvFile;

    csv
        .fromString(sampleFile.data.toString())
        .on('json', (jsonObj) => {
            // combine csv header row and csv line to a json object

            db.none('insert into Users(tesChamps)' +
                'values($1,$2,$3,$4,$5,$6)', [jsonObj["Matric Info"], jsonObj["Nom Etudiant"], jsonObj["Prénom Etudiant"], jsonObj["Année"], jsonObj["Orientation"], jsonObj["EMail Etudiant 2"]])
                .then(function () {
                    // NOTHING TO DO HERE
                })
                .catch(function (err) {
                    return next(err);
                });

        })
        .on('done', () => {
            //parsing finished
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Registered all students DONE'
                });
        })
        .on('error', (err) => {
            return next(err);
        })

}

function createUserProfil(req, res, next) {

    db.none('insert into laBonneTable(tesChamps)' +
        'values($1,etc)', [req.body.name])
        .then(function () {
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Inserted one user profil'
                });
        })
        .catch(function (err) {
            return next(err);
        });

}

function useUserProfilOnStudents(req, res, next) {

    for (let studentId of req.body.studentIds) {

        db.none('insert into laBonneTable(tesChamps)' +
            'values($1,etc)', [parseInt(studentId), parseInt(req.body.userProfil)])
            .then(function () {
                // NOTHING TO DO HERE
            })
            .catch(function (err) {
                return next(err);
            });

    }
    res.status(200)
        .json({
            status: 'success',
            message: 'Applied the user profil on users'
        });

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