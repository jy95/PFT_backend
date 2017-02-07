let json2csv = require('json2csv');
let fs = require('fs');
let db = require("../database/api.js");

module.exports.handleRequest = function (data, callback) {

    try {

        let fields = ['user_name', 'first_name','email','password'];
        let fieldNames = ['NomEtudiant', 'PrenomEtudiant','emailEtudiant','motDePasse'];

        let csv = json2csv({data: data, fields: fields , fieldNames: fieldNames});
        let name = "scriptClaroline.csv";
        let filePath = __dirname + "/files/" + name;

        fs.writeFile(filePath, csv, function (err) {
            if (err) {
                callback(err);
            } else {
                callback(null,filePath,name);
            }
        });

    } catch (e) {
        callback(new Error("WRONG SETTINGS"));
    }

};