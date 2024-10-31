function createInterfaceCommon() {
	//aggiusto delle variabili perchè solo ora conosco il valore di isSmartphone etc (quelle create in header.php)
	if ( isSmartphone ) {
		fadeDuration = 0; //millisecondi, durata delle animazioni degli elementi dell'interfaccia. 0 per no effetti
		userInactivityThreshold = 4*1000;
	}
	
	//empty body
	jQuery('body').empty();
	//logo
	if ( player_mode == 'iframe' ) {
		//se l'iframe è richiamato 
		jQuery('body').append("<a class='liveLogo liveLogoIframe' href='?rognone' target='_top' title='fullscreen'></a>");
	} else {
		jQuery('body').append("<a class='liveLogo' href='?no_splash' title='go to the classic website'></a>");
	}
	//busy icon
	//va per ultima, così sta sopra a tutti gli altri elementi dell'interfaccia
	jQuery('body').append("<div id='liveBusyIconContainer'><div id='liveBusyIcon'></div></div>");
	//jQuery('#liveBusyIcon').addClass("liveBusyIconSmartphone");
	//if ( isSmartphone ) jQuery('#liveBusyIcon').addClass("liveBusyIconSmartphone");
	//jQuery('#liveBusyIcon').centerXY();
	jQuery('#liveBusyIconContainer').hide();
	
	//listener on resize per correggere errori che introduce il social button di twitter
	//e poi non si sa mai
	/*
	jQuery('html').resize(function() {
		console.log("htmlhtmlhtmlhtmlhtmlhtml");
		jQuery('html').css('overflow', 'hidden');
	});
	jQuery('body').resize(function() {
		console.log("bodybodybodybodybodybody");
		jQuery('body').css('overflow', 'hidden');
	});
	*/
}

function createInterfaceCommonOnLoad() {
	fullscreenForSmartphones();
	//attivo il check per il cambio di orientamento
	var supportsOrientationChange = "onorientationchange" in window,
	orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
	window.addEventListener(orientationEvent, function() {
		fullscreenForSmartphones();
		//alert('HOLY ROTATING SCREENS BATMAN:' + window.orientation + " " + screen.width);
	}, false);
	
}

function fullscreenForSmartphones() {
	//hide url bar in smartphones
	//ma non quando sono in iframe
	
	//**** l'ho disabilitato perchè non funzionava sempre (su alcuni browser), e su altri faceva proprio casino
	if ( false && isSmartphone && player_mode != 'iframe' ) {
		/*
		concetto: appena caricato rognone (che è una pagina a se stante rispetto a wordpress)
		la barra dell'url del browser è ancora visibile, e l'altezza della viewport 
		(e conseguentemente di rognone) è la differenza tra la risoluzione dello schermo dello 
		smartphone e la barra dell'url.
		allora aumento l'altezza di rognone, e faccio uno
		scrollTo(0,0), così che spingo fuori dallo schermo la barra dell'url.
		*/
		//questi servono per far funzionare lo scrollTo()
		jQuery('html').css('overflow','visible');
		jQuery('body').css('overflow','visible');
		//per prima cosa setto l'altezza del body, che altrimenti resterebbe a 0
		jQuery('body').css('height',jQuery(window).height()+'px');
		//alert("window w="+jQuery(window).width()+" h="+jQuery(window).height() );
		//alert("body h="+jQuery('body').css('height') );
		
		var incrementH = 500; //px
		var intervalDuration = 1000; //msec
		
		setTimeout(function(){
			var viewportH = Number( jQuery(window).height() );
			var bodyH = viewportH + incrementH;
			
			jQuery('body').css('height',bodyH+'px');
			//alert("settato body height a "+bodyH+" ovvero: "+jQuery('body').css('height'));
			setTimeout( function() { 
				window.scrollTo(1, 1);
				setTimeout( function() { 
					//dopo che ho scrollato (la url bar è sparita) ridimensiono la pagina alla viewport attuale
					//alert("scrollato in 1,1 e ora la viewport height vale: "+jQuery(window).height() );
					jQuery('body').css('height',jQuery(window).height()+'px');
				},Math.round(intervalDuration));
			}, Math.round(intervalDuration));
		},intervalDuration);
	}
}

