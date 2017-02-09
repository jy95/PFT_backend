let promise = require('bluebird');
let scriptManager = require("../script_manager/script_manager.js");
const csv = require('csvtojson');
let jwt = require('jsonwebtoken');
let generatePassword = require('password-generator');
let customErrors = require('./errrors.js');
let pdfGenerator = require('../script_manager/script_pdf_generator.js');

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

/**
 * @api {post} /api/signIn Function for an admin to sign in
 * @apiName signIn
 * @apiGroup Admin
 *
 * @apiParam {String} login Admin's login.
 * @apiParam {String} password Admin's password.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 Error Code
 *     {
 *          status: 'error',
 *          message: "Un message d'erreur"
 *     }
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          status: 'error',
 *          message: "Un message de success",
 *          token: "UnTokenJWT"
 *     }
 */
function signIn(req, res, next) {

    let login = req.body.login;
    let password = req.body.password;

    if (login == undefined || login.length == 0 || password == undefined || password.length == 0) {
        return next(customErrors.errorMissingParameters);
    }

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
            console.log(err);
            return next(customErrors.errorUnauthorizedAccess);
        });
}

/**
 * @api {get} /api/scriptGenerator/:name Request login script for a software
 * @apiName scriptGenerator
 * @apiGroup Admin
 *
 * @apiParam {String} name Name of the software.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 Error Code
 *     {
 *          status: 'error',
 *          message: "Un message d'erreur"
 *     }
 * @apiSuccessExample {csv} Claroline Response:
 *     HTTP/1.1 200 OK  /api/scriptGenerator/Claroline
 *     "NomEtudiant","PrenomEtudiant","emailEtudiant","motDePasse"
 *     "Tesla","Nikola",,"qerubaqodu"
 *     "Edison","Thomas",,"jebohehumu"
 * @apiSuccessExample {bat} Windows Response:
 *     HTTP/1.1 200 OK  /api/scriptGenerator/Windows
 *     dsadd Tesla /prenom=Nikola /mdp=lanefolame
 *     dsadd Edison /prenom=Thomas /mdp=fowudumiro
 * @apiSuccessExample {csv} Nutrilog Response:
 *     HTTP/1.1 200 OK  /api/scriptGenerator/Nutrilog
 *     "matricule","user_name","first_name","password"
 *     "2    ","Edison","Thomas","ciwabayewa"
 */
function scriptGenerator(req, res, next) {

    let software = req.params.name;
    let newresult = [];

    if (software == undefined || software.length == 0) {
        return next(customErrors.errorMissingParameters);
    }

    db.tx(function (t) {

        return t.any("SELECT u.id_user , u.first_name , u.name AS user_name, u.email , u.matricule , s.id_software, s.name AS software_name FROM TFE.users u " +
            "JOIN TFE.profiles p ON u.id_profile = p.id_profile " +
            "JOIN TFE.profiles_softwares ps ON ps.id_profile = p.id_profile " +
            "JOIN TFE.softwares s USING(id_software) " +
            "WHERE s.name = $1 " +
            "AND s.deleted IS FALSE " +
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
                    return db.none("INSERT INTO TFE.users_access(id_user,id_software,password) VALUES($1,$2,$3)", [l["id_user"], l["id_software"], l["password"]])
                });
                return t.batch(queries);
            })
    }).then(function () {
        scriptManager.handleRequest(newresult, software, function (err, filePath, fileName) {
            if (err) {
                console.log(err);
                return next(customErrors.errorScriptGeneration);
            } else {
                res.download(filePath, fileName);
            }
        });
    }).catch(function (err) {
        console.log(err);
        return next(customErrors.errorNotFound);
    });

}

/**
 * @api {get} /api/AllUserLoginsInfo Request for all logins/passwords of all students.
 * @apiName allUserLoginsInfo
 * @apiGroup Admin
 *
 * @apiSuccess {File} A PDF file with all the logins/passwords found.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 Error Code
 *     {
 *          status: 'error',
 *          message: "Un message d'erreur"
 *     }
 */
