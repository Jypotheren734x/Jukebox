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
	let hr = Math.floor(secs / 3600);
	let min = Math.floor((secs - (hr * 3600)) / 60);
	let sec = Math.floor(secs - (hr * 3600) - (min * 60));

	if (min < 10){
		min = "0" + min;
	}
	if (sec < 10){
		sec  = "0" + sec;
	}

	return min + ':' + sec;
}
function shuffle(a) {
	for (let i = a.length; i; i--) {
		let j = Math.floor(Math.random() * i);
		[a[i - 1], a[j]] = [a[j], a[i - 1]];
	}
}
function findWithAttr(array, attr, value) {
	for(var i = 0; i < array.length; i += 1) {
		if(array[i][attr] === value) {
			return i;
		}
	}
	return -1;
}