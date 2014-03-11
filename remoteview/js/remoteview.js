/*
for infos https://github.com/Deedo/RemoteView
*/
var wsUri = "ws://192.168.0.38:8085/datalink"; //You can put an IP here
var maxRadius = 300; // used for the map

/* draw ellipse
* x0,y0 = center of the ellipse
* a = greater semi-axis
* exc = ellipse excentricity (exc = 0 for circle, 0 < exc < 1 for ellipse, exc > 1 for hyperboloid)
*/
function drawEllipse(ctx, x0, y0, a, exc, lineWidth, color) {
	x0 += a * exc;
	var r = a * (1 - exc*exc)/(1 + exc)
	var x = x0 + r;
	var y = y0;
	ctx.beginPath();
	ctx.moveTo(x, y);
	var i = 0;
	var twoPi = 2 * Math.PI;
	while (i < twoPi) {
		r = a * (1 - exc*exc)/(1 + exc * Math.cos(i));
		x = x0 + r * Math.cos(i);
		y = y0 + r * Math.sin(i);
		ctx.lineTo(x, y);
		i += 0.01 * Math.PI;
	}
	ctx.lineWidth = lineWidth;
	ctx.strokeStyle = color;
	ctx.closePath();
	ctx.stroke();
}

/*
draw Pe and Ap icons
*/
function drawApAndPe(ctx,a,apIcon,peIcon) {
	//Pe
	x = a; //center icon
	y = 0; //center icon
	ctx.drawImage(peIcon, x, y);
    //Ap
	x = -(apIcon.width) - a; //center icon
	y = 0; //center icon
	ctx.drawImage(apIcon, x, y);
}

/*
convert readable time format
*/
function seconds2time (seconds) {
	var hours   = Math.floor(seconds / 3600);
	var minutes = Math.floor((seconds - (hours * 3600)) / 60);
	var seconds = seconds - (hours * 3600) - (minutes * 60);
	var time = "";
	if (hours == 0) {
		time = "00:"; // always prefixed with hours
	} 
	else {
		time = hours+":";
	}
	if (minutes != 0 || time !== "") {
		minutes = (minutes < 10 && time !== "") ? "0"+minutes : String(minutes);
		time += minutes+":";
	}
	if (time === "") {
		time = seconds+"s";
	}
	else {
		time += (seconds < 10) ? "0"+seconds : String(seconds);
	}
	return time;
}

/*
Testing 3D stuff
*/
function drawGrid(ctx,color,thick) {
	x = -400;
	y = -400;
	ctx.beginPath();
	while (x<=400) {
		ctx.moveTo(x, y);
		ctx.lineTo(x, y+800);
		x+=50;
	}
	x=400;
	while (y<=400) {
		ctx.moveTo(x, y+50);
		ctx.lineTo(x-800, y+50);
		y+=50;
	}
	ctx.lineWidth= thick;
	ctx.strokeStyle = color;
	ctx.stroke();
}

/*
Load some graphics and open websocket
*/
function init()
{
	shipImage = new Image();
	apImage = new Image();
	peImage = new Image();
	targetImage = new Image();
	shipImage.src = './icons/ship.png';
	apImage.src = './icons/ap.png';
	peImage.src = './icons/pe.png';
	targetImage.src = './icons/target.png';

	writeToScreen("Connecting to "+wsUri, "#Status");
	websocket = new WebSocket(wsUri); 
	websocket.onopen = function (evt) { doSubscribe() };
	websocket.onclose = function (evt) { onClose(evt) }; 
	websocket.onmessage = function (evt) { onMessage(evt) }; 
	websocket.onerror = function (evt) { onError(evt) };
}

/*
Report connection closed
*/
function onClose(evt)
{
	writeToScreen("Connection lost", "#Status");
}

/*
Reports errors
*/
function onError(evt)
{
	writeToScreen(evt.data, "#Status");
}

/*
Parse the received data
*/
function onMessage(evt)
{
	var parsedJSON = $.parseJSON(evt.data.replace(/:nan,/g,':0,')); // Seriously ? At least parsedJSON does not complain anymore...
	update(parsedJSON);		
}

/*
Subscribe to websocket
*/
function doSubscribe() {
	writeToScreen("Connected", "#Status");
	//My orbit stuff
	doSend(JSON.stringify({ "+": ["v.orbitalVelocity", "o.ApA", "o.PeA", "o.period", "o.timeToAp", "o.timeToPe", "o.inclination", "o.eccentricity", "v.angleToPrograde", "v.body", "o.trueAnomaly","o.lan","o.argumentOfPeriapsis","v.long"], "rate": 100}));
	//Target
	doSend(JSON.stringify({ "+": ["tar.o.trueAnomaly", "tar.o.sma", "tar.o.orbitingBody","tar.o.eccentricity","tar.o.lan","tar.o.inclination","tar.o.argumentOfPeriapsis"]}));
	//Button
	doSend(JSON.stringify({ "+": ["v.name","v.lightValue","v.sasValue","v.rcsValue"]}));
	//resources
	doSend(JSON.stringify({ "+": ["r.resourceMax[Oxidizer]","r.resourceMax[LiquidFuel]","r.resourceMax[MonoPropellant]","r.resourceMax[ElectricCharge]"]}));
	doSend(JSON.stringify({ "+": ["r.resource[Oxidizer]","r.resource[LiquidFuel]","r.resource[MonoPropellant]","r.resource[ElectricCharge]"]}));
}

