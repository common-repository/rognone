
var tv = {
	enabledMediaTags: ['iframe','img','canvas'],//in ordine di importanza, di chi ha la prevalenza sugli altri in caso di tag multipli in un singolo content. tutto ciò che non è mediaTags è considerato testo. nota: in questo array i tag vanno in ordine CRESCENTE di importanza, perchè nei casi in cui si trovino più tag diversi, verrà tenuto solo il tag di importanza maggiore 
	enabledShortcodeTags: ['rog'],//sono gli shortcode riconosciuti che mi arrivano come tag html
	clock: 33, //ms - tempo di clock, ovvero ogni quanto viene eseguito un ciclo di rendering (che aggiorna i contenuti in base ai timing della timeline)
	speed: 1, //è il moltiplicatore di tutti gli eventi temporali, per velocizzare o rallentare i tempi standard definiti nella timeline
	speedMax: 5,
	speedMin: 0.1,
	//da qui in poi sono variabili runtime managed
	dom: {}, //l'elemento jquery della tv
	//postWpId: 0, //wordpress id del post correntemente visualizzato
	post: {}, //lo post corrente da cui si prendono i contenuti per la timeline
	contents: [], //è un reference a post.contentsOrig
	timeline: [], //array dei timing di ogni content dello post. è un array di oggetti tipo: timeline= [{contentId:123, 'isText':false, tag:'img', timing:3200, duration:4100}]
	timelineMediaBuffer: [], //array usato dall'algoritmo che genera la timeline
	playbackTimeCur: 0, //ms - il tempo attuale di play all'interno della timeline
	playbackTimePrev: 0, //ms - variabile di timing usata dal renderer
	playbackTimeStart: 0, //ms - variabile di timing usata dal renderer
	playbackTimePauseStart: 0, //ms - variabile di timing usata dal renderer
	playbackTimePauseDuration: 0, //ms - variabile di timing usata dal renderer
	timelineTimeCur: 0, //ms - variabile usata dall'algoritmo che genera la timeline
	timelineTimeTot: 0, //ms - durata totale della timeline
	userInactivity: 0, //timer per controllare se l'utente è attivo
	clockTimer: 0, //timer per controllare se l'utente è attivo
	isTemporaryStopped: false,
	isStopped: true,
	panelWillBeHiddenOnNextPost: true,
	panelIsHidden: false,
	mouseOverPanel: false,
	closure: function(){}, //qui ci va la closure che la tv richiama quando la si chiude (spegne)
	//wps: 2.5, //Words Per Second - valore di default sulla velocità di lettura dei post
	cps: 15, //Chars Per Second - valore di default sulla velocità di lettura dei post
	maxTextDuration: 60000, //ms - massima durata sullo schermo di un test
	minTextDuration: 4000, //ms - minima durata sullo schermo di un test
	minMediaDuration: 6000, //ms - minima durata sullo schermo di un contenuto multimediale
	//prevSeekTime: 500, //ms - quanto prima si va rispetto al timing della traccia prev. è il tempo necessario per fare il doppio click e skippare a 2 tracce prima
	onlyVisuals: true, //about contents
	onlyTexts: true, //about contents
	canvasForBrightness: 0,
	timelineClicked: false,
	timelineCanvasHeight: 14,
	livePanelTvHeight: 50
};

/* metodo da chiamare esternamente per avviare il baraccone */
function initTv(postWpId,containerDomId,closure)
{
	//salvo nell'oggetto globale anche l'elemento dom che rappresenta la tv
	tv.dom = jQuery('#'+containerDomId);
	tv.closure = closure;
	tv.panelWillBeHiddenOnNextPost = true;
	//init some vars
	if ( isSmartphone ) tv.clock = 333; //sugli smartphone uso un intervallo di update più lungo
	tv.speed = 1;
	if ( player_mode == 'iframe' ) {
		//tv.timelineCanvasHeight = 10;
		//tv.livePanelTvHeight = 40;
	}
	//carico il mio post normalizzato per la tv
	//e popolo le mie variabili tv
	loadPostTv(postWpId, loadPostTvOnResult);
}

function initTvFromEvent(post_wpId) {
	hidePanel();
	jQuery('#outerContainer').fadeOut('slow');
	var wasStopped = isStopped;
	if ( jQuery('#outerContainer').length > 0 ) setStopped();
	initTv(post_wpId,'tvContainer',function(){
		//questa è una closure che viene chiamata quando la tv viene spenta per passare alla spyral
		//se la spyral sotto alla tv non esiste già, devo inizializzarla, altrimenti semplicemente la mostro
		if ( jQuery('#outerContainer').length > 0 ) {
			jQuery('#outerContainer').fadeIn('slow');
			if ( wasStopped ) {
				setLayout();
			} else {
				unsetStopped();
			}
			//pos logo
			jQuery('.liveLogo').css('top', 'auto');
			jQuery('.liveLogo').css('bottom', '0px');
			jQuery('.liveLogo').css('right', '0px');
		} else {
			//init spyral
			initSpyralFromScratch();
		}
	});
}

function loadPostTvOnResult(result) {
	//console.log('loadPostTvOnResult');
	//console.log('  result');
	//console.log(result);
	tv.post = result;
	tv.contents = tv.post.contentsOrig;
	
	//prependo ai contenuti del post un titolo iniziale, che è il titolo del post
	tv.contents.unshift( jQuery('<div><i>'+tv.post.postTitle+'</i><h3>'+tv.post.categoriesNames+' - '+tv.post.author+'</h3><h5>'+tv.post.time+'</h5></div>') );
	//console.log(tv.contents);
	
		
	//tv.post.prevId = getUrlVars(tv.post.prevLink)["p"];
	//tv.post.nextId = getUrlVars(tv.post.nextLink)["p"];
	//console.log('tv.contents');
	//console.log(tv.contents);
	/*
	console.log("dopo loadPostTv");
	console.log(tv.post.prevLink);
	console.log(tv.post.nextLink);
	console.log(tv.post.prevTitle);
	console.log(tv.post.nextTitle);
	console.log(tv.post.prevId);
	console.log(tv.post.nextId);
	*/
	
	//popolo la timeline in base ai contents a disposizione
	//va fatto prima di popolare l'interfaccia perchè la timeline va disegnata nell'interfaccia
	populateTimeline();
	//il resto del processo è chiamato asyncronamente poi
	
}

