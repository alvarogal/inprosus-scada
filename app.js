var http = require('http');
var express = require('express')
var fs = require('fs')
const path = require('path');
const csv = require('@fast-csv/parse');
//var parse = require('@fast-csv/parse')
var app = express();
app.use(express.urlencoded())

//Establish the server
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

var server = app.listen(port, function() {
	var host = server.address().address
	var port = server.address().port
	console.log("app listening at %s:%s Port", host, port)
});

//Response with the form when he makes a get with browser
app.get('/', function(req, res) {
	fs.readFile('indexPage.html', function(err, data) {
		res.writeHead(200, {
			'Content-Type': 'text/html'
		});
		res.write(data);
		res.end();
	});
});

//Define actions to take when user click submit
app.post('/thank', function(req, res) {
	
	//we take the lines from the user in the bitText
	//the string thant contains the bigger lines are splitted by new line
	lines = req.body.bigText.split('\n');

	//we take the filter substring from filterText input text from form
	filter = req.body.filterText;

	//write the response taking the lines that have 
	//the substring specified by the user
	//the format is html and we put each line in a <p>
	var reply = '';
	reply = "<body>";
	reply += "<h1>The lines are: </h1>";
	for (var i = 0; i < lines.length; i++) {
		if (lines[i].indexOf(filter) != -1){
			reply += "<p>" + lines[i] + "</p>";
		}
	}
	reply += "</body>"
	res.send(reply);
});

app.get('/datos', function(req, res) {
	fs.readFile('paginaPost.html', function(err, data) {
		res.writeHead(200, {
			'Content-Type': 'text/html'
		});	
		res.write(data);
		res.end();
	});
});

app.post('/posted', function(req, res) {
	var tiempo = new Date();

	//we take the filter substring from filterText input text from form
	dato = req.body.varDato;
	
	//convertimos al tiempo colombiano manteniendo la referencia UTC
	tiempo.setTime(tiempo.getTime() - tiempo.getTimezoneOffset()*60*1000)
	fs.writeFile("assets/datos.csv", '\n' + dato + ';' + tiempo.getTime(), { flag: "a" }, ()=>{
		console.log("Este es el dato: " + dato)
	});

	//write the response taking the lines that have 
	//the substring specified by the user
	//the format is html and we put each line in a <p>
	var reply = '';
	reply = "<body>";
	reply += "<p>OK</p>";
	reply += "</body>"
	res.send(reply);
});

app.get('/grafica', function(req, res) {
	var csvData = [];
	var chartData = [];

	fs.createReadStream(path.resolve(__dirname, 'assets', 'datos.csv'))
    .pipe(csv.parse({ delimiter: ';' }))
    .on('error', error => console.error(error))
    .on('data', row => {
    	csvData.push(row)
    	console.log(row)
    })
    .on('end', rowCount => {
    	console.log(`Parsed ${rowCount} rows`)
    	var tiempoF = new Date();
    	var tiempoI = new Date();
    	var count = csvData.length-1;
    	
    	tiempoF.setTime(csvData[count][1]);
    	do{	
    		tiempoI.setTime(csvData[count][1]);
    		chartData.unshift('{x: ' + tiempoI.getUTCMinutes() + ", y: " + csvData[count][0] + '}');
    		count = count - 1;

    		
    	}while((tiempoF.getHours() - tiempoI.getHours() < 4 ) && count > 0);
    });


    //tiempo.setTime(time)
    //var fecha = tiempo.toUTCString();

	fs.readFile('graficaPage.html', "utf-8", function(err, data) {
		res.writeHead(200, {
			'Content-Type': 'text/html'
		});	
        //var result = data.replace('{chartData}', JSON.stringify(chartData));
        var result = data.replace('{chartData}', '['+chartData+']');
		res.write(result);
		res.end();
	});
});