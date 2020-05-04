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
ask();
function ask() {
	inquirer
		.prompt([
			{
				name: "task",
				message: "What would you like to do?",
				type: "list",
				choices: [
					{ name: "concert-this", value: 0 },
					{ name: "spotify-this", value: 1 },
					{ name: "movie-this", value: 2 },
					{ name: "commands from text file", value: 3 },
					{ name: "quit", value: 4 },
				],
			},
			{
				name: "query",
				message: "About what?",
				when: (answers) => answers.task < 3,
			},
		])
		.then(async (response) => {
			if (response.task === 3) {
				txtCommands();
			} else if (response.task === 4) {
				return;
			} else {
				if (!response.query) {
					console.log(highlight("You need to search something!"));
					return ask();
				}
				let task = ["concert-this", "spotify-this", "movie-this"][
					response.task
				];
				addCommandToLog(task + " " + response.query);
				let res;
				switch (response.task) {
					case 0:
						res = await axiosGetEvents(response.query);
						console.log(res || highlight("Nothing to show!"));
						ask();
						break;
					case 1:
						res = await spotifySearch(response.query);
						console.log(res || highlight("Nothing to show!"));
						ask();
						break;
					case 2:
						res = await axiosSearchMovie(response.query);
						console.log(res || highlight("Nothing to show!"));
						ask();
						break;
					case 4:
						break;
				}
			}
		});
}
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
		values.forEach((e, i) => {
			command = input.commands[i];
			addCommandToLog(command);
			outputData += "\n" + command + e;
		});
		if (input.nonsense) {
			outputData += `\n\n ${separator}I did not understand the following commands: ${input.nonsense.join(
				"\n"
			)}`;
		}
		writeOutput(outputData, input.outputFile);
		ask();
	});
}
function writeOutput(outputData, outputFile) {
	fs.writeFileSync(`${outputFile}`, outputData);
	console.log(highlight("Check Output Folder!"));
}
function extractInput() {
	let input = fs.readFileSync("input.txt", "utf8");
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
				output =
					line
						.slice(line.indexOf(":") + 1)
						.replace(".txt", "")
						.trim() + ".txt";
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
	let info = highlight(
		`Venue: ${event.venue.name}\nLocation: ${
			event.venue.location
		}\nDate of Event: ${moment(event.datetime).format("MM/DD/YYYY")}`
	);
	return info;
}

async function spotifySearch(query, callback) {
	return new Promise((resolve, reject) => {
		spotify.search({ type: "track", query: query, limit: 2 }, (err, data) => {
			if (err) errorFn();
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
	console.log(highlight("Nothing to show!"));
}

function addCommandToLog(command) {
	fs.appendFile(
		"log.txt",
		`${moment(new Date()).format("DD/MM/YYYY hh:mm:ss")}: ${command}\n`,
		(err) => {
			if (err) console.log("error");
		}
	);
}

function highlight(string) {
	return separator + string + separator;
}
