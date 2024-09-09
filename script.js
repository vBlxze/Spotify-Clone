console.log("Hello");
document.addEventListener("DOMContentLoaded", main);
let currSong = new Audio();
let songs;
let currSongIndex = 0;
let currFolder;

function secondsToMinutesSeconds(seconds) {
	if (isNaN(seconds) || seconds < 0) {
		return "00:00";
	}

	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);

	const formattedMinutes = String(minutes).padStart(2, "0");
	const formattedSeconds = String(remainingSeconds).padStart(2, "0");

	return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongsFromDirectory(folder) {
	currFolder = folder;
	let a = await fetch(`http://127.0.0.1:5500/${folder}/`);
	let response = await a.text();
	let div = document.createElement("div");
	div.innerHTML = response;

	let as = div.getElementsByTagName("a");
	songs = [];

	for (let index = 0; index < as.length; index++) {
		const element = as[index];
		if (element.href.endsWith(".mp3")) {
			songs.push(element.href.split(`/${folder}/`)[1]);
		}
	}

	let songUL = document.querySelector(".songList ul");
	songUL.innerHTML = "";

	for (const song of songs) {
		let listItem = document.createElement("li");
		listItem.innerHTML = `
            <img class="invert" src="img/music.svg" alt="music-logo">
            <div class="songInfo" data-filename="${song}">
                <div>
                    ${decodeURIComponent(song)
				.replaceAll("_", " ")
				.replaceAll("-", " ")
				.replaceAll(".mp3", "")
				.replaceAll("(128k)", "")
				.replaceAll("(256k)", "")
				.replaceAll("(320 kbps)", "")
				.replaceAll("%2", "")}
                </div>
            </div>
            <div class="playNow">
                <span>Play Now</span>
                <img class="invert" src="img/play.svg" alt="play-button">
            </div>
        `;
		songUL.appendChild(listItem);
	}

	// Attach an event listener to each song present in the library
	Array.from(songUL.getElementsByTagName("li")).forEach((e) => {
		e.addEventListener("click", () => {
			let filename = e
				.querySelector(".songInfo")
				.getAttribute("data-filename");
			playMusic(filename);
		});
	});

	return songs;
}

const playMusic = (track, pause = false) => {
	console.log(track);

	console.log(window.location.pathname);

	let basePath = window.location.pathname.split("/").slice(0, -1).join("/");
	console.log("Base Path:", basePath);

	// Construct the full URL for the audio file
	let audioPath = `${basePath}/${currFolder}/${decodeURIComponent(track)}`;
	console.log("Audio Path:", audioPath);

	// Create the Audio object and play the song
	currSong.src = audioPath;

	if (!pause) {
		currSong.play().catch((error) => {
			console.error("Failed to play audio:", error);
		});

		play.src = "img/pause.svg";
	}

	document.querySelector(".info").innerHTML = decodeURIComponent(track)
		.slice(0, -4)
		.replaceAll("_", " ")
		.replaceAll("-", " ");
	document.querySelector(".songDuration").innerHTML = "00:00 / 00:00";

	currSongIndex = songs.indexOf(track);
};

function removeDuplicateCards() {
	const cards = document.querySelectorAll(".card");
	const seenFolders = new Set();

	cards.forEach(card => {
		const folder = card.getAttribute("data-folder");

		if (seenFolders.has(folder)) {
			card.remove(); // Remove duplicate card
		} else {
			seenFolders.add(folder); // Mark this folder as seen
		}
	});
}

