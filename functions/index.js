const functions = require('firebase-functions');
const admin = require('firebase-admin');
const request = require('request');
const crypto = require('crypto');
const storage = require('@google-cloud/storage');

admin.initializeApp(functions.config().firebase);

// Firebase Project ID and Service Account Key.
const gcs = storage({
  projectId: 'snapshelf-aabb55',
  keyFilename: './serviceAccountKey.json'
});

const bucket = gcs.bucket('snapshelf-aabb55.appspot.com');

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

  // Option 2:
  // The image (or any file) download link
  console.log(event.mediaLink);
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
  			console.log('Image successfully uploaded to Firebase Storage!');

        // Configure image access
        const config = {
          action: 'read',
          expires: '05-03-2027'
        };

        // Option 1:
        // Get download url for stored image
        bucket.file(`sample/images/${randomFileName}`)
          .getSignedUrl(config, (error, url) => {
            if (error) {
              return console.error(error);
            }

            // Do something with your URL
            // (Like save it to Firebase)

            console.log(`Your image Firebase Storage URL is: ${url}`);
          });
  		});
	});
};
