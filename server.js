//  OpenShift sample Node application
var express = require('express');
var app = express();
var fs = require("fs");
var https = require('https');
var http = require('http');
var md5 = require('md5');
var Keysession = "badae6cf02734ac34c50cb58d3877d39";
var apiKey = "badae6cf02734ac34c50cb58d3877d39";
var pathApi = "";
var hostApi = 'webservice.laposte.fr';
/*************/
/* cgi proxy */
/*************/
//var HttpsProxyAgent = require('https-proxy-agent');
var HttpProxyAgent = require('http-proxy-agent');
/*************/
var numPhase = 0;
var paramId = 0;
// caching time in second
var cachingTime = "2 minutes";
var codeAcore = "";
var getOnlyHoraire = false;
var accessFile = null;
var jsonrefregateFile = null;
var DISFEObject = null;
var start = new Date();
var isregatefromfile = true;
var sharedSecret = "argte6cf02734ac34c50cb58d3877d396552";
var crypto = require("crypto");
var apicache = require('apicache').options({
    debug: false
}).middleware;
/**
 *  Define the sample application.
 */
var SampleApp = function()

{

    //  Scope.
    var self = this;
    var winston = require('winston');
    var debug = false;
    var TabAmngt = new Array();
    var TabAutomate = new Array();
    process.argv.forEach(function(val, index, array) {
      if(val == "debug"){
        debug = true;
      }
      if(val == "notregatefile"){
        isregatefromfile = false;
      }
    });

    /**
    *  Initializes the sample application.
    */
    self.initialize = function() {
        winston.add(winston.transports.File, { filename: 'debug.log',handleExceptions: false, humanReadableUnhandledException: true, maxsize: 5000000 ,maxFiles : 5 , zippedArchive :true });

        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();

    };

     /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express();
        self.app.enable('trust proxy');
        self.app.set("trust proxy", true);


        self.app.use(function(req, res, next) {

            var retrievedSignature, parsedUrl, computedSignature;
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET');
            res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
            var forwardedIpsStr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            if (forwardedIpsStr) {
                if (accessFile != null) {
                    var obj = JSON.parse(accessFile);
                    var allowedIp = obj.Allow;
                    try {
                        var isAllowedDomain = false;
                        for (var nextip in allowedIp) {
                            if ((forwardedIpsStr.indexOf(allowedIp[nextip].domain) > -1) && allowedIp[nextip].allowed == "true") {
                                isAllowedDomain = true;
                            } else {

                            }
                        }
                        if (isAllowedDomain) {

/*

                            if (req.method === "OPTIONS") {
                                res.setHeader("Access-Control-Allow-Headers", "X-Signature");
                                res.writeHead(204);
                                res.end();
                            }else{
                                retrievedSignature = req.headers["x-signature"];
                                computedSignature = crypto.createHmac("sha256", sharedSecret).update(forwardedIpsStr).digest("hex");
                                if (computedSignature === retrievedSignature) {
                                     next(); 
                                }else{
                                    winston.info('Signature Client',' unkown ',forwardedIpsStr);
                                    res.sendStatus(403);
                                }

                            }*/
                                next();

                        } else {
                            winston.info('ip client','access forbidden for ip :',forwardedIpsStr);
                            res.sendStatus(403);
                        }
                    } catch (Err) {
                        winston.error('error access :',JSON.stringify(Err, ["message", "arguments", "type", "name"]));

                    }
                }
            }
        });

        for (var r in self.routes) {
            self.app.get(r, apicache(cachingTime), self.routes[r]);
        }
       
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {



        var fs = require('fs');
        fs.readFile(('access.json'), function(errorreadfile, datafile) {
            if (errorreadfile) {
                winston.error('debug','error reading access.json', errorreadfile);
            } else {
                accessFile = datafile;
            }
        });

        fs.readFile(('refregate.json'), function(errorreadfile, datafile) {
            if (errorreadfile) {
                winston.error('debug','error reading refregate.json', errorreadfile);
            } else {
                try{
                    jsonrefregateFile = JSON.parse(datafile);
                }catch(error){
                     winston.error('error parsing refregateFile :',JSON.stringify(error, ["message", "arguments", "type", "name"]));
                }
                
            }
        });
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            winston.info('%s: Node server started on %s:%d', Date(Date.now()), self.ipaddress, self.port,'Environment :', debug ? 'DEBUG':'PROD');
        });




    };


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP ||
            process.env.OPENSHIFT_INTERNAL_IP;
        self.port = process.env.OPENSHIFT_NODEJS_PORT ||
            process.env.OPENSHIFT_INTERNAL_PORT || 9000;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            self.ipaddress = "127.0.0.1";
        };
    };




    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = {
                'index.html': ''
            };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) {
        return self.zcache[key];
    };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig) {
        if (typeof sig === "string") {
             winston.info('%s: Received %s - terminating sample app ...',Date(Date.now()), sig);
            process.exit(1);
        }
         winston.info('%s: Node server stopped.', Date(Date.now()));
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function() {
        //  Process on exit and signals.
        process.on('exit', function() {
            self.terminator();
        });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
            'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() {
                self.terminator(element);
            });
        });




    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = {};



        self.routes['/api/acores/siteAcore/filtreGuichet/:codeAcore/:id'] = function(req, res) {

            redirectionRoute(req, res, "/api/acores/siteAcore/filtreGuichet/");


        };

        self.routes['/api/acores/siteAcore/horaires/:codeAcore/:id'] = function(req, res) {


             redirectionRoute(req, res,"/api/acores/siteAcore/horaires/");

        };



        
        if(debug){
        
            self.routes['/env'] = function(req, res) {
                var content = 'Version: ' + process.version + '\n<br/>\n' +
                    'Env: {<br/>\n<pre>';
                //  Add env entries.
                for (var k in process.env) {
                    content += '   ' + k + ': ' + process.env[k] + '\n';
                }
                content += '}\n</pre><br/>\n'
                res.send('<html>\n' +
                    '  <head><title>Node.js Process Env</title></head>\n' +
                    '  <body>\n<br/>\n' + content + '</body>\n</html>');
            };

            self.routes['/'] = function(req, res) {
                res.set('Content-Type', 'text/html');
                res.send(self.cache_get('index.html'));
            };
        
        }

        self.routes['/'] = function(req, res) {
            res.sendStatus(200);
            
        };
    };


     //**************************************************************************
    // CG : 09-11-2014 Function de redirection de route
    // Parametres { req : request/(request), res : result/(Num), route : nom de la route/(String) }
    //**************************************************************************

    function redirectionRoute(req, res, route){

            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET');
            res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

            var isCodeAcoreValid = false;
            var coderegatefromfile = null;
            if(jsonrefregateFile != null){
                if(jsonrefregateFile.hasOwnProperty(req.params.codeAcore)){
                    isCodeAcoreValid = true;
                    coderegatefromfile = jsonrefregateFile[req.params.codeAcore]; 
                }else{
                    winston.error("requete sur code acore inconnue : "+req.params.codeAcore);
                }
            }

            if(isCodeAcoreValid){

                 if ((req.params.id.length > 0 && req.params.id > 0)) {

                        paramId = req.params.id;
                        getOnlyHoraire = false;

                        if(route == "/api/acores/siteAcore/horaires/"){
                            console.log("get only horaire");
                            getOnlyHoraire = true;
                        }else{
                            getOnlyHoraire = false;
                        };

                        codeAcore = req.params.codeAcore;
                        start = new Date();
                        pathApi = '/api/acores/bureau_detail/' + codeAcore + '?id=' + paramId + '&session=' + apiKey;
                        DISFEObject = createDIFSEObject();
                        if(isregatefromfile){
                            DISFEObject.codeRegate = coderegatefromfile;
                            performResponse(res, 2, "");
                        }else{
                            performResponse(res, 0, "");
                        }
                    }

            }else{
                res.sendStatus(502);
            }


    }

    //**************************************************************************
    // CG : 09-11-2014 Function de changement de phase pour les 4 requetes
    // Parametres { response : response/(Result), numPhase : numero de phase/(Num), data : data/(Json) }
    //**************************************************************************

    function performResponse(response, numPhase, data) {

        switch (numPhase) {
            // Tentative de connexion Acore V1  
            case 0:
                authentificationAcoreV1(response,numPhase);
                break;
                // Tentative de récuperation Json Acore V1      
            case 1:
                traitementRedirectionAcoreV1(response,data,numPhase);
                break;
                // Tentative de connexion Acore V2
            case 2:
                authentificationAcoreV2(response, numPhase);
                break;
                // Tentative de récuperation Json Acore V2
            case 3:
                traitementRedirectionAcoreV2(response,data);
                break;
        }


    }

    //**************************************************************************
    // CG : 10-12-2015 Function d'authentification Acore v 1
    // Parametre { response : response/(response), numPhase : numero de phase/(Int) }
    //**************************************************************************

    function authentificationAcoreV1(response,numPhase){

      pathApi = '/api/acores/bureau_detail/' + codeAcore + '?id=' + paramId + '&session=' + apiKey;
      performRequest(response, numPhase);

    }

    //**************************************************************************
    // CG : 10-12-2015 Function de traitement de de redirection Acore v 2
    // Parametre { response : response/(response), data : data/(JSON) }
    //**************************************************************************

    function traitementRedirectionAcoreV1(response,data,numPhase){

         setDataAcoreV1(response, data);
         apiKey = 'badae6cf02734ac34c50cb58d3877d39';
         pathApi = '/api/acores/bureau_detail_v2/' + codeAcore + '?id=' + paramId + '&session=' + apiKey + '&use_http_status_code=0';
         performRequest(response, numPhase + 1);

    }


    //**************************************************************************
    // CG : 10-12-2015 Function d'authentification Acore v 2
    // Parametre { response : response/(response), numPhase : numero de phase/(Int) }
    //**************************************************************************

    function authentificationAcoreV2(response,numPhase){

      pathApi = '/api/acores/bureau_detail_v2/' + codeAcore + '?id=' + paramId + '&session=' + apiKey + '&use_http_status_code=0';
      performRequest(response, numPhase);

    }

    //**************************************************************************
    // CG : 10-12-2015 Function de traitement de de redirection Acore v 2
    // Parametre { response : response/(response), data : data/(JSON) }
    //**************************************************************************

    function traitementRedirectionAcoreV2(response,data){

        setDataAcoreV2(response, data);
            if (!getOnlyHoraire) {
                        response.send(JSON.stringify(DISFEObject));
            } else {
                        response.send(JSON.stringify(DISFEObject.horaires));
            }
        response.end();

    }

    //**************************************************************************
    // CG : 10-11-2014 Function de traitement data Acore V1
    // Parametre { Res : Result(Result), data : data/(Json) }
    //**************************************************************************

    function setDataAcoreV1(res, data) {

        try {
            if (!getOnlyHoraire) {
                var obj = JSON.parse(data);
                DISFEObject.codeRegate = obj.bureaux.codeRegate;
            }
        } catch (error) {
             winston.error('traitement Json Acore v1',JSON.stringify(error, ["message", "arguments", "type", "name"]));

            res.sendStatus(502);
           
            
        }

    }




    //**************************************************************************
    // CG : 10-11-2014 Function de traitement data Acore V2
    // Parametre { Res : Result/(Result), data : data/(Json) }
    //**************************************************************************

    function setDataAcoreV2(res, data) {

        try {

            var obj = JSON.parse(data);

            if (!getOnlyHoraire) {


                DISFEObject.codeAcores = codeAcore;
                DISFEObject.libelleCourt = null;
                DISFEObject.libelleLong = checkEmpty(obj.bureaux[codeAcore].general.libelleSite);
                DISFEObject.codLongitude = checkEmpty(obj.bureaux[codeAcore].general.lng);
                DISFEObject.codLatitude = checkEmpty(obj.bureaux[codeAcore].general.lat);
                DISFEObject.libTypSitAc = checkEmpty(obj.bureaux[codeAcore].general.libelleType.toUpperCase());

                // adresse geo 
                var adresseGeo = new Object();
                adresseGeo.cplAdresse = checkEmpty(obj.bureaux[codeAcore].general.complementAdresse);
                adresseGeo.libAdresse = checkEmpty(obj.bureaux[codeAcore].general.adresse);
                adresseGeo.lieuDit = checkEmpty(obj.bureaux[codeAcore].general.lieuDit);
                adresseGeo.codePostal = checkEmpty(obj.bureaux[codeAcore].general.codePostal);
                adresseGeo.libAcheminement = null;
                adresseGeo.pays = null;
                DISFEObject.adresseGeo = adresseGeo;

                // adresse postal 
                var adressePostale = new Object();
                adressePostale.cplAdresse = checkEmpty(obj.bureaux[codeAcore].general.complementAdresse);
                adressePostale.libAdresse = checkEmpty(obj.bureaux[codeAcore].general.adresse);
                adressePostale.lieuDit = checkEmpty(obj.bureaux[codeAcore].general.lieuDit);
                adressePostale.codePostal = null
                adressePostale.libAcheminement = checkEmpty(obj.bureaux[codeAcore].general.localite);
                adressePostale.pays = null;
                DISFEObject.adressePostale = adressePostale;


                TabAmngt = new Array();
                TabAutomate = new Array();
                setAmngtAutoFromAccessibilite(obj.bureaux[codeAcore].services);
                DISFEObject.amenagements = TabAmngt;
                DISFEObject.automates = TabAutomate;
              //  DISFEObject.services = checkEmpty(obj.bureaux[codeAcore].services);
              //  DISFEObject.accessibilite = setAccessHandicapFromAccessibilite(obj.bureaux[codeAcore].accessibilite);

            }else{
              DISFEObject.horaires = getHoraires(obj.bureaux[codeAcore].horaires, codeAcore, DISFEObject.codeRegate);  
            }


            


        } catch (error) {
            winston.error('traitement Json Acore v2',JSON.stringify(error, ["message", "arguments", "type", "name"]));
            res.sendStatus(502);
        }

    }


    function setAmngtAutoFromAccessibilite(serviceAcore){

        try{

            var services = serviceAcore;
            console.log(JSON.stringify(services));
            for (var service in services) {
                if (services.hasOwnProperty(service)) {
                    //console.log(JSON.stringify(accessibilites[accessibilite]));
                    getformatedAmngtAutoFromAcoreServices(services[service]);
                }
            }

        }catch(error){
            winston.error('traitement serviceAcore',JSON.stringify(error, ["message", "arguments", "type", "name"]));
            res.sendStatus(502);
        }

    }


    function setAccessHandicapFromAccessibilite(accessibilitesAcore){

        try{

            var accessibilites = accessibilitesAcore;

            for (var accessibilite in accessibilites) {
                if (accessibilites.hasOwnProperty(accessibilite)) {
                    //console.log(JSON.stringify(accessibilites[accessibilite]));
                    getformatedAccessHandicapFromAcoreAccessibilite(accessibilites[accessibilite]);
                }
            }

        }catch(error){
            winston.error('traitement ccessHandicapFromAccessibilite',JSON.stringify(error, ["message", "arguments", "type", "name"]));
            res.sendStatus(502);
        }

    }


    function getformatedAmngtAutoFromAcoreServices(strService){


        /* 
        type possible : 

        Distributeur automatique de billets
        Espaces automates d'affranchissement
        Espace conseil bancaire - Appelez le 3639*
        Photocopieurs
        Achats et ventes de billets en devises

        exemple bureau avec devises : 14365A PARIS DENFERT ROCHEREAU 

        */


        ObjectUnformated = null;
        
        switch (strService) {

            case "Distributeur automatique de billets":
                ObjectUnformated = createAutomateObject();
                ObjectUnformated.codTypAutomate = "TAU00001";
                ObjectUnformated.libTypAutomate = "DAB";
                ObjectUnformated.codAutomate = null;
                ObjectUnformated.libAutomate = null;
                ObjectUnformated.numSerie = null;
                ObjectUnformated.codParc = null;
                ObjectUnformated.datInstallation= null;
                ObjectUnformated.codConstrAutomate= null;
                TabAutomate.push(ObjectUnformated);
                break;    
            case "Espaces automates d'affranchissement":
                ObjectUnformated = createAmngtObject();
                ObjectUnformated.codTypAmngt = "AME00003";
                ObjectUnformated.libTypAmngt = "espace automates";
                ObjectUnformated.codReferenceService = null;
                TabAmngt.push(ObjectUnformated);
                break;
            case "Espace conseil bancaire - Appelez le 36 39*":
                ObjectUnformated = createAmngtObject();
                ObjectUnformated.codTypAmngt = "AME00040";
                ObjectUnformated.libTypAmngt = "espace COFI";
                ObjectUnformated.codReferenceService = null;
                TabAmngt.push(ObjectUnformated);
                break;
            case "Photocopieurs":
                ObjectUnformated = createAutomateObject();
                ObjectUnformated.codTypAutomate = "TAU00036";
                ObjectUnformated.libTypAutomate = "PHOTOCOPIEUR";
                ObjectUnformated.codAutomate = null;
                ObjectUnformated.libAutomate = null;
                ObjectUnformated.numSerie = null;
                ObjectUnformated.codParc = null;
                ObjectUnformated.datInstallation= null;
                ObjectUnformated.codConstrAutomate= null;
                TabAutomate.push(ObjectUnformated);
                break;
            case "Achats et ventes de billets en devises":

                break;
        }
        


      //  ObjectUnformated
        //return formatedAmngt;
    }


    function getformatedAccessHandicapFromAcoreAccessibilite(strAccessibilite){


        /*

        type possible : 

        Bureau accessible aux clients handicapés moteur
        Guichet automatique Bancaire 24h/24, accessible aux clients handicapés moteur
        Espace conseil accessible aux clients handicapés moteur
        Automates accessibles aux handicapés visuel
        Bureau accessible aux clients handicapés visuel
        Bureau accessible aux clients handicapés auditif
        exemple bureau avec tous les accessibilités : 14365A PARIS DENFERT ROCHEREAU 

        */


        formatedAccessHandicap = createAccessHandicapObject();
        switch (strAccessibilite) {

            case "Bureau accessible aux clients handicapés moteur":
                formatedAccessHandicap.CodeTypAccessibiliteHandicap = "ACH00002";
                formatedAccessHandicap.CodeTypHandicap = "TAH00002";
                formatedAccessHandicap.LibTypAccessibiliteHandicap = "Entrée autonome en fauteuil roulant possible";
                break;    
            case "Guichet automatique Bancaire 24h/24, accessible aux clients handicapés moteur":
                formatedAccessHandicap.CodeTypAccessibiliteHandicap = "ACH00009";
                formatedAccessHandicap.CodeTypHandicap = "TAH00002";
                formatedAccessHandicap.LibTypAccessibiliteHandicap = "Présence d'un GAB externe accessible PMR";
                break;
            case "Espace conseil accessible aux clients handicapés moteur":
                formatedAccessHandicap.CodeTypAccessibiliteHandicap = "ACH00013";
                formatedAccessHandicap.CodeTypHandicap = "TAH00002";
                formatedAccessHandicap.LibTypAccessibiliteHandicap = "Présence d'un espace confidentiel accessible PMR";
                break;
            case "Automates accessibles aux handicapés visuel":
                formatedAccessHandicap.CodeTypAccessibiliteHandicap = "ACH00005";
                formatedAccessHandicap.CodeTypHandicap = "TAH00003";
                formatedAccessHandicap.LibTypAccessibiliteHandicap = "Distributeur de billets avec prise audio";
                break;
            case "Bureau accessible aux clients handicapés visuel":
                formatedAccessHandicap.CodeTypAccessibiliteHandicap = "ACH00008";
                formatedAccessHandicap.CodeTypHandicap = "TAH00003";
                formatedAccessHandicap.LibTypAccessibiliteHandicap = "Présence d'une bande de guidage au sol";
                break;
            case "Bureau accessible aux clients handicapés auditif":
                formatedAccessHandicap.CodeTypAccessibiliteHandicap = "ACH00001";
                formatedAccessHandicap.CodeTypHandicap = "TAH00001";
                formatedAccessHandicap.LibTypAccessibiliteHandicap = "Boucle magnétique en état de fonctionnement";
                break;

        }

        return formatedAccessHandicap;
    }

    function createAccessHandicapObject(){


        var accesHandicap = {
            CodeTypAccessibiliteHandicap: null,
            CodeTypHandicap: null,
            LibTypAccessibiliteHandicap: null
        }

        return accesHandicap;


    }

    function createAutomateObject(){

        var Automate = {
            codTypAutomate : null,
            libTypAutomate : null,
            codAutomate: null,
            libAutomate : null,
            numSerie : null,
            codParc : null,
            datInstallation : null,
            codConstrAutomate : null
        }

        return Automate;

    }


      function createAmngtObject(){

        var Amngt = {
            codTypAmngt: null,
            libTypAmngt: null,
            codReferenceService: null
        }

        return Amngt;


    }

    //**************************************************************************
    // CG : 10-11-2014 Function de verification d'un string pour l'affichage de null au lieu d'une chaine vide
    // Retour : String 
    //**************************************************************************
    function checkEmpty(str){

        if(str == null || str.length === 0){
            return null;
        }else{
            return str;
        }

    }

    //**************************************************************************
    // CG : 10-11-2014 Function de creation d'un objet DIFSE
    // Retour : Object DIFSE(vide)
    //**************************************************************************
    function createDIFSEObject() {

        var DifseObject = {
            codeAcores: null,
            codeRegate: null,
            libelleCourt: null,
            libelleLong: null,
            codTypSitAc: null,
            libTypSitAc: null,
            codSitAcoresRattach: null,
            emails: [],
            idZoneGeoTVA: null,
            codLongitude: null,
            codLatitude: null,
            adresseGeo: null,
            adressePostale: null,
            pointDeStockListe: [],
            hld: [],
            telephones: [],
            caracteristiques: [],
            equipements: [],
            amenagements: [],
            automates: [],
            horaires: [],
            services: null,
            accessibilite: null
        };

        return DifseObject;

    }

    function getHoraires(horairesV2, codeAcore, codeRegate) {

        try {
            var horaires = horairesV2;
            var tabHoraireFormatted = new Array();

            for (var horaire in horaires) {
                if (horaires.hasOwnProperty(horaire)) {
                    var oneHoraire = new Object();
                    oneHoraire.codSitAcores = codeAcore;
                    oneHoraire.codEntRegate = codeRegate;
                    oneHoraire.datJour = horaire;

                    if (horaires[horaire].horaires.length !== 0) {

                        oneHoraire.codTypService = null;

                        try {
                            oneHoraire.hldCour = horaires[horaire].heures_limites.lettres[1];
                        } catch (e) {
                            oneHoraire.hldCour = null;
                        }
                        try {
                            oneHoraire.hldChro = horaires[horaire].heures_limites.chrono[1];
                        } catch (e) {
                            oneHoraire.hldChro = null;
                        }
                        try {
                            oneHoraire.hldColi = horaires[horaire].heures_limites.colis[1];
                        } catch (e) {
                            oneHoraire.hldColi = null;
                        }

                        for (i = 1; i <= 7; i++) {
                            if (i <= horaires[horaire].horaires.length) {
                                oneHoraire['plageHor' + i] = horaires[horaire].horaires[i - 1];
                            } else {
                                oneHoraire['plageHor' + i] = null;
                            }

                        }

                        oneHoraire.libFermeture = null;
                        oneHoraire.codTypConAct = null;
                        oneHoraire.codTypEtaAct = null;
                        oneHoraire.codSitTrfAct = null;

                    } else {


                        oneHoraire.codTypService = null;
                        for (i = 1; i <= 7; i++) {
                            oneHoraire['plageHor' + i] = null;
                        }
                        oneHoraire.hldCour = null;
                        oneHoraire.hldChro = null;
                        oneHoraire.hldColi = null;
                        oneHoraire.libFermeture = null;
                        oneHoraire.codTypConAct = null;
                        oneHoraire.codTypEtaAct = null;
                        oneHoraire.codSitTrfAct = null;

                    }

                    tabHoraireFormatted.push(oneHoraire);

                }

            }


            return tabHoraireFormatted;

        } catch (error) {
            winston.error('traitement horaire Acore v2',JSON.stringify(error, ["message", "arguments", "type", "name"]));
            res.sendStatus(502);
            
        }
    }




    //**************************************************************************
    // CG : 06-11-2014 Function d'envoi de requete API 
    // Parametre { Res : Result/(Result), Phase : NumeroDePhase/(Num) }
    //**************************************************************************

    function performRequest(res, phase) {




        if(debug){

            /**********************************************/
            /***************** cgi proxy ******************/
            /**********************************************/
            var proxy = 'http://fr-proxy.groupinfra.com:3128';
            var agent = new HttpProxyAgent(proxy);
            /**********************************************/

            var options = {
                host: hostApi,
                path: pathApi,
                encoding: 'UTF-8',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'max-age=60'
                },
                agent: agent,
                port: 80
            }; 
        }else{
            var options = {
                host: hostApi,
                path: pathApi,
                encoding: 'UTF-8',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'max-age=60'
                },
                port: 80
            };

        }

        
        var reqGet = http.request(options, function(result) {
            var chunks = [];
            // Recuperation des Partials Data
            result.on('data', function(chunk) {
                chunks.push(chunk);
            });

            // Fin de reception des Partials data Concatenation et Traitement
            result.on('end', function() {

                    var stringBuffer = Buffer.concat(chunks);
                    // reception d'une erreur d'authentification "401" , recuperation Token et generation clef de session ( Acore v1 )
                    if (result.statusCode == "401") {
                        try {
                            var obj = JSON.parse(stringBuffer);
                            apiKey = md5(Keysession + obj.token);
                            performResponse(res, (phase), stringBuffer);

                        } catch (error) {
                            winston.error('erreur en phase d authentification V1',JSON.stringify(error, ["message", "arguments", "type", "name"]));
                        }

                        // reception resultat de la requete sans erreur 
                    } else if (result.statusCode == "200") {

                        // verification de la presence d'un statusCode 401 dans la reponse Json 
                        try {
                            if (JSON.parse(stringBuffer).hasOwnProperty('statusCode') == true) {
                                if (JSON.parse(stringBuffer).statusCode == "401") {
                                    // recuperation Token generation clef de session ( Acore V2 )
                                    var obj = JSON.parse(stringBuffer);
                                    apiKey = md5(Keysession + obj.token);
                                    performResponse(res, (phase), stringBuffer);
                                }
                            } else {
                                performResponse(res, (phase + 1), stringBuffer);
                            }
                        } catch (error) {
                           winston.error('erreur en phase d authentification V2',JSON.stringify(error, ["message", "arguments", "type", "name"]));
                        }

                    }
               


            });

        });

        reqGet.end();
        reqGet.on('error', function(error) {
            winston.error('getting request',JSON.stringify(error, ["message", "arguments", "type", "name"]));
        });

    }


}; 


/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();