async function displayAlbums() {
	let a = await fetch(`http://127.0.0.1:5500/songs`);
	let response = await a.text();
	let div = document.createElement("div");
	div.innerHTML = response;
	// console.log(div);

	let anchors = div.getElementsByTagName("a");

	cardContainer = document.querySelector(".card_container");

	let arr = Array.from(anchors);

	for (let index = 0; index < arr.length; index++) {
		const e = arr[index];

		if (e.href.includes("/songs/")) {
			let folder = e.href.split("/").slice(-1)[0];
			// Get the metadata of the folder
			let a = await fetch(
				`http://127.0.0.1:5500/songs/${folder}/info.json`
			);
			let response = await a.json();

			let coverImagePath = `songs/${folder}/cover.jpeg`;

			cardContainer.innerHTML +=
				`<div data-folder="${folder}" class="card">
						<div class="play-button">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="60" color="white"
								fill="#18AD4C">
								<circle cx="12" cy="12" r="10" />
								<path
									d="M15.4531 12.3948C15.3016 13.0215 14.5857 13.4644 13.1539 14.3502C11.7697 15.2064 11.0777 15.6346 10.5199 15.4625C10.2893 15.3913 10.0793 15.2562 9.90982 15.07C9.5 14.6198 9.5 13.7465 9.5 12C9.5 10.2535 9.5 9.38018 9.90982 8.92995C10.0793 8.74381 10.2893 8.60868 10.5199 8.53753C11.0777 8.36544 11.7697 8.79357 13.1539 9.64983C14.5857 10.5356 15.3016 10.9785 15.4531 11.6052C15.5156 11.8639 15.5156 12.1361 15.4531 12.3948Z"
									stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="white" />
							</svg>

						</div>
						<img src="${coverImagePath}" alt="cover">
						<h2>${response.title}</h2>
						<p>${response.description}</p>
					</div>`;
		}
	}

	removeDuplicateCards();

	// Load the playlist saved in the particular folder
	// item.target gives us the element that is clicked
	// currentTarget gives us the event that has been listened
	Array.from(document.getElementsByClassName("card")).forEach((e) => {
		e.addEventListener("click", async (item) => {
			songs = await getSongsFromDirectory(
				`songs/${item.currentTarget.dataset.folder}`
			);
		});
	});
}

async function main() {
	// fetching all the songs from the directory
	await getSongsFromDirectory("songs/cs");
	playMusic(songs[0], true);

	// Display all the albums
	await displayAlbums();

	currSong.volume = .02;
	document.querySelector(".range input").value = 2;

	// Load metadata of the first song
	currSong.addEventListener("loadedmetadata", () => {
		document.querySelector(
			".songDuration"
		).innerHTML = `${secondsToMinutesSeconds(
			currSong.currentTime
		)} / ${secondsToMinutesSeconds(currSong.duration)}`;
	});

	// Attach an event listener to play/pause , previous/next song
	play.addEventListener("click", () => {
		if (currSong.paused) {
			currSong.play();
			play.src = "img/pause.svg";
		} else {
			currSong.pause();
			play.src = "img/play.svg";
		}
	});

	// Add event listener to previous, next buttons
	previous.addEventListener("click", () => {
		currSong.pause();
		if (currSongIndex > 0) {
			playMusic(songs[currSongIndex - 1]);
		}
	});

	next.addEventListener("click", () => {
		currSong.pause();
		if (currSongIndex < songs.length) {
			playMusic(songs[currSongIndex + 1]);
		}
	});

	// Add event listener to get the current time and song duration
	currSong.addEventListener("timeupdate", () => {
		// console.log(currSong.currentTime, currSong.duration);
		document.querySelector(
			".songDuration"
		).innerHTML = `${secondsToMinutesSeconds(
			currSong.currentTime
		)}/${secondsToMinutesSeconds(currSong.duration)}`;
		document.querySelector(".circle").style.left =
			(currSong.currentTime / currSong.duration) * 100 + "%";
	});

	// Add an event listener to seekbar to adjust its current time
	document.querySelector(".seekbar").addEventListener("click", (e) => {
		let percent =
			(e.offsetX / e.target.getBoundingClientRect().width) * 100;

		document.querySelector(".circle").style.left = percent + "%";
		currSong.currentTime = (currSong.duration * percent) / 100;
	});

	// Add event Listener to open hamburger
	document.querySelector(".hamburger").addEventListener("click", () => {
		document.querySelector(".left").style.left = "0";
	});

	// Add event Listener to close hamburger
	document.querySelector(".close").addEventListener("click", () => {
		document.querySelector(".left").style.left = "-130%";
	});

	// Add event listener to volume rocker
	document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
		currSong.volume = e.target.value / 100;
	});

	// Add event listener on volume to mute / unmute
	document.querySelector(".volumeRocker > img").addEventListener("click", e => {
		console.log(e.target);

		if (e.target.src.includes("volume.svg")) {
			e.target.src = e.target.src.replace("volume.svg", "mute.svg");
			currSong.muted = true;
			document.querySelector(".range").getElementsByTagName("input")[0].value = 0;

		}
		else {
			e.target.src = e.target.src.replace("mute.svg", "volume.svg");
			currSong.muted = false;
			currSong.volume = .02;
			document.querySelector(".range").getElementsByTagName("input")[0].value = 2;
		}
	})

}

main();