function createInterfaceSpyral()
{
	//pos logo
	jQuery('.liveLogo').css('top', 'auto');
	jQuery('.liveLogo').css('bottom', '0px');
	jQuery('.liveLogo').css('right', '0px');
	
	//containers
	jQuery('body').append("<div id='outerContainer'></div>");
	jQuery('#outerContainer').append("<div id='innerContainer'></div>");
	
	//onmouseover sull'outer container faccio comparire il panel
	jQuery('#outerContainer').mouseover(function() {
		//faccio comparire il panel
		showPanel();
	});		
	jQuery('#outerContainer').mouseout(function(e) {
		//faccio scomparire il panel
		//ma solo se il mouse è fuori dalla porzione visibile
		if ( e.pageX < 0 || e.pageY < 0 || e.pageX > jQuery('#outerContainer').width() || e.pageY > jQuery('#outerContainer').height() )
		{
			hidePanel();
			//ricentro l'innerContainer
			jQuery('#innerContainer').css('left','0px');
			jQuery('#innerContainer').css('top','0px');
		}
	});				
	//onmousemove sull'inner container ricentro il container
	//jQuery('#innerContainer').mousemove(function(e){
	jQuery('#outerContainer').mousemove(function(e){
		//centro l'inner container
		var margin = 300;
		if ( edge_right - edge_left > jQuery(window).width() ) {
			jQuery('#innerContainer').css('left', ( edge_right - edge_left - jQuery(window).width() + margin ) * ( 1/2 - e.pageX/jQuery('#outerContainer').width()*jQuery('#innerContainer').width() / jQuery(window).width() ) );
		} else {
			jQuery('#innerContainer').css('left', 0 );
		}
		if ( edge_bottom - edge_top > jQuery(window).height() ) {
			jQuery('#innerContainer').css('top', ( edge_bottom - edge_top - jQuery(window).height() + margin ) * ( 1/2 - e.pageY/jQuery('#outerContainer').height()*jQuery('#innerContainer').height() / jQuery(window).height() ) );
		} else {
			jQuery('#innerContainer').css('top', 0 );
		}
		
		//sposto anche il popup come l'innerContainer
		var containerPosition = jQuery('#innerContainer').position();
		jQuery('#livePopup').css("left", jQuery('#livePopup').data("left") + containerPosition.left );
		jQuery('#livePopup').css("top", jQuery('#livePopup').data("top") + containerPosition.top );
		
		//se il panel non è visibile, lo visualizzo
		//(potrebbe essere stato nascosto per inattività dell'utente, nel qual caso non comparirebbe fino al successivo mouseover)
		if ( panelIsHidden ) showPanel();
		
		//resetto il timer user inactivity
		clearTimeout(userInactivity);
		userInactivity = setTimeout(function() {
			clearTimeout(userInactivity);
			if ( !mouseOverPanel ) hidePanel();
		}, userInactivityThreshold);
	});		
	
	
	//popup (in comune per tutti gli slots)
	jQuery('#outerContainer').append("<div id='livePopup'></div>");
	
	//control panel and buttons
	jQuery('#outerContainer').append("<div id='livePanel'><img id='liveButtonPause' src='"+plugins_url+"imgs/icon_media_pause_29x45.png' /><img id='liveButtonPlay' src='"+plugins_url+"imgs/icon_arrow_e_50x50.png' /><img id='liveButtonAdd' title='load more posts' src='"+plugins_url+"imgs/icon_new_50x50.png' /><img id='liveButtonDel' title='unload posts' src='"+plugins_url+"imgs/icon_minus_50x50.png' /><div id='refreshSlider' title='refresh time'></div><h5 id='refreshLabel' title='refresh time'>"+String(Math.round(refreshSlotsTimerDuration/100)/10)+" s</h5></div>");
	updatePlayPauseButtons();
	//enable refreshSlider
	//console.log(refreshSlotsTimerMin);
	//console.log(refreshSlotsTimerMax);
	//console.log(Math.pow( refreshSlotsTimerMin/refreshSlotsTimerMax, 1/4 ));
	//console.log(Math.pow( refreshSlotsTimerDuration/refreshSlotsTimerMax, 1/4 ));
	jQuery('#refreshSlider').slider({
		min: Math.pow( refreshSlotsTimerMin/refreshSlotsTimerMax, 1/4 ),
		max: 1,
		step: 0.001,
		value: Math.pow( refreshSlotsTimerDuration/refreshSlotsTimerMax, 1/4 ),
		animate: false,
		change: function(event, ui) {
			//slider esponenziale
			refreshSlotsTimerDuration = Math.round( Math.pow(ui.value,4)*refreshSlotsTimerMax );
			//jQuery('#refreshSlider').attr('title',String(refreshSlotsTimerDuration)+' ms');
			jQuery('#refreshLabel').html(String(Math.round(refreshSlotsTimerDuration/100)/10)+' s');
		}
	});

	//hide panel at startup
	//if ( !isSmartphone ) {
		jQuery('#livePanel').css("bottom",'-'+jQuery('#livePanel').height()+'px'); //comparirà solo onmousemove
		jQuery('#livePanel').mouseover(function() {
			mouseOverPanel = true;
		});		
		jQuery('#livePanel').mouseout(function() {
			mouseOverPanel = false;
		});		
	//} else {
		//nel caso di smartphone, per pigrizia, dichiaro che il mouse è sempre sopra al panel, che quindi resta aperto
		//mouseOverPanel = true;
	//}
	
	//pause button actions
	jQuery('#liveButtonPause').click( function (){
		//swappo i bottoni play/pausa
		//jQuery('#liveButtonPause').hide();
		//jQuery('#liveButtonPlay').show();
		//fermo tutto
		setStopped();
		setLayout();
	});		
	//play button actions
	jQuery('#liveButtonPlay').click( function (){
		//swappo i bottoni play/pausa
		//jQuery('#liveButtonPause').show();
		//jQuery('#liveButtonPlay').hide();
		//faccio ripartire tutti i timer di tutti gli slot
		unsetStopped();
	});
	//add button actions
	jQuery('#liveButtonAdd').click(function() {
		loadNextPost(1,drawSlotsFromQuery);
	});		
	//del button actions
	jQuery('#liveButtonDel').click(function() {
		delLastSlot();
	});		
	
	/*
	//ticker icon
	jQuery('#outerContainer').append("<div id='ticker'></div>");
	jQuery('#ticker').fadeOut(200);
	*/
	
	
	//onresize ricentro tutto
	jQuery(window).resize( function (){
		//console.log("on resize: "+jQuery('#innerContainer').width());
		//siccome gli eventi resize sono una serie fitta finchè non si smette di resizare, 
		//devo usare un timer per tenere solo l'ultimo evento prima di triggerare il ridisegno degli slot
		//quindi prima cancello il timer corrente
		clearTimeout(resizeTimer);
		//poi lo rilancio
		resizeTimer = setTimeout(resizeOnTimer, 100);
	});
	
	//quando la finestra perde il flocus, stoppo tutto
	function onBlur() {
		setTemporaryStopped();
	};
	function onFocus(){
		unsetTemporaryStopped();
	};
	if (/*@cc_on!@*/false) { // check for Internet Explorer
		document.onfocusin = onFocus;
		document.onfocusout = onBlur;
	} else {
		window.onfocus = onFocus;
		window.onblur = onBlur;
	}		
	
	//attivo il timer che aggiornerà gli slot
	//questo timer non si ferma mai
	//lo stop si ottiene con un flag che dice al timer di skippare al prossimo loop,
	//ma il timer non si ferma mai
	refreshSlotsTimer = setTimeout(refreshSlotOnTimer, refreshSlotsTimerDuration);
	
}