function allUserLoginsInfo(req, res, next) {

    db.many("SELECT u.login AS userLogin, ua.password AS softwarePassword, s.name AS softwareName " +
        "FROM TFE.users u JOIN TFE.users_access ua USING(id_user) JOIN TFE.softwares s USING(id_software) " +
        "WHERE s.deleted IS FALSE")
        .then(function (data) {

            pdfGenerator.generateFile("ALL_USERS", data, function (err, pdfDoc) {
                if (err) {
                    console.log(err);
                    return next(customErrors.errorScriptGeneration);
                } else {
                    res.set('content-type', 'application/pdf');
                    res.setHeader('Content-disposition', 'attachment; filename=' + 'Logins_' + "ALL_USERS" + '.pdf');

                    // Create the PDF and pipe it to the response object.
                    pdfDoc.pipe(res);
                    pdfDoc.end();
                }
            });

        })
        .catch(function (err) {
            console.log(err);
            return next(customErrors.errorNotFound);
        });
}

/**
 * @api {get} /api/UserloginsInfo/:id Request for all logins/passwords of a student.
 * @apiName userloginsInfo
 * @apiGroup User
 *
 * @apiParam {String} matricule Student's matricule.
 *
 * @apiSuccess {PDF} A PDF file with all the logins/passwords found.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 Error Code
 *     {
 *          status: 'error',
 *          message: "Un message d'erreur"
 *     }
 */
function userloginsInfo(req, res, next) {

    let matricule = req.params.matricule;
    db.many("SELECT u.login AS userLogin, ua.password AS softwarePassword, s.name AS softwareName " +
        "FROM TFE.users u JOIN TFE.users_access ua USING(id_user) JOIN TFE.softwares s USING(id_software) " +
        " WHERE s.deleted IS FALSE AND u.matricule = $1 ", matricule)
        .then(function (data) {

            pdfGenerator.generateFile(matricule, data, function (err, pdfDoc) {
                if (err) {
                    console.log(err);
                    return next(customErrors.errorScriptGeneration);
                } else {
                    res.set('content-type', 'application/pdf');
                    res.setHeader('Content-disposition', 'attachment; filename=' + 'Logins_' + matricule + '.pdf');

                    // Create the PDF and pipe it to the response object.
                    pdfDoc.pipe(res);
                    pdfDoc.end();
                }
            });

        })
        .catch(function (err) {
            console.log(err);
            return next(customErrors.errorNotFound);
        });
}

/**
 * @api {post} /api/addSoftware Function to add a new software in the database.
 * @apiName addSoftware
 * @apiGroup Admin
 *
 * @apiParam {String} name Name of the new software.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 Error Code
 *     {
 *          status: 'error',
 *          message: "Un message d'erreur"
 *     }
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          status: 'error',
 *          message: "Un message de success",
 *     }
 */
function addSoftware(req, res, next) {

    let name = req.body.name;

    if (name == undefined || name.length == 0) {
        return next(customErrors.errorMissingParameters);
    }

    db.none('insert into TFE.softwares(name)' +
        'values($1)', name)
        .then(function () {
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Inserted one software'
                });
        })
        .catch(function (err) {
            console.log(err);
            return next(customErrors.createServerError({
                title: 'errorCreateSoftware',
                statusCode: 500,
                message: 'Erreur à la création d\'un software'
            }));
        });
}

/**
 * @api {post} /api/removeSoftware Function to mark as deleted an existing software in the database.
 * @apiName removeSoftware
 * @apiGroup Admin
 *
 * @apiParam {String} name Name of the software to be removed.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 Error Code
 *     {
 *          status: 'error',
 *          message: "Un message d'erreur"
 *     }
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          status: 'error',
 *          message: "Un message de success",
 *     }
 */
function removeSoftware(req, res, next) {

    let id = req.body.id;

    if (id == undefined || id == null) {
        return next(customErrors.errorMissingParameters);
    }

    db.none('UPDATE TFE.softwares SET deleted=TRUE WHERE id_software = $1', parseInt(id)) //TODO check
        .then(function () {

            res.status(200)
                .json({
                    status: 'success',
                    message: `Removed sofware`
                });

        })
        .catch(function (err) {
            console.log(err);
            return next(customErrors.errorServer);
        });
}

