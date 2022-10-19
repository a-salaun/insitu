
// MODAL

// Au click sur le marker, on ouvre la modal et on centrer la map sur le marker
// function markerOnClick(e) {
//     var id = this.options.id;
//     $(".modal-content").html('This is marker ' + id);
//     $('#emptymodal').modal('show');
//     map.setView(e.target.getLatLng());
//     e.preventDefault();
//   }

// Au click sur la map, on ferme la modal
//   map.on('click', function(e) {
//     $('.modal').modal('hide');
//   });


//// DATE LOCALE
// Fonction qui retourne la date local au format suivant: Jour de la semaine, Jour du mois, Mois, Année
function getFormattedDate(date){
    let options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(date * 1000).toLocaleDateString("fr-FR",options);
};

//// HEURE LOCALE
function startClock(){
    setInterval(function(){
        document.querySelector('#localTime').innerHTML = new Date().toLocaleTimeString();
    }, 1000);
};

startClock();

//// OPENWEATHERMAP

const OWM_API_KEY = '099fd4a8089c57482bc7cb4b258ae3bf';

// Coordonnées par défaut: Paris
let lat = '48.856614';
let lon = '2.3522219';

// Liste associant les codes d'icones (weather.icon) à des classes Fontawesome
let weatherIcons = {
    "01d": "fa-sun",
    "01n": "fa-moon",
    "02d": "fa-cloud-sun",
    "02n": "fa-cloud-moon",
    "03d": "fa-cloud",
    "03n": "fa-cloud",
    "04d": "fa-cloud",
    "04n": "fa-cloud",
    "09d": "fa-cloud-showers-heavy",
    "09n": "fa-cloud-showers-heavy",
    "10d": "fa-cloud-sun-rain",
    "10n": "fa-cloud-moon-rain",
    "11d": "fa-cloud-bolt",
    "11n": "fa-cloud-bolt",
    "13d": "fa-snowflake",
    "13n": "fa-snowflake",
    "50d": "fa-smog",
    "50n": "fa-smog"
};

// Fonction pour sélectionner les élements d'un tableau avec un pas régulier
function getEveryNth(arr, nth) {
    const result = [];
  
    for (let i = 0; i < arr.length; i += nth) {
      result.push(arr[i]);
    }
  
    return result;
}


