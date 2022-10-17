// API GAS
function gas(gas) {
    
    let url = `https://data.economie.gouv.fr/api/records/1.0/search/?dataset=prix-carburants-fichier-instantane-test-ods-copie&q=${gas}&rows=10000&facet=id&facet=adresse&facet=ville&facet=prix_maj&facet=prix_nom&facet=com_arm_name&facet=epci_name&facet=dep_name&facet=reg_name&facet=services_service&facet=horaires_automate_24_24
    `;

    fetch(url)
        .then(res => res.json()
        .then(data => {

            console.log(data);

            // on zoom en arrière pour montrer les prix de l'essence autour du marqueur de position
            map.setZoom(13);

            let records = data.records;
            // console.log(records);

            for(let i=0; i<=records.length; i++){    
                
                // on boucle sur les coordonnées du tableau de données
                let coor = records[i].geometry.coordinates.reverse();

                // on boucle sur les champs du tableau de données
                let field = records[i].fields;

                // on boucle sur les prix pour les affecter aux marqueurs de position     
                let price = field.prix_valeur.toFixed(3);
                let gasPrice = L.divIcon({
                    iconSize:null,
                    html:'<div class="map-label"><div class="map-label-content">'+ price +'</div><div class="map-label-arrow"></div></div>'
                });

                // on boucle sur les marqueurs de positions selon les coordonées obtenues
                let marker = L.marker(coor, {icon: gasPrice}).addTo(map);

                // on boucle sur les horaires d'ouverture
                let reviver = function (key, value) {
                    return typeof value === 'undefined' ? null : value;
                }
                
                let h = JSON.stringify(field.horaires, reviver).replaceAll(/@|-24-24/g, '');
                // console.log(hRpl);

                let hStr = JSON.parse(h);
                let hObj = {...JSON.parse(hStr)};
                console.log(hObj);

                console.log(hObj.jour[0].horaire);

                // on attache aux marqueurs des popups contenant les données cibles
                marker.bindPopup(
                    "<strong>" 
                        + field.adresse.toUpperCase() + " "
                        + field.cp + " "
                        + field.com_name.toUpperCase() 
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
                    + "<p>"
                        + "Horaires : "
                        + (hObj.automate == 1 ? '<strong>Automate 24/24</strong>' : '')
                            + "<ul>"
                                + "<li>Lundi : "
                                    // + (hObj.jour[0].horaire.ouverture == 'undefined' ? '?' : hObj.jour[0].horaire.ouverture)
                                + "</li>"
                            + "</ul>"
                    + "</p>"
                   

                );
    
            }
            
        }))
        .catch(err => console.log('Erreur: ' + err));
};

    // Gazole (B7)
    document.getElementById('b7').addEventListener('click', () => gas('Gazole'));

    // SP98
    document.getElementById('sp98').addEventListener('click', () => gas('SP98'));

    // E10
    document.getElementById('e10').addEventListener('click', () => gas('E10'));

    // SP95
    document.getElementById('sp95').addEventListener('click', () => gas('SP95'));

    // E85
    document.getElementById('e85').addEventListener('click', () => gas('E85'));

    // GPLc
    document.getElementById('gpl').addEventListener('click', () => gas('GPLc'));

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
  


// DATE LOCALE
// Fonction qui retourne la date local au format suivant: Jour de la semaine, Jour du mois, Mois, Année
function getFormattedDate(date){
    let options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(date * 1000).toLocaleDateString("fr-FR",options);
};

// HEURE LOCALE
function startClock(){
    setInterval(function(){
        document.querySelector('#localTime').innerHTML = new Date().toLocaleTimeString();
    }, 1000);
};

startClock();

// METEO OPENWEATHERMAP

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
let map = L.map('map').setView([48.856614, 2.3522219], 10);

// Initialisation du fond de carte (tileLayer) Jawg_Light: https://leaflet-extras.github.io/leaflet-providers/preview/
let Jawg_Light = L.tileLayer('https://{s}.tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token={accessToken}', {
	attribution: '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	minZoom: 0,
	maxZoom: 20,
	subdomains: 'abcd',
	accessToken: 'hSRPziInXu119ZILRAWeuOq6BdKWo77O2hSys2IBqvP28KtqJDJcwJ972xORqzfu'
});

