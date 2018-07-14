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
    let parameters = req.body.queryResult.parameters;

    // only proceed if parameters are sent (shouldn't really happen)
    if (isEmptyObject(parameters)) {
        return res.json({
            fulfillmentText: 'Something went wrong! Parameters object is empty!',
            source: 'wikilookup'
        });
    }

    // we can split logic based on e.g. parameters if we want
    // in our case we have a parameter "painter" that we might want to look up in a specific way
    if (parameters.painter) {

        let wikiReqUrl = encodeURI(`${wikiReqPath}${parameters.painter}`);

        https.get(wikiReqUrl, (responseFromAPI) => {

            let completeResponse = '';

            responseFromAPI.on('data', (chunk) => {
                completeResponse += chunk;
            });
            responseFromAPI.on('end', () => {

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