/*
Update resources bars
*/
function updateBars(data) {
	var pctLiquidFuel = (data["r.resource[LiquidFuel]"] / data["r.resourceMax[LiquidFuel]"])*100;
	var pctOxidizer = (data["r.resource[Oxidizer]"] / data["r.resourceMax[Oxidizer]"])*100;
	var pctMonoPropellant = (data["r.resource[MonoPropellant]"] / data["r.resourceMax[MonoPropellant]"])*100;
	var pctElectricCharge = (data["r.resource[ElectricCharge]"] / data["r.resourceMax[ElectricCharge]"])*100;

	document.getElementById("pctLiquidFuel").setAttribute("style","width:"+pctLiquidFuel+"%");
	document.getElementById("pctOxidizer").setAttribute("style","width:"+pctOxidizer+"%");
	document.getElementById("pctMonoPropellant").setAttribute("style","width:"+pctMonoPropellant+"%");
	document.getElementById("pctMonoPropellant").setAttribute("style","width:"+pctMonoPropellant+"%");

	writeToScreen(data["r.resource[LiquidFuel]"].toFixed() + " / " + data["r.resourceMax[LiquidFuel]"].toFixed(), "#LiquidFuel");
	writeToScreen(data["r.resource[Oxidizer]"].toFixed() + " / " + data["r.resourceMax[Oxidizer]"].toFixed(), "#Oxidizer");
	writeToScreen(data["r.resource[MonoPropellant]"].toFixed() + " / "  +data["r.resourceMax[MonoPropellant]"].toFixed(), "#MonoPropellant");
	writeToScreen(data["r.resource[ElectricCharge]"].toFixed() + " / "  +data["r.resourceMax[ElectricCharge]"].toFixed(), "#ElectricCharge");
}

/*
Update Orbit info box
*/
function updateInfoPanel(data) {
	writeToScreen(data["v.orbitalVelocity"].toFixed() + " m/s", "#OrbitalSpeed");
	writeToScreen(data["o.ApA"].toFixed() + " m", "#Apoapsis");
	writeToScreen(data["o.PeA"].toFixed() + " m", "#Periapsis");
	writeToScreen(seconds2time(data["o.period"].toFixed()), "#OrbitalPeriod");
	writeToScreen(seconds2time(data["o.timeToAp"].toFixed()), "#TimeToApoapsis");
	writeToScreen(seconds2time(data["o.timeToPe"].toFixed()), "#TimeToPeriapsis");
	writeToScreen(data["o.inclination"].toFixed(3) + " &deg", "#Inclination");
	writeToScreen(data["o.eccentricity"].toFixed(3), "#Eccentricity");
	writeToScreen(data["v.angleToPrograde"].toFixed(2) + " &deg", "#AngleToPrograde");
	writeToScreen(data["o.trueAnomaly"].toFixed(2) + " &deg", "#TrueAnomaly");
}
/*
Update Target Panel
*/
function updateTargetPanel(data) {
	writeToScreen(data["tar.o.trueAnomaly"].toFixed(3), "#TargetTrueAnomaly");
	writeToScreen(data["tar.o.sma"], "#TargetSMA");
	writeToScreen(data["tar.o.orbitingBody"], "#TargetOrbitingBody");
	writeToScreen(data["tar.o.eccentricity"], "#TargetEccentricity");
}

/*
update button status
*/
function updateButtons(data) {
	var lightElement = document.getElementById('Light');
	var RCSElement = document.getElementById('RCS');
	var SASElement = document.getElementById('SAS');
	light = data["v.lightValue"];
	RCS = data["v.rcsValue"];
	SAS = data["v.sasValue"];
	if (light === 'True') {
		lightElement.style.opacity = "1";
	}
	else {
		lightElement.style.opacity = "0.25";
	}
	if (RCS === 'True') {
		RCSElement.style.opacity = "1";
	}
	else {
		RCSElement.style.opacity = "0.25";
	}
	if (SAS === 'True') {
		SASElement.style.opacity = "1";
	}
	else {
		SASElement.style.opacity = "0.25";
	}
}

