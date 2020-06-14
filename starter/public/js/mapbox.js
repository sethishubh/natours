//Below-> Disabling ES-Lint for this entire file coz ES-Lint is configured for Node.Js and NOT for JS code
/* eslint-disable */
//Also including this JS file at the bottom in base.pug file

//- Below-> Integrating a MAP that displays all the stops/locations of a specific/certain tour on a specific tour detail page in website
//-Contd.. USING MAPBOX

// this mapbox.js file will be integrated into our specific tour detail page coz we want to display this map having stops/locations of a specific tour on the Tour detail page ONLY
//Contd... And we do above mentioned integration by extending a block in our base template ie in base.pug file
//Contd... So, Creating a new block there (Called 'block head') in base.pug that is then gonna extend from the tour.pug file

//Now We want to get access to the location/stops data of the specific tour that we're currently trying to display ri8 here in this JS file
//..contd and we can do that by doing the Ajax req (ie by a Call to our API for Getting tour.locations data) but we dont do this here
//..contd And so as in tour.pug/tour template we already have all the data about the tour itself (coz we have access to 'tour' variable in entire tour.pug file) and so we can put that tour data into our HTML so that the JS can then read it from there.
//..contd So basically we are gonna expose the location data ri8 here as a string in the HTML and then our JS will then pick it up from there w/o having to do any API call
//..Now go to tour.pug file and see code-> '#map(data-locations=`${JSON.stringify(tour.locations)}`)' and its comments above <- this code there in tour.pug file for more info on below's code ; for dataset.locations code's explanation go to tour.pug file map code same as above
// JSON.parse -> to convert the string into JSON below
// below locations = array of four locations/stops of this specific tour
//const locations = JSON.parse(document.getElementById('map').dataset.locations);
//MOVING JUST ABOVE COMMENTED CODE INTO INDEX.JS FILE located At/In '/public/js/index.js'

//Below (locaions) = array of locations vch will be read in index.js file when we import this below mentioned displayMap f'n there in index.js COZ index.js is more for getting data from the user interface, so from the website, and then delegating some actions into these other modules.
export const displayMap = (locations) => {
  //Mapbox Access token = token that we need in order to actually be able to access MapBox
  //- Below's code is copied from installation steps given on mapbox website
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2V0aGk2Nzc3IiwiYSI6ImNrYWx5dmR6eDB2aXYycm82ZHZ5bWhleWkifQ.eCwAI8Y3vHksXVmsTYvIFw';

  //- Below's code is copied from installation steps given on mapbox website
  var map = new mapboxgl.Map({
    container: 'map', //So, this code will create a map and display it(map) on tour.pug/SpecificTourDetailTemplate page . Coz container here is set to 'map' and this means that it will put the map on an element with the ID (And Not class) of 'map' and so thats y in tour.pug file we have code-> #map(data-.....) -> ie element with ID('#') called 'map'
    style: 'mapbox://styles/sethi6777/ckam19sxn4d741ir1v7dob175',
    scrollZoom: false, //Disabling the scrolling functionality on map
    // center: [-118.113491, 34.111745], // 'location/point we want to center this map at, so every time we open this map, we will find it centered at this location by default '  ; [] -> array of two co-ordinates(lng,lat) ; [-118.113491, 34.111745] -> co-ordinates of los angeles
    // zoom: 10, //Zoom-in level of map , more the no, more the map will be zoomed-in
    // interactive: false, //ie user can not interact with this map on webpage, so this map will look like just an image on ur webpage
    //But we want it(map) to automatically figure out the position of the map based on our tour location/stops points and so we commented center: .. code above
    //contd.. So what we are gonna do now below is basically put all the locations/stops for a certain tour on the map and then allow the map to figure out automatically vch portion of the map it(the map itself) shud display in order to fit all of these points correctly
    // contd.. And the 1st thing we need to do below is to create a bounds variable below
  });

  const bounds = new mapboxgl.LngLatBounds(); //And we got access to the 'mapboxgl' object here coz we included the Mapbox library at the beginning of our page (ie on tour.pug in code-> "script(src= 'https://api.mapb....')"
  // this bounds object above is basically the area that will be displayed on the map and so we will now extend that with all the locations that are in our locations array

  //Below looping through all our locations/stops and add a marker(pin(s) on map) for each of them ; loc-> current element in loop iteration
  locations.forEach((loc) => {
    //Below Creating marker
    const el = document.createElement('div'); //createElement('div') -> creating new element(div here)
    el.className = 'marker'; //and in style.css we have defined a class/style for this marker named '.marker' in style.css and there we have defined our custom pin-image made by us

    //Below Adding the marker
    //Below we actually create a new marker inside of Mapbox
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom', //ie its the bottom of the element(pin here) vch is gonna be located at the exact GPS location
    })
      .setLngLat(loc.coordinates)
      .addTo(map);
    //Above calling -> setLngLat() to make Mapbox know about the GPS co-ordinates of this marker(pin) ; 'coordinates' in loc.coordinates above = array of long,lat in it = coordinates = [lng, lat] And also, in tours.json file-> tour.locations.coordinates = array of [lat, lng] ; map -> map variable created above in var map = ...

    //Below is Code for creating pop-up vch displays info about the location/pin/stop on hovering over pin/location/stop on map
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description} </p>`)
      .addTo(map);
    //loc-> current location/stop in loop iteration and so loc.day = currentLocation.day = locations.day in tours.json file

    //Below Extending the map bounds to include current location/stop
    bounds.extend(loc.coordinates);
  });

  //Below making map to fit the bounds
  //fitBounds() -> f'n that controls/executes the moving and zooming animations of bounds(bounds = boundary/territory on map having all the pins in its boundary) on webpage reload/load
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    }, // {top: 200, ....} -> manually specifying padding to the bounds in map
  });
};