function createUi() {
	//vars
	if ( isSmartphone ) {
		tv.timelineCanvasHeight = 20;
		tv.livePanelTvHeight = 75;
	}
	
	//creo un panel per i comandi
	
	//resetto
	jQuery(tv.dom).empty();
	
	//inner container, the one that will effectively contain texts and graphics
	jQuery(tv.dom).append("<div id='tvInnerContainer'><div id='tvForegroundContainer'></div><div id='tvBackgroundContainer'></div></div>");
	//control panel and buttons
	//var urlToBeShared = window.location.href.split('?')[0]+'?rognone&p='+preselected_post_id+'&c='+preselected_category_id+'&a='+preselected_archive_id;
	var urlToBeShared = window.location.href.split('?')[0]+'?rognone&p='+tv.post.wpid;
	var panelHtml = "\
		<div id='livePanelTv'>\
			<div id='livePanelTvInnerContainer'>\
				<table cellspacing='0' cellpadding='0' border='0'>\
					<tr>\
						<td><div id='liveButtonPauseTv' title='pause [space]' ></div></td>\
						<td><div id='liveButtonPlayTv' title='resume play [space]' ></div></td>\
						<td><div id='timelineButtonNextPost' title='"+tv.post.nextTitle+" [up arrow]'></div></td>\
						<td><div id='timelineButtonPrev' title='prev content [left arrow]'></div></td>\
						<td><div id='timelineButtonNext' title='next content [right arrow]'></div></td>\
						<td><div id='timelineButtonPrevPost' title='"+tv.post.prevTitle+" [down arrow]'></div></td>\
						<td><div id='liveTimerTv'>00:00</div></td>\
						<td><div id='liveButtonExitTv' title='view all posts in the spiral layout' ></div></td>\
						<td><div id='liveButtonInfo' title='informations' ></div></td>\
						<td><div id='liveButtonSettings' title='settings' ></div></td>\
						<td><div id='liveTitleTv' title='open post page [enter]' onclick='openPostUrl()'>"+tv.post.postTitle.substr(0,50)+"</div></td>\
					</tr>\
				</table>\
			</div>\
			<canvas id='timeline'></canvas>\
			<div id='timelineSelector'></div>\
			<div id='timelineSelectorLabel'></div>\
			<div id='timelineAreahit' title='skip to content'></div>\
			<div id='livePopupTvInfo' class='livePopupTv'>\
				<table cellpadding='5'>\
					<tr>\
						<td>\
							<h5>current post</h5>\
							<hr/>\
							<table cellpadding='10'>\
								<tr>\
									<td>\
										"+jQuery(tv.post.thumbnail).html()+"\
									</td>\
									<td><h3 id='livePopupTvInfoTitle'>"+tv.post.postTitle+"</h3><h6 id='livePopupTvInfoDatetime'>"+tv.post.time+"</h6></td>\
									<td><h6>author:</h6><h4 id='livePopupTvInfoAuthor'><i>"+tv.post.author+"</i></h4><h6>categories:</h6><h4 id='livePopupTvInfoCategories'><i>"+tv.post.categoriesNames+"</i></h4></td>\
								</tr>\
							</table>\
						</td>\
						<td style='width:20px;'>\
						</td>\
						<td rowspan='2'>\
							<h5>keyboard shortcuts</h5>\
							<hr/>\
							<table cellpadding='5'>\
								<tr>\
									<td><h4>&larr;</h4></td>\
									<td><h4>&rarr;</h4></td>\
									<td><h4>&uarr;</h4></td>\
									<td><h4>&darr;</h4></td>\
									<td><h4>&crarr;</h4></td>\
									<td><h5>space</h5></td>\
								</tr>\
								<tr>\
									<td><h6>prev content</h6></td>\
									<td><h6>next content</h6></td>\
									<td><h6>prev post</h6></td>\
									<td><h6>next post</h6></td>\
									<td><h6>open post page</h6></td>\
									<td><h6>play/pause</h6></td>\
								</tr>\
							</table>\
							<br/>\
							<br/>\
							<h5>share</h5>\
							<hr/>\
							<table cellpadding='5' id='social' class='cf'>\
								<tr>\
									<td><a href='http://twitter.com/share' class='socialite twitter-share' data-text='calepiopress | "+tv.post.postTitle+"' data-url='"+urlToBeShared+"' data-count='vertical' rel='nofollow' target='_blank'><span class='vhidden'>Share on Twitter</span></a></td>\
									<td><a href='http://www.facebook.com/sharer.php?u="+urlToBeShared+"&amp;t=calepiopress | "+tv.post.postTitle+"' class='socialite facebook-like' data-href='"+urlToBeShared+"' data-send='false' data-layout='box_count' data-width='60' data-show-faces='false' rel='nofollow' target='_blank'><span class='vhidden'>Share on Facebook</span></a></td>\
									<td><a href='http://www.linkedin.com/shareArticle?mini=true&amp;url="+urlToBeShared+"&amp;title=calepiopress | "+tv.post.postTitle+"' class='socialite linkedin-share' data-url='"+urlToBeShared+"' data-counter='top' rel='nofollow' target='_blank'><span class='vhidden'>Share on LinkedIn</span></a></td>\
									<td><a href='https://plusone.google.com/_/+1/confirm?hl=en&amp;url="+urlToBeShared+"' class='socialite googleplus-one' data-size='tall' data-href='"+urlToBeShared+"' rel='nofollow' target='_blank'><span class='vhidden'>Share on Google+</span></a></td>\
								</tr>\
							</table>\
						</td>\
					</tr>\
					<tr id='livePopupTvInfoForVideoContainer'>\
						<td id='livePopupTvInfoForVideo'>\
						</td>\
					</tr>\
				</table>\
			</div>\
			<div id='livePopupTvSettings' class='livePopupTv'>\
				<h4>settings</h4>\
				<hr/>\
				<table cellpadding='5'>\
					<tr>\
						<td><h2>speed</h2></td>\
						<td><div id='speedSliderTv' title='speed'></div></td>\
						<td><h5 id='speedLabelTv' title='speed'>"+String(Math.round(tv.speed*100)/100)+" X</h5></td>\
						<td>Contents change too fast? Try lowering this. You read faster than texts updating pace? Try rising this.</td>\
					</tr>\
				</table>\
				<div style='clear:both;'></div>\
			</div>\
		</div>";
	jQuery(tv.dom).append(panelHtml);
	
	//se iframe tolgo un po' di roba
	if ( player_mode == 'iframe' ) {
		jQuery('#liveButtonExitTv').remove();
		jQuery('#liveButtonInfo').remove();
		jQuery('#liveButtonSettings').remove();
	}
	
	//attivo i bottoni di share
	Socialite.load('#livePopupTvInfo');
	
	//update grafico del bottone di play/pause
	updatePlayPauseButtonsTv();
	
	//set panel height
	jQuery('#livePanelTv').css("height",String( tv.livePanelTvHeight + tv.timelineCanvasHeight )+"px");
	
	//enable speedSliderTv
	jQuery('#speedSliderTv').slider({
		max: 1,
		min: Math.pow( tv.speedMin/tv.speedMax, 1/4 ),
		step: 0.001,
		value: Math.pow( tv.speed/tv.speedMax, 1/4 ),
		animate: false,
		change: updateSpeed
	});
	//logo positioning
	jQuery('.liveLogo').css('top', '0px');
	jQuery('.liveLogo').css('right', '0px');
	
	//show panel onmousemove
	jQuery(tv.dom).mousemove(function(e){
		//se il panel non è visibile, lo visualizzo
		//(potrebbe essere stato nascosto per inattività dell'utente, nel qual caso non comparirebbe fino al successivo mouseover)
		if ( tv.panelIsHidden ) showPanelTv();
		
		//re-setto il timer user inactivity
		clearTimeout(tv.userInactivity);
		tv.userInactivity = setTimeout(function() {
			clearTimeout(tv.userInactivity);
			if ( !tv.mouseOverPanel ) hidePanelTv();
		}, userInactivityThreshold);
	});	
	//onmouseover sull'outer container faccio comparire il panel
	jQuery(tv.dom).mouseover(function() {
		//faccio comparire il panel
		showPanelTv();
	});		
	

	//assegno gli eventi di pannello visibile/invisibile
	//if ( !isSmartphone ) {
		//la prima volta che parte la tv il panel è nascosto, tutte le altre volte che si ricrea l'interfaccia il panel resterà nel suo stato corrente
		if ( tv.panelWillBeHiddenOnNextPost ) {
			tv.panelWillBeHiddenOnNextPost = false;
			jQuery('#livePanelTv').css("bottom",'-'+String(-tv.timelineCanvasHeight+Number(jQuery('#livePanelTv').height()))+'px'); //comparirà solo onmousemove
		}
		
		jQuery('#livePanelTv').mouseover(function() {
			tv.mouseOverPanel = true;
		});		
		jQuery('#livePanelTv').mouseout(function() {
			tv.mouseOverPanel = false;
		});
		
		/*
		//l'interfaccia parte con il panel aperto, e dopo pochi secondi lo chiudo
		clearTimeout(tv.userInactivity);
		tv.userInactivity = setTimeout(function() {
			clearTimeout(tv.userInactivity);
			if ( !tv.mouseOverPanel ) hidePanelTv();
		}, userInactivityThreshold);
		//jQuery('.liveLogo').css('right', '-'+jQuery('.liveLogo').outerWidth(true)+'px');
		*/
		
	//} else {
		//nel caso di smartphone, per pigrizia, dichiaro che il mouse è sempre sopra al panel, che quindi resta aperto
		//tv.mouseOverPanel = true;
	//}
	
	//pause button actions
	jQuery('#liveButtonPauseTv').click( function (){
		//fermo tutto
		pausePlayback();
	});		
	//play button actions
	jQuery('#liveButtonPlayTv').click( function (){
		//faccio ripartire tutti i timer di tutti gli post
		startPlayback();
	});
	//settings button actions
	jQuery('#liveButtonSettings').click( function (){
		toggleLivePopupTv();
	});
	//info button actions
	jQuery('#liveButtonInfo').click( function (){
		jQuery('.livePopupTv:not(#livePopupTvInfo)').hide();
		toggleLivePopupTv('#livePopupTvInfo');
	});
	//settings button actions
	jQuery('#liveButtonSettings').click( function (){
		jQuery('.livePopupTv:not(#livePopupTvSettings)').hide();
		toggleLivePopupTv('#livePopupTvSettings');
	});
	function toggleLivePopupTv( popupSelector ) {
		jQuery(popupSelector).css('padding',String(tv.livePanelTvHeight/2)+'px');
		jQuery(popupSelector).css('width',String( jQuery(window).width() - tv.livePanelTvHeight )+'px');
		//jQuery(popupSelector).css('height',String( jQuery(window).height() / 2 )+'px');
		jQuery(popupSelector).css('bottom',String(  tv.livePanelTvHeight + tv.timelineCanvasHeight )+'px');
		jQuery(popupSelector).css('left','0px');
		if ( jQuery(popupSelector).is(":visible") ) {
			jQuery(popupSelector).fadeOut();
		} else {
			jQuery(popupSelector).fadeIn();
		}
		/*
		console.log(jQuery(window).width());
		console.log(jQuery(popupSelector).width());
		console.log(String( (jQuery(window).height() - jQuery(popupSelector).height()) / 2 )+'px');
		*/
	}
	//close button actions
	jQuery('#liveButtonExitTv').click( exitTv );
	function exitTv() {
		//vars
		start_as_tv == 'off'
		//disabilito la tastiera
		jQuery(document).off('keydown');
		//spengo i timer
		clearTimeout( tv.clockTimer );
		clearTimeout( tv.userInactivity );
		clearInterval(tv.videoSyncInterval);
		//chiudo il panel
		hidePanelTv();
		if ( start_as_tv == 'on' ) {
			//elimino l'oscurante sopra all'interfacci a spiral
			jQuery('#outerContainerObscurator').remove();
		}
		//la tv sparisce
		jQuery(tv.dom).fadeOut('slow');
		//ammazzo tutto via!
		jQuery(tv.dom).empty();
		//chiamo il metodo di close
		tv.closure();
		
	}
	
	//activate next/prev content buttons
	jQuery('#timelineButtonPrev').click( timelineButtonPrevClicked );
	jQuery('#timelineButtonNext').click( timelineButtonNextClicked );
	
	//activate next/prev post buttons
	jQuery('#timelineButtonPrevPost').click( function (){
		pausePlayback();
		clearInterval(tv.videoSyncInterval);
		loadPostTv(tv.post.prevId, loadPostTvOnResult);
	});
	jQuery('#timelineButtonNextPost').click( function (){
		pausePlayback();
		clearInterval(tv.videoSyncInterval);
		loadPostTv(tv.post.nextId, loadPostTvOnResult);
	});
	//visualizzo o nascondo i bottoni di prev/next post
	if ( tv.post.prevId > 0 ) {
		jQuery('#timelineButtonPrevPost').show();
	} else {
		jQuery('#timelineButtonPrevPost').hide();
	}
	if ( tv.post.nextId > 0 ) {
		jQuery('#timelineButtonNextPost').show();
	} else {
		jQuery('#timelineButtonNextPost').hide();
	}
	
	//binding della tastiera con i next/prev content/post
	jQuery(document).off('keydown');
	jQuery(document).keydown(function(e){
		tv.panelWillBeHiddenOnNextPost = true;
		// 37 - left
		if (e.keyCode == 37) { 
			timelineButtonPrevClicked();
			return false;
		// 38 - up
		} else if (e.keyCode == 38) { 
			if ( tv.post.nextId > 0 ) {
				pausePlayback(true);
				loadPostTv(tv.post.nextId, loadPostTvOnResult);
			}
			return false;
		// 39 - right
		} else if (e.keyCode == 39) { 
			timelineButtonNextClicked();
			return false;
		// 40 - down
		} else if (e.keyCode == 40) {
			if ( tv.post.prevId > 0 ) {
				pausePlayback(true);
				loadPostTv(tv.post.prevId, loadPostTvOnResult);
			}
			return false;
		// 13 - enter
		} else if (e.keyCode == 13) { 
			openPostUrl();
			return false;
		// 32 - space
		} else if (e.keyCode == 32) { 
			if ( tv.isStopped ) {
			   startPlayback();
			} else {
			   pausePlayback();
			}
			return false;
		}
	});
	
	//on mousemove muovo il cursore della timeline
	jQuery('#timelineAreahit').mousemove(function(e){
		//console.log(e.clientX +', '+ e.clientY);
		jQuery('#timelineSelector').css('left',(e.clientX - 1)+'px');
		jQuery('#timelineSelectorLabel').html(formatTimer( cursorPxToTime() ));
		var leftLabelPos = e.clientX - jQuery('#timelineSelectorLabel').width()/2 ;
		if ( leftLabelPos < 0 ) leftLabelPos = 0;
		if ( leftLabelPos > jQuery('#timeline').width() - jQuery('#timelineSelectorLabel').width() ) leftLabelPos = jQuery('#timeline').width() - jQuery('#timelineSelectorLabel').width();
		jQuery('#timelineSelectorLabel').css('left',String(leftLabelPos)+'px');
		//jQuery('#timelineSelectorLabel').css('bottom',String(tv.timelineCanvasHeight + jQuery('#timelineSelector').position.bottom )+'px');
		
	});
	//on click sulla timeline faccio un update del time Cur
	jQuery('#timelineAreahit').click(function(){
		var newTiming = cursorPxToTime();
		//console.log("jQuery('#timelineSelector').position().left="+jQuery('#timelineSelector').position().left);
		//console.log("newTiming="+newTiming);
		if ( tv.isStopped ) startPlayback();
		//console.log("click on timeline trigger call of setPlaybackTimeCurWithSpeed()");
		setPlaybackTimeCurWithSpeed(newTiming);
		tv.timelineClicked = true;
	});
	//quando esco dalla timeline spengo il cursore
	jQuery('#timelineAreahit').mouseleave(function(){
		//jQuery('#timelineSelector').stop(true).fadeOut();
		jQuery('#timelineSelector').hide();
		jQuery('#timelineSelectorLabel').hide();
	});
	//quando entro nella timeline appiccio il cursore
	jQuery('#timelineAreahit').mouseenter(function(){
		//jQuery('#timelineSelector').stop(true).fadeIn();
		jQuery('#timelineSelector').show();
		jQuery('#timelineSelectorLabel').show();
	});

	//create timeline for the first time
	drawTimeline();

	/*
	//ticker icon
	jQuery(tv.dom).append("<div id='tickerTv'></div>");
	jQuery('#tickerTv').fadeOut(200);
	*/

	//accendo
	jQuery(tv.dom).fadeIn('slow');
	
}
function cursorPxToTime() {
	return jQuery('#timelineSelector').position().left / jQuery('#timeline').width() * tv.timelineTimeTot;
}
function updateSpeed(event, ui) {
	//if (typeof onlyChangeVisual === "undefined" || onlyChangeVisual===null) onlyChangeVisual = false;
	//console.log("updateSpeed!!! con value = "+ui.value);
	//tv.speed = ui.value;
	var prevSpeed = tv.speed;
	tv.speed = Math.pow(ui.value,4)*tv.speedMax;
	//console.log('SLIDER tv.speed='+tv.speed);
	//jQuery('#speedLabelTv').html(String(Math.round(tv.speed/100)/10)+' s');
	//jQuery('#speedLabelTv').html(String(Math.round(tv.speed*10)/10)+' X');
	jQuery('#speedLabelTv').html(String(Math.round(tv.speed*100)/100)+' X');
	//aggiorno il playback
	//if ( !onlyChangeVisual ) {
		var timeCur01 = tv.playbackTimeCur / ( tv.timelineTimeTot/prevSpeed ); //current time between 0 and 1
		var timeCurNew = timeCur01 * applySpeed(tv.timelineTimeTot);
		//console.log("updateSpeed trigger call of setPlaybackTimeCur()");
		setPlaybackTimeCur(timeCurNew);
		tv.playbackTimePrev = tv.playbackTimePrev*prevSpeed;
	//}
}
function timelineButtonPrevClicked() {
	clearInterval(tv.videoSyncInterval);
	//devo trovare il timing di inizio del content più vicino a me, nel passato rispetto a timeCur
	if ( tv.isStopped ) startPlayback();
	var prevTiming = 0;
	var hasPrevTiming = false;
	var hasPrevPrevTiming = false;
	var prevPrevTiming = 0;
	for ( var x=0; x < tv.timeline.length; x++ ) {
		var element = tv.timeline[x];
		if ( tv.playbackTimeCur > applySpeed(element.timing) ) {
			prevTiming = element.timing;
			hasPrevTiming = true;
			//trovo anche il prevPrevTiming che mi serve in alcuni casi
			for ( var y=0; y < tv.timeline.length; y++ ) {
				var prevPrevElement = tv.timeline[y];
				//if ( prevTiming > applySpeed(prevPrevElement.timing) ) {
				if ( prevTiming > prevPrevElement.timing ) {
					prevPrevTiming = prevPrevElement.timing;
					hasPrevPrevTiming = true;
				} else {
					break;
				}
			}
		} else {
			break;
		}
	}
	//se prevTiming è troppo vicino al current timing, vuol dire che devo tornare indietro di un altro contenuto ancora (se ce l'ho)
	if ( hasPrevPrevTiming && ( tv.playbackTimeCur - applySpeed(prevTiming) ) < 2000 ) {
		//console.log("timelineButtonPrevClicked trigger call of setPlaybackTimeCurWithSpeed() con prevPrevTiming="+prevPrevTiming);
		setPlaybackTimeCurWithSpeed(prevPrevTiming);
	} else if ( ( tv.playbackTimeCur - applySpeed(prevTiming) ) < 2000 ) {
		loadPostTv(tv.post.nextId, loadPostTvOnResult);
	} else if ( hasPrevTiming ) {
		//console.log("timelineButtonPrevClicked BIS trigger call of setPlaybackTimeCurWithSpeed() con prevTiming="+prevTiming);
		setPlaybackTimeCurWithSpeed(prevTiming);
		//in questo caso sto tornando all'inizio del content corrente, quindi devo far tornare indietro anche il video correntemente
		if ( tv.currentContentWithYtLoader && tv.contents[tv.currentContentWithYtLoader] && tv.contents[tv.currentContentWithYtLoader].yt_loader && typeof tv.contents[tv.currentContentWithYtLoader].yt_loader.seekTo === 'function') {
			var seekTo = 0;
			var element = getTimelineElement(tv.currentContentWithYtLoader);
			if ( element.vin > 0 ) {
				seekTo += element.vin/1000;
			}

			tv.contents[tv.currentContentWithYtLoader].yt_loader.seekTo(seekTo, true);
			setVideoSyncInterval(); //lo ricreo perchè, mentre di solito è sempre attivo, qui si passa attraverso un redraw della scena che resetta il timer
		}
	}
}
function timelineButtonNextClicked() {
	clearInterval(tv.videoSyncInterval);
	//devo trovare il timing di inizio del content più vicino a me, nel futuro rispetto a timeCur
	if ( tv.isStopped ) startPlayback();
	var nextTiming = 0;
	for ( var x=0; x < tv.timeline.length; x++ ) {
		var element = tv.timeline[x];
		if ( tv.playbackTimeCur < applySpeed(element.timing) ) {
			nextTiming = element.timing;
			break;
		}
	}
	if ( nextTiming == 0 ) {
		//se arrivato qui il nextTiming è ancora 0, vuole dire che ho cliccato il next quando ero sull'ultimo paragraph, 
		//ma non voglio che ritorni al primo paragraph, bensì che venga caricato il prossimo post (cioè il prev, in termini temporali)
		pausePlayback(true);
		loadPostTv(tv.post.prevId, loadPostTvOnResult);
	} else {
		//console.log("oggiorno il timing per content successivo");
		//trovato il prev time, aggiorno il playback
		//console.log("timelineButtonNextClicked trigger call of setPlaybackTimeCurWithSpeed()");
		setPlaybackTimeCurWithSpeed(nextTiming);
	}
}

