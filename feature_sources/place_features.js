var fs = require('fs');
var S2 = require('s2-geometry').S2;

(function (exports) {
    var module = exports.module = {};
    var gymGroups = fileToJson(__dirname + '/../json/gym_groups.json').places;
    var pokestopGroups = fileToJson(__dirname + '/../json/pokestop_groups.json').places;

    /**
     * Get the feature value for the specified key by using the data of the pokeEntry,
     * which represents the JSON object which is returned from the API for a Pokemon sighting.
     * @param keys array of keys which refer to the name of features. The keys are read out from the feature_config.json
     * @param pokeEntry the JSON object which is received from the API for a Pokemon sighting
     * @returns the values for the specified features by considering the given data.
     */
    module.getFeatures = function (keys, pokeEntry) {
        var cellKey = S2.latLngToKey(pokeEntry.latitude, pokeEntry.longitude, 17);
        var parts = cellKey.split('/');
        var face = parseInt(parts[0]);
        var position = parts[1];
        var gymDistanceInKM = distanceToCell(pokeEntry.latitude, pokeEntry.longitude, face, position, gymGroups);
        var pokestopDistanceInKM = distanceToCell(pokeEntry.latitude, pokeEntry.longitude, face, position, pokestopGroups);
        var values = {};

        keys.forEach(function (key) {
            if (key === 'gymDistanceKm') {
                values[key] = gymDistanceInKM;
            }
            else if (key === 'gymIn100m') {
                values[key] = gymDistanceInKM <= 0.1;
            }
            else if (key === 'gymIn250m') {
                values[key] = gymDistanceInKM <= 0.25;
            }
            else if (key === 'gymIn500m') {
                values[key] = gymDistanceInKM <= 0.5;
            }
            else if (key === 'gymIn1000m') {
                values[key] = gymDistanceInKM <= 1.0;
            }
            else if (key === 'gymIn2500m') {
                values[key] = gymDistanceInKM <= 2.5;
            }
            else if (key === 'gymIn5000m') {
                values[key] = gymDistanceInKM <= 5.0;
            }
            else if (key === 'pokestopDistanceKm') {
                values[key] = pokestopDistanceInKM;
            }
            else if (key === 'pokestopIn100m') {
                values[key] = pokestopDistanceInKM <= 0.1;
            }
            else if (key === 'pokestopIn250m') {
                values[key] = pokestopDistanceInKM <= 0.25;
            }
            else if (key === 'pokestopIn500m') {
                values[key] = pokestopDistanceInKM <= 0.5;
            }
            else if (key === 'pokestopIn1000m') {
                values[key] = pokestopDistanceInKM <= 1.0;
            }
            else if (key === 'pokestopIn2500m') {
                values[key] = pokestopDistanceInKM <= 2.5;
            }
            else if (key === 'pokestopIn5000m') {
                values[key] = pokestopDistanceInKM <= 5.0;
            }
            else {
                console.log("The key " + key + " is not handled by the place feature source.");
                throw "UnknownFeatureKey";
            }
        });

        return values;
    };

    module.getNominalValues = function (key) {
        if (key.startsWith('gymIn') || key.startsWith('pokestopIn')) {
            return [true, false];
        }
        else {
            console.log("The key " + key + " does not provide nominal values.");
            throw "UnknownNominalKey";
        }
    };

    function distanceToCell(lat, lon, face, position, faces) {
        if (!faces.hasOwnProperty(face)) {
            return 999999;
        }

        var placeArray = findPlaces(position, faces[face], face, '');
        return getDistanceToPlace(lat, lon, placeArray);
    }

    function findPlaces(testKeyPositions, cellGroup, face, cellParentPosition) {
        if (cellGroup.constructor === Array) {
            return cellGroup;
        }

        for (var gymKeyPosition in cellGroup) {
            if (testKeyPositions.lastIndexOf(gymKeyPosition, 0) === 0) {
                return findPlaces(testKeyPositions, cellGroup[gymKeyPosition], face, gymKeyPosition);
            }
        }

        // fall back - if no sub cell was found, assume gym at parent cell's center
        var latLon = S2.keyToLatLng(face + '/' + cellParentPosition);
        return [{"latitude": latLon.lat, "longitude": latLon.lng}];
    }

    function getDistanceToPlace(lat, lon, placeArray) {
        var distances = placeArray.map(function (place) {
            return latLonDistanceInKm(place.latitude, place.longitude, lat, lon);
        });
        return Math.min(distances);
    }

    // from http://stackoverflow.com/a/27943
    function latLonDistanceInKm(lat1, lon1, lat2, lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1);  // deg2rad below
        var dLon = deg2rad(lon2 - lon1);
        var a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d;
    }

    function deg2rad(deg) {
        return deg * (Math.PI / 180)
    }

    function fileToJson(file) {
        var data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    }
})('undefined' !== typeof module ? module.exports : window);