/**
 * @api {post} /api/updateSoftware Function to update an existing software in the database.
 * @apiName updateSoftware
 * @apiGroup Admin
 *
 * @apiParam {String} name New name of the software.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 Error Code
 *     {
 *          status: 'error',
 *          message: "Un message d'erreur"
 *     }
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          status: 'error',
 *          message: "Un message de success",
 *     }
 */
function updateSoftware(req, res, next) {

    let name = req.body.name;
    let id = req.body.id;

    if (name == undefined || name.length == 0 || id == undefined || id == null) {
        return next(customErrors.errorMissingParameters);
    }

    db.none('update TFE.softwares set name=$1 where id_software=$2',
        [name, parseInt(id)])
        .then(function () {
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Updated software'
                });
        })
        .catch(function (err) {
            console.log(err);
            return next(customErrors.errorServer);
        });

}

/**
 * @api {post} /api/registerStudents Function to register a list of new students based on a CSV file.
 * @apiName registerStudents
 * @apiGroup Admin
 *
 * @apiParam {File} csvFile The CSV file containing the list of new students.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 Error Code
 *     {
 *          status: 'error',
 *          message: "Un message d'erreur"
 *     }
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          status: 'error',
 *          message: "Un message de success",
 *     }
 */
function registerStudents(req, res, next) {

    let sampleFile;

    if (!req.files) {
        return next(customErrors.errorMissingFile);
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
            }).then(function () {
                res.status(200)
                    .json({
                        status: 'success',
                        message: 'Registered all students'
                    });
            }).catch(function (err) {
                console.log(err);
                return next(customErrors.errorServer);
            });

        })
        .on('error', (err) => {
            console.log(err);
            return next(customErrors.createServerError({
                title: 'errorRegisterStudent',
                statusCode: 500,
                message: 'Erreur à l\'inscription des étudiants'
            }));
        })

}

/**
 * @api {post} /api/createUserProfil Function to create a new user profile.
 * @apiName createUserProfil
 * @apiGroup Admin
 *
 * @apiParam {String} name Name of the new profile.
 * @apiParam {Number} [id_year=NULL] Database id of a specific year of the school.
 * @apiParam {Number[]} software List of the id software included in that new profile.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 Error Code
 *     {
 *          status: 'error',
 *          message: "Un message d'erreur"
 *     }
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          status: 'error',
 *          message: "Un message de success",
 *     }
 */
function createUserProfil(req, res, next) {

    let name = req.body.name;
    let id_year = (req.body.id_year == undefined) ? null : req.body.id_year;
    let softwareList = req.body.software;

    if (softwareList == undefined || name == undefined || name.length == 0) {
        return next(customErrors.errorMissingParameters);
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
            .then(function () {
                res.status(200)
                    .json({
                        status: 'success',
                        message: 'Inserted one user profil'
                    });
            })
            .catch(function (err) {
                console.log(err);
                return next(customErrors.createServerError({
                    title: 'errorCreateProfil',
                    statusCode: 500,
                    message: 'Erreur à la création d\'un profil utilisateur'
                }));
            });
    }
}

/**
 * @api {post} /api/useUserProfilOnStudents Function to register a list of new students based on a CSV file.
 * @apiName useUserProfilOnStudents
 * @apiGroup Admin
 *
 * @apiParam {Number} id_profil The id of the profile to apply.
 * @apiParam {Number[]} studentIds List of the id students receiving the profile.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 Error Code
 *     {
 *          status: 'error',
 *          message: "Un message d'erreur"
 *     }
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          status: 'error',
 *          message: "Un message de success",
 *     }
 */
function useUserProfilOnStudents(req, res, next) {

    let id_profil = req.body.id_profil;
    let studentIds = req.body.studentIds;

    if (studentIds == undefined || id_profil == undefined) {
        return next(customErrors.errorMissingParameters);
    } else {

        db.tx(function (t) {
            let queries = studentIds.map(function (l) {
                return db.none("UPDATE TFE.users SET id_profile = $1 WHERE id_user = $2", [parseInt(id_profil), parseInt(l)]);
            });
            t.batch(queries);
        }).then(function () {
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Applied one user profil on user(s)'
                });
        })
            .catch(function (err) {
                console.log(err);
                return next(customErrors.errorServer);
            });
    }
}

