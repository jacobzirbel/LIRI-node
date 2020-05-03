require("dotenv").config();
const keys = require("./keys.js");
const fs = require("fs");
const inquirer = require("inquirer");
const axios = require("axios");
const moment = require("moment");
const Spotify = require("node-spotify-api");
const spotify = new Spotify({
	id: keys.spotify.id,
	secret: keys.spotify.secret,
});
const separator = "------------";

inquirer
	.prompt([
		{
			name: "task",
			message: "What would you like to do?",
			type: "list",
			choices: [
				{ name: "concert-this", value: 1 },
				{ name: "spotify-this", value: 2 },
				{ name: "movie-this", value: 3 },
				{ name: "commands from text file", value: 4 },
			],
		},
		{
			name: "query",
			message: "About what would you like those details?",
			when: (answers) => answers.task !== 4,
		},
	])
	.then((response) => {
		if (response.task === 4) {
			// txt file commands
		} else {
			switch (response.task) {
				case 1:
					axiosGetEvents(response.query);
					break;
				case 2:
					spotifySearch(response.query);
					break;
				case 3:
					axiosSearchMovie(response.query);
					break;
			}
		}
	});

function axiosGetEvents(artist) {
	let url = `https://rest.bandsintown.com/artists/${artist}/events?app_id=${keys.bandsInTown.secret}`;
	axios.get(url).then(eventCallback).catch(errorFn);
	function eventCallback(response) {
		response.data.forEach((e) => showEvent(e));
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

function errorFn(err) {
	console.log("error");
}
