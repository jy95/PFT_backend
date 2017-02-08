const fonts = {
    Roboto: {
        normal: './fonts/Roboto-Regular.ttf',
        bold: './fonts/Roboto-Medium.ttf',
        italics: './fonts/Roboto-Italic.ttf',
        bolditalics: './fonts/Roboto-Italic.ttf'
    }
};

let PdfPrinter = require('pdfmake/src/printer');
let printer = new PdfPrinter(fonts);
let fs = require('fs');


module.exports.generateFile = function (matricule,data,callback) {

    let fileName = "Logins_" + matricule + ".pdf";
    let filePath = __dirname + "/files/" + fileName;

    let columns = ['userlogin', 'softwarepassword', 'softwarename'];

    try {

        let docDefinition = {
            content: [
                { text: 'Mes Login', style: 'header' },
                table(data, columns)
            ]
        };
        // NOTE : PAS UTILE ICI
        //let writeStream = fs.createWriteStream(filePath);
        let pdfDoc = printer.createPdfKitDocument(docDefinition);
        callback(null,pdfDoc);
    } catch (err){
        console.log(err);
        callback(err);
    }
};

function buildTableBody(data, columns) {
    let body = [];

    body.push(columns);

    data.forEach(function(row) {
        let dataRow = [];

        columns.forEach(function(column) {
            dataRow.push(row[column]);
        });

        body.push(dataRow);
    });

    return body;
}

function table(data, columns) {
    return {
        table: {
            headerRows: 1,
            widths: [ '*', '*', '*', '*', '*' ],
            body: buildTableBody(data, columns)
        }
    };
}