function createInterfaceTv()
{
	//containers
	jQuery('body').append("<div id='tvContainer'></div>");
	
}



function showPanel()
{
	panelIsHidden = false;
	jQuery('#livePanel').animate({
		bottom:0
	}, fadeDuration, "swing", function(){ 
		//per ora nulla alla fine dell'animazione
	});
}

function hidePanel()
{
	panelIsHidden = true;
	jQuery('#livePanel').animate({
		bottom:-jQuery('#livePanel').height()
	}, fadeDuration, "swing", function(){ 
		//per ora nulla alla fine dell'animazione
	});
}

function resizeOnTimer() {
	//devo buttare tutti i contenuti, perchè dopo un resize sono tutti stroiati
	jQuery('.liveElement').children().empty();
	jQuery('.liveElement').find('canvas').remove();
	//reimposto il layout dopo il resize
	setLayout();
}

function updatePlayPauseButtons() {
	if ( isStopped || isTemporaryStopped ) {
		jQuery('#liveButtonPause').hide();
		jQuery('#liveButtonPlay').show();
	} else {
		jQuery('#liveButtonPause').show();
		jQuery('#liveButtonPlay').hide();
	}
}

function setStopped() {
	isStopped = true;
	updatePlayPauseButtons();
}

function unsetStopped() {
	isStopped = false;
	updatePlayPauseButtons();
}

