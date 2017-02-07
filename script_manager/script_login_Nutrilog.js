let json2csv = require('json2csv');
let fs = require('fs');
let db = require("../database/api.js");

module.exports.handleRequest = function (data, callback) {

    try {
        // à modifier quand je saurais
        let fields = ['matricule', 'user_name', 'first_name','password'];
        let name = "scriptNutrilog.csv";
        let filePath = __dirname + "/files/" + name;

        let csv = json2csv({data: data, fields: fields});

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