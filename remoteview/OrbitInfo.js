var wsUri = "ws://192.168.0.25:8085/datalink";
var maxRadius = 300;

var light = 'True', RCS = 'True', SAS = 'True';

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

function seconds2time (seconds) {
	var hours   = Math.floor(seconds / 3600);
	var minutes = Math.floor((seconds - (hours * 3600)) / 60);
	var seconds = seconds - (hours * 3600) - (minutes * 60);
	var time = "";
	if (hours == 0) {
		time = "00:";
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

function init()
{
	shipImage = new Image();
	apImage = new Image();
	peImage = new Image();
	shipImage.src = './icons/ship.png';
	apImage.src = './icons/ap.png';
	peImage.src = './icons/pe.png';
    writeToScreen("Connecting...", "#Status");
	websocket = new WebSocket(wsUri); 
	websocket.onopen = function (evt) { doSubscribe() };
	websocket.onclose = function (evt) { onClose(evt) }; 
	websocket.onmessage = function (evt) { onMessage(evt) }; 
	websocket.onerror = function (evt) { onError(evt) };
	
}

function onClose(evt)
{
	writeToScreen("Connection lost", "#Status");
}

function onMessage(evt)
{
	//writeToScreen(evt.data, "#OrbitInfo");
	var parsedJSON = $.parseJSON(evt.data);
	update(parsedJSON);		
}

function onError(evt)
{
	writeToScreen(evt.data, "#Status");
}

function doSubscribe() {
	writeToScreen("Connected", "#Status");
	doSend(JSON.stringify({ "+": ["v.orbitalVelocity", "o.ApA", "o.PeA", "o.period", "o.timeToAp", "o.timeToPe", "o.inclination", "o.eccentricity", "v.angleToPrograde", "v.body", "o.trueAnomaly"], "rate": 100}));
	doSend(JSON.stringify({ "+": ["v.name","v.lightValue","v.sasValue","v.rcsValue"], "rate": 100}));
	doSend(JSON.stringify({ "+": ["v.name","v.lightValue","v.sasValue","v.rcsValue"], "rate": 100}));
	doSend(JSON.stringify({ "+": ["r.resourceMax[Oxidizer]","r.resourceMax[LiquidFuel]","r.resourceMax[MonoPropellant]"], "rate": 100}));
	doSend(JSON.stringify({ "+": ["r.resource[Oxidizer]","r.resource[LiquidFuel]","r.resource[MonoPropellant]"], "rate": 100}));
}

function doSend(message)
{
	websocket.send(message);
}

function writeToScreen(message, theDiv)
{
	$(theDiv).html(message);
}

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

function updateInfoPanel(data) {
	writeToScreen(data["r.resource[LiquidFuel]"].toFixed() + " / " + data["r.resourceMax[LiquidFuel]"].toFixed(), "#LiquidFuel");
	writeToScreen(data["r.resource[Oxidizer]"].toFixed() + " / " + data["r.resourceMax[Oxidizer]"].toFixed(), "#Oxidizer");
	writeToScreen(data["r.resource[MonoPropellant]"].toFixed() + " / "  +data["r.resourceMax[MonoPropellant]"].toFixed(), "#MonoPropellant");
}

function updateBars(data) {
	writeToScreen(data["v.orbitalVelocity"].toFixed() + " m/s", "#OrbitalSpeed");
	writeToScreen(data["o.ApA"].toFixed(), "#Apoapsis");
	writeToScreen(data["o.PeA"].toFixed(), "#Periapsis");
	writeToScreen(seconds2time(data["o.period"].toFixed()), "#OrbitalPeriod");
	writeToScreen(seconds2time(data["o.timeToAp"].toFixed()), "#TimeToApoapsis");
	writeToScreen(seconds2time(data["o.timeToPe"].toFixed()), "#TimeToPeriapsis");
	writeToScreen(data["o.inclination"].toFixed(3), "#Inclination");
	writeToScreen(data["o.eccentricity"].toFixed(3), "#Eccentricity");
	writeToScreen(data["v.angleToPrograde"].toFixed(2), "#AngleToPrograde");
	writeToScreen(data["o.trueAnomaly"].toFixed(2), "#TrueAnomaly");
}

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
function drawMap(data) {
	var canvas = document.getElementById('Canvas');
	var context = canvas.getContext('2d');
	var ratio = (2*maxRadius / (data["o.PeA"] + data["o.ApA"] + (2 *getVBodyRadius(data["v.body"]))));
	var bodySize = ratio * getVBodyRadius(data["v.body"]); //size of Orbited Body 
	var shipAngle = -(data["o.trueAnomaly"]/180)* Math.PI; //in radians
	
	//Preparing canvas context
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.save();
	context.translate(canvas.width / 2, canvas.height / 2);

	//Orbit
	drawEllipse(context,0,0,maxRadius,data["o.eccentricity"],1,"YellowGreen");
	drawApAndPe(context,maxRadius,apImage,peImage);
	
	//Orbited Body
	drawEllipse(context,data["o.eccentricity"] * maxRadius,0,bodySize,0,0.5,"LightBlue");
	//Ship
	drawShip(context,0,0,maxRadius,data["o.eccentricity"],shipAngle,shipImage);
	
	context.font = "12px FixedSys";
	context.fillStyle = "LightBlue";
	
	context.fillText("Orbiting " + data["v.body"], 0.80 * maxRadius,1.25 * maxRadius);
	context.restore();
}

function drawShip(ctx, x0, y0, a, exc, angle, icon)
{
	x0 += a * exc;
	var r = a * (1 - exc*exc)/(1 + exc),x = x0 + r,y = y0;
	r = a * (1 - exc*exc)/(1 + exc * Math.cos(angle));
	x = -(icon.width/2) + x0 + r * Math.cos(angle); //center icon
	y = -(icon.height/2) + y0 + r * Math.sin(angle); //center icon
	ctx.drawImage(icon, x, y);
}

function update(data)
{
	updateInfoPanel(data);
	updateButtons(data);
	updateBars(data);
	drawMap(data);
	drawShip(data);
}

window.addEventListener("load", init, false);
function switchButton(what) {
	var Element = document.getElementById(what);
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