function setTemporaryStopped() {
	isTemporaryStopped = true;
	updatePlayPauseButtons();
}

function unsetTemporaryStopped() {
	isTemporaryStopped = false;
	updatePlayPauseButtons();
}

function getTimelineElement(contentId) {
	for ( var x=0; x < tv.timeline.length; x++ ) {
		var element = tv.timeline[x];
		if (element.contentId == contentId ) {
			return element;
		}
	}
}

function zoomContentToContainer(content, container, forTv, tagForTv) {
	//console.log("zoomContentToContainer con content");
	//console.log(content);
	if ( forTv ) {
		var originalContentW = jQuery(content).attr( 'width');
		var originalContentH = jQuery(content).attr( 'height');
	} else {
		var originalContentW = jQuery(content).width();
		var originalContentH = jQuery(content).height();
	}
	var contentRatio = originalContentW / originalContentH;
	var slotRatio = jQuery(container).width() / jQuery(container).height();
	if ( contentRatio > slotRatio ) {
		//content più orizzontale dello slot
		if ( forTv && tagForTv == 'iframe' ) {
			//fisso larghezza
			var contentW = jQuery(container).width();
			var contentH = contentW/contentRatio;
		} else {
			//fisso altezza
			var contentH = jQuery(container).height();
			var contentW = contentH*contentRatio;
		}
	} else {
		//content più verticale dello slot
		if ( forTv && tagForTv == 'iframe' ) {
			//fisso altezza
			var contentH = jQuery(container).height();
			var contentW = contentH*contentRatio;
		} else {
			//fisso larghezza
			var contentW = jQuery(container).width();
			var contentH = contentW/contentRatio;
		}
	}
	jQuery(content).width( contentW );
	jQuery(content).height( contentH );
	//infine, dopo aver calcolato le dim del content,
	//le riapplico allo slot, e da quelle dello slot
	//deriveranno tutte le altre
	if ( contentcrop == 'off' && !forTv ) {
		jQuery(container).width( contentW );
		jQuery(container).height( contentH );
		jQuery(container).css( 'max-width','none' );
		jQuery(container).css( 'max-height','none' );
	} else {
		//se c'è il cropping delle immagini, allora lo attuo
		jQuery(content).css( 'position', 'relative' );
		jQuery(content).css( 'top', String( Math.round( ( jQuery(container).height() - contentH ) / 2 ) )+'px' );
		jQuery(content).css( 'left', String( Math.round( ( jQuery(container).width() - contentW ) / 2 ) )+'px' );
	}
}

