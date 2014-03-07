/*
for infos https://github.com/Deedo/RemoteView
*/
var wsUri = "ws://127.0.0.1:8085/datalink"; //You can put an IP here
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
	doSend(JSON.stringify({ "+": ["v.orbitalVelocity", "o.ApA", "o.PeA", "o.period", "o.timeToAp", "o.timeToPe", "o.inclination", "o.eccentricity", "v.angleToPrograde", "v.body", "o.trueAnomaly","o.lan"], "rate": 100}));
	//Target
	doSend(JSON.stringify({ "+": ["tar.o.trueAnomaly", "tar.o.sma", "tar.o.orbitingBody","tar.o.eccentricity","tar.o.lan"]}));
	//Button
	doSend(JSON.stringify({ "+": ["v.name","v.lightValue","v.sasValue","v.rcsValue"], "rate": 100}));
	//resources
	doSend(JSON.stringify({ "+": ["r.resourceMax[Oxidizer]","r.resourceMax[LiquidFuel]","r.resourceMax[MonoPropellant]","r.resourceMax[ElectricCharge]"]}));
	doSend(JSON.stringify({ "+": ["r.resource[Oxidizer]","r.resource[LiquidFuel]","r.resource[MonoPropellant]","r.resource[ElectricCharge]"]}));
}

/*
send something on the wire
*/
function doSend(message)
{
	websocket.send(message);
}

/*
put content in a div
*/
function writeToScreen(message, theDiv)
{
	$(theDiv).html(message);
}

/*
Get radius of KSP bodies
TODO : must be an other way to do it...
*/
function getVBodyRadius(vbody)
{
	switch (vbody)
	{
	case 'Sun':
		return 261600000;
		break;
	case 'Kerbin':
		return 600000;
		break;
	case 'Mun':
		return 200000;
		break;
	case 'Minmus':
		return 60000;
		break;
	case 'Eve':
		return 700000;
		break;
	case 'Gilly':
		return 13000;
		break;
	case 'Moho':
		return 250000;
		break;
	case 'Duna':
		return 320000;
		break;	
	case 'Dres':
		return 138000;
		break;
	case 'Jool':
		return 6000000;
		break;
	case 'Laythe':
		return 500000;
		break;
	case 'Vall':
		return 300000;
		break;
	case 'Tylo':
		return 600000;
		break;
	case 'Bop':
		return 65000;
		break;
	case 'Pol':
		return 44000;
		break;
	case 'Eeloo':
		return 138000;
		break;
	case 'Ike':
		return 130000;
		break;
	}
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
	var canvas = document.getElementById('Canvas');
	var context = canvas.getContext('2d');
		//Preparing canvas context
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.font = "12px FixedSys";
		context.fillStyle = "LightBlue";
	var ratio = (2*maxRadius / (data["o.PeA"] + data["o.ApA"] + (2*getVBodyRadius(data["v.body"]))));
	var bodySize = ratio * getVBodyRadius(data["v.body"]); //size of Orbited Body 
	var shipAngle = -(data["o.trueAnomaly"]/180)* Math.PI; //in radians
	
	if (data["o.eccentricity"] < 1) {
		/* 
		The Orbit is closing... or at least not (hyper/para)boloid
		*/
		context.save();
		context.translate(canvas.width / 2, canvas.height / 2); // Center on orbit center
		//Orbit
		drawEllipse(context,0,0,maxRadius,data["o.eccentricity"],1,"YellowGreen");
		//Ship
		drawObject(context,0,0,maxRadius,data["o.eccentricity"],shipAngle,shipImage);
		//Target Only if orbiting the same object
		if (data["tar.o.orbitingBody"] == data["v.body"]) {
				var targetAngle = -((data["tar.o.trueAnomaly"]-(data["o.lan"]-data["o.trueAnomaly"]-data["tar.o.lan"]))/180)* Math.PI; //in radians
				//Target's Orbit
				drawEllipse(context,data["o.eccentricity"] * maxRadius,0,data["tar.o.sma"]*ratio,data["tar.o.eccentricity"],0.5,"grey");
				//Target
				drawObject(context,data["o.eccentricity"] * maxRadius,0,data["tar.o.sma"]*ratio,data["tar.o.eccentricity"],targetAngle,targetImage);
		}
		//Orbited Body
		drawEllipse(context,data["o.eccentricity"] * maxRadius,0,bodySize,0,0.5,"white");
		drawApAndPe(context,maxRadius,apImage,peImage);
		context.fillText("Orbiting " + data["v.body"], 0.80 * maxRadius,1.25 * maxRadius);
		context.restore();
	}
	else {
		/*
		The orbit is (hyper/para)boloid
		*/
		context.save();
		context.translate(canvas.width / 2, canvas.height / 2); // Center on orbit center
		//Orbit
		drawEllipse(context,data["o.eccentricity"] * maxRadius,0,maxRadius,data["o.eccentricity"],1,"YellowGreen");
		//drawApAndPe(context,maxRadius,apImage,peImage);
		//Orbited Body
		drawEllipse(context,0,0,bodySize,0,0.5,"LightBlue");
		//Ship
		drawObject(context,data["o.eccentricity"] * maxRadius,0,maxRadius,data["o.eccentricity"],shipAngle,shipImage);
		context.fillText("Escaping " + data["v.body"], 0.80 * maxRadius,1.25 * maxRadius);
		context.restore();
	}
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

/*
onClick RCS-SAS-Light
*/
function switchButton(what) {
	switch (what)
	{
	case 'RCS':
		doSend(JSON.stringify({ "run": ["f.rcs"]}));
		break;
	case 'SAS':
		doSend(JSON.stringify({ "run": ["f.sas"]}));
		break;
	case 'Light':
		doSend(JSON.stringify({ "run": ["f.light"]}));
		break;
	}
}

window.addEventListener("load", init, false);
