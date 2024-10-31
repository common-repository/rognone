/**
 * rognone - a content visualization plugin for wordpress
 *
 *
 * Copyright (C) 2012 Federico Carrara (federico@obliquid.it)
 *
 * For more information http://obliquid.org/
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */









//prima i parametri gestibili dal plugin
//var slotsNum = 5; //questa è definita dai settings del plugin
var postContentsRandomOrd = true;
//var refreshSlotsTimerDuration = 2000;  //questa è definita dai settings del plugin //ogni quanto uno slot viene aggiornato. in ms



//poi le altre vars

var slots = [];
var pageNum = new Array();
var lastSlotId = 0; //contatore univoco per gli slot. ogni slot ha un id, che è dato da questo contatore, che non viene mai resettato dall'avvio dell'applicazione
var resizeTimer; //timer per gestire i resize della finestra
var refreshSlotsTimer; //timer che triggera l'aggiornamento degli slot
var refreshSlotsTimerMin = 500; //valore minimo consentito //DA MODIFICARE ANCHE IN ROGNONE.PHP
var refreshSlotsTimerMax = 20000; //valore minimo consentito //DA MODIFICARE ANCHE IN ROGNONE.PHP
var refreshSlotsTimerStack = 0; //mi dice a quale slot sono arrivato nel refresh
var fadeDuration = 200; //millisecondi, durata delle animazioni degli elementi dell'interfaccia. 0 per no effetti
var tvEnabled = true; //solo per spyral: se false, allora con click su uno slot si apre la pagina di wordpress, altrimenti si apre la tv
var userInactivityThreshold = 2*1000; //dopo quanto tempo (millisec) considero l'utente intattivo. per gli smartphone viene allungato un po'
var userInactivity; //un timer che mi serve per fare qualcosa dopo una certa inattività dell'utente
var panelIsHidden = true;
var mouseOverPanel = false;
var isStopped = false;//dice se partire in play o meno
var isTemporaryStopped = false;
var isLoadingStopped = false;
var animateResize = false;//funzionicchia, nel senso che graficamente funziona, ma ad alti refresh si perde per strada i titoli dei post, e in generale rallenta tutto

//spiral layout specific
var recursion_level = 0; //autogestito dall'algoritmo
var spacing = 0; //non più usato. usare il css margin degli elementi
var starting_direction_degree = 180; //starting direction of slot visualization in degrees: 180 = left, 90 = up, 0 = right, 270 = down //autogestito dall'algoritmo
var direction_degree = 0; //autogestito dall'algoritmo
var edge_left = 0; //autogestito dall'algoritmo
var edge_top = 0; //autogestito dall'algoritmo
var edge_right = 0; //autogestito dall'algoritmo
var edge_bottom = 0; //autogestito dall'algoritmo

//var setLayoutProgress = false;
var debugSetLayoutCurrentMethod = "";







//on ready parte praticamente tutto
jQuery(document).ready(function(){
	//start everything

	init();
	/* metodo runtime
	//carico i file esterni
	var core_libraries_num = core_libraries.length;
	var core_libraries_loaded = 0;
	while ( core_libraries.length > 0 ) {
		var lib = core_libraries.pop();
		jQuery.getScript(lib, function()
		{
			console.log('OK loaded library: '+lib);
			//finito di caricare una libreria
			core_libraries_loaded++;
			//vedo se era l'ultima
			if ( core_libraries_loaded == core_libraries_num ) {
				console.log('all libraries loaded. init!');
				//era l'ultima
				//lancio l'init dell'applicazione
				//start everything
				init();
			}
		});
	}
	*/
});
	
//on load poca roba, per ora esegue l'hide della urlbar per gli smartphone
jQuery(window).load(function() {
	initOnLoad();
});
	
	




/* questi 2 metodi vengono chiamati una tantum al boot di rognone */
function init()
{
	//se mi passano in url un post id, ovviamente devo partire con la tv, e non con la spyral
	if ( preselected_post_id > 0 ) start_as_tv = 'on';
	createInterfaceCommon();
	if ( start_as_tv == 'off' ) {
		initSpyralFromScratch();
	} else if ( start_as_tv == 'on' ) {
		initTvFromScratch();
	}
}
function initOnLoad()
{
	createInterfaceCommonOnLoad();
}
/*
ordine di precedenza dei parametri gestiti da questa function:
function param wpid
GET param "p"

*/
function initTvFromScratch(wpid) {
	//disegno, una tantum, gli elementi fissi dell'interfaccia spiral
	createInterfaceTv();
	//faccio saprire subito l'interfaccia a spiral
	//jQuery('#outerContainer').hide();
	if ( wpid > 0 ) {
		//triggero l'init della tv sul mio post
		initTvFromEvent(wpid);
	} else if ( preselected_post_id > 0 ) {
		//triggero l'init della tv sul mio post
		initTvFromEvent(preselected_post_id);
	} else {
		//se non è specificato un post id, per default carico l'ultimo post e nella closure triggero l'init della tv
		loadNextPost(1, function(slotsFromQuery){
			initTvFromEvent(slotsFromQuery[0].wpid);
		});
	}
}
function initSpyralFromScratch() {
	//disegno, una tantum, gli elementi fissi dell'interfaccia spiral
	createInterfaceSpyral();
	pageNum = new Array();
	//carico i post
	loadNextPost(slotsNum,drawSlotsFromQuery);
}
function drawSlotsFromQuery(slotsFromQuery) {
	for ( var i=0; i<slotsFromQuery.length; i++ ) {
		var slotFromQuery = slotsFromQuery[i];
		//incremento il contatore degli slot
		lastSlotId++;
		//aggiungo all'array globale degli slots
		slots.push( slotFromQuery );
		//genero un id intero crescente che mi serve per varie cose, tra cui per tovare uno slot nel DOM
		slotFromQuery.id = lastSlotId;
		//e sempre disegno lo slot relativo al post
		drawSlot(slotFromQuery,slotsNum);
	}
}


function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0; i < obj.length; ++i) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}


(function(c,n){var k="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";c.fn.imagesLoaded=function(l){function m(){var b=c(h),a=c(g);d&&(g.length?d.reject(e,b,a):d.resolve(e));c.isFunction(l)&&l.call(f,e,b,a)}function i(b,a){b.src===k||-1!==c.inArray(b,j)||(j.push(b),a?g.push(b):h.push(b),c.data(b,"imagesLoaded",{isBroken:a,src:b.src}),o&&d.notifyWith(c(b),[a,e,c(h),c(g)]),e.length===j.length&&(setTimeout(m),e.unbind(".imagesLoaded")))}var f=this,d=c.isFunction(c.Deferred)?c.Deferred():
0,o=c.isFunction(d.notify),e=f.find("img").add(f.filter("img")),j=[],h=[],g=[];e.length?e.bind("load.imagesLoaded error.imagesLoaded",function(b){i(b.target,"error"===b.type)}).each(function(b,a){var e=a.src,d=c.data(a,"imagesLoaded");if(d&&d.src===e)i(a,d.isBroken);else if(a.complete&&a.naturalWidth!==n)i(a,0===a.naturalWidth||0===a.naturalHeight);else if(a.readyState||a.complete)a.src=k,a.src=e}):m();return d?d.promise(f):f}})(jQuery);
