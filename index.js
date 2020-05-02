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
	let url;
	url = `https://rest.bandsintown.com/artists/${artist}/events?app_id=${keys.bandsInTown.secret}`;
	console.log(url);
	axios
		.get(url)
		.then((response) => response.data.forEach((e) => showEvent(e)))
		.catch((error) => console.log("error"));
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
