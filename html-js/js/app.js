/**
 * Demo application
 */

var app, text, dialogue, response, start, stop;
var SERVER_PROTO, SERVER_DOMAIN, SERVER_PORT, ACCESS_TOKEN, SERVER_VERSION, TTS_DOMAIN;

SERVER_PROTO = 'wss';
SERVER_DOMAIN = 'api-ws.api.ai';
TTS_DOMAIN = 'api.api.ai';
SERVER_PORT = '4435';
ACCESS_TOKEN = 'bf7dbeaf1bb7402883da546ec1fd5f39';
SERVER_VERSION = '20150910';

window.onload = function () {
    text = $('text');
    dialogue = $('dialogue');
    response = $('response');
    start = $('start');
    stop = $('stop');
    $('server').innerHTML = SERVER_DOMAIN;
    $('token').innerHTML = ACCESS_TOKEN;

    app = new App();
};

function App() {
    var apiAi, apiAiTts;
    var isListening = false;
    var sessionId = ApiAi.generateRandomId();

    this.start = function () {
        start.className += ' hidden';
        stop.className = stop.className.replace('hidden', '');

        _start();
    };
    this.stop = function () {
        _stop();

        stop.className += ' hidden';
        start.className = start.className.replace('hidden', '');
    };

    this.sendJson = function () {
        var query = text.value,
            queryJson = {
                "v": SERVER_VERSION,
                "query": query,
                "timezone": "GMT+6",
                "lang": "en",
                //"contexts" : ["weather", "local"],
                "sessionId": sessionId
            };

        console.log('sendJson', queryJson);

        apiAi.sendJson(queryJson);
    };

    this.open = function () {
        console.log('open');
        apiAi.open();
    };

    this.close = function () {
        console.log('close');
        apiAi.close();
    };

    this.clean = function () {
        dialogue.innerHTML = '';
    };

    _init();


    function _init() {
        console.log('init');

        /**
         * You can use configuration object to set properties and handlers.
         */
        var config = {
            server: SERVER_PROTO + '://' + SERVER_DOMAIN + ':' + SERVER_PORT + '/api/ws/query',
            serverVersion: SERVER_VERSION,
            token: ACCESS_TOKEN,// Use Client access token there (see agent keys).
            sessionId: sessionId,
            lang: 'en',
            onInit: function () {
                console.log("> ON INIT use config");
            }
        };
        apiAi = new ApiAi(config);

        /**
         * Also you can set properties and handlers directly.
         */
        apiAi.sessionId = '1234';

        apiAi.onInit = function () {
            console.log("> ON INIT use direct assignment property");
            apiAi.open();
        };

        apiAi.onStartListening = function () {
            console.log("> ON START LISTENING");
        };

        apiAi.onStopListening = function () {
            console.log("> ON STOP LISTENING");
        };

        apiAi.onOpen = function () {
            console.log("> ON OPEN SESSION");

            /**
             * You can send json through websocet.
             * For example to initialise dialog if you have appropriate intent.
             */
            apiAi.sendJson({
                "v": "20150512",
                "query": "hello",
                "timezone": "GMT+6",
                "lang": "en",
                //"contexts" : ["weather", "local"],
                "sessionId": sessionId
            });

        };

        apiAi.onClose = function () {
            console.log("> ON CLOSE");
            apiAi.close();
        };

        /**
         * Reuslt handler
         */
        apiAi.onResults = function (data) {
            console.log("> ON RESULT", data);

            var status = data.status,
                code,
                speech;

            if (!(status && (code = status.code) && isFinite(parseFloat(code)) && code < 300 && code > 199)) {
                //dialogue.innerHTML = JSON.stringify(status);
                return;
            }

            speech = (data.result.fulfillment) ? data.result.fulfillment.speech : data.result.speech;
            // Use Text To Speech service to play text.
            apiAiTts.tts(speech, undefined, 'en-US');

            if(speech == "") {
                dialogue.innerHTML += ('user : ' + data.result.resolvedQuery + '\n');
            } else {
                dialogue.innerHTML += ('user : ' + data.result.resolvedQuery + '\napi  : ' + speech + '\n\n');
            }

            response.innerHTML = JSON.stringify(data, null, 2);
            text.innerHTML = '';// clean input






            // Where is the nearest post office?
            if(data.result.metadata.intentName == "post_office.location") {
                // Confirm Action Ready
                if(data.result.action == "post_office.location" && data.result.actionIncomplete == false) {
                    // Grab Input
                    var uspsLocation = data.result.parameters.address;
                    action_post_office_location(uspsLocation);
                }
            }

            // Check this address
            if(data.result.metadata.intentName == "address.check") {
                // Confirm Action Ready
                if(data.result.action == "address.check " && data.result.actionIncomplete == false) {
                    // Grab Input
                    var uspsLocation = data.result.parameters.address;
                    action_address_check(uspsLocation);
                }
            }






        };

        apiAi.onError = function (code, data) {
            apiAi.close();
            console.log("> ON ERROR", code, data);
            //if (data && data.indexOf('No live audio input in this browser') >= 0) {}
        };

        apiAi.onEvent = function (code, data) {
            console.log("> ON EVENT", code, data);
        };

        /**
         * You have to invoke init() method explicitly to decide when ask permission to use microphone.
         */
        apiAi.init();

        /**
         * Initialise Text To Speech service for playing text.
         */
        apiAiTts = new TTS(TTS_DOMAIN, ACCESS_TOKEN, undefined, 'en-US');

    }

    function _start() {
        console.log('start');

        isListening = true;
        apiAi.startListening();
    }

    function _stop() {
        console.log('stop');

        apiAi.stopListening();
        isListening = false;
    }



    function action_post_office_location(_address) {
        // Grab Input
        var uspsLocation = _address;

        // Clean location input
        var latitude = 0;
        var longitude = 0;
        if(uspsLocation == "here") {
            // Geolocate current location
            latitude = 40.7057809;
            longitude = -74.0139724;

            // Send PO Locator Request
            jQuery.ajax({
                url: "http://production.shippingapis.com/ShippingAPI.dll",
                type: "GET",
                data: {
                    "API": "POLocatorV2",
                    "XML": "<?xml version=\"1.0\"?><POLocatorV2Request USERID=\"496TEAMP2106\"><ResponseDetail /><Latitude>" + latitude + "</Latitude><Longitude>" + longitude + "</Longitude><Radius>30</Radius><MaxLocations>1</MaxLocations><Filters><FacilityType>PO</FacilityType> </Filters></POLocatorV2Request>",
                },
            })
            .done(function(data, textStatus, jqXHR) {
                console.log("HTTP Request Succeeded: " + jqXHR.status);
                console.log(data);
                var xml = jQuery(data);

                console.log("Nearest Name: " + xml.find("LocationName").text());
                console.log("Nearest Address: " + xml.find("Address2").text());
                console.log("Nearest City: " + xml.find("City").text());
                console.log("Nearest Distance: " + xml.find("Distance").text());

                var resultName = xml.find("LocationName").text();
                var resultAddress = xml.find("Address2").text();
                var resultCity = xml.find("City").text();
                var resultDistance = xml.find("Distance").text();

                resultDistance = Math.round(resultDistance * 100) / 100;
                if(resultDistance == 1.00) {
                    resultDistance = resultDistance + " mile";
                } else {
                    resultDistance = resultDistance + " miles";
                }

                var resultSpeech = "The nearest location is the " + resultName + " Post Office. It is " + resultDistance + " away at " + resultAddress + ", " + resultCity;
                dialogue.innerHTML += ('api  : ' + resultSpeech + '\n\n');
                apiAiTts.tts(resultSpeech, undefined, 'en-US');
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log("HTTP Request Failed");
            });
        } else {
            // Convert address to GPS
            // Send PO Locator Request
            jQuery.ajax({
                url: "https://maps.googleapis.com/maps/api/geocode/xml",
                type: "GET",
                data: {
                    "address": _address,
                    "key": "AIzaSyDlDKiQ8fNEIjjTWCLS1eZgT0sIiBxbrEA",
                },
            })
            .done(function(data, textStatus, jqXHR) {
                console.log("HTTP Request Succeeded: " + jqXHR.status);
                console.log(data);
                var xml = jQuery(data);

                console.log("lat: " + xml.find("lat").first().text());
                console.log("lng: " + xml.find("lng").first().text());

                latitude = xml.find("lat").first().text();
                longitude = xml.find("lng").first().text();

                // Send PO Locator Request
                jQuery.ajax({
                    url: "http://production.shippingapis.com/ShippingAPI.dll",
                    type: "GET",
                    data: {
                        "API": "POLocatorV2",
                        "XML": "<?xml version=\"1.0\"?><POLocatorV2Request USERID=\"496TEAMP2106\"><ResponseDetail /><Latitude>" + latitude + "</Latitude><Longitude>" + longitude + "</Longitude><Radius>30</Radius><MaxLocations>1</MaxLocations><Filters><FacilityType>PO</FacilityType> </Filters></POLocatorV2Request>",
                    },
                })
                .done(function(data, textStatus, jqXHR) {
                    console.log("HTTP Request Succeeded: " + jqXHR.status);
                    console.log(data);
                    var xml = jQuery(data);

                    console.log("Nearest Name: " + xml.find("LocationName").text());
                    console.log("Nearest Address: " + xml.find("Address2").text());
                    console.log("Nearest City: " + xml.find("City").text());
                    console.log("Nearest Distance: " + xml.find("Distance").text());

                    var resultName = xml.find("LocationName").text();
                    var resultAddress = xml.find("Address2").text();
                    var resultCity = xml.find("City").text();
                    var resultDistance = xml.find("Distance").text();

                    resultDistance = Math.round(resultDistance * 100) / 100;
                    if(resultDistance == 1.00) {
                        resultDistance = resultDistance + " mile";
                    } else {
                        resultDistance = resultDistance + " miles";
                    }

                    var resultSpeech = "The nearest location is the " + resultName + " Post Office. It is " + resultDistance + " away at " + resultAddress + ", " + resultCity;
                    dialogue.innerHTML += ('api  : ' + resultSpeech + '\n\n');
                    apiAiTts.tts(resultSpeech, undefined, 'en-US');
                })
                .fail(function(jqXHR, textStatus, errorThrown) {
                    console.log("HTTP Request Failed");
                });
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log("HTTP Request Failed");
            });
        }

        
    }

    function action_address_check(_address) {
        // Grab Input
        var uspsLocation = _address;

        // Clean location input
        if(uspsLocation == "here") {

        }

        // Send Request
        jQuery.ajax({
            url: "http://production.shippingapis.com/ShippingAPI.dll",
            type: "GET",
            data: {
                "API": "POLocatorV2",
                "XML": "<?xml version=\"1.0\"?><POLocatorV2Request USERID=\"496TEAMP2106\">    <ResponseDetail />   <Latitude>40.749749</Latitude>  <Longitude>-73.9755952</Longitude>   <Radius>30</Radius> <MaxLocations>1</MaxLocations>  <Filters>       <FacilityType>PO</FacilityType> </Filters></POLocatorV2Request>",
            },
        })
        .done(function(data, textStatus, jqXHR) {
            console.log("HTTP Request Succeeded: " + jqXHR.status);
            console.log(data);
            var xml = jQuery(data);

            console.log("Nearest Name: " + xml.find("LocationName").text());
            console.log("Nearest Address: " + xml.find("Address2").text());
            console.log("Nearest City: " + xml.find("City").text());
            console.log("Nearest Distance: " + xml.find("Distance").text());

            var resultName = xml.find("LocationName").text();
            var resultAddress = xml.find("Address2").text();
            var resultCity = xml.find("City").text();
            var resultDistance = xml.find("Distance").text();

            resultDistance = Math.round(resultDistance * 100) / 100;
            if(resultDistance == 1.00) {
                resultDistance = resultDistance + " mile";
            } else {
                resultDistance = resultDistance + " miles";
            }

            var resultSpeech = "The nearest location is the " + resultName + " Post Office. It is " + resultDistance + " away at " + resultAddress + ", " + resultCity;
            dialogue.innerHTML += ('api  : ' + resultSpeech + '\n\n');
            apiAiTts.tts(resultSpeech, undefined, 'en-US');
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            console.log("HTTP Request Failed");
        });
    }






}


function $(id) {
    return document.getElementById(id);
}
