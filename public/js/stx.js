       
  var socket = null;
 //var addressport = "127.0.0.1:8091"
  var addressport = "nodejs-laposteiot.rhcloud.com:8000";
  var addressSeul = "nodejs-laposteiot.rhcloud.com";
        $(document).ready(function () 
		{
 
		  socket = io.connect('ws://'+addressport+'/');
		  getData();
		   initsvg();
			   
        });
		
	   var myArray;
	   var arrayFusionChart;

	   function createNewFusion(idfuelMeter,nameFuelMeter,renderAtHtml,identifiantBenne,hauteurMax){
	   	  var Fuel = new FusionCharts({
            type: 'cylinder',
            dataFormat: 'json',
            id: 'fuelMeter'+idfuelMeter,
            renderAt: renderAtHtml,
            width: '200',
            height: '280',
            dataSource:
				{
	                "chart": {
	                    "caption": nameFuelMeter,
	                    "subcaption": "N°"+identifiantBenne,
	                    "subcaptionFontBold": "0",
	                    "lowerLimit": "0",
	                    "upperLimit": hauteurMax,
	                    "lowerLimitDisplay": "Vide",
	                    "upperLimitDisplay": "Remplie",
	                    "numberSuffix": "Cm",
	                    "showValue": "0",
	                    "showhovereffect": "1",
	                    "bgCOlor": "#ffffff",
	                    "borderAlpha": "0",
	                    "cylFillColor": "#008ee4",
	                    "cyloriginx": "30",
						"cyloriginy": "260",
						"cylradius": "40",
		            "cylheight": "150"
	                },
		      
	                "value": "0"
	            }
        	}).render();

       //	arrayFusionChart.push(Fuel);
     
	   }


	   function getData()
	   {

			$.ajax({
				url: "http://"+addressSeul+"/api/database/regions",
				dataType: 'json',
				jsonpCallback: 'callback',
				 success: function() { 
				 	console.log("Success");
				 	 },
				 error: function() { console.log('Failed!'); }
			}).then(function(data) {
				console.log(data);
			       myArray = data;
				   recupererInfos(myArray);
			});  
			
	   }; 
	   
	   function initsvg(){
			document.getElementById("chart-container").style.display = 'none';
		};
	   
	   function getNumberBennes(){
		var nbrbennes = document.getElementById("nb-bennes").value;
		for (i=0; i<nbrbennes;i++)
		 { 
	     generateDiv("mabenne"+i);
		 }
	   };
		
		function generateDiv(id,nameFusion,hauteurMax) {	

		
			
		   $("#bloc-body .row").append('<span id="mabenne'+id+'"></span>');
			console.log("creation d'un fuelmeter avec l'id :"+id);
			var idbenne = "mabenne"+id;
			createNewFusion(id,nameFusion,idbenne,id,hauteurMax);
			socket.on('message/'+id, function (data)
			{
                var obj = JSON.parse(data);
				 FusionCharts("fuelMeter"+id).feedData("&value=" + (hauteurMax-obj.poid));
                $("#numboiteaulettre").html(obj.id);
                $("#timerecept").html("reçu à "+obj.heurerecepetion);
            });

		};
		
	/*	function viderDivBennes() {

		 var nbrbennes = document.getElementById("nb-bennes").value;
		 for(i=0 ; i<nbrbennes ;i++)
		 {
		     var element = document.getElementById("mabenne"+i);
			 element.parentNode.removeChild(element);
         }
   		 };
		 */
		 
		 function removeOptions(selectbox){
				var i;
				for(i=selectbox.options.length-1;i>=0;i--)
				{
				 selectbox.remove(i);
				}
		}
		
		
		function recupererInfos(arr) {
		var targetRegion = document.getElementById("list-region2");
		var i;
		console.log(arr);
		for(i = 0; i<myArray.length; i++) {
			maDivR = document.createElement("option");
			maDivR.id = arr[i].region;
			maDivR.innerHTML = maDivR.innerHTML + arr[i].region;
			targetRegion.appendChild(maDivR);
		  }	
		};
		
		function searchVille(){
		
		$("#bloc-body .row").html('');

		var targetBennes = document.getElementById("list-benne");		
		var targetSite = document.getElementById("list-ville2");
		var eR = document.getElementById("list-region2");
		var strRegion = eR.options[eR.selectedIndex].value;
		removeOptions(targetBennes);
		removeOptions(targetSite);
		var latitude ;
		var longitude ;
        for(var i = 0; i<myArray.length; i++) {
		if(myArray[i].region===strRegion){
			
		   for( var j = 0 ; j<myArray[i].ListeSite.length;j++){
	             
				  maDivB = document.createElement("option");
				  maDivB.id = "id-ville"+i;
				  maDivB.innerHTML =  myArray[i].ListeSite[j].Site;
				  targetSite.appendChild(maDivB); 
                  console.log(" vous avez choisi la region "+ strRegion);				 
			 }	 	  
	      }
        }
       };
	   
	   function searchInfosVille(){



		//viderDivBennes();
		$("#bloc-body .row").html('');
		var targetBennes = document.getElementById("list-benne");
		removeOptions(targetBennes);
		var e = document.getElementById("list-ville2");
		var strSite = e.options[e.selectedIndex].value;
		var latitudeBennes ;
		var longitudeBennes ;
		console.log(myArray[0].ListeSite);
        for(var i = 0; i< myArray.length; i++) {
		   for( var j = 0 ; j< myArray[i].ListeSite.length;j++){
			   if(myArray[i].ListeSite[j].Site === strSite){
				
				 document.getElementById("nb-bennes").value = myArray[i].ListeSite[j].ListBennes.length;
				 document.getElementById("latitude").value = myArray[i].ListeSite[j].coord.Altitude;
				 document.getElementById("longitude").value = myArray[i].ListeSite[j].coord.Longitude;
				 maDivlistT = document.createElement("option");
				 maDivlistT.id = "id-tout";
				 maDivlistT.innerHTML =  maDivlistT.innerHTML + "Toutes";
				 targetBennes.appendChild(maDivlistT);
				 for(var k = 0 ; k <myArray[i].ListeSite[j].NbBennes ; k++)
				 {
				 
				  maDivlistB = document.createElement("option");
				  maDivlistB.id = myArray[i].ListeSite[j].ListBennes[k].Identifiant;
				  maDivlistB.innerHTML =  maDivlistB.innerHTML + myArray[i].ListeSite[j].ListBennes[k].Libelle;
				  targetBennes.appendChild(maDivlistB);
				  try{
				  console.log("suppression du fusionchart : "+myArray[i].ListeSite[j].ListBennes[k].Identifiant);
				  FusionCharts('fuelMeter'+myArray[i].ListeSite[j].ListBennes[k].Identifiant).dispose();
			      }catch(e){

			      }
                   generateDiv(myArray[i].ListeSite[j].ListBennes[k].Identifiant,myArray[i].ListeSite[j].ListBennes[k].Libelle,myArray[i].ListeSite[j].ListBennes[k].HauteurMax);
				 }
			  }  
	        }
        }
		//getNumberBennes();
	
       };
		
		function chargerCoordBennes(){
			var nbr=1;
            var idBenne =[];
			var tabCoordsAlt = [];
			var tabCoordsLng = [];
			var ele = document.getElementById("list-benne");
		    var strBenneId = ele.options[ele.selectedIndex].value;
			
			var e = document.getElementById("list-ville2");
		     var strSite = e.options[e.selectedIndex].value;
			
			   for(var i = 0; i<myArray.length; i++) {
		         for( var j = 0 ; j<myArray[i].ListeSite.length;j++){
					
						if(myArray[i].ListeSite[j].Site===strSite){						
							 for(var k = 0 ; k <myArray[i].ListeSite[j].ListBennes.length ; k++)
						       {  
							      if(strBenneId==="Toutes") {
								   
 								      nbr=myArray[i].ListeSite[j].ListBennes.length;
									  console.log("vous avez bien selectionné voir toute");
									  
									 
									  console.log("nbr"+nbr);
									  idBenne.push(myArray[i].ListeSite[j].ListBennes[k].Identifiant);
									  tabCoordsAlt.push(myArray[i].ListeSite[j].ListBennes[k].coord.Altitude);
									  tabCoordsLng.push(myArray[i].ListeSite[j].ListBennes[k].coord.Longitude); 
									  console.log("tabCoords "+tabCoordsAlt);
									  console.log("tabCoords "+tabCoordsLng);
							          initMap2(nbr,tabCoordsAlt,tabCoordsLng,idBenne);
							   }
								
								 if(myArray[i].ListeSite[j].ListBennes[k].Identifiant===strBenneId){ 
								 nbr=1;
								 tabCoordsAlt.push(myArray[i].ListeSite[j].ListBennes[k].coord.Altitude);
								 tabCoordsLng.push(myArray[i].ListeSite[j].ListBennes[k].coord.Longitude);
								 initMap2(nbr,tabCoordsAlt,tabCoordsLng,idBenne);
							}  
						 }
				 } } 
	             }
          };
	
		
		
		function chargerCoordTouteBennes(){
			var BenneAlt;
			var BennesLong;
			var nbBennes;
			var ele = document.getElementById("list-benne");
			var nbBennes = document.getElementById("nb-bennes");
		    var strBenneId = ele.options[ele.selectedIndex].value;
			   for(var i = 0; i<myArray.length; i++) {
		         for( var j = 0 ; j<myArray[i].ListeSite.length;j++){
						 for(var k = 0 ; k <myArray[i].ListeSite[j].ListBennes.length ; k++)
						 {
							 if(myArray[i].ListeSite[j].ListBennes[k].Identifiant===strBenneId){ 
						      console.log("Element "+k+" : Identifiant"+ myArray[i].ListeSite[j].ListBennes[k].Identifiant + " lat :"+ myArray[i].ListeSite[j].ListBennes[k].coord.Altitude+"long :" +myArray[i].ListeSite[j].ListBennes[k].coord.Longitude);
							  BenneAlt=myArray[i].ListeSite[j].ListBennes[k].coord.Altitude;
							  BennesLong =myArray[i].ListeSite[j].ListBennes[k].coord.Longitude;
							  //initMap(nbBennes,BenneAlt,BennesLong);
							  
						 }
					  }  
	             }
          }
	
		};
	
	  
		