// Fonction pour la requête vers l'API OWM
function owm(lat, lon) {
    
    // Données toutes les 3 heures sur 5 jours (jour courant + 4 jours prochains) soit 40 entrées
    let url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}&units=metric&lang=fr`;

    fetch(url)
        .then(res => res.json()
        .then(data => {

            console.log(data);

            // BULLETIN DU JOUR
            let today = data.list[0];

            document.getElementById('city').innerHTML = data.city.name;
            document.getElementById('description').innerHTML = today.weather[0].description;
            document.getElementById('temp').innerHTML = Math.round(today.main.temp) + ' °C';
            document.getElementById('humidity').innerHTML = 'humidité: <strong>' + today.main.humidity + ' %</strong>';
            document.getElementById('wind').innerHTML = 'vent: <strong>' + Math.round((today.wind.speed)*3.6) + ' km/h</strong>';
            document.getElementById('tempMax').innerHTML = 'maximale: <strong>' + Math.round(today.main.temp_max) + ' °C</strong>';
            document.getElementById('tempMin').innerHTML = 'minimale: <strong>' + Math.round(today.main.temp_min) + ' °C</strong>';
            document.getElementById('localDate').innerHTML = getFormattedDate(today.dt);
            document.getElementById('weatherIcon').classList.add(weatherIcons[today.weather[0].icon]);

            // BULLETIN SUR 4 JOURS
            // On initialise une nouvelle liste avec getEveryNth() et un pas de 8 pour avoir car il y a une table toute les 3 heures
            let fiveDays = getEveryNth(data.list,8);
            // console.log(fiveDays);

            for(let i=1; i<=fiveDays.length; i++){          
                
                let day = fiveDays[i];
                // console.log(day);

                document.getElementById('day-' + i + '-name').innerHTML = getFormattedDate(day.dt).split(' ')[0];
                document.getElementById('day-' + i + '-temp').innerHTML = Math.round(day.main.temp) + ' °C';
                document.getElementById('day-' + i + '-icon').classList.add(weatherIcons[day.weather[0].icon]);

            }
            
        })
    ).catch(err => console.log('Erreur: ' + err));
};

owm(lat, lon);
  

//// LEAFLET MAP

// Initialisation de la map (Paris: ([coordonnées par défaut], niveau de zoom par défaut))
let map = L.map('map', {
    center: [48.856614, 2.3522219],
    zoom: 10,
    zoomControl: false,
    scrollWheelZoom: false // on désactive le zoom au scroll
});

// Initialisation du contrôleur de zoom
L.control.zoom({
    position: 'bottomright'
}).addTo(map);

// Initialisation du fond de carte (tileLayer) Jawg_Light: https://leaflet-extras.github.io/leaflet-providers/preview/
let Jawg_Light = L.tileLayer('https://{s}.tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token={accessToken}', {
	attribution: false,
	minZoom: 0,
	maxZoom: 20,
	subdomains: 'abcd',
	accessToken: 'hSRPziInXu119ZILRAWeuOq6BdKWo77O2hSys2IBqvP28KtqJDJcwJ972xORqzfu'
});

// On enlève le préfixe Leaflet (les crédits seront en footer)
map.attributionControl.setPrefix("");

// Ajout du fond de carte dans la map
Jawg_Light.addTo(map);

// Définition des marqueurs de position
let blackIcon = new L.Icon({
    iconUrl: './img/marker/marker-icon-black.png',
    shadowUrl: './img/marker/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -30],
    shadowSize: [41, 41]
});

//// AUTOCOMPLETION BAN (Script de gestion de recherche avec l'API adresses.data.gouv.fr)
  
// Initialisation des variables
let currentFocus = -1; // TimeOut pour un déclenchement à retardement pour la requête vers l’API
let fetchTrigger = 0; //  Curseur de sélection d’un résultat avec les résultats étant numérotés de 1 à n.
  
// Fonction pour mettre en forme visuellement un résultat sélectionné
function setActive() {

    let nbVal = $("div.search-feedback a").length;

    if (!nbVal) {

        return false; // Si on n'a aucun résultat listé, on s'arrête là.

    } else {

        // On commence par nettoyer une éventuelle sélection précédente
        $('div.search-feedback a').removeClass("active");

        // On contraint le focus dans la plage du nombre de résultats
        currentFocus = ((currentFocus + nbVal - 1) % nbVal) + 1;

        $('div.search-feedback a:nth-child(' + currentFocus + ')').addClass("active");

    }
        
}


// On prépare le calque qui va recevoir le marker de position
let markerLayer = L.layerGroup().addTo(map);

// Au clic sur une adresse suggérée, on ventile l'adresse dans les champs appropriés. On espionne mousedown plutôt que click pour l'attraper avant la perte de focus du champ adresse.
$('div.search-feedback').on("mousedown", "a", function(e) {

    // On stop la propagation par défaut
    e.preventDefault();
    e.stopPropagation();

    // On ré-initialise le calque du marqueur de position
    markerLayer.clearLayers();
    
    // On affecte les valeurs
    const name = $(this).attr("data-name");
    const postcode = $(this).attr("data-postcode");
    const city = $(this).attr("data-city");
    const coordinates = $(this).attr("data-coordinates");

    // On ventile les valeurs
    $("#search").val(name + " " + postcode + " " + city);
    $('.search-feedback').empty();

    // On récupère les coordonnées au format JSON
    let coor = JSON.parse("[" + coordinates + "]");

    // On place un marqueur selon ces coordonnées dans le calque
    let marker = L.marker(coor, {icon: blackIcon}).addTo(markerLayer);

    // On recentre la map sur le nouveau marqueur
    let latLngs = [ marker.getLatLng() ];
    let markerBounds = L.latLngBounds(latLngs);
    map.fitBounds(markerBounds);

    // On génère la météo aux coordonnées indiquées
    let lat = coor[0].toString();
    let lon = coor[1].toString();
    owm(lat, lon);

});

// On espionne le clavier dans le champ adresse pour déclencher les actions qui vont bien
$("#search").keyup(function(e) {
    
    // Stop la propagation par défaut
    e.preventDefault();
    e.stopPropagation();

    if (e.keyCode === 38) { // Flèche HAUT
        
        currentFocus--;
        setActive();
        return false;

    } else if (e.keyCode === 40) { // Flèche BAS
        
        currentFocus++;
        setActive();
        return false;

    } else if (e.keyCode === 13) { // Touche ENTREE
        
        if (currentFocus > 0) {

        // On simule un clic sur l'élément actif
        $("div.search-feedback a:nth-child(" + currentFocus + ")").mousedown();

        }
        
        return false;
    }

    // Si on arrive ici c'est que l'user a avancé dans la saisie : on réinitialise le curseur de sélection.
    $('div.search-feedback a').removeClass("active");
    currentFocus = 0;

    // On annule une éventuelle précédente requête en attente
    clearTimeout(fetchTrigger);

    // Si le champ adresse est vide, on nettoie la liste des suggestions et on ne lance pas de requête.
    let rue = $("#search").val();

    if (rue.length === 0) {

        $('.search-feedback').empty();
        return false;

    }

    // On lance une minuterie pour une requête vers l'API.
    fetchTrigger = setTimeout(function() {

        // On lance la requête sur l'API
        $.get('https://api-adresse.data.gouv.fr/search/', {
            
            q: rue,
            limit: 15,
            autocomplete: 1

        }, function(data, status, xhr) {
        
            let liste = "";

            $.each(data.features, function(i, obj) {
                
                // données phase 1 (obj.properties.label) & phase 2 : name, postcode, city
                // J'ajoute chaque élément dans une liste
                let cooladdress = obj.properties.name + " " + obj.properties.postcode + " <strong>" + obj.properties.city + "</strong>";
                liste += '<a class="list-group-item list-group-item-action py-1" href="#" name="' + obj.properties.label + '" data-name="' + obj.properties.name + '" data-postcode="' + obj.properties.postcode + '" data-city="' + obj.properties.city + '" data-coordinates="' + obj.geometry.coordinates.reverse() + '">' + cooladdress + '</a>';

            });

            $('.search-feedback').html(liste);

        }, 'json');

    }, 500);

});

// On cache la liste si le champ adresse perd le focus
$("#search").focusout(function() {

    $('.search-feedback').empty();

});

// On annule le comportement par défaut des touches entrée et flèches si une liste de suggestion d'adresses est affichée
$("#search").keydown(function(e) {

    if ($("div.search-feedback a").length > 0 && (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 13)) {
        
        e.preventDefault();

    }
    
});


//// API GAS

// On prépare le calque qui va recevoir les données à ajouter à la map
let gasLayer = L.layerGroup().addTo(map);

// On écrit une fonction qui enverra une requête à l'API selon le carburant sélectionné
function gas(gas) {

    // On initialise l'url avec une variable "gas" pour l'envoi de requêtes à l'API
    let url = `https://data.economie.gouv.fr/api/records/1.0/search/?dataset=prix-carburants-fichier-instantane-test-ods-copie&q=${gas}&rows=10000&facet=id&facet=adresse&facet=ville&facet=prix_maj&facet=prix_nom&facet=com_arm_name&facet=epci_name&facet=dep_name&facet=reg_name&facet=services_service&facet=horaires_automate_24_24
    `;

    // On ré-initialise le layer pour vider les données qui existent déjà
    gasLayer.clearLayers();

    // On fetch l'url pour récupérer les données
    fetch(url)
        .then(res => res.json()
        .then(data => {

            console.log(data);

            // on zoom en arrière pour montrer les prix de l'essence autour du marqueur de position
            map.setZoom(13);

            // On initialise les enregistrements de données que l'on souhaite parcourir dans une variable
            let records = data.records;

            // On parcourt les données contenue dans les enregistrements
            for(let i=0; i<=records.length; i++){
                
                // function undefined(key, value) {
                //     if(typeof value === 'undefined') {
                //         return null;
                //     } else {
                //         return value;
                //     };
                // }

                // undefined(records[i], value);
                
                // (key, value) => {
                //     return typeof value === 'undefined' ? null : value;
                
                // on boucle sur les coordonnées du tableau de données
                let coor = records[i].geometry.coordinates.reverse();

                // on boucle sur les champs du tableau de données
                let field = records[i].fields;

                // on boucle sur les prix pour les affecter aux marqueurs de position     
                let price = field.prix_valeur.toFixed(3);
                let gasPrice = L.divIcon({
                    iconSize: null,
                    popupAnchor: [0, -40],
                    html: '<div class="map-label"><div class="map-label-content">'+ price +'</div><div class="map-label-arrow"></div></div>'
                });

                // on boucle sur les marqueurs de positions selon les coordonées obtenues
                let marker = L.marker(coor, {icon: gasPrice})
                
                // on attache aux marqueurs des popups contenant les données cibles
                .bindPopup(
                    "<strong>"
                        + "<a class='text-uppercase' style='color: black;' href='http://maps.google.com/?q=station service " + field.adresse + " "
                        + field.cp + " "
                        + field.com_name + "'>"
                            + field.adresse + " "
                            + field.cp + " "
                            + field.com_name
                        + "</a>" 
                    + "</strong>"
                    + "<p>"
                        + field.prix_nom + " : "
                        + field.prix_valeur.toFixed(3) + " €/L"
                    + "</p>"
                    + "<p>"
                        + "Dernière mise à jour : le "
                        + field.prix_maj.substring(8,10) + "/"
                        + field.prix_maj.substring(5,7) + "/"
                        + field.prix_maj.substring(0,4) + " à "
                        + field.prix_maj.substring(11,16)
                    + "</p>"

                )
                
                // on stocke les marqueurs et popups dans un layer qui sera ajouté à la map
                .addTo(gasLayer);
            
                
                // // on boucle sur les horaires d'ouverture (string) transformés en objet JSON
                // let horaires = {...JSON.parse(
                //     JSON.parse(
                //         JSON.stringify(field.horaires, (key, value) => {
                //             return typeof value === 'undefined' ? null : value;
                //         }).replaceAll(/@|-24-24/g, '')
                //     )
                // )};
                
                // // console.log(horaires);

                // if(horaires.jour) {
                //     console.log(horaires.jour[0].horaire);
                // } 

                // // if(typeof(horaires) === 'undefined') {
                // //     null;
                // // } else {
                // //     console.log(horaires.jour[0].horaire);
                // // }
    
            }
            
        }))
        .catch(err => console.log('Erreur: ' + err));
};

// On instancie la fonction avec des écouteurs d'évènements sur la sélection du carburant
document.getElementById('b7').addEventListener('click', () => gas('Gazole'));
document.getElementById('sp98').addEventListener('click', () => gas('SP98'));
document.getElementById('e10').addEventListener('click', () => gas('E10'));
document.getElementById('sp95').addEventListener('click', () => gas('SP95'));
document.getElementById('e85').addEventListener('click', () => gas('E85'));
document.getElementById('gpl').addEventListener('click', () => gas('GPLc'));