function zoomTexts(domElement,totalElements,forTv) {
	//in base alla lunghezza, gli forzo una dimensione
	var charCount = jQuery(domElement).text().length;
	var boldThreshold = 20;
	var lineheightThresholdChars = 150;
	
	//calcolo il fontSize in base alle dimensioni dello schermo
	if ( forTv ) {
		
		//if ( player_mode == 'iframe' ) {
			//console.log("**SM** wh="+jQuery(window).height()+" dh="+jQuery(document).height()+" hh="+jQuery('html').height()+" bh="+jQuery('body').height()+" ch="+jQuery('#tvContainer').height() );
			//var totalPixel = jQuery(document).width()*jQuery(document).height();
		//} else {
			var totalPixel = jQuery(window).width()*jQuery(window).height();
		//}
		
		
		var pixelPerChar = totalPixel / charCount;
		var fontSize = Math.round( Math.sqrt(  pixelPerChar	) );
		//console.log("**zoomTexts** wh="+jQuery(window).height()+" dh="+jQuery(document).height()+" hh="+jQuery('html').height()+" bh="+jQuery('body').height()+" ch="+jQuery('#tvContainer').height()+" ppc="+pixelPerChar+" fs="+fontSize );
	} else {
		var minFontSize = 12;
		var maxFontSize = 20 + 60/Math.pow(totalElements,1/3); //è dinamico pure questo
		var minCharCount = 10;
		if ( charCount > lineheightThresholdChars ) {
			fontSize = minFontSize;
		} else if ( charCount >= minCharCount ) {
			//definisco le dimensioni del testo inversamente proporzionali alla sua lunghezza in caratteri
			fontSize = Math.round( maxFontSize - (charCount - minCharCount)/(lineheightThresholdChars - minCharCount)*(maxFontSize - minFontSize) );
		} else { 
			fontSize = maxFontSize;
		}		
	}
	
	
	
	//assegno i font-size
	//console.log("charCount="+charCount+" fontSize="+fontSize);
	if ( forTv ) {
		jQuery(domElement).css( 'font-size',String(fontSize)+'px' );
		jQuery(domElement).css( 'text-align','left' );
		jQuery(domElement).css( 'word-wrap','break-word' );
	} else {
		jQuery(domElement).children().css( 'font-size',String(fontSize)+'px' );
		jQuery(domElement).children().css( 'text-align','left' );
		jQuery(domElement).children().css( 'word-wrap','break-word' );
	}
	
	
	//definisco il rapporto tra font-size e line-height
	var minFontLineRatio = 0.76; //al minimo il line-height può valere minFontLineRatio volte il font-size
	var maxFontLineRatio = 1.3; //al massimo il line-height può valere maxFontLineRatio volte il font-size
	
	//assegno i line-height
	if ( forTv ) {
		//da spaziato ad appiccicato
		if ( charCount > lineheightThresholdChars ) {
			jQuery(domElement).css( 'line-height',String(Math.round(fontSize*(  maxFontLineRatio + (minFontLineRatio - maxFontLineRatio)*Math.pow(lineheightThresholdChars/charCount,2)  )))+'px' );
		} else {
			jQuery(domElement).css( 'line-height',String(Math.round(fontSize*minFontLineRatio))+'px' );
		}
	} else {
		if ( charCount < lineheightThresholdChars ) {
			jQuery(domElement).children().css( 'line-height',String(fontSize*0.9)+'px' );
		} else {
			jQuery(domElement).children().css( 'line-height','auto' );
		}
	}	

	//assegno i font-weight
	if ( fontSize >= boldThreshold ) {
		if ( forTv ) {
			jQuery(domElement).css( 'letter-spacing',String(Math.round(1.5 -1.5*fontSize/boldThreshold))+'px' );
			jQuery(domElement).css( 'font-weight','bold' );
		} else {
			jQuery(domElement).children().css( 'letter-spacing',String(Math.round(1.5 -1.5*fontSize/boldThreshold))+'px' );
			jQuery(domElement).children().css( 'font-weight','bold' );
		}
	} else {
		if ( forTv ) {
			jQuery(domElement).css( 'letter-spacing','0px' );
			jQuery(domElement).css( 'font-weight','normal' );
		} else {
			jQuery(domElement).children().css( 'letter-spacing','0px' );
			jQuery(domElement).children().css( 'font-weight','normal' );
		}
	}
	
	
	/*
	if ( fontSize > lineheightThreshold ) {
		if ( forTv ) {
			//da spaziato ad appiccicato
			jQuery(domElement).css( 'line-height',String(fontSize*(  minFontLineRatio + (maxFontLineRatio - minFontLineRatio)*Math.pow(lineheightThreshold/fontSize,3)  ))+'px' );
		} else {
			//molto spaziato
			jQuery(domElement).children().css( 'line-height',String(fontSize*0.9)+'px' );
		}
	} else {
		if ( forTv ) {
			jQuery(domElement).css( 'line-height',String(fontSize*maxFontLineRatio)+'px' );
			//jQuery(domElement).css( 'font-weight','auto' );
		} else {
			jQuery(domElement).children().css( 'line-height','auto' );
		}
	}
	*/
	
}


