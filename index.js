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
const separator = "\n------------\n";

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
	.then(async (response) => {
		if (response.task === 4) {
			txtCommands();
		} else {
			let res;
			switch (response.task) {
				case 1:
					res = await axiosGetEvents(response.query);
					console.log(res);
					break;
				case 2:
					res = await spotifySearch(response.query);
					console.log(res);
					break;
				case 3:
					res = await axiosSearchMovie(response.query);
					console.log(res);
					break;
			}
		}
	});

async function txtCommands() {
	let input = extractInput();
	let outputData = "";
	promises = [];
	input.commands.forEach((line) => {
		line = line.split(" ");
		let command = line.shift();
		let query = line.join(" ");

		if (command.includes("spotify")) {
			promises.push(spotifySearch(query));
		} else if (command.includes("concert")) {
			promises.push(axiosGetEvents(query));
		} else if (command.includes("movie")) {
			promises.push(axiosSearchMovie(query));
		}
	});
	Promise.all(promises).then((values) => {
		console.log(values);
		values.forEach((e) => {
			console.log(e);
			outputData += e;
		});
		writeOutput(outputData, input.outputFile);
	});
}
function writeOutput(outputData, outputFile) {
	fs.writeFileSync(outputFile, outputData);
}
function extractInput() {
	let input = fs.readFileSync("input.txt", "utf8");
	let outputRE = new RegExp(/\w*OUTPUT\sLOCATION*\w:(.*)\.txt/i);
	let output = "output.txt";
	let commands = [];
	let nonsense = [];
	input.split("\n").forEach((line) => {
		if (!line.includes("#")) {
			if (
				line.includes("spotify") ||
				line.includes("concert") ||
				line.includes("movie")
			) {
				commands.push(line);
			} else if (line.includes("OUTPUT")) {
				output = line.match(outputRE)[1].trim() + ".txt";
			} else {
				nonsense.push(line);
			}
		}
	});
	return { commands: commands, nonsense: nonsense, outputFile: output };
}
function axiosGetEvents(artist) {
	let url = `https://rest.bandsintown.com/artists/${artist}/events?app_id=${keys.bandsInTown.secret}`;
	return new Promise((resolve, reject) => {
		axios
			.get(url)
			.then((response) => resolve(showEvents(response)))
			.catch(errorFn);
	});
}

function showEvents(response) {
	let info = "";
	response.data.forEach((e) => {
		info += showEvent(e);
	});
	return info;
}

function showEvent(event) {
	let info = `${separator}Venue: ${event.venue.name}\nLocation: ${
		event.venue.location
	}\nDate of Event: ${moment(event.datetime)}${separator}`;
	return info;
}

async function spotifySearch(query, callback) {
	return new Promise((resolve, reject) => {
		spotify.search({ type: "track", query: query, limit: 2 }, (err, data) => {
			if (err) reject(err);
			resolve(showSong(data.tracks.items[0]));
		});
	});
}

function showSong(song) {
	let info = `${separator}Artists: ${JSON.stringify(
		song.artists[0].name
	)}\nSong Name: ${song.name}\nSpotify URL: ${
		song.external_urls.spotify
	}\nAlbum: ${song.album.name}${separator}`;
	return info;
}

function axiosSearchMovie(query, callback) {
	let url = `http://www.omdbapi.com/?t=${query}&y=&plot=short&apikey=${keys.ombd.secret}`;

	return new Promise((resolve, reject) => {
		axios
			.get(url)
			.then((response) => resolve(showMovieInfo(response)))
			.catch(errorFn);
	});
}

function showMovieInfo(response) {
	let info = `${separator}Title: ${response.data.Title}\nYear: ${response.data.Year}\nIMDB Rating: ${response.data.imdbRating}\nCountry: ${response.data.Country}\nLanguage: ${response.data.Language}\nPlot: ${response.data.Plot}\nActors: ${response.data.Actors}${separator}`;
	return info;
}
function errorFn(err) {
	console.log("error");
}