/**
 * @api {get} /api/listSoftwares Request a list of all the softwares.
 * @apiName listSoftwares
 * @apiGroup Admin
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 Error Code
 *     {
 *          status: 'error',
 *          message: "Un message d'erreur"
 *     }
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "status":"success",
 *          "message":"Enjoy",
 *          "data":[
 *              {
 *                  "id_software":  1,
 *                  "name": "Windows",
 *                  "deleted":  false
 *              },
 *              {
 *                  "id_software":  2,
 *                  "name": "Claroline",
 *                  "deleted":  false
 *              },
 *              {
 *                  "id_software":  3,
 *                  "name": "Nutrilog",
 *                  "deleted":  false
 *              }
 *          ]
 *      }
 */
function listSoftwares(req, res, next) {

    db.any("SELECT * FROM TFE.softwares WHERE deleted IS FALSE")
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Enjoy',
                    data: data
                });
        }).catch(function (err) {
        console.log(err);
        return next(customErrors.errorServer);
    });

}

/**
 * @api {get} /api/listUsers Request a list of all the users.
 * @apiName listUsers
 * @apiGroup Admin
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 Error Code
 *     {
 *          status: 'error',
 *          message: "Un message d'erreur"
 *     }
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *  {
 *       "status":"success",
 *       "message":"Enjoy",
 *       "data":[
 *           {
 *               "id_user":  3,
 *               "id_year":  2,
 *               "id_profile":   2,
 *               "matricule":    "21111",
 *               "name": "Edison",
 *               "first_name":   "Thomas",
 *               "login":    "tedison",
 *               "email":    null,
 *               "user_type":    "STUDENT",
 *               "admin_password":   null
 *           },
 *           {
 *               "id_user":  1,
 *               "id_year":  null,
 *               "id_profile":   1,
 *               "matricule":    null,
 *               "name": "Admin",
 *               "first_name":   "Ladministrateur",
 *               "login":    "Admin00",
 *               "email":    null,
 *               "user_type":    "Admin",
 *               "admin_password":   "admin"
 *           }
 *       ]
 *   }
 */
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
        console.log(err);
        return next(customErrors.errorServer);
    });
}

/**
 * @api {get} /api/listProfils Request a list of all the users.
 * @apiName listProfils
 * @apiGroup Admin
 *
 * @apiSuccess {String} Message of success.
 */
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
        console.log(err);
        return next(customErrors.errorServer);
    });
}

/**
 * @api {post} /api/createUser Function to register a new user.
 * @apiName createUser
 * @apiGroup Admin
 *
 * @apiParam {String} name The name of the new user.
 * @apiParam {String} firstName The first name of the new user.
 * @apiParam {String} type The type of the new user (ADMIN, GUEST, STUDENT, TEACHER).
 *
 */
function createUser(req, res, next) {

    let name = req.body.name;
    let firstName = req.body.firstName;
    let type = req.body.type;

    if (firstName == undefined || firstName.length == 0 || name == undefined || name.length == 0 || type == undefined || type.length == 0) {
        return next(customErrors.errorMissingParameters);
    }
    type = type.toUpperCase();
    if(type != 'ADMIN' || type != 'GUEST' || type != 'STUDENT' || type != 'TEACHER'){
        return next(customErrors.errorSynthaxRequest);
    }

    let login = firstName.charAt(0) + name.substring(0, 6);

    let email = ( req.body.email == undefined || req.body.email.length == 0 ) ? "" : req.body.email;
    console.log(email);
    let params = [name, firstName, type, login, email];

    db.one("INSERT INTO TFE.users(name,first_name,user_type,login,email) VALUES($1,$2,$3,$4,$5) RETURNING id_user", params)
        .then(function (user) {
            db.one("SELECT id_profile FROM TFE.profiles WHERE name = $1", "GUEST")
                .then(function (profil) {
                    req.body.id_profil = parseInt(profil.id_profile);
                    req.body.studentIds = [parseInt(user.id_user)];
                    useUserProfilOnStudents(req, res, next);
                    return null;
                });
        })
        .catch(function (err) {
            console.log(err);
            return next(customErrors.errorServer);
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
    createUser: createUser,
    allUserLoginsInfo: allUserLoginsInfo
};
