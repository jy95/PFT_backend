let json2csv = require('json2csv');
let fs = require('fs');
let generatePassword = require('password-generator');

module.exports.handleRequest = function (data, callback) {

    try {
        // à modifier quand je saurais
        let fields = ['idEtudiant', 'NomEtudiant', 'PrenomEtudiant','motDePasse'];
        let name = "scriptNutrilog.csv";
        let filePath = __dirname + "/files/" + name;

        let newresult = data;
        for(let i=0;i<data.length;i++)
        {
            newresult[i]['password'] = generatePassword();
        }

        let csv = json2csv({data: newresult, fields: fields});

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