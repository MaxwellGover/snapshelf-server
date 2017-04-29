const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const request = require('request');
const crypto = require('crypto');
const storage = require('@google-cloud/storage');

// Firebase Project ID and Service Account Key.
const gcs = storage({
  projectId: 'snapshelf-aabb55',
  keyFilename: './serviceAccountKey.json'
});

const bucket = gcs.bucket('snapshelf-aabb55.appspot.com');

exports.getProcessedImage = functions.https.onRequest((req, res) => {
	console.log(req.body.processedImageURL);
	console.log(req.body.imageTicket);
	if (req.body && req.body.processedImageURL) {
    	// Get image from Pixelz and save it to Firebase Storage.
    	saveImage(
    		req.body.processedImageURL, 
    		req.body.imageTicket
    	);
    	return res.status(200).end();
  	}
  	res.status(400).end();
});

function saveImage(url, ticketId) {
	// Generate a random HEX string using crypto (a native node module).
	const randomFileName = crypto.randomBytes(16).toString('hex');
	// Fetch image info using a HTTP HEAD request.
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/HEAD
	request.head(url, (error, info) => {
	if (error) {
		return console.error(error);
	}
	// Download image from Pixelz, then save the image to Firebase
	// using the Google Cloud API and the magic of Node Streams.
	// https://googlecloudplatform.github.io/google-cloud-node/#/docs/google-cloud/v0.52.0/storage/file
	// http://stackoverflow.com/questions/28355079/how-do-node-js-streams-work
	request(url)
		.pipe(
			bucket.file(`sample/images/${randomFileName}`)
			.createWriteStream({
  				metadata: {
    				contentType: info.headers['content-type']
  				}
			})
		)
		.on('error', (err) => {
			// Do something if the upload fails.
			console.error(err);
		})
		.on('finish', () => {
			// Do something when everything is done.

			// Get download url for stored image
			console.log('Image successfully uploaded to Firebase Storage!');
		});
	});
	getImageOwner(/* get ticket and downloadURL to use in function */);
};

function getImageOwner (ticketId, downloadURL) {
	// Loop over all tickets in database and find the match
	// Get the image owner
	// Store downloadURL for Firebase to owner/processedImages
}