function showPanelTv()
{
	tv.panelIsHidden = false;
	//per prima cosa ritorna il cursore
	//NONVA jQuery('body').css({cursor: 'default'});
	
	//torna il cursore
	//jQuery('body').css('cursor', 'default');
	
	//sposto il logo
	jQuery('.liveLogo').stop(true).animate({
		//right:-jQuery('.liveLogo').outerWidth(true)
		//bottom:jQuery('#livePanelTv').outerHeight(true)
	}, fadeDuration, "swing", function() {
		jQuery('#livePanelTv').stop(true).animate({
			bottom:0
		}, fadeDuration*3, "swing", function(){ 
			//niente dopo la fine dell'animazione
		});
	});
}

function hidePanelTv()
{
	tv.panelIsHidden = true;
	//jQuery('body').css('cursor', 'none');
	jQuery('.livePopupTv').fadeOut();
	jQuery('#livePanelTv').stop(true).animate({
		bottom:-jQuery('#livePanelTv').height()+tv.timelineCanvasHeight
	}, fadeDuration*3, "swing", function(){ 
		//rimetta - a - posto - il - logo
		jQuery('.liveLogo').stop(true).animate({
			//right:0
			//bottom:0
		}, fadeDuration, "swing", function(){ 
			//sparisce pure il cursore alla fine dell'animazione
			//NONVA jQuery('body').css({cursor: 'none'});
		});
	});
}

function updatePlayPauseButtonsTv() {
	if ( tv.isStopped || tv.isTemporaryStopped ) {
		jQuery('#liveButtonPauseTv').hide();
		jQuery('#liveButtonPlayTv').show();
	} else {
		jQuery('#liveButtonPauseTv').show();
		jQuery('#liveButtonPlayTv').hide();
	}
}

function setPlaybackTimeCur(timeCurNew) {
	tv.playbackTimeStart -= timeCurNew - tv.playbackTimeCur;
	tv.playbackTimeCur = getSystime() - tv.playbackTimeStart;
	//console.log("tremate!!! setPlaybackTimeCur chiamato! con tv.playbackTimeCur="+tv.playbackTimeCur);
	
}

function setPlaybackTimeCurWithSpeed(newTiming) {
	var timeCurNew = applySpeed( newTiming );
	setPlaybackTimeCur(timeCurNew);
}

function initTvRenderer() {
	tv.playbackTimeStart = 0;
	tv.playbackTimeCur = 0;
	tv.playbackTimePrev = 0;
	tv.playbackTimePauseDuration = 0;
	tv.playbackTimePauseStart = 0;
	//console.log("initTvRenderer: con tv.playbackTimeStart="+tv.playbackTimeStart+" e tv.playbackTimeCur="+tv.playbackTimeCur);
}

function pausePlayback(notPauseYTVideo) {
	if ( !tv.isStopped ) {
		tv.isStopped = true;
		tv.playbackTimePauseStart = getSystime();
	}
	//se c'è un video, metto in pausa pure quello
	if ( 
		!notPauseYTVideo
		&&
		tv.currentContentWithYtLoader 
		&& 
		tv.contents[tv.currentContentWithYtLoader]
		&& 
		tv.contents[tv.currentContentWithYtLoader].yt_loader 
		&& 
		typeof tv.contents[tv.currentContentWithYtLoader].yt_loader.pauseVideo === 'function' 	
	) {
		tv.contents[tv.currentContentWithYtLoader].yt_loader.pauseVideo();
	}	
	updatePlayPauseButtonsTv();
	//console.log("tremate!!! pauseVideo chiamato! con tv.playbackTimePauseStart = "+tv.playbackTimePauseStart+" e tv.playbackTimeCur="+tv.playbackTimeCur);
}

function startPlayback(notPlayYTVideo) {
	tv.isStopped = false;
	//se il play era già iniziato prima, aggiorno con la pausa che c'è stata
	if ( tv.playbackTimeCur > 0 ) {
		if ( tv.playbackTimePauseStart > 0 ) {
			tv.playbackTimePauseDuration = (getSystime() - tv.playbackTimePauseStart);
			tv.playbackTimeStart = tv.playbackTimeStart + tv.playbackTimePauseDuration;
			tv.playbackTimePauseStart = 0;
			tv.playbackTimePauseDuration = 0;
		}
	} else {
		//playback dall'inizio, quindi resetto il timestart
		tv.playbackTimeStart = getSystime();
	}
	//se c'è un video, metto in playback pure quello
	if ( 
		!notPlayYTVideo
		&&
		tv.currentContentWithYtLoader 
		&& 
		tv.contents[tv.currentContentWithYtLoader]
		&& 
		tv.contents[tv.currentContentWithYtLoader].yt_loader 
		&& 
		typeof tv.contents[tv.currentContentWithYtLoader].yt_loader.playVideo === 'function' 	
	) {
		tv.contents[tv.currentContentWithYtLoader].yt_loader.playVideo();
	}	
	updatePlayPauseButtonsTv();
	//console.log("tremate!!! startPlayback chiamato! con tv.playbackTimeCur="+tv.playbackTimeCur);
}

function setTemporaryStoppedTv() {
	tv.isTemporaryStopped = true;
	updatePlayPauseButtonsTv();
}

function unsetTemporaryStoppedTv() {
	tv.isTemporaryStopped = false;
	updatePlayPauseButtonsTv();
}

function getSystime() {
	var sysTime = new Date();
	return sysTime.getTime();
}

function applySpeed(ms) {
	return ms/tv.speed;
}

/* questo è il timer principale, che da il sync a tutto, ovvero che aggiunge i post man mano */
function updateTvOnTimer()
{
	//console.log('updateTvOnTimer con tv.playbackTimeCur='+tv.playbackTimeCur+' e tv.playbackTimeStart='+tv.playbackTimeStart);
	
	//bypasso se sono in stop, o se non ci sono posts visualizzati
	updatePlayPauseButtonsTv();
	if ( !tv.isStopped && !tv.isTemporaryStopped ) {
		
		//se il playback ha superato la fine, stoppo
		if ( tv.playbackTimeCur >  applySpeed(tv.timelineTimeTot) ) {
				pausePlayback(true);
				initTvRenderer();
				drawTimeline();
			//se c'è un post precedente, passo a quello, altrmienti stoppo tutto
			if ( tv.post.prevId > 0 ) {
				tv.panelWillBeHiddenOnNextPost = true; //voglio che quando viene caricato il prossimo post il panel resti nascosto
				loadPostTv(tv.post.prevId, loadPostTvOnResult);
			} else {
			}
		} else {
		
			//aggiorno i contenuti
			tvRendererLoop();
			
			//aggiorno la timeline (perchè c'ha dentro il cursore, e va ridisegnata ogni volta
			drawTimeline();
			

			//se sto skippando, skippo al mio content
			//console.log("ontimer: tv.timelineClicked="+tv.timelineClicked);
			//console.log("ontimer: tv.currentContentWithYtLoader="+tv.currentContentWithYtLoader);
			if ( tv.timelineClicked && tv.currentContentWithYtLoader ) {
				//console.log("updateTvOnTimer: timeline clicked!");
				//se lo skeep ricade prima o dopo il content corrente (fuori da lui), lascio l'evento di timelineClicked intatto, ad uso futuro
				var element = getTimelineElement(tv.currentContentWithYtLoader);
				if ( element ) {
					var videoRelativeSeek = tv.playbackTimeCur - element.timing;
					if ( 
						videoRelativeSeek > 0 && videoRelativeSeek <= element.duration 
						&&
						tv.contents[element.contentId]
						&&
						tv.contents[element.contentId].yt_loader
						&&
						typeof tv.contents[element.contentId].yt_loader.seekTo === 'function'
					) {
						tv.timelineClicked = false;
						//se c'è un video in play, lo skippo
						//console.log("skippo il video a : "+String(videoRelativeSeek));
						//console.log(tv.currentContentWithYtLoader);
						//console.log(tv.contents[element.contentId]);
						//console.log(tv.contents[element.contentId].yt_loader);
						//console.log(tv.contents[element.contentId].yt_loader.getDuration() );
						tv.contents[element.contentId].yt_loader.seekTo( (videoRelativeSeek)/1000, true);
					}	
				} else {
				}
			}
			
		
			/*
			//animazione al ticker
			jQuery('#tickerTv').fadeIn(1, function() {
				jQuery('#tickerTv').fadeOut(200);
			});
			*/
		}
		
	}
	//riavvio il timer
	tv.clockTimer = setTimeout(updateTvOnTimer, tv.clock);
}