/*
Draw the nice map !
*/
function drawMap(data) {
	var Map = document.getElementById('Map');
	var OrbitPlane = document.getElementById('OrbitPlane');
	var TargetPlane = document.getElementById('TargetPlane');
	var OrbitPlaneContext = OrbitPlane.getContext('2d');
	var TargetPlaneContext = TargetPlane.getContext('2d');
	var ratio = (2*maxRadius / (data["o.PeA"] + data["o.ApA"] + (2*getVBodyRadius(data["v.body"]))));
	var bodySize = ratio * getVBodyRadius(data["v.body"]); //size of Orbited Body 
	var shipAngle = -(data["o.trueAnomaly"]/180)* Math.PI; //in radians
	//Preparing OrbitPlane OrbitPlaneContext
	OrbitPlaneContext.clearRect(0, 0, 800, 800);
	TargetPlaneContext.clearRect(0, 0, 800, 800);
	OrbitPlaneContext.font = "12px FixedSys";
	OrbitPlaneContext.fillStyle = "LightBlue";
	OrbitPlaneContext.save();
	TargetPlaneContext.save();
	OrbitPlaneContext.translate(400,400); // Center on orbit center
	TargetPlaneContext.translate(400,400); // Center on orbit center
		if (data["o.eccentricity"] < 1) { //The Orbit is closing... or at least not (hyper/para)boloid

		//Orbited Body
		drawEllipse(OrbitPlaneContext,data["o.eccentricity"] * maxRadius,0,bodySize,0,0.5,"white");
		//Orbit
		drawEllipse(OrbitPlaneContext,0,0,maxRadius,data["o.eccentricity"],1,"YellowGreen");
		//Ship
		drawObject(OrbitPlaneContext,0,0,maxRadius,data["o.eccentricity"],shipAngle,shipImage);
		//tiny icons
		drawApAndPe(OrbitPlaneContext,maxRadius,apImage,peImage);
		if (data["tar.o.orbitingBody"] == data["v.body"]) { //Only draw Target orbit if the body is the same...
				var targetAngle = -(data["tar.o.trueAnomaly"]/180)* Math.PI; //in radians
				//Draw Grid 
				TargetPlaneContext.translate((data["o.eccentricity"] * maxRadius),0);
				TargetPlaneContext.rotate(data["o.argumentOfPeriapsis"]*Math.PI/180);
				TargetPlaneContext.translate(-(data["o.eccentricity"] * maxRadius),0);
				drawGrid(TargetPlaneContext,"grey",0.5);
				//drawGrid(OrbitPlaneContext,"yellowgreen",0.2);
				//Target's Orbit
				drawEllipse(TargetPlaneContext,data["o.eccentricity"] * maxRadius,0,data["tar.o.sma"]*ratio,data["tar.o.eccentricity"],1,"grey");
				//Target
				drawObject(TargetPlaneContext,data["o.eccentricity"] * maxRadius,0,data["tar.o.sma"]*ratio,data["tar.o.eccentricity"],targetAngle,targetImage);
				
				TargetPlane.style["-webkit-transform-origin"] = (400+data["o.eccentricity"] * maxRadius) + "px 400px 0px ";
				Map.style.WebkitPerspective = "800px";
				TargetPlane.style.WebkitTransform = "rotateX("+data["o.inclination"]+"deg) rotateZ("+data["o.lan"]+"deg)";
		}
	
		//Some text at the bottom
		OrbitPlaneContext.fillText(data["o.argumentOfPeriapsis"].toFixed(2), 0.5 * maxRadius,1.25 * maxRadius);
		
	}
	else {
		/*
		The orbit is (hyper/para)boloid
		This part is very buggy and does not work as wanted
		*/
		OrbitPlaneContext.translate(OrbitPlane.width / 2, OrbitPlane.height / 2); // Center on orbit center
		//Orbit
		drawEllipse(OrbitPlaneContext,data["o.eccentricity"] * maxRadius,0,maxRadius,data["o.eccentricity"],1,"YellowGreen");
		//drawApAndPe(OrbitPlaneContext,maxRadius,apImage,peImage);
		//Orbited Body
		drawEllipse(OrbitPlaneContext,0,0,bodySize,0,0.5,"LightBlue");
		//Ship
		drawObject(OrbitPlaneContext,data["o.eccentricity"] * maxRadius,0,maxRadius,data["o.eccentricity"],shipAngle,shipImage);
		OrbitPlaneContext.fillText("Escaping " + data["v.body"], 0.80 * maxRadius,1.25 * maxRadius);
	}
	OrbitPlaneContext.restore();
	TargetPlaneContext.restore();
		
}
/*
draw an object on the map
*/
function drawObject(ctx, x0, y0, a, exc, angle, icon)
{
	x0 += a * exc;
	var r = a * (1 - exc*exc)/(1 + exc),x = x0 + r,y = y0;
	r = a * (1 - exc*exc)/(1 + exc * Math.cos(angle));
	x = -(icon.width/2) + x0 + r * Math.cos(angle); //center icon
	y = -(icon.height/2) + y0 + r * Math.sin(angle); //center icon
	ctx.drawImage(icon, x, y);
}

/*
meta-update
*/
function update(data)
{
	updateInfoPanel(data);
	updateButtons(data);
	updateBars(data);
	updateTargetPanel(data)
	drawMap(data);
}

window.addEventListener("load", init, false);
