/*
put content in a div
*/
function writeToScreen(message, theDiv)
{
	$(theDiv).html(message);
}

/*
send something on the wire
*/
function doSend(message)
{
	websocket.send(message);
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