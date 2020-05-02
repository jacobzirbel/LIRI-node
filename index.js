require("dotenv").config();
const keys = require("./keys.js");
const fs = require("fs");
const axios = require("axios");
const moment = require("moment");
const Spotify = require("node-spotify-api");
const spotify = new Spotify({
	id: keys.spotify.id,
	secret: keys.spotify.secret,
});
const separator = "------------";

function axiosGetEvents(artist) {
	let url = `https://rest.bandsintown.com/artists/${artist}/events?app_id=${keys.bandsInTown.secret}`;
	console.log(url);
	axios.get(url).then(eventCallback).catch(errorFn);
	function eventCallback(response) {
		(response) => response.data.forEach((e) => showEvent(e));
	}
}

function showEvent(event) {
	let result = `Venue: ${event.venue.name}\nLocation: ${
		event.venue.location
	}\nDate of Event: ${moment(event.datetime)}\n`;
	console.log(result);
	console.log(separator);
}

function spotifySearch(query) {
	spotify.search({ type: "track", query: query, limit: 2 }, (err, data) => {
		if (err) return console.log("error");
		showSong(data.tracks.items[0]);
	});
}

function showSong(song) {
	let result = `Artists: ${JSON.stringify(song.artists[0].name)}\nSong Name: ${
		song.name
	}\nSpotify URL: ${song.external_urls.spotify}\nAlbum: ${song.album.name}`;
	console.log(result);
}
function axiosSearchMovie(query) {
	let url = `http://www.omdbapi.com/?t=${query}&y=&plot=short&apikey=${keys.ombd.secret}`;
	axios.get(url).then(movieCallback).catch(errorFn);
	function movieCallback(response) {
		console.log(
			`Title: ${response.data.Title}\nYear: ${response.data.Year}\nIMDB Rating: ${response.data.imdbRating}\nCountry: ${response.data.Country}\nLanguage: ${response.data.Language}\nPlot: ${response.data.Plot}\nActors: ${response.data.Actors}\n`
		);
	}
}
axiosSearchMovie("mr nobody");
function errorFn(err) {
	console.log("error");
}
