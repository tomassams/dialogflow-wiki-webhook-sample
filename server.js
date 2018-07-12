// init
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
// const http = require('http');
const https = require('https');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

// webhook handler
app.post('/wikilookup', (req, res) => {
  
    /*
      static wiki lookup path - we will append the correct search term later
      this type of lookup requires the title to be a match to the WIKI page we are trying to get an extract from
      we can name our Dialogflow entities the same as the WIKI page to make this easier for us
    */
    const wikiReqPath = 'https://en.wikipedia.org/w/api.php?format=json&formatversion=2&action=query&prop=extracts&exintro=&explaintext=&titles=';
      
    // wiki also has "open search", which could be considered also
    // const wikiOpenSearchPath = 'https://en.wikipedia.org/w/api.php?&format=json&action=opensearch&limit=2&profile=fuzzy&search=global%20warming';

    // get all parameters from the Dialogflow POST request
    const parameters = req.body.queryResult.parameters;

    // only proceed if parameters are sent (shouldn't really happen)
    if (isEmptyObject(parameters)) {
        return res.json({
            fulfillmentText: 'Something went wrong! Parameters object is empty!',
            source: 'wikilookup'
        });
    }

    // we can split logic based on parameters if we want
    // in our case we have two entities, painting and painter
    if (parameters.painting) {

        let wikiReqUrl = encodeURI(`${wikiReqPath}&titles=${parameters.painting}`);

        // do a GET request to the API
        https.get(wikiReqUrl, (responseFromAPI) => {

            let completeResponse = ''; // placeholder

            responseFromAPI.on('data', (chunk) => {
                completeResponse += chunk;
            });
            responseFromAPI.on('end', () => {

                // parse the response and pass the value we want into fulfillmentText which is sent back to Dialogflow
                let searchResults = JSON.parse(completeResponse);

                return res.json({
                    fulfillmentText: searchResults.query.pages[0].extract,
                    source: 'wikilookup'
                });

            });
        }, (error) => {

            return res.json({
                fulfillmentText: 'Something went wrong!',
                source: 'wikilookup-painting-error'
            });

        });

    } else if (parameters.painter) {

        let wikiReqUrl = encodeURI(`${wikiReqPath}${parameters.painter}`);

        // do a GET request to the API
        https.get(wikiReqUrl, (responseFromAPI) => {

            let completeResponse = ''; // placeholder

            responseFromAPI.on('data', (chunk) => {
                completeResponse += chunk;
            });
            responseFromAPI.on('end', () => {

                // parse the response and pass the value we want into fulfillmentText which is sent back to user
                let searchResults = JSON.parse(completeResponse);

                return res.json({
                    fulfillmentText: searchResults.query.pages[0].extract,
                    source: 'wikilookup'
                });

            });
        }, (error) => {

            return res.json({
                fulfillmentText: 'Something went wrong!',
                source: 'wikilookup'
            });

        });
    }

});

// simple check for empty object
function isEmptyObject(obj) {
    return !Object.keys(obj).length;
}

// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
    console.log('Your app is listening on port ' + listener.address().port);
});