// Ajout du fond de carte dans la map
Jawg_Light.addTo(map);

// Définition des marqueurs de position
let blackIcon = new L.Icon({
    iconUrl: './img/marker-icon-black.png',
    shadowUrl: './img/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

//// AUTOCOMPLETION BAN (Script de gestion de recherche avec l'API adresses.data.gouv.fr)

// Infobulle bootstrap du champ #adresse
$(function() {
    $('[data-toggle="tooltip"]').tooltip()
})
  
// Initialisation des variables
let currentFocus = -1; // TimeOut pour un déclenchement à retardement pour la requête vers l’API
let fetchTrigger = 0; //  Curseur de sélection d’un résultat avec les résultats étant numérotés de 1 à n.
  
// Fonction pour mettre en forme visuellement un résultat sélectionné
function setActive() {

    let nbVal = $("div.address-feedback a").length;

    if (!nbVal) {

        return false; // Si on n'a aucun résultat listé, on s'arrête là.

    } else {

        // On commence par nettoyer une éventuelle sélection précédente
        $('div.address-feedback a').removeClass("active");

        // On contraint le focus dans la plage du nombre de résultats
        currentFocus = ((currentFocus + nbVal - 1) % nbVal) + 1;

        $('div.address-feedback a:nth-child(' + currentFocus + ')').addClass("active");

    }
        
}

// Au clic sur une adresse suggérée, on ventile l'adresse dans les champs appropriés. On espionne mousedown plutôt que click pour l'attraper avant la perte de focus du champ adresse.
$('div.address-feedback').on("mousedown", "a", function(event) {

    // Stop la propagation par défaut
    event.preventDefault();
    event.stopPropagation();
    
    // On affecte les valeurs
    $("#adresse").val($(this).attr("data-name"));
    $("#cp").val($(this).attr("data-postcode"));
    $("#ville").val($(this).attr("data-city"));
    $("#coordonnees").val($(this).attr("data-coordinates"));
    $('.address-feedback').empty();

    // Placer un marqueur qui reprend les coordonnées du formulaire
    let coor = JSON.parse("[" + $("#coordonnees").val() + "]");
    let marker = L.marker(coor, {icon: blackIcon}).addTo(map);

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
$("#adresse").keyup(function(event) {
    
    // Stop la propagation par défaut
    event.preventDefault();
    event.stopPropagation();

    if (event.keyCode === 38) { // Flèche HAUT
        
        currentFocus--;
        setActive();
        return false;

    } else if (event.keyCode === 40) { // Flèche BAS
        
        currentFocus++;
        setActive();
        return false;

    } else if (event.keyCode === 13) { // Touche ENTREE
        
        if (currentFocus > 0) {

        // On simule un clic sur l'élément actif
        $("div.address-feedback a:nth-child(" + currentFocus + ")").mousedown();

        }
        
        return false;
    }

    // Si on arrive ici c'est que l'user a avancé dans la saisie : on réinitialise le curseur de sélection.
    $('div.address-feedback a').removeClass("active");
    currentFocus = 0;

    // On annule une éventuelle précédente requête en attente
    clearTimeout(fetchTrigger);

    // Si le champ adresse est vide, on nettoie la liste des suggestions et on ne lance pas de requête.
    let rue = $("#adresse").val();

    if (rue.length === 0) {

        $('.address-feedback').empty();
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

            $('.address-feedback').html(liste);

        }, 'json');

    }, 500);

});

// On cache la liste si le champ adresse perd le focus
$("#adresse").focusout(function() {

    $('.address-feedback').empty();

});

// On annule le comportement par défaut des touches entrée et flèches si une liste de suggestion d'adresses est affichée
$("#adresse").keydown(function(e) {

    if ($("div.address-feedback a").length > 0 && (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 13)) {
        
        e.preventDefault();

    }
    
});