//metodo principale che renderizza la view ad ogni ciclo di clock
//prima deve sempre essere chiamato unatantum startRenderer
function tvRendererLoop() {
	//helper functions
	function drawContent(contentId) {
		//azzero apriori il timer di sync video,
		//che potrebbe essere rimasto attivo da
		//un content precedente
		clearInterval(tv.videoSyncInterval);
		
		//azzero i dati video dall'info popup
		jQuery('#livePopupTvInfoForVideoContainer').hide();

		//console.log("disegno il "+contentId);
		//console.log(tv.contents[contentId].mediaTag);
		var isMedia = contentIsMediaTag(tv.contents[contentId]);
		//decido il container
		if ( isMedia ) {
			//le immagini vanno sotto ai testi
			var containerId = '#tvBackgroundContainer';
		} else {
			//ri-visualizzo il foreground container che potrebbe essere stato disabilitato da qualche video precedente
			jQuery("#tvForegroundContainer").show();
			//testi sopra alle immagini
			var containerId = '#tvForegroundContainer';
		}
		//setto size
		if ( isMedia ) {
			//caso immagini
			//console.log("drawContent con contentId = "+contentId+" e content");
			//console.log(tv.contents[contentId]);
			zoomContentToContainer(jQuery(tv.contents[contentId]).find(tv.contents[contentId].mediaTag), containerId, true, tv.contents[contentId].mediaTag);
		} else {
			//caso testi
			zoomTexts(tv.contents[contentId],1,true);
		}
		//setto id
		jQuery( tv.contents[contentId] ).attr('id','tvId'+contentId);
		
		//i video vanno generati programmaticamente tramite le yt api, mentre tutti
		//gli altri contenuti seguono un processo comune qui
		if ( isMedia && tv.contents[contentId].mediaTag == 'iframe' ) {
			//prima di tutto se non era a 1, rimetto a 1x lo slider della velocità e lo disabilito
			var slider_value_for_1x_speed = Math.pow( 1/tv.speedMax, 1/4 );
			var slider_value_for_1x_speed_approx = Math.round( slider_value_for_1x_speed * 100 ) / 100;
			var sliderCurrentValue = Math.round( Number(jQuery('#speedSliderTv').slider("option", "value")) * 100  ) / 100;
			//console.log("ora lo slider vale: "+sliderCurrentValue);
			//console.log("mentre la slider_value_for_1x_speed_approx: "+slider_value_for_1x_speed_approx);
			if ( sliderCurrentValue != slider_value_for_1x_speed_approx ) {
				jQuery('#speedSliderTv').slider('value',slider_value_for_1x_speed);
				
				//jQuery('#speedSliderTv').slider("disable");
				//console.log("chiamo updateSpeed on PLAYING del YT player");
				//updateSpeed("", {'value':slider_value_for_1x_speed}, true);
			}
			jQuery('#speedSliderTv').slider("disable");
			

			var ytVideoId = youtube_parser(jQuery(tv.contents[contentId]).find("iframe").attr('src'));
			//jQuery(containerId).append("<div id='tvId"+contentId+"'></div>");
			//aggiungo al dom
			jQuery(containerId).append( tv.contents[contentId] );
			//stoppo provvisoriamente il play perchè qui si blocca tutto finchè il player non ha bufferizzato e si è messo in play
			pausePlayback(true);
			//per permettere di interagire con il yt player, devo disabilitare provvisoriamente il foreground container
			jQuery("#tvForegroundContainer").hide();
			//creo un yt player sopra
			//prima distruggo un eventuale yt player preesistente
			if ( tv.currentContentWithYtLoader ) {
				tv.contents[tv.currentContentWithYtLoader].yt_loader.destroy();
				tv.currentContentWithYtLoader = false;
			}
			//poi creo il mio nuovo
			tv.currentContentWithYtLoader = contentId;
			//se si sta propagando un evento di timelineClicked, lo consumo qui
			var seekTo = 0;
			var element = getTimelineElement(tv.currentContentWithYtLoader);
			//console.log("sto per buttar fuori video con vin="+element.vin);
			//se era stato specificato un vin, ne tengo conto
			if ( element.vin > 0 ) {
				seekTo += element.vin/1000;
			}
			if ( tv.timelineClicked ) {
				var videoRelativeSeek = tv.playbackTimeCur - element.timing;
				if ( videoRelativeSeek > 0 && videoRelativeSeek <= element.duration ) {
					//console.log("click sul video corrente beccato in fase di draw contents!!!!!!!!!!!!!!!!!!!!");
					tv.timelineClicked = false; //consumo il click sul video corrente
					seekTo += videoRelativeSeek/1000;
				}					
			}
			//console.log("c'ha che creo uno YT player vah");
			tv.contents[contentId].yt_loader = new YT.Player('tvId'+contentId, {
				height: String(jQuery(containerId).height()),
				width: String(jQuery(containerId).width()),
				videoId: ytVideoId,
				events: {
					'onReady': onPlayerReady,
					'onStateChange': onPlayerStateChange
				},
				playerVars: {
					controls: 0,
					showinfo: 0 ,
					wmode: "opaque",
					autoplay: 1,
					start: seekTo,
					disablekb: 1
				}
			});	
			
		} else {
			//per tutto ciò che non è iframe, riabilito lo slider della velocità
			jQuery('#speedSliderTv').slider("enable");
			//lo visualizzerò con un fade
			jQuery( tv.contents[contentId] ).css('display','none');
			//aggiungo al dom
			jQuery(containerId).append( tv.contents[contentId] );
			//setto i colori una prima volta
			applyColors();
		}
		


		//helper function per scelta colori e varie
		function applyColors() {
			if ( isSmartphone ) {
				var textShadowSize = 20;
			} else {
				var textShadowSize = 15;
			}
			//positioning (in centro) solo per i testi 
			if ( !isMedia ) {
				//positioning
				jQuery( tv.contents[contentId] ).css('max-width','80%');
				jQuery( tv.contents[contentId] ).css('position','absolute');
				var left = Math.round( ( jQuery(window).width() - jQuery( tv.contents[contentId] ).width() ) / 2 );
				var top = Math.round( ( jQuery(window).height() - jQuery( tv.contents[contentId] ).height() ) / 2 );
				jQuery( tv.contents[contentId] ).css('left',left+'px');
				jQuery( tv.contents[contentId] ).css('top',top+'px');
				//se non ci sono immagini di fondo, imposto un
				//default color (al container, perchè poi le immagini lo assegnano al container)
				if ( jQuery( '#tvBackgroundContainer' ).children().length == 0 ) {
					if ( contentId == 0 ) {
						//per il primo contenuto del post (che è il suo titolo) uso dei colori prefissati
						jQuery( '#tvForegroundContainer' ).css('color','#000');
						jQuery( '#tvForegroundContainer' ).css('text-shadow','rgba(255,255,255, 1) 0px 0px '+textShadowSize+'px');
						jQuery( '#tvBackgroundContainer' ).css('background-color','#fff');
						jQuery( '#tvBackgroundContainer' ).css('background-image','url("wp-content/plugins/rognone/imgs/bg_noise_white.png")');
						jQuery( '#tvBackgroundContainer' ).css('background-repeat','repeat');
					} else {
						//per tutti gli altri contenuti scelgo il colore di fondo con un algoritmo
						jQuery( '#tvForegroundContainer' ).css('color','#fff');
						jQuery( '#tvForegroundContainer' ).css('text-shadow','rgba(0,0,0, 1) 0px 0px '+textShadowSize+'px');
						jQuery( '#tvBackgroundContainer' ).css('background-color','#000');
						jQuery( '#tvBackgroundContainer' ).css('background-image','url("wp-content/plugins/rognone/imgs/bg_noise_black.png")');
						jQuery( '#tvBackgroundContainer' ).css('background-repeat','repeat');
					}
				}
			}
			//se immagine
			if ( isMedia && ( tv.contents[contentId].mediaTag == 'img' || tv.contents[contentId].mediaTag == 'canvas' ) ) {
				//console.log("chiamato applyColors su "+tv.contents[contentId].mediaTag+" con id "+contentId);
				//metto sempre come sfondo il nero, così le immagini compaiono in fadeIn dal nero
				jQuery( '#tvBackgroundContainer' ).css('background-image','url("wp-content/plugins/rognone/imgs/bg_noise_black.png")');
				jQuery( '#tvBackgroundContainer' ).css('background-repeat','repeat');
				//devo cambiare il colore dei testi in foreground in base al brightness dell'immagine sottostante
				var avgBrightness = 1; //per default assegno nero su bianco
				if ( tv.contents[contentId].avgBrightness ) {
					avgBrightness = tv.contents[contentId].avgBrightness;
					//console.log("applyColors trovato avgBrightness in jquery data: "+avgBrightness);
				} else if ( tv.contents[contentId].mediaTag == 'img' ) {
					avgBrightness = getAvgBrightness('tvId'+contentId,contentId);
					//console.log("applyColors trovato avgBrightness leggendo img: "+avgBrightness);
				}
				if ( avgBrightness > 0.8 ) {
					jQuery( '#tvForegroundContainer' ).css('color','#000');
					jQuery( '#tvForegroundContainer' ).css('text-shadow','rgba(255,255,255, 1) 0px 0px '+textShadowSize+'px');
					//sui desktop lascio sempre lo sfondo nero di default, perchè se passo da nero a bianco fa schifo, e tanto ci va sopra l'immagine
					//invece sugli smartphone devo settare il colore di sfondo perchè l'immagine che ci va sopra è in trasparenza
					if ( isSmartphone ) {
						jQuery( '#tvBackgroundContainer' ).css('background-color','#fff');
						jQuery( '#tvBackgroundContainer' ).css('background-image','url("wp-content/plugins/rognone/imgs/bg_noise_white.png")');
					}
				} else {
					jQuery( '#tvForegroundContainer' ).css('color','#fff');
					jQuery( '#tvForegroundContainer' ).css('text-shadow','rgba(0,0,0, 1) 0px 0px '+textShadowSize+'px');
					if ( isSmartphone ) {
						jQuery( '#tvBackgroundContainer' ).css('background-color','#000');
						jQuery( '#tvBackgroundContainer' ).css('background-image','url("wp-content/plugins/rognone/imgs/bg_noise_black.png")');
					}
				}
			}
			//se video in iframe, aggiusto lo zindex
			if ( isMedia && tv.contents[contentId].mediaTag == 'iframe' ) {
				//console.log("chiamato applyColors su iframe");
				jQuery( tv.contents[contentId] ).find('iframe').each(function(){
					var url = jQuery(this).attr("src");
					if ( url.indexOf("youtube") != -1 && url.indexOf("wmode=transparent") == -1 ) {
						jQuery(this).attr("src",url+"&wmode=transparent");
					}
				});
			}
		}


		
		//fade onload
		jQuery( tv.contents[contentId] ).imagesLoaded( function() {
			
			//se ci sono testi sopra immagini e devo blurrare, allora prima faccio sparire le immagini, che compariranno solo dopo l'applicazione dell'effetto di blur
			//if ( jQuery( '#tvForegroundContainer' ).children().length > 0 ) {
				//jQuery( '#tvBackgroundContainer' ).find('img').hide();
			//}
			//prima il fadein
			jQuery( tv.contents[contentId] ).fadeTo(1, 0, function() {
				var img = jQuery( tv.contents[contentId] ).find('img').get(0);
				//poi se sopra all'immagine ci sono dei testi, devo blurrare l'immagine
				if ( jQuery( '#tvForegroundContainer' ).children().length > 0 ) {
					//console.log("imgOnLoad: CASO IMG + TEXT");
					if ( !isSmartphone ) {
						//console.log("ci passo C");
						//jQuery( '#tvBackgroundContainer' ).find('img').pixastic("blurfast", {amount:2.0},function() { console.log("finito A"); jQuery( tv.contents[contentId] ).fadeIn(fadeDuration*5); }).pixastic("noise", {mono:true,amount:1.0,strength:0.20});
						//var img = jQuery( '#tvBackgroundContainer' ).find('img').get(0);
						if ( img ) {
							//console.log("imgOnLoad: NO SMARTPHONE, SI' IMG");
							//console.log(img);
							var optionBlur = {amount:2.0};
							//stoppo provvisoriamente il play perchè qui si blocca tutto finchè pixastic non ha finito
							pausePlayback(true);
							Pixastic.process( img, "blurfast", optionBlur,function() { 
								//pixastic trasforma il mio elemento immagine in una canvas, quindi devo cambiare il mediatag
								tv.contents[contentId].mediaTag = "canvas";
								for ( var n=0; n < tv.timeline.length; n++ ) {
									var element = tv.timeline[n];
									if ( element.contentId == contentId ) {
										element.tag = "canvas";
										break;
									}
								}
								//console.log("pixastic: finito A"); 
								//var imgBlurred = jQuery( '#tvBackgroundContainer' ).find('img').get(0);
								var imgBlurred = jQuery( tv.contents[contentId] ).find('canvas').get(0);
								//console.log(imgBlurred); 
								Pixastic.process( imgBlurred, "noise", {mono:true,amount:1.0,strength:0.20}, function() {
									//console.log("pixastic: finito B"); 
									applyColors();
									//alla fine dell'elaborazione dell'immagine riparte il play
									startPlayback(true);
									jQuery( tv.contents[contentId] ).delay(fadeDuration).fadeTo(fadeDuration*5,1); 
								});
							});
						} else {
							applyColors();
							jQuery( tv.contents[contentId] ).fadeTo(fadeDuration*5,1); 
						}
					} else {
						//agli smartphone gli risparmio un po' di effetti
						applyColors();
						jQuery( tv.contents[contentId] ).fadeTo(1,1); 
						//jQuery( '#tvBackgroundContainer' ).find('img').pixastic("blurfast", {amount:2.0});
						//invece del blur, setto l'opacity
						jQuery( '#tvBackgroundContainer' ).find('img').fadeTo( 0, 0.5 );
						
					}
				} else {
					//console.log("imgOnLoad: CASO IMG DA SOLA");
					//nel caso l'immagine sia da sola distinguo due casi:
					//se è più piccola dello screen (e qundi verrà zoomata), allora applico blur+noise
					if ( !isSmartphone ) {
						if ( img ) {
							//console.log("imgOnLoad: NO SMARTPHONE, SI' IMG");
							var sourceW = img.naturalWidth;
							var sourceH = img.naturalHeight;
							var diffPercW = jQuery('#tvBackgroundContainer').width() / sourceW;
							var diffPercH = jQuery('#tvBackgroundContainer').height() / sourceH;
							//console.log("imgOnLoad: sourceW = "+sourceW+ " diffPercW = "+diffPercW);
							//console.log("imgOnLoad: sourceH = "+sourceH+ " diffPercH = "+diffPercH);
							if ( diffPercW > 1 || diffPercH > 1 ) {
								//l'immagine sorgente sta venendo zoomata. in base a quanto viene zoomata la blurro
								var amount = Math.max( diffPercW, diffPercH ); //numero > 1, indica di quanto effettivamente viene ingrandita l'immagine
								var fxAmount = Math.pow(amount-1,2)/20; //traslata su una parabolica per quanto effetto applicare
								//console.log("imgOnLoad: vai di effettti! fxAmount="+fxAmount);
								var optionBlur = {"amount":fxAmount};
								var optionNoise = {mono:true,"amount":fxAmount,strength:0.30};
								//stoppo provvisoriamente il play perchè qui si blocca tutto finchè pixastic non ha finito
								pausePlayback(true);
								Pixastic.process( img, "blurfast", optionBlur,function() { 
									//pixastic trasforma il mio elemento immagine in una canvas, quindi devo cambiare il mediatag
									tv.contents[contentId].mediaTag = "canvas";
									for ( var n=0; n < tv.timeline.length; n++ ) {
										var element = tv.timeline[n];
										if ( element.contentId == contentId ) {
											element.tag = "canvas";
											break;
										}
									}
									//console.log("pixastic: finito A"); 
									//var imgBlurred = jQuery( '#tvBackgroundContainer' ).find('img').get(0);
									var imgBlurred = jQuery( tv.contents[contentId] ).find('canvas').get(0);
									//console.log(imgBlurred); 
									Pixastic.process( imgBlurred, "noise", optionNoise, function() {
										//console.log("pixastic: finito B"); 
										applyColors();
										//alla fine dell'elaborazione dell'immagine riparte il play
										startPlayback(true);
										jQuery( tv.contents[contentId] ).delay(fadeDuration).fadeTo(fadeDuration*5,1); 
									});
								});
							} else {
								//l'immagine è abbastanza grande, non faccio nulla
								applyColors();
								jQuery( tv.contents[contentId] ).fadeTo(fadeDuration*5,1); 
								
							}
						} else {
							//sicuramente era un'immagine, ma se non lo fosse, non faccio nulla
							applyColors();
							jQuery( tv.contents[contentId] ).fadeTo(fadeDuration*5,1); 
						}
					} else {
						//agli smartphone gli risparmio tutti gli effetti
						applyColors();
						jQuery( tv.contents[contentId] ).fadeTo(fadeDuration*5,1); 
					}
				}
			});
			/*
			//prima il fadein
			jQuery( tv.contents[contentId] ).fadeIn(fadeDuration*5, function() {
				//poi se sopra all'immagine ci sono dei testi, devo blurrare l'immagine
				if ( jQuery( '#tvForegroundContainer' ).children().length > 0 ) {
					if ( !isSmartphone ) {
						jQuery( '#tvBackgroundContainer' ).find('img').pixastic("blurfast", {amount:2.0}).pixastic("noise", {mono:true,amount:1.0,strength:0.20});
					} else {
						//agli smartphone gli risparmio un po' di effetti
						jQuery( '#tvBackgroundContainer' ).find('img').pixastic("blurfast", {amount:2.0});
					}
					//pixastic trasforma il mio elemento immagine in una canvas, quindi devo cambiare il mediatag
					tv.contents[contentId].mediaTag = "canvas";
				}
			});
			*/
		});
	}
	function removeContent(contentId) {
		//console.log("rimuovo il "+contentId);
		//jQuery( '#tvId'+contentId ).fadeOut(fadeDuration, function(){
			jQuery( '#tvId'+contentId ).remove();
		//});
	}
	
	
	
	//prima di aggiornare il time corrente, lo salvo per avere il time precedente
	tv.playbackTimePrev = tv.playbackTimeCur;
	//se qualcuno si è dimenticato di inizializzare il renderer, lo rifaccio ora
	if ( tv.playbackTimeStart == 0 ) {
		initTvRenderer();
	}
	//il rendering sta girando
	//questo dovrebbe essere l'unico punto in cui si setta direttamente tv.playbackTimeCur. in tutti gli altri casi si usa la function setPlaybackTimeCurWithSpeed()
	tv.playbackTimeCur = getSystime() - tv.playbackTimeStart;
	
	jQuery('#liveTimerTv').html( formatTimer(tv.playbackTimeCur)+'<span id="liveTimerTvTot">'+formatTimer(applySpeed(tv.timelineTimeTot))+'</span>' );
	
	//console.log('tvRendererLoop: tv.playbackTimeCur='+tv.playbackTimeCur+' tv.playbackTimeStart='+tv.playbackTimeStart+' applySpeed(tv.timelineTimeTot)='+applySpeed(tv.timelineTimeTot));
	
	//trovo tutti gli eventi nel range di tempo che va da ora al loop precedente
	//var timeDiff = tv.playbackTimeCur - tv.playbackTimePrev;
	//for ( var x=0; x < tv.timeline.length; x++ ) {
	for ( var x=tv.timeline.length-1; x >= 0; x-- ) {
		var element = tv.timeline[x];
		var isStart = false;
		var isEnd = false;
		var isDuring = false;
		//caso di elemento che inizia
		if ( 
			applySpeed(element.timing) >= tv.playbackTimePrev
			&&
			applySpeed(element.timing) <= tv.playbackTimeCur
		) {
			isStart = true;
		}
		//caso di elemento che finisce
		if ( 
			applySpeed(element.timing) + applySpeed(element.duration) >= tv.playbackTimePrev
			&&
			applySpeed(element.timing) + applySpeed(element.duration) <= tv.playbackTimeCur
		) {
			isEnd = true;
		}
		//caso di elemento che perdura
		if ( 
			applySpeed(element.timing) + applySpeed(element.duration) >= tv.playbackTimeCur
			&&
			applySpeed(element.timing) <= tv.playbackTimePrev
		) {
			isDuring = true;
		}
		
		//butto via gli elementi che iniziano e finiscono in un solo loop
		if ( isStart && isEnd ) {
		//fadeIn per chi entra
		} else if ( isStart ) {
			//console.log("isStart: lo creo: "+element.contentId);
			drawContent(element.contentId);
			//console.log('appendo alla scena: '+tv.contents[element.contentId]);
		//fadeOut per chi esce
		} else if ( isEnd ) {
			removeContent(element.contentId);
		} else if ( isDuring ) {
			//controllo se non esiste già, lo rivisualizzo
			if ( jQuery( '#tvId'+element.contentId ).length == 0 ) {
				//console.log("isDuring: lo creo: "+element.contentId);
				drawContent(element.contentId);
			}
			// QUI!!! va usato show() SOLO se l'elemento non è visibile, altrimenti si perderebbe il fadeIn
			/*	
			} else if ( jQuery( '#tvId'+element.contentId ).is(":hidden") ) {
				//console.log("isDuring: lo showo");
				//jQuery( '#tvId'+element.contentId ).show();
			}
			*/
		} else {
			//se non è Start, End o During, vuol dire che è un evento iniziato e finito o prima o dopo il time current, e quindi non deve essere visibile
			removeContent(element.contentId);
		}
			
	}
}


