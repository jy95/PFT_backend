let promise = require('bluebird');
let scriptManager = require("../script_manager/script_manager.js");
const csv = require('csvtojson');
let jwt = require('jsonwebtoken');
let generatePassword = require('password-generator');

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

const secretToken = process.env.SECRET_TOKEN || "osfdotg654468fd_g,fsdnbvff";

function signIn(req, res, next) {

    db.one('SELECT id_user, user_type FROM TFE.users u WHERE u.login = $1 AND u.admin_password = $2', [req.body.login, req.body.password])
        .then(function (data) {

            // if user is found and password is right
            // create a token
            let token = jwt.sign({USER_TYPE: data["user_type"], USER_ID: data.id}, secretToken, {
                expiresIn : 60*60*24 // expires in 24 hours
            });

            // return the information including token as JSON
            res.json({
                success: true,
                message: 'Enjoy your token!',
                token: token
            });

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

    db.none('insert into TFE.softwares(name)' +
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
    db.result('delete from TFE.softwares where id_software = $1', parseInt(req.body.id))
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

    db.none('update TFE.softwares set name=$1 where id_software=$2',
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

    let content = sampleFile.data.toString();

    csv
        .fromString(content)
        .on('json', (jsonObj) => {
            // combine csv header row and csv line to a json object

            db.none('insert into TFE.users(matricule,name,first_name,id_year,id_profile,email,user_type)' +
                'values($1,$2,$3,$4,$5,$6,$7)', [jsonObj["Matric Info"], jsonObj["Nom Etudiant"], jsonObj["Prénom Etudiant"], jsonObj["Année"], jsonObj["Orientation"], jsonObj["EMail Etudiant 2"], "STUDENT"])
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
                    message: 'Registered all students'
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

        db.many("SELECT id_software FROM TFE.softwares WHERE id_software IN (SELECT id_software FROM TFE.profiles_softwares WHERE id_profile = $1)", parseInt(req.body.userProfil))
            .then(function (data) {

                db.none('insert into TFE.users_access(id_user,id_software,password)' +
                    'values($1,$2,$3)', [parseInt(studentId), data["id_software"], generatePassword()])
                    .then(function () {
                        // NOTHING TO DO HERE
                    })
                    .catch(function (err) {
                        return next(err);
                    });

            })
            .catch(function (err) {
                return next(err);
            });

    }
    // IF NO PROBLEM
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