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


module.exports.generateFile = function (data,callback) {

    let fileName = "Logins_" + data[0]["userLogin"] + ".pdf";
    let filePath = __dirname + "/files/" + fileName;

    let logins = [ ['userLogin', 'softwarePassword', 'softwareName'] ];
    for (let obj of data) {
        let arr = [];
        for(let x in obj){
            arr.push(obj[x]);
        }
        logins.push(arr);
    }

    let docDefinition = {
        content: [
            {
                table: {
                    // headers are automatically repeated if the table spans over multiple pages
                    // you can declare how many rows should be treated as headers
                    headerRows: 1,
                    widths: [ '*', 'auto', 100, '*' ],

                    body: logins
                }
            }
        ]
    };

    try {

        let chunks = [];
        let result;

        let doc = printer.createPdfKitDocument(docDefinition);
        doc.on('data', function (chunk) {
            chunks.push(chunk);
        });
        doc.on('end', function () {
            result = Buffer.concat(chunks);
            callback(null,'data:application/pdf;base64,' + result.toString('base64'));
        });
        doc.end();
    } catch (err){
        callback(err);
    }
};