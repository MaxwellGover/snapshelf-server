const functions = require('firebase-functions');
const admin = require('firebase-admin');
const request = require('request');
const crypto = require('crypto');
const storage = require('@google-cloud/storage');
const bucketName = 'snapshelf-aabb55';

admin.initializeApp(functions.config().firebase);

// Firebase Project ID and Service Account Key.
const gcs = storage({
  projectId: bucketName,
  keyFilename: './serviceAccountKey.json'
});

const bucket = gcs.bucket(`${bucketName}.appspot.com`);

exports.getProcessedImage = functions.https.onRequest((req, res) => {
  if (req.body && req.body.processedImageURL) {

		// Get image from Pixelz and save it to Firebase Storage.
		saveImage(req.body.processedImageURL, req.body.imageTicket);

		return res.status(200).end();
	}

	res.status(400).end();
});

exports.updateProcessedImageUrl = functions.storage.object().onChange(event => {

  // DEBUG
  console.log(event);

  const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/`;
  const mediaName = event.data.name.replace(/\//g, '%2F');
  const accessConfig = `?alt=media&token=${event.data.metadata.firebaseStorageDownloadTokens}`;

  // The image (or any file) download link
  const downloadLink = `${baseUrl}${mediaName}${accessConfig}`;

  console.log(`The download link is: ${downloadLink}`);

  // Do something with your URL
  // (Like save it to Firebase Database)
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
  		.pipe(bucket.file(`sample/images/${randomFileName}`)
        .createWriteStream({
          metadata: {
            contentType: info.headers['content-type']
          }
        })
      ).on('error', (error) => {

        // Do something if the upload fails.
  			console.error(error);
  		}).on('finish', () => {

        // Image successfully downloaded from Pixelz and uploaded to Firebase Storage.
  			console.log('Image successfully uploaded to Firebase Storage!');
  		});
	});
};
