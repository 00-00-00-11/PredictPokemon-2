var fs = require('fs');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var url = 'http://pokedata.c4e3f8c7.svc.dockerapp.io:65014/api/pokemon/sighting/';

var destination = 'json/apiData.json';


httpGetAsync(url, destination, 'pokemonID');

function httpGetAsync(url, destination, classKey) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var apiData = JSON.parse(xmlHttp.responseText);
            fs.writeFileSync(destination, apiData, 'utf8');
        }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
    return xmlHttp.responseText;
}