//una canvas con disegnata la timeline
	//con vari colori per i vari tipi di contanuti
	//interattiva: cliccando su un elemento della timeline,
	//si sposta il tempo corrente all'inizio di quell'elemento
function drawTimeline(){
	//console.log("drawTimeline");
	//console.log(tv.timeline);
	if ( tv.timeline.length > 0 ) {
		//helpers
		function msecToPix(ms) {
			var px = 0;
			var pxPerMs = canvasW / applySpeed( tv.timelineTimeTot );
			//var px = Math.round( pxPerMs * ms );
			var px = pxPerMs * ms; //così esce antialias!
			return px;
		}
		if ( isSmartphone ) {
			var margin = 2;
		} else {
			var margin = 1;
		}
		var canvasH = tv.timelineCanvasHeight;
		var canvasW = jQuery('#livePanelTv').width();
		var buttonsWidth = tv.livePanelTvHeight;
		var buttonsHeight = tv.livePanelTvHeight;
		
		jQuery('#timeline').width(canvasW);
		jQuery('#timeline').height(canvasH);
		jQuery('#timeline').css('left',0+'px');
		jQuery('#timeline').css('top',0+'px');
		
		jQuery('#timelineAreahit').width(canvasW);
		jQuery('#timelineAreahit').height(canvasH);
		jQuery('#timelineAreahit').css('left',0+'px');
		jQuery('#timelineAreahit').css('top',0+'px');
		
		if ( isSmartphone || jQuery(window).width() < 900 ) {
			jQuery('#liveTitleTv').empty();
			jQuery('#liveTitleTv').width(buttonsWidth);
			jQuery('#liveTitleTv').height(buttonsHeight);
			jQuery('#liveTitleTv').css('padding','0px');
			jQuery('#liveTitleTv').css('margin','0px');
		} else {
			jQuery('#liveTitleTv').height(tv.livePanelTvHeight-10);
		}
		
		//jQuery('#liveTimerTv').width(4*buttonsWidth);
		jQuery('#timelineButtonPrev').width(buttonsWidth);
		jQuery('#timelineButtonNext').width(buttonsWidth);
		jQuery('#liveButtonPauseTv').width(buttonsWidth);
		jQuery('#liveButtonPlayTv').width(buttonsWidth);
		jQuery('#liveButtonExitTv').width(buttonsWidth);
		jQuery('#timelineButtonPrevPost').width(buttonsWidth);
		jQuery('#timelineButtonNextPost').width(buttonsWidth);
		jQuery('#liveButtonSettings').width(buttonsWidth);
		jQuery('#liveButtonInfo').width(buttonsWidth);
		
		jQuery('#liveTimerTv').height(buttonsHeight);
		jQuery('#liveTimerTv').css('font-size',String(Number(buttonsHeight)/3*2)+'px');
		jQuery('#liveTimerTvTot').css('font-size',String(Number(buttonsHeight)/3)+'px');
		jQuery('#liveTitleTv').css('font-size',String(Number(buttonsHeight)/3)+'px');
		jQuery('#liveTimerTv').css('line-height',buttonsHeight+'px');
		jQuery('#timelineButtonPrev').height(buttonsHeight);
		jQuery('#timelineButtonNext').height(buttonsHeight);
		jQuery('#liveButtonPauseTv').height(buttonsHeight);
		jQuery('#liveButtonPlayTv').height(buttonsHeight);
		jQuery('#liveButtonExitTv').height(buttonsHeight);
		jQuery('#liveButtonSettings').height(buttonsHeight);
		jQuery('#liveButtonInfo').height(buttonsHeight);
		jQuery('#timelineButtonPrevPost').height(buttonsHeight);
		jQuery('#timelineButtonNextPost').height(buttonsHeight);
		
		jQuery('#liveTimerTv').css('top',tv.timelineCanvasHeight+'px');
		jQuery('#timelineButtonPrev').css('top',tv.timelineCanvasHeight+'px');
		jQuery('#timelineButtonNext').css('top',tv.timelineCanvasHeight+'px');
		jQuery('#liveButtonPauseTv').css('top',tv.timelineCanvasHeight+'px');
		jQuery('#liveButtonPlayTv').css('top',tv.timelineCanvasHeight+'px');
		jQuery('#liveButtonExitTv').css('top',tv.timelineCanvasHeight+'px');
		jQuery('#liveButtonSettings').css('top',tv.timelineCanvasHeight+'px');
		jQuery('#liveButtonInfo').css('top',tv.timelineCanvasHeight+'px');
		jQuery('#timelineButtonPrevPost').css('top',tv.timelineCanvasHeight+'px');
		jQuery('#timelineButtonNextPost').css('top',tv.timelineCanvasHeight+'px');
		jQuery('#liveTitleTv').css('top',tv.timelineCanvasHeight+'px');
		
		//centro tutto
		//if ( isSmartphone ) {
			var sum=0;
			jQuery('#livePanelTvInnerContainer').children(':visible').each( function(){ sum += jQuery(this).outerWidth(true); });
			jQuery('#livePanelTvInnerContainer').width( sum );
			jQuery('#livePanelTvInnerContainer').css( "margin","0 auto" );
		//}
		
		/*
		jQuery('#timelineButtonPrev').css('left',buttonsWidth+'px');
		jQuery('#timelineButtonNext').css('left',2*buttonsWidth+'px');
		*/
		//jQuery('#liveTimerTv').css('left',3*buttonsWidth+'px');
		jQuery('#timelineSelector').width(2*margin);
		jQuery('#timelineSelector').height(canvasH);
		jQuery('#timelineSelectorLabel').height(canvasH);
		jQuery('#timelineSelector').css('top',0+'px');
		jQuery('#timelineSelectorLabel').css('top',String( - jQuery('#timelineSelectorLabel').outerHeight() )+'px');
		var canvas = document.getElementById('timeline');
		canvas.width  = canvasW;			
		canvas.height = canvasH;
		if (canvas.getContext){  
			var ctx = canvas.getContext('2d');  
			//resetto la view
			ctx.clearRect ( 0, 0, canvasW, canvasH );
			//disegno gli elementi
			for ( var x=0; x < tv.timeline.length; x++ ) {
				var event = tv.timeline[x];
				var eventX = msecToPix(applySpeed(event.timing));
				var eventW = msecToPix(applySpeed(event.duration)) - margin;
				//se il mio elemento è correntemente in play, dovrò disegnarne la parte rimenente,
				//quindi mi salvo alcune var
				if ( tv.playbackTimeCur > applySpeed(event.timing) && tv.playbackTimeCur < applySpeed(event.timing + event.duration) ) {
					var currentX = msecToPix(tv.playbackTimeCur);
					var currentW = msecToPix(applySpeed(event.duration) - ( tv.playbackTimeCur - applySpeed(event.timing) )) - margin;
				} else {
					var currentX = 0;
					var currentW = 0;
				}
				
				if ( eventW < 1 ) eventW = 1; //minimo 1px è sindacale
				if ( event.isText ) {
					var eventColor = 'rgba(200,200,200,0.8)';
					var eventColorRemain = 'rgba(255,255,255,0.8)';
					//var eventColor = '#02f136';
					if ( tv.onlyTexts ) {
						var eventH = canvasH;
					} else {
						var eventH = canvasH/2 - margin/2;
					}
					var eventY = 0;
				} else {
					if ( event.tag == "img" || event.tag == "canvas" ) {
						var eventColor = 'rgba(150,150,150,0.8)';
						var eventColorRemain = 'rgba(255,255,255,0.8)';
					} else if ( event.tag == "iframe" ) {
						var eventColor = 'rgba(100,100,100,0.8)';
						var eventColorRemain = 'rgba(255,255,255,0.8)';
					} else {
						console.log("qui non ci dovrei mai entrare");
						var eventColor = 'rgba(0,255,0,1)';
						var eventColorRemain = 'rgba(255,255,255,0.8)';
					}
					//var eventColor = '#f102bd';
					if ( tv.onlyVisuals ) {
						var eventH = canvasH;
						var eventY = 0;
					} else {
						var eventH = canvasH/2 - margin/2;
						var eventY = canvasH/2 + margin/2;
					}
				}
				drawRect(ctx,eventX,eventY,eventW,eventH,eventColor,0);
				//se il mio elemento è correntemente in play, ne evidenzio la parte rimenente, a mo di timer
				if ( currentX > 0 && currentW > 0 ) {
					drawRect(ctx,currentX,eventY,currentW,eventH,eventColorRemain,0);
				}
			}
			
			//disegno il current time
			var curTimeW = 2+msecToPix(tv.playbackTimeCur - tv.playbackTimePrev);
			var curTimeX = msecToPix(tv.playbackTimeCur)-curTimeW;
			drawRect(ctx,curTimeX,0,curTimeW/2,canvasH,'rgba(0,0,0,0.9)',0);
			drawRect(ctx,curTimeX+curTimeW/2,0,curTimeW/2,canvasH,'rgba(255,255,255,0.9)',0);
			//prima la metà nera
			//drawRect(ctx,curTimeX,0,curTimeW/2,canvasH,'rgba(255,255,255,0.8)',0);
			//poi la metà bianca
			//drawRect(ctx,curTimeX+curTimeW/2,0,curTimeW,canvasH,'rgba(0,0,0,0.8)',0);
			
		}
	}
}


