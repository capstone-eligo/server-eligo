var express = require('express')
var app = express()
var http = require('http')
var https = require('https')
var json = require('./secrets.json');
var firebase = require('firebase');

var config = {
	apiKey: "AIzaSyDa7CpASbxArYtrSARNkJy36FmuHdm7GpU",
	databaseURL: "https://eligo-ca1b0.firebaseio.com",
};
firebase.initializeApp(config);

var user = JSON.parse('{ "0" : ["peanut"],' +
  '"1" : ["soy"]}');

var userAndRestriction = '';

function getDrtiInfo(callback) {
	var drtiRef = firebase.database().ref("/drti");
	drtiRef.on('value', function(snapshot) {
		callback(snapshot.child("restrictions"));
	});
};

function compareRestrictions(str, callback) {
	var ingredients = JSON.parse(str).nf_ingredient_statement;
	var ingArray = ingredients.split(', ');	
	getDrtiInfo(function(object) {
		for(var x = 0; x <= Object.keys(user).length-1; x++) {
			for (var dr in user[x.toString()]) {
				var drIngredients = object.child(user[x.toString()][dr]).val();
				for (var i in ingArray) {
					for (var i2 in drIngredients) {
						var regex = new RegExp(drIngredients[i2], 'ig');
						if (regex.test(ingArray[i])) {
							userAndRestriction = userAndRestriction.concat("***", x, ":", user[x.toString()], ":", drIngredients[i2], ":", ingArray[i]);
						};
					};
				};
			};
		};
		callback(userAndRestriction);
	});
}

app.get('/upc/:upcCode', function(req, res) {
	//details of api call with upc code
	// var options = {
	//   host: "api.nutritionix.com",
	//   path: '/v1_1/item?upc='+req.params.upcCode+'&appId='+json.nutritionix.users.alex.id+'&appKey='+json.nutritionix.users.alex.key,
	//   method: 'GET',
	// };

	//GET request to personally hosted json file for cocktail peanuts, regardless of upc sent. 
	var options = {
	  host: "students.washington.edu",
	  path: '/adtroupe/capstone/example.json',
	  method: 'GET',
	};

	callback = function(response) {
		var str = '';

		//receives data and appends to str
		response.on('data', function (chunk) {
			str += chunk;
		});

		//on end of api call, json sent
		response.on('end', function () {
			//Compares restrictions to ingredients
			compareRestrictions(str, function(results) {
				str["Restrictions"].push(results);
				res.send(str);
				console.log(str);
			});

			//Gets only api returned string
			//res.send(str);
		});
	};
	https.request(options, callback).end();
});


//for testing, call >node index.js to create server. then call localserver:3000/upc/[upcCode]
var server = app.listen(process.env.PORT || 8080, function () {
	var port = server.address().port;
	console.log('Example app listening on port ', port)
})
