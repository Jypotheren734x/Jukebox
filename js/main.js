/**
 * Created by komar on 6/7/2017.
 */
function $(element) {
	if(element[0] === '#') {
		return document.getElementById(element.slice(1, element.length));
	}
	if(element[0] === '.'){
		return document.getElementsByClassName(element.slice(1,element.length));
	}else{
		return document.getElementsByTagName(element);
	}
}
function formatSecondsAsTime(secs, format) {
	var hr  = Math.floor(secs / 3600);
	var min = Math.floor((secs - (hr * 3600))/60);
	var sec = Math.floor(secs - (hr * 3600) -  (min * 60));

	if (min < 10){
		min = "0" + min;
	}
	if (sec < 10){
		sec  = "0" + sec;
	}

	return min + ':' + sec;
}