function populateTimeline( ) {
	//prima un ciclo sui contenuti disponibili per epurarne i tag meno importanti, e salvare per ciascuno il media tag scelto
	for ( var x=0; x<tv.contents.length; x++ ) {
		var content = tv.contents[x];
		//prima un ciclo sui media tags riconosciuti per capire il tipo di contenuto del mio content
		content.mediaTag = '';
		for ( var i=0; i<tv.enabledMediaTags.length; i++ ) {
			if ( jQuery(content).find(tv.enabledMediaTags[i]).length > 0 ) {
				content.mediaTag = tv.enabledMediaTags[i];
				break;
			}
		}
		//poi un ciclo per epurare dal mio content tutti gli altri media tag diversi da quello scelto
		for ( i=0; i<tv.enabledMediaTags.length; i++ ) {
			if ( tv.enabledMediaTags[i] != content.mediaTag ) {
				jQuery(content).find(tv.enabledMediaTags[i]).remove();
			}
		}
				
	}
	
	
	//se non sono già caricate, carico le youtube iframe_api
	//queste a loro volta chiameranno onYouTubeIframeAPIReady()
	//che a sua volta chiamerà onPreloaderReady()
	//che a sua volta chiamerà populateTimelineAndAllTheRestYeah()
	if ( ! tv.yt_api_script_loader ) {
		loadYTApi();
	} else {
		//console.log("YT API GIA PRESENTI");
		//le youtube api sono già caricate, skippo allo step successivo
		onYouTubeIframeAPIReady();
	}
	
	//il resto del processo viene obbligatoriamente continuato (in populateTimelineAndAllTheRestYeah() ) 
	//dopo che si saranno fetchate le durate dei video con chiamate alle youtube api
	
}

function loadYTApi() {
	//console.log("CARICO YT API");
	tv.yt_api_script_loader = document.createElement('script');
	tv.yt_api_script_loader.src = "//www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tv.yt_api_script_loader, firstScriptTag);
}

function populateTimelineAndAllTheRestYeah( ) {
	//prima di popolarla, azzero la timeline
	tv.timeline = [];
	tv.timelineMediaBuffer = [];
	var isTextPrev = false;
	var onlyTexts = true;
	var onlyVisuals = true;
	
	/* helper functions di gestione shortcodes */
	//ci sono 2 casi:
	//il mio contenuto era un tag <rog>, quindi è già stato mergiato con il contenuto successivo, che ne eredita gli attributi
	//oppure il tag <rog> è un children del mio contenuto, quindi devo trovarlo, e leggerne gli attributi
	
	/*
	//gestisco lo shortcode "solo"
	//vuol dire che se è un'immagine non deve avere sopra testi, o se è un testo non deve avere sotto immagini
	function manageShortcode_solo(content) {
		if ( jQuery(content).attr('solo') == 'solo' || jQuery(content).find('rog').attr('solo') == 'solo' ) {
			//console.log("questo andrà dasolo!");
			flushMediaBuffer();
		}
	}
	*/
	
	//gestisco lo shortcode "dur"
	//indica la durata in secondi del mio content, e bypassa quella che calcolerebbe la timeline in automatico
	function manageShortcode_dur(content) {
		var dur = 0;
		if ( !isNaN( jQuery(content).attr('dur') ) ) {
			dur = jQuery(content).attr('dur');
		} else if ( !isNaN( jQuery(content).find('rog').attr('dur') ) ) {
			dur = jQuery(content).find('rog').attr('dur');
		}
		//if ( dur ) console.log("dagli shortcodes la duration vale "+dur);
		return Number(dur)*1000;
	}
	
	//gestisco lo shortcode "vin"
	//indica da che timing far partire il video, in HH:MM:SS
	function manageShortcode_vin(content) {
		var vin = "";
		if ( jQuery(content).attr('vin') != "" ) {
			vin = jQuery(content).attr('vin');
		} else if ( jQuery(content).find('rog').attr('vin') != "" ) {
			vin = jQuery(content).find('rog').attr('vin');
		}
		//console.log("uèuèuèuèu: vin="+vin);
		//console.log("uèuèuèuèu: vin="+HHMMSStoS(vin)*1000);
		return HHMMSStoS(vin)*1000;
	}
	
	//gestisco lo shortcode "vout"
	//indica fino a che timing dovrà andare il video, in HH:MM:SS
	function manageShortcode_vout(content) {
		var vout = "";
		if ( jQuery(content).attr('vout') != "" ) {
			vout = jQuery(content).attr('vout');
		} else if ( jQuery(content).find('rog').attr('vout') != "" ) {
			vout = jQuery(content).find('rog').attr('vout');
		}
		//console.log("uèuèuèuèu: vout="+vout);
		//console.log("uèuèuèuèu: vout="+HHMMSStoS(vout)*1000);
		return HHMMSStoS(vout)*1000;
	}
	
	function HHMMSStoS(hhmmss) {
		//trasformo da HH:MM:SS in S
		var secs = 0;
		if ( hhmmss ) {
			var a = hhmmss.split(':');
			if (a.length == 3 ) {
				secs = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);	
			}
		}
		return secs;
		
	}
	
	function getTextDuration(content) {
		var duration = 0;
		//duration = countWords( jQuery(content).text() )/tv.wps*1000;
		duration = jQuery(content).text().length/tv.cps*1000;
		//correggo secondo i limiti
		if ( duration > tv.maxTextDuration ) duration = tv.maxTextDuration;
		if ( duration < tv.minTextDuration ) duration = tv.minTextDuration;
		return duration;
	}
	
	//MAIN LOOP
	//il ciclo sui contents con la logica vera e propria per la timeline
	//questo è il ciclo che prende un contenuto alla volta e lo trasforma in un evento nella timeline
	var lastWasText = false;
	//var lastWasImage = false;
	var lastImgIndex = 0; //indice dell'ultimo contenuto immagine
	var lastTextTiming = 0; //indice dell'ultimo contenuto immagine
	var originalContentsLength = tv.contents.length; //loopo su questa variabile, e non sulla length effettiva che può aumentare a causa dell'aggiunta durante il loop di contenuti alla fine dell'array tv.contents
	for ( x=0; x<originalContentsLength; x++ ) {
		//init delle vars
		var content = tv.contents[x];
		var duration = 0; //ms - durata del contenuto
		var vin = 0; //ms - ingresso del contenuto
		var vout = 0; //ms - uscita del contenuto
		var isImage = mediaTagEnabled(content.mediaTag) && ( content.mediaTag == 'img' || content.mediaTag == 'canvas' );
		var isText = !mediaTagEnabled(content.mediaTag);
		var isLast = x == originalContentsLength - 1;
		//se è il primo testo di una serie, ne memorizzo il timing
		//mi servirà per inserire l'immagine di sfondo
		//(questo controllo va fatto prima di sovrascrivere lastWasText)
		if ( isText && !lastWasText ) {
			lastTextTiming = tv.timelineTimeCur;
		}
		//se ci sono degli shortcodes, ne tengo conto qui
		duration = manageShortcode_dur(content);
		vin = manageShortcode_vin(content);
		vout = manageShortcode_vout(content);
		
		//qui la logica vera e propria:
		//se il precedente era un testo, e l'attuale non è un testo (o è l'ultimo content), 
		//vuol dire che si chiude una serie di (uno o più) testi
		//quindi se esiste una last image, la uso come sfondo per i miei testi
		if ( lastWasText && lastImgIndex > 0 && ( !isText || isLast ) ) {
			//clono?
			//console.log("before cloning: ");
			//console.log(tv.contents);
			var clonedElement = jQuery(tv.contents[lastImgIndex]).clone(true,true);
			clonedElement.mediaTag = 'img';
			tv.contents.push( clonedElement );
			//console.log("after cloning: ");
			//console.log(tv.contents);
			if ( isText ) {
				var cloneDuration = tv.timelineTimeCur - lastTextTiming + getTextDuration(content);
			} else {
				var cloneDuration = tv.timelineTimeCur - lastTextTiming;
			}
			tv.timeline.push({ 'contentId':tv.contents.length-1, 'isText':false, 'tag':tv.contents[lastImgIndex].mediaTag, 'timing':lastTextTiming, 'duration':cloneDuration, 'duration_shortcodes':duration});
			//console.log("clonerei con timing: "+lastTextTiming+" e duration: "+cloneDuration);
		}
		
		//infine l'inserimento dei content come elementi della timeline
		if ( isText ) {
			//se non è stata definita una duration con gli shortcodes,
			//calcolo quanti secondi servono per leggere il testo
			if ( duration == 0 ) {
				duration = getTextDuration(content);
			}
			//lo inserisco nella timeline
			tv.timeline.push({ 'contentId':x, 'isText':true, 'tag':content.mediaTag, 'timing':tv.timelineTimeCur, 'duration':duration});
		} else if ( content.mediaTag == 'iframe' ) {
			//caso contenuto video
			//nel caso dei video a volte yt scazza le durate, e devo scartare il video perchè unplayable
			if ( !content.yt_loader || typeof content.yt_loader.getDuration !== 'function' || content.yt_loader.getDuration() == 0 ) {
				//non faccio niente, butto il content
			} else {
				//se sono stati specificati vin o vout correggo la duration
				if ( vin > 0 && vout > 0 ) {
					duration = vout - vin;
				} else if ( duration == 0 && vin > 0 ) {
					duration = content.yt_loader.getDuration()*1000;
					duration -= vin;
				} else if ( duration == 0 && vout > 0 ) {
					duration = vout;
				} else if ( duration == 0 ) {
					duration = content.yt_loader.getDuration()*1000;
				} else if ( duration > 0 && vin > 0 ) {
					//tengo la duration specificata
				} else if ( duration > 0 && vout > 0 ) {
					vin = vout - duration;
				}
				//lo inserisco nella timeline
				tv.timeline.push({ 'contentId':x, 'isText':false, 'tag':content.mediaTag, 'timing':tv.timelineTimeCur, 'duration':duration, 'vin':vin, 'vout':vout});
			}
		} else {
			//caso contenuti visuali
			duration = tv.minMediaDuration;
			tv.timeline.push({ 'contentId':x, 'isText':false, 'tag':content.mediaTag, 'timing':tv.timelineTimeCur, 'duration':duration, 'duration_shortcodes':duration});
		}
		//aggiorno la posizione temporale della timeline al tempo di fine del mio content
		tv.timelineTimeCur += duration;
		//alla fine, se era un'immagine, la tengo come possibile sfondo futuro
		if ( isImage ) {
			//lastWasImage = true;
			//se è un'immagine, la salvo come ultima immagine nel caso servisse da sfondo per i testi
			lastImgIndex = x;
		//} else {
			//lastWasImage = false;
		}
		if ( isText ) {
			lastWasText = true;
			onlyVisuals = false;
		} else {
			lastWasText = false;
			onlyTexts = false;
		}
		
	}	
	
	/*
	//MAIN LOOP (old version)
	//il ciclo sui contents con la logica vera e propria per la timeline
	//questo è il ciclo che prende un contenuto alla volta e lo trasforma in un evento nella timeline
	for ( x=0; x<tv.contents.length; x++ ) {
		//init delle vars
		var content = tv.contents[x];
		var duration = 0; //ms - durata del contenuto
		var vin = 0; //ms - ingresso del contenuto
		var vout = 0; //ms - uscita del contenuto

		//se ci sono degli shortcodes, ne tengo conto qui
		duration = manageShortcode_dur(content);
		vin = manageShortcode_vin(content);
		vout = manageShortcode_vout(content);
		manageShortcode_solo(content);
		
		//prima faccio un distinguo tra content testuali, e content non testuali
		//console.log("populateTimelineAndAllTheRestYeah: content.mediaTag="+content.mediaTag);
		var isText = !mediaTagEnabled(content.mediaTag);
		
		if ( isText ) {
			//caso contenuti di solo testo
			onlyVisuals = false;
			
			//se non è stata definita una duration con gli shortcodes,
			//calcolo quanti secondi servono per leggere il testo
			if ( duration == 0 ) {
				//duration = countWords( jQuery(content).text() )/tv.wps*1000;
				duration = jQuery(content).text().length/tv.cps*1000;
				
				//correggo secondo i limiti
				if ( duration > tv.maxTextDuration ) duration = tv.maxTextDuration;
				if ( duration < tv.minTextDuration ) duration = tv.minTextDuration;
			}
			
			//lo inserisco nella timeline
			tv.timeline.push({ 'contentId':x, 'isText':true, 'tag':content.mediaTag, 'timing':tv.timelineTimeCur, 'duration':duration});
			
			//aggiorno la posizione temporale della timeline al tempo di fine del mio content
			tv.timelineTimeCur += duration;
			
		} else if ( content.mediaTag == 'iframe' ) {
			//caso contenuto video
			onlyTexts = false;
			//console.log('populateTimelineAndAllTheRestYeah: considero il content: ');
			//console.log(content);
			//console.log(content.yt_loader);
			//nel caso dei video a volte yt scazza le durate, e devo scartare il video perchè unplayable
			if ( !content.yt_loader || typeof content.yt_loader.getDuration !== 'function' || content.yt_loader.getDuration() == 0 ) {
				//non faccio niente, butto il content
			} else {
				
				//se sono stati specificati vin o vout correggo la duration
				if ( vin > 0 && vout > 0 ) {
					duration = vout - vin;
				} else if ( duration == 0 && vin > 0 ) {
					duration = content.yt_loader.getDuration()*1000;
					duration -= vin;
				} else if ( duration == 0 && vout > 0 ) {
					duration = vout;
				} else if ( duration == 0 ) {
					duration = content.yt_loader.getDuration()*1000;
				} else if ( duration > 0 && vin > 0 ) {
					//tengo la duration specificata
				} else if ( duration > 0 && vout > 0 ) {
					vin = vout - duration;
				}
				
				
				//ogni volta che aggiungo un video, faccio un flush delle eventuali immagini uscite prima di me.
				flushMediaBuffer();
				//lo inserisco nella timeline
				tv.timeline.push({ 'contentId':x, 'isText':false, 'tag':content.mediaTag, 'timing':tv.timelineTimeCur, 'duration':duration, 'vin':vin, 'vout':vout});
				
				//aggiorno la posizione temporale della timeline al tempo di fine del mio content
				tv.timelineTimeCur += duration;
			}
		} else {
			//caso contenuti visuali
			onlyTexts = false;
			
			//considero se il content precedente era testuale o ancora visuale
			if ( isTextPrev ) {
				//il tipo di content è cambiato da testuale a visuale, quindi posso salvare nella timeline tutti i vecchi tag visuali bufferizzati fin'ora (se ce ne sono)
				flushMediaBuffer();
			}
			//metto il mio content in un buffer perchè non posso ancora salvarlo in timeline
				//nel buffer va salvato assieme al suo timing, che vale tv.timelineTimeCur
				//ovviamente poi questo timing verrà sovrascritto con quello definitivo
			tv.timelineMediaBuffer.push({ 'contentId':x, 'isText':false, 'tag':content.mediaTag, 'timing':tv.timelineTimeCur, 'duration':0, 'duration_shortcodes':duration});
		}
		//se il mio contenuto era l'ultimo salvo il buffer
		if ( x == tv.contents.length - 1 ) {
			flushMediaBuffer();
		}
		
		//se ci sono degli shortcodes, ne tengo conto qui
		manageShortcode_solo(content);
		
		//tengo una copia del mio tipo di content per l'iterazione successiva
		isTextPrev = isText;

	}
	//fine MAIN LOOP
	*/
	
	
	//ordino la timeline per timing
	tv.timeline.sort( function(a, b) {
		return a.timing-b.timing;
	})
	
	//salvo la durata totale
	tv.timelineTimeTot = tv.timelineTimeCur;
	//azzero la posizione nella timeline
	tv.timelineTimeCur = 0;
	
	//salvo se ci sono solo un tipo o l'altro di contents
	tv.onlyVisuals = onlyVisuals;
	tv.onlyTexts = onlyTexts;
	
	//console.log("alla fine ho creato sto muostruo:");
	//console.log(tv.timeline);
	
	
	//ora che la timeline è popolata, continuo il processo
	
	//creo interfaccia
	createUi();
	
	//resetto il renderer. verrà chiamato dal timer
	initTvRenderer();

	//accendo il renderer, ovvero
	//attivo il timer che aggiornerà i contenuti
	//questo timer non si ferma mai fino a che un nuovo post non viene caricato
	//lo stop si ottiene con un flag che dice al timer di skippare al prossimo loop,
	//stoppo tutti i timeout eventualmente rimasti attivi
	clearTimeout(tv.userInactivity);
	clearTimeout( tv.clockTimer );
	
	tv.clockTimer = setTimeout(updateTvOnTimer, tv.clock);
	//console.log(tv.clockTimer);
	
	//tolgo la busy icon
	jQuery('#liveBusyIconContainer').hide();
	
	//metto in play
	startPlayback();	
	
}

