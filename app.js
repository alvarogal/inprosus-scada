var http = require('http');
var express = require('express')
var fs = require('fs')
const path = require('path');
const csv = require('@fast-csv/parse');
const { Client } = require('pg');
const { Pool } = require('pg');
//var parse = require('@fast-csv/parse')

//Conexion a la DB
/*
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
  //ssl: process.env.DATABASE_URL ? true : false
});
client.connect();
*/

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://tngsqrukcqwxtz:d251142aacd2295b822332608c5e8519a56d08e7e4ee89b0e4c12b316ad2e0d8@ec2-23-20-168-40.compute-1.amazonaws.com:5432/d8emk5v8m18fas',
    ssl: process.env.DATABASE_URL ? true : false
})
pool.connect();
//Prueba para ver
/*
client.query('SELECT * FROM datosturbidez;', (err, res) => {
  if (err) throw err;
  for (let row of res.rows) {
    console.log(JSON.stringify(row));
  }
  //client.end();
});
*/

//Establish the server
var app = express();
app.use(express.urlencoded())

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
	dato = parseInt(req.body.valor);
	
	//convertimos al tiempo colombiano manteniendo la referencia UTC
	//tiempo.setTime(tiempo.getTime() - 5*60*60*1000)

	//escribo al CSV
	/*
	fs.writeFile("assets/datos.csv", '\n' + dato + ';' + tiempo.getTime(), { flag: "a" }, ()=>{
		console.log("Este es el dato: " + dato)
	});
	*/

	//escribo a la DB
	//client.connect();
	//client.query('INSERT INTO datosturbidez(valor,tiempo) VALUES ('+
	pool.query('INSERT INTO datosturbidez(valor,tiempo) VALUES ('+
		dato + ',' + tiempo.getTime() +
		');', (err, res) => {
	  if (err) throw err;
	  console.log("Este es el dato: " + dato);
	  //console.log(res);
	  //client.end();
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

function loadChartData() {
	var chartData = []
	pool.query(
		'select * from datosturbidez where tiempo > ((select max(tiempo) from datosturbidez)-4*3600000);', (err, res) => {
			if (err) throw err;
			for (let row of res.rows) {
				//console.log(row);
				chartData.unshift('{t: new Date(' +
					row.tiempo +
					')' +
					",y: " + row.valor + '}');
			}
		});
	return chartData;
}

app.get('/grafica', async function (req, res) {

	//esperamos para leer datos de DB
	let promise = Promise.resolve(loadChartData());
	let chartData = await promise;

	//se envian datos a grafica
	fs.readFile('graficaPage.html', "utf-8", function (err, data) {
		res.writeHead(200, {
			'Content-Type': 'text/html'
		});
		//var result = data.replace('{chartData}', JSON.stringify(chartData));
		var result = data.replace('{chartData}', '[' + chartData + ']');
		res.write(result);
		res.end();
	});
});