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

    let login = req.body.login;
    let password = req.body.password;

    db.one('SELECT id_user, user_type FROM TFE.users u WHERE u.login = $1 AND u.admin_password = $2', [login, password])
        .then(function (data) {

            // if user is found and password is right
            // create a token
            let token = jwt.sign({USER_TYPE: data["user_type"], USER_ID: data.id}, secretToken, {
                expiresIn: 60 * 60 * 24 // expires in 24 hours
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
    let newresult = [];
    db.tx(function (t) {

        return t.any("SELECT u.id_user , u.first_name , u.name AS user_name, u.email , u.matricule , s.id_software, s.name AS software_name FROM TFE.users u " +
            "JOIN TFE.profiles p ON u.id_profile = p.id_profile " +
            "JOIN TFE.profiles_softwares ps ON ps.id_profile = p.id_profile " +
            "JOIN TFE.softwares s USING(id_software) " +
            "WHERE s.name = $1 " +
            "AND u.id_user NOT IN ( " +
            " SELECT ua.id_user " +
            "FROM TFE.users_access ua " +
            "WHERE ua.id_software = s.id_software)", software)
            .then(function (users) {

                //add a password to each users :
                newresult = users;
                for (let i = 0; i < users.length; i++) {
                    newresult[i]['password'] = generatePassword();
                }

                let queries = newresult.map(function (l) {
                    return db.none("INSERT INTO TFE.users_access(id_user,id_software,password) VALUES($1,$2,$3)", [ l["id_user"], l["id_software"] , l["password"] ])
                });
                return t.batch(queries);
            })
    }).then(function () {
        scriptManager.handleRequest(newresult, software, function (err, filePath, fileName) {
            if (err) {
                console.log(err);
                return next(err);
            } else {
                res.download(filePath, fileName);
            }
        });
    }).catch(function (err) {
        console.log(err);
        err.code = 404;
        return next(err);
    });

}

function userloginsInfo(req, res, next) {
    let userId = parseInt(req.params.id);
    db.any("SELECT * FROM Users.access u WHERE u.matricule = $1", userId)
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
    let csvContent = [];

    csv().fromString(content)
        .on('json', (jsonObj) => {
            csvContent.push(jsonObj);
        })
        .on('done', () => {

            db.tx(function (t) {
                let queries = csvContent.map(function (l) {

                    return t.one('SELECT id_year_section FROM TFE.years_sections WHERE section = $1 AND year = $2', [l["Orientation"], l["Année"]])
                        .then(function (result) {
                            let pseudo = l["Prénom Etudiant"].charAt(0) + l["Nom Etudiant"].substring(0, 6);
                            return t.none('insert into TFE.users(matricule,name,first_name,id_year,email,user_type,login)' +
                                'values($1,$2,$3,$4,$5,$6,$7)', [l["Matric Info"], l["Nom Etudiant"], l["Prénom Etudiant"], result.id_year_section, l["EMail Etudiant 2"], "STUDENT", pseudo.toLowerCase()]);
                        });
                });
                return t.batch(queries);
            }).then(function (data) {
                res.status(200)
                    .json({
                        status: 'success',
                        message: 'Registered all students'
                    });
            }).catch(function (err) {
                console.log(err);
                return next(err);
            });

        })
        .on('error', (err) => {
            err.code = 404;
            return next(err);
        })

}

function createUserProfil(req, res, next) {

    let name = req.body.name;
    let id_year = (req.body.id_year == undefined) ? null : req.body.id_year;
    let softwareList = req.body.software;

    if (softwareList == undefined) {
        return next(new Error("NO REQUIRED PARAM"));
    } else {

        db.tx(function (t) {

            return t.one('insert into TFE.profiles(id_year, name) VALUES($1,$2) RETURNING id_profile', [id_year, name])
                .then(function (result) {
                    let queries = softwareList.map(function (software) {
                        return t.none('INSERT into TFE.profiles_softwares(id_profile,id_software) VALUES($1,$2)', [result.id_profile, parseInt(software)]);
                    });
                    return t.batch(queries);
                });
        })
            .then(function (data) {
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
}

function useUserProfilOnStudents(req, res, next) {

    let id_profil = req.body.id_profil;
    let studentIds = req.body.studentIds;

    if (studentIds == undefined) {
        return next(new Error("NO REQUIRED PARAM"));
    } else {

        db.tx(function (t) {
            let queries = studentIds.map(function (l) {
                return db.none("UPDATE TFE.users SET id_profile = $1 WHERE id_user = $2", [parseInt(l), id_profil]);
            });
            t.batch(queries);
        }).then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Applied one user profil on user(s)'
                });
        })
            .catch(function (err) {
                return next(err);
            });
    }
}

function listSoftwares(req, res, next) {

    db.any("SELECT * FROM TFE.softwares")
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Enjoy',
                    data: data
                });
        }).catch(function (err) {
        return next(err);
    });

}

function listUsers(req, res, next) {
    db.any("SELECT * FROM TFE.users")
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Enjoy',
                    data: data
                });
        }).catch(function (err) {
        return next(err);
    });
}

function listProfils(req, res, next) {
    db.any("SELECT * FROM TFE.profiles")
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Enjoy',
                    data: data
                });
        }).catch(function (err) {
        return next(err);
    });
}

// TODO
function createUser(req,res,next) {

    let name = req.body.name;
    let firstName = req.body.firstName;
    let type = req.body.type;

    if (login.length == 0 || firstName.length == 0 || type.length == 0){
        return next(new Error("VIDE"));
    }

    let email = ( req.body.email == undefined || (req.body.email.length == 0) ) ? "" : req.body.email;
    let login = (type == "TEACHER" && req.body.login != undefined && req.body.login.length != 0) ? req.body.login  : firstName.charAt(0) + name.substring(0, 6);
    let params = [name,firstName,type,login,email];

    db.none("INSERT INTO TFE.users(name,first_name,user_type,login,email) VALUES($1,$2,$3,$4,$5) RETURNING id_user", params)
        .then(function (user) {
            db.once("SELECT id_profil FROM TFE.profiles WHERE name = $1","GUEST")
                .then(function (profil) {
                    req.body.id_profil = profil.id_profil;
                    req.body.studentIds = [user.id_profil];
                    return useUserProfilOnStudents(req,res,next);
                });
        })
        .catch(function (err) {
            return next(err);
        })
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
    useUserProfilOnStudents: useUserProfilOnStudents,
    listSoftwares: listSoftwares,
    listUsers: listUsers,
    listProfils: listProfils,
    createUser: createUser
};