function flushMediaBuffer() {
	if ( tv.timelineMediaBuffer.length > 0 ) {
		//helpers functions
		function sumDurationTill(index) {
			var totDuration = 0;
			for ( var i=0; i<index; i++ ) {
				totDuration += Number(getMediaDuration(i));
			}
			//console.log("sumDurationTill con index="+index+" e totDuration="+totDuration);
			return totDuration;
		}
		function getMediaDuration(index) {
			var element = tv.timelineMediaBuffer[index];
			if ( !isNaN(element.duration_shortcodes) && Number(element.duration_shortcodes) > 0 ) {
				//console.log("getMediaDuration con index="+index+" e duration da shortcodes = "+element.duration_shortcodes);
				return Number(element.duration_shortcodes);
			} else {
				//console.log("getMediaDuration con index="+index+" e duration = minMediaDuration = "+tv.minMediaDuration);
				return tv.minMediaDuration;
			}
		}
		
		
		//calcolo il tempo minimo totale: sommo le duration di ogni content 
		//(se è stata specificata una duration con shortcodes tengo quella, altrimenti assegno minMediaDuration al content)
		var minTimeRequired = sumDurationTill(tv.timelineMediaBuffer.length);
		//timing del primo elemento
		var firstElementTime = tv.timelineMediaBuffer[0].timing;
		//calcolo il tempo a disposizione, ovvero il tempo tra:
		//tv.timelineTimeCur
		//e il timing del primo content visuale del buffer (il più vecchio, ma dovrebbero avere tutti lo stesso timing)
		//questo è il tempo che ho a disposizione. 
		var maxTimeAvailable = tv.timelineTimeCur - firstElementTime;
		//se le immagini durano più di questo tempo:
		if ( minTimeRequired > maxTimeAvailable ) {
			//le salvo nella timeline con la loro duration, e poi aggiorno tv.timelineTimeCur di conseguenza
			var element = {};
			for ( var i=0; i<tv.timelineMediaBuffer.length; i++ ) {
				element = tv.timelineMediaBuffer[i];
				element.timing = firstElementTime + sumDurationTill(i);
				element.duration = getMediaDuration(i);
				tv.timeline.push(element);
			}
			//il tempo corrente è dato dal timing dell'ultimo elemento inserito più la sua durata
			tv.timelineTimeCur = element.timing + element.duration;
		} else {
		//se le immagini durano meno di questo tempo:
			//gli elementi che hanno un timing definito dagli shortcodes tengono quello,
			//tutti gli altri invece li allungo in modo che la somma di tutti sia uguale
			//al tempo a disposizione
			
			//quindi prima calcolo il timing totale dato dagli shortcodes
			var totalShortcodesTime = 0;
			var elementsNumWithoutShortcodes = 0;
			var element = {};
			for ( var i=0; i<tv.timelineMediaBuffer.length; i++ ) {
				element = tv.timelineMediaBuffer[i];
				if ( !isNaN(element.duration_shortcodes) && Number(element.duration_shortcodes) > 0 ) {
					totalShortcodesTime += Number(element.duration_shortcodes);
				} else {
					elementsNumWithoutShortcodes++;
				}
			}
			
			//tempo totale a disposizione 
			var maxTimeAvailableWithoutShortcodes = maxTimeAvailable - totalShortcodesTime;
			//calcolo il tempo medio per immagine per occupare tutto il tempo a disposizione
			var avgElementTime = maxTimeAvailableWithoutShortcodes / elementsNumWithoutShortcodes;
			//console.log("caso minTimeRequired < maxTimeAvailable: maxTimeAvailable="+maxTimeAvailable);
			//console.log("caso minTimeRequired < maxTimeAvailable: totalShortcodesTime="+totalShortcodesTime);
			//console.log("caso minTimeRequired < maxTimeAvailable: maxTimeAvailableWithoutShortcodes="+maxTimeAvailableWithoutShortcodes);
			//console.log("caso minTimeRequired < maxTimeAvailable: avgElementTime="+avgElementTime);
			//salvo le immagini nella timeline con la loro duration
			element = {};
			var sumDurationTillNow = 0;
			for ( var i=0; i<tv.timelineMediaBuffer.length; i++ ) {
				element = tv.timelineMediaBuffer[i];
				if ( !isNaN(element.duration_shortcodes) && Number(element.duration_shortcodes) > 0 ) {
					element.duration = Number(element.duration_shortcodes);
				} else {
					element.duration = avgElementTime;
				}
				element.timing = firstElementTime + sumDurationTillNow;
				sumDurationTillNow += element.duration;
				//console.log("caso minTimeRequired < maxTimeAvailable: element.timing="+element.timing+" element.duration="+element.duration);
				tv.timeline.push(element);
			}
		}
		//alla fine azzero il buffer, perchè tutti i suoi contenuti sono stati salvati nella timeline
		tv.timelineMediaBuffer = [];
	}
}

function mediaTagEnabled(mediaTag) {
	var enabled = false;
	for ( i=0; i<tv.enabledMediaTags.length; i++ ) {
		if ( tv.enabledMediaTags[i] == mediaTag ) {
			enabled = true;
			break;
		}
	}
	return enabled;
}


function contentIsMediaTag(content) {
	for ( var i=0; i<tv.enabledMediaTags.length; i++) {
		if ( jQuery(content).find(tv.enabledMediaTags[i]).length > 0 ) {
			return true;
		}
	}
	return false;
}

function contentIsShortcodeTag(content) {
	for ( var i=0; i<tv.enabledShortcodeTags.length; i++) {
		//console.log("contentIsShortcodeTag "+tv.enabledShortcodeTags[i]+" == "+jQuery(content).get(0).tagName+" ????");
		if ( jQuery(content).get(0).tagName.toUpperCase() == tv.enabledShortcodeTags[i].toUpperCase() ) {
			//console.log("trovato un rog!");
			return true;
		}
	}
	return false;
}

function countWords(str){
   var count = 0;
   words = str.split(" "); 
    for (i=0 ; i < words.length ; i++){
       // inner loop -- do the count
       if (words[i] != "")
          count += 1; 
    }
	return count;
}

function drawRect(ctx,x,y,w,h,fillStyle,lineWidth,strokeStyle) {
	ctx.fillStyle = fillStyle;  
	if ( lineWidth > 0 ) {
		ctx.strokeStyle = strokeStyle;
		ctx.lineWidth   = lineWidth;
	}
	ctx.beginPath();
	ctx.moveTo(x,y); 
	ctx.lineTo(x+w,y); 
	ctx.lineTo(x+w,y+h); 
	ctx.lineTo(x,y+h); 
	ctx.lineTo(x,y); 
	ctx.closePath();
	ctx.fill();				
	if ( lineWidth > 0 ) ctx.stroke();				
	
}

function formatTimer(ms) {
	var minuti = Math.floor(ms/1000/60);
	var sec = Math.floor(ms/1000) - minuti*60;
	//console.log('ms='+ms+' min='+minuti+' sec='+sec);
	return pad(minuti,2)+':'+pad(sec,2);
	
}

function openPostUrl() {
	//window.location = '?p='+tv.post.wpid; 
	window.open('?p='+tv.post.wpid,'_blank');
}

function pad(number, length) {
   
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
   
    return str;

}

/* ritorna un valore tra 0 e 1 */
function getAvgBrightness(imgContainerId,contentId) {

	//console.log("XXXXXXXXXXXXX avgBrightness CHIAMATO");

	//prendo la mia immagine
	var img = jQuery('#'+imgContainerId).find('img').get(0);
	//creo la canvas
    tv.canvasForBrightness = document.createElement("canvas");
    var c = tv.canvasForBrightness.getContext('2d');
    c.width = tv.canvasForBrightness.width = 1;
    c.height = tv.canvasForBrightness.height = 1;
    c.clearRect(0, 0, c.width, c.height);
	//questa ogni tanto fallisce sugli smartphone, devo catchare l'errore
	try {
		c.drawImage(img, 0, 0, img.width , img.height, 0, 0, tv.canvasForBrightness.width , tv.canvasForBrightness.height);
	} catch(err) {
		var txt="There was an error on getAvgBrightness().\n\n";
		txt+="Error description: " + err.message + "\n\n";
		txt+="img: " + img + "\n\n";
		txt+="img.width: " + img.width + "\n\n";
		txt+="img.height: " + img.height + "\n\n";
		txt+="tv.canvasForBrightness.width: " + tv.canvasForBrightness.width + "\n\n";
		txt+="tv.canvasForBrightness.height: " + tv.canvasForBrightness.height + "\n\n";
		console.log(txt);
		return 0; //in caso di errore me ne esco con un avg a 0 (fondo nero)
	}
	
	
    //return c; // returns the context
	//jQuery('body').prepend(tv.canvasForBrightness);
	var pixel = c.getImageData(0, 0, 1, 1).data; 
	var avgBrightness = ( pixel[0]+pixel[1]+pixel[2] ) / 3 / 255;
	//salvo anche nel dom il valore, per comodità e per aumentare il caos e l'ignoranza di questo codice
	//jQuery('#'+imgContainerId).data("avgBrightness",avgBrightness);
	tv.contents[contentId].avgBrightness = avgBrightness;
	//console.log("XXXXXXXXXXXXX avgBrightness = "+tv.contents[contentId].avgBrightness);
	return avgBrightness;
}



/* youtube iframe_api */



//qui continua il processo iniziato da populateTimeline()
//questa viene chiamata dalle yt api appena finito di caricarsi
function onYouTubeIframeAPIReady() {
	//per poter popolare la timeline devono conscere le durate di tutti i singoli contents
	//per testi e immagini la durata viene decisa programmaticamente, ma per i video è una menata, 
	//bisogna fare chiamate asincrone all'api di youtube per conoscere la durata, senza play del video,
	//e solo quando tutte le risposte sono arrivate, proseguire con la popolazione della timeline
	//console.log("onYouTubeIframeAPIReady: comincio a ciclare...");
	//quindi devo fare un loop sui contenuti, e per quelli video, lancio la creazione di un player YT, da cui poi posso ricevere la durata del video
	tv.contentsVideoCounter = 0;
	for ( var x=0; x<tv.contents.length; x++ ) {
		var content = tv.contents[x];
		//console.log("onYouTubeIframeAPIReady: ciclo #"+x+" content.mediaTag="+content.mediaTag);
		if ( content.mediaTag == "iframe" ) {
			
			//distinguo a seconda che il mio content sia l'iframe, o se l'iframe sia un suo child
			var src = "";
			if ( jQuery(content).prop("tagName") == 'iframe' ) {
				src = jQuery(content).attr('src');
				//console.log("l'iframe è proprio il CONTENT STESSO, con src="+src+" da cui videoId="+youtube_parser(src));
			} else if ( jQuery(content).find("iframe") ) {
				src = jQuery(content).find("iframe").attr('src');
				//console.log("effettivamente c'è un iframe, ma è FIGLIO!!!!, con src="+src+" da cui videoId="+youtube_parser(src));
			}
			
			//trovo il ytVideoId di yt dal src dell'iframe
			var ytVideoId = youtube_parser(src);
			//if ( isSmartphone ) alert( 'onYouTubeIframeAPIReady: ytVideoId: '+ytVideoId );
			if ( ytVideoId != "" ) {
				tv.contentsVideoCounter++;
				
				//avendo un'API Key di un'application registrata su youtube, 
				//uso quella che è più efficiente, e funziona anche sugli smartphone
				if ( yt_apikey != "" ) {
					//chiamo un service youtube che mi ritorna tutti i dati del video in json (tra cui la durata).
					//console.log("BBBB: ");
					//console.log(x);
					//console.log(content);
					//console.log(tv.contents[x]);
					jQuery.getJSON('https://www.googleapis.com/youtube/v3/videos?id='+ytVideoId+'&part=snippet,contentDetails&key='+yt_apikey, 
						(function(this_content) {
							return function(data) {
								var content = this_content;
								content.yt_loader = {};
								//console.log("youtube data result: ");
								//console.log(data);
								var durationString = data.items[0].contentDetails.duration;
								var duration = 0; //in secondi, devo tradurre quella in formato stringa che mi arriva da yt in un intero che è in secondi
								var snippet = data.items[0].snippet;
								/*
								var contentDetails = data.items[0].contentDetails;
								console.log("contentDetails:");
								console.log(contentDetails);
								*/
								//if ( isSmartphone ) alert( 'onYouTubeIframeAPIReady: durationString: '+durationString );
								//devo fare il parsing dei risultati che mi arrivano, che sono del tipo: P1W2DT6H21M32S, PT3M23S, PT8S, ecc.
								if ( durationString != "" ) {
									//devo trasformare la duration in secondi
									var ytDateRegex = /^P(\d+W)?(\d+D)?T(\d+H)?(\d+M)?(\d+S)+$/g;
									var matches = ytDateRegex.exec(durationString);
									//console.log(matches);
									if ( matches[1] != undefined ) {
										var weeks = matches[1].substr(0,matches[1].length-1);
									} else {
										var weeks = 0;
									}
									if ( matches[2] != undefined ) {
										var days = matches[2].substr(0,matches[2].length-1);
									} else {
										var days = 0;
									}
									if ( matches[3] != undefined ) {
										var hours = matches[3].substr(0,matches[3].length-1);
									} else {
										var hours = 0;
									}
									if ( matches[4] != undefined ) {
										var minutes = matches[4].substr(0,matches[4].length-1);
									} else {
										var minutes = 0;
									}
									if ( matches[5] != undefined ) {
										var seconds = matches[5].substr(0,matches[5].length-1);
									} else {
										var seconds = 0;
									}
									duration = Number(seconds) + Number(minutes)*60 + Number(hours)*3600 + Number(days)*86400 + Number(weeks)*604800;
									//console.log("duration = "+duration+" s. ( weeks: "+weeks+" days: "+days+" hours: "+hours+" minutes: "+minutes+" seconds: "+seconds+" )");
								} else {
								}
								
								//salvo la duration
								content.yt_loader.getDuration = function() {
									return duration;
								}
								//console.log("ho creato getDuration che ritorna: "+content.yt_loader.getDuration() );
								
								//salvo tutti gli altri dati del video (snippet)
								content.getTheFuckinSnippet = function() {
									/* ritorna una roba tipo:
									Object {
										publishedAt: "2012-08-14T11:48:02.000Z", 
										channelId: "UCfIJut6tiwYV3gwuKIHk00w", 
										title: "Crysis 3 | CryEngine 3 Tech Demo", 
										description: "In Crysis 3, the technology behind CryEngine 3 is …ndbox that is Crysis 3.↵↵http://www.crysis.com/uk", 
										thumbnails: Object…
									}
									*/
									
									return snippet;
								}
								//console.log("ho creato getTheFuckinSnippet che ritorna: ");
								//console.log( content.getTheFuckinSnippet() );
								
								//console.log('alla fine getduration='+content.yt_loader.getDuration());
								
								//ho trovato la durata diun altro video. la scalo dal totale e verifico se li ho tutti
								//se li ho finiti, continuo il processo di popolamientos timeline
								tv.contentsVideoCounter--;
								if ( tv.contentsVideoCounter == 0 ) {
									//console.log("finito di caricare le durations con le Data API");
									//ho ottenuto la durata di tutti i video!
									//proseguo con la popolazione della timeline
									tv.currentContentWithYtLoader = false;
									populateTimelineAndAllTheRestYeah();
								}
							};
						}(content))
					);
				} else {
					//lancio la creazione di un yt player, da cui ottengo poi la duration
					jQuery('body').append("<div id='yt_loader"+ytVideoId+"' style='position:relative;left:1000000px;'></div>");
					
					content.yt_loader = new YT.Player('yt_loader'+ytVideoId, {
						height: '220',
						width: '220',
						videoId: ytVideoId,
						events: {
							'onReady': onPreloaderReady,
							'onStateChange': onPreloaderStateChange
						}
					});
				}
			}
		}
	}
	//se qui è acnora 0, vuol dire che non c'erano video, proseguo
	if ( tv.contentsVideoCounter == 0 ) {
		populateTimelineAndAllTheRestYeah();
	}
	
}
function onPreloaderReady(event) {
	//event.target.playVideo();
	//if ( isSmartphone ) alert( 'onPreloaderReady: duration: '+event.target.getDuration() );
	
	//ottenuta la duration ( sta in content.yt_loader.getDuration() ), posso eliminare il player yt dal dom
	var videoId = youtube_parser2( event.target.getVideoUrl() );
	//console.log( 'videoId: '+videoId);
	var playerId = '#yt_loader'+videoId;
	jQuery(playerId).remove();
	event.target.destroy();
	//content.yt_loader.duration = event.target.getDuration();
	//console.log( event.target.ytVideoId );
	
	//ho trovato la durata diun altro video. la scalo dal totale e verifico se li ho tutti
	//se li ho finiti, continuo il processo di popolamientos timeline
	tv.contentsVideoCounter--;
	if ( tv.contentsVideoCounter == 0 ) {
		//ho ottenuto la durata di tutti i video!
		//proseguo con la popolazione della timeline
		tv.currentContentWithYtLoader = false;
		populateTimelineAndAllTheRestYeah();
	}
}
//forse questa non serve a un cazzo, ma ho paura a toglierla
var done = false;
function onPreloaderStateChange(event) {
	//console.log( 'onPreloaderStateChange: duration: '+event.target.getDuration() );
	if (event.data == YT.PlayerState.PLAYING && !done) {
		event.target.stopVideo();		
		done = true;
	}
}

function onPlayerReady(event) {
	//if ( isSmartphone ) alert("READY! "+event.data);
	/*
	jQuery('iframe').each(function() {
		var url = jQuery(this).attr("src");
		if (url.indexOf("wmode=transparent") == -1) {
	
			var char = "?";
			if (url.indexOf("?") != -1) {
				var char = "&";
			}
			jQuery(this).attr("src",url+char+"wmode=transparent");
		}	
	});	
	*/
	
	//event.target.playVideo();
	//startPlayback();
	
	//prima metto tutti gli iframe (tv + spyral) bassi, poi alzo solo la tv
	jQuery('#outerContainer').css('z-index','40');
	jQuery('iframe').css('z-index','5');
	jQuery('#tvInnerContainer iframe').css('z-index','10');
	
	//per i cellulari non setto la risoluzione perchè tanto i video vanno in player fullscreen autonomo,
	//mentre per i pc setto la risoluzione in base a quella dello schermo
	var resH = jQuery(window).height();
	//console.log(resH);
	if ( !isSmartphone ) {
		var yt_res = "";
		if ( resH > 1280 ) {
			yt_res =  'highres';
		} else if ( resH > 1080 ) {
			yt_res =  'hd1080';
		} else if ( resH > 720 ) {
			yt_res =  'hd720';
		} else if ( resH > 480 ) {
			yt_res =  'large';
		} else if ( resH > 240 ) {
			yt_res =  'medium';
		} else {
			yt_res =  'small';
		}
		//console.log(yt_res);
		if ( yt_res != "" ) event.target.setPlaybackQuality( yt_res );
	}
	
	
	//console.log( event.target.getDuration() );
	//non va... console.log( event.target.getAvailableQualityLevels() );
	
	
	//popolo l'info popup con i dati del video
	if ( typeof tv.contents[tv.currentContentWithYtLoader].getTheFuckinSnippet === 'function' ) {
		var videoData = tv.contents[tv.currentContentWithYtLoader].getTheFuckinSnippet();
		/* ritorna una roba tipo:
		Object {
			publishedAt: "2012-08-14T11:48:02.000Z", 
			channelId: "UCfIJut6tiwYV3gwuKIHk00w", 
			title: "Crysis 3 | CryEngine 3 Tech Demo", 
			description: "In Crysis 3, the technology behind CryEngine 3 is …ndbox that is Crysis 3.↵↵http://www.crysis.com/uk", 
			thumbnails: Object…
		}
		*/
		//console.log("dai figa!");
		//console.log(videoData);
		var videoInfo = "\
			<h5>current video</h5>\
			<hr/>\
			<table cellpadding='5'>\
				<tr>\
					<td><a href='"+tv.contents[tv.currentContentWithYtLoader].yt_loader.getVideoUrl()+"' target='_blank'><img src='"+videoData.thumbnails['default'].url+"' /><h6>play in YouTube</h6></a></td>\
					<td><h4>"+videoData.title+"</h4><h6>"+videoData.publishedAt+"</h6><p>"+videoData.description+"</p></td>\
				</tr>\
			</table>";
		jQuery('#livePopupTvInfoForVideo').html(videoInfo);
		jQuery('#livePopupTvInfoForVideoContainer').show();
	}
	
	
	
	//attivo il timer di sincronizzazione di rognone sul video
	setVideoSyncInterval();
	
	
}
function onPlayerStateChange(event) {
	//if (event.data == YT.PlayerState.PLAYING) {
	if (
		event.data == YT.PlayerState.BUFFERING
		||
		event.data == YT.PlayerState.PAUSED
	) {
		//event.target.stopVideo();
		//console.log("PAUSED/buffering... pause playback!");
		if ( !isSmartphone ) pausePlayback(true);
	} else if (
		event.data == YT.PlayerState.PLAYING
	) {
		if ( !isSmartphone ) {
			//e faccio ripartire il tutto
			startPlayback(true);
		}
	} else if (
		event.data == YT.PlayerState.ENDED
	) {
		//if ( isSmartphone ) alert("ENDED");		
		//quando un video finisce, skippo alla traccia successiva
		//console.log("video finito!!!!!!!!!!!!!!!!!!!!!!!!!!");
		timelineButtonNextClicked();
	}
}

function setVideoSyncInterval() {
	clearInterval(tv.videoSyncInterval);
	tv.videoSyncInterval = setInterval(function() {
		if ( !tv.isStopped ) {
			//console.log("aggiornerei timing");
			//console.log("PRIMA: "+tv.playbackTimeCur);
			//console.log(tv.currentContentWithYtLoader);
			var syncedTiming = 0;
			var element = getTimelineElement(tv.currentContentWithYtLoader);
			//var syncedTiming = event.target.getCurrentTime()*1000 + element.timing;
			//console.log("MEDIUM: "+tv.contents[element.contentId].yt_loader.getCurrentTime());
			if ( tv.contents[element.contentId].yt_loader.getCurrentTime() > 0 ) {
				//siccome il seek di un video può portare in una posizione leggermente differente da quella richiesta, devo correggerla
				if ( tv.contents[element.contentId].yt_loader.getCurrentTime()*1000 >= element.vin ) {
					//ok, il timing corrente è posteriore al vin
					syncedTiming = element.timing + tv.contents[element.contentId].yt_loader.getCurrentTime()*1000 - element.vin;
				} else {
					//il timing corrente è anteriore al vin, e questo sarebbe un problema perchè porterebbe il play generale alla fine del content precedente
					//quindi lo limito all'inizio dell'elemento
					syncedTiming = element.timing;
				}
			}
			if ( syncedTiming > 0 ) {
				//console.log("VideoSyncInterval trigger call of setPlaybackTimeCurWithSpeed()");
				setPlaybackTimeCurWithSpeed(syncedTiming);
			}
			//console.log("POI: "+syncedTiming);
		}
	}, 1000);
}


/* esempio funzionante che carica il player e lo mette in play 

var yt_loader;
var done = false;
function onYouTubeIframeAPIReady() {
	yt_loader = new YT.Player('yt_loader', {
		height: '390',
		width: '640',
		videoId: 'u1zgFlCw8Aw',
		events: {
			'onReady': onPreloaderReady,
			'onStateChange': onPreloaderStateChange
		}
	});		
}
function onPreloaderReady(event) {
	event.target.playVideo();
	console.log( 'duration: '+yt_loader.getDuration() );
}		
function onPreloaderStateChange(event) {
	if (event.data == YT.PlayerState.PLAYING && !done) {
		setTimeout(stopVideo, 6000);
		done = true;
	}
}
function stopVideo() {
	yt_loader.stopVideo();
}		



*/


function youtube_parser(url) {
	var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
	var match = url.match(regExp);
	if (match&&match[7].length==11){
		//console.log("URL DI YOURUBE beccato: "+url);
		return match[7];
	} else {
		console.log("URL DI YOUTUBE scorretto: "+url);
		return "";
	}
}

function youtube_parser2(url) {
	//var videoid = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
	var videoid = url.replace(/^[^v]+v.(.{11}).*/,"$1");
	if(videoid != null) {
		//console.log("URL DI YOURUBE beccato: "+url);
		return videoid;
	} else { 
		console.log("URL DI YOUTUBE scorretto: "+url);
		return "";
	}
}

