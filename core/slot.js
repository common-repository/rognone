
function drawSlot(slot,slotsNum)
{
	//genero l'elemento html da appendere al dom
	var slotDom = jQuery('<div id="tag'+slot.id+'" />');
	//set styles
	jQuery(slotDom).css('opacity',0);
	jQuery(slotDom).attr('class','liveElement');
	//imposto gli eventi:
	//visualizzo il popup quando vado col mouse sopra ad uno slot
	jQuery(slotDom).mouseenter(function() {
		setTemporaryStopped();
		/* questo blocco funziona, ma è sospeso
		//ingrandisco la progress bar
		jQuery(slotDom).css('margin-bottom','15px');
		jQuery(slotDom).find('.elementProgress').css('height','12px');
		jQuery(slotDom).find('.elementProgress').css('bottom','-15px');
		drawProgressBar(slot, slotDom,12);
		*/
		
		//visualizzo il popup
		var livePopupContent = '<h4>'+slot.postTitle+'</h4><h6>here showing part '+String(slot.contentsTotal - slot.contents.length)+'/'+String(slot.contentsTotal)+'</h6><hr/><h5 class="postCategories">'+slot.categoriesNames+' - '+slot.author+'</h5><h6>['+slot.time+']</h6>';
		jQuery('#livePopup').html( livePopupContent );
		//devo calcolare la posizione del popup:
		//se il centro dello slot è a dx dello schermo, visualizzerò il popup alla sx dello slot, a dx altrimenti
		if ( ( jQuery(slotDom).position().left + jQuery(slotDom).width()/2 ) > ( jQuery(window).width() / 2 ) ) {
			var popupX = Number(jQuery(slotDom).position().left - Number(jQuery('#livePopup').outerWidth(true)) ) + 6;
		} else {
			var popupX = Number(jQuery(slotDom).position().left + Number(jQuery(slotDom).outerWidth(true)) ) - 6;
		}
		/*
		//se il centro dello slot è sopra nello schermo, visualizzerò il popup sotto allo slot, sopra altrimenti
		if ( ( jQuery(slotDom).position().top + jQuery(slotDom).height()/2 ) > ( jQuery(window).height() / 2 ) ) {
			var popupY = Number(jQuery(slotDom).position().top - Number(jQuery('#livePopup').outerHeight(true)) );
		} else {
			var popupY = Number(jQuery(slotDom).position().top + Number(jQuery(slotDom).outerHeight(true)) );
		}
		*/
		var popupY = Number(jQuery(slotDom).position().top) + 21;
		//var popupY = Number(jQuery(slotDom).position().top) -  Number(jQuery('#livePopup').outerHeight(true)) + 27;
		jQuery('#livePopup').css("left", popupX );
		jQuery('#livePopup').css("top", popupY );
		jQuery('#livePopup').data("left", popupX );
		jQuery('#livePopup').data("top", popupY );
		//infine lo disegno
		jQuery('#livePopup').show();
	});		
	jQuery(slotDom).mouseleave(function() {
		unsetTemporaryStopped();
		/* questo blocco funziona, ma è sospeso
		//rimpicciolisco la progress bar
		jQuery(slotDom).css('margin-bottom','6px');
		jQuery(slotDom).find('.elementProgress').css('height','3px');
		jQuery(slotDom).find('.elementProgress').css('bottom','-9px');
		drawProgressBar(slot, slotDom,3);
		*/
		//nascondo il popup
		jQuery('#livePopup').html( "" );
		jQuery('#livePopup').hide();
	});
	//on click apro il post nel blog
	jQuery(slotDom).click(function() {
		if ( tvEnabled ) {
			//se la tv non esiste già, devo inizializzarla
			if ( jQuery('#tvContainer').length > 0 ) {
				initTvFromEvent(slot.wpid);
			} else {
				initTvFromScratch(slot.wpid);
			}
		} else {
			//window.location = '?p='+slot.wpid;
			window.open('?p='+slot.wpid,'_blank');
		}
	});
	
	//lo aggiungo al dom
	jQuery('#innerContainer').append(slotDom);

	/* va ma fa poi casino con il movimento mousemove
	//lo posiziono al centro dello schermo (spostando innerContainer)
	var newPosX = jQuery('#outerContainer').width() / 2 - jQuery(slotDom).position().left - jQuery(slotDom).width() / 2;
	var newPosY = jQuery('#outerContainer').height() / 2 - jQuery(slotDom).position().top - jQuery(slotDom).height() / 2;
	jQuery('#innerContainer').animate({
		'left': newPosX+'px',
		'top': newPosY+'px'
	}, 300, function() {
		// Animation complete.
		jQuery('#innerContainer').css('left', newPosX+'px');
		jQuery('#innerContainer').css('top', newPosY+'px');
	});
	*/
	
	//scelgo un content a caso tra quelli disponibili (se ce ne sono)
	//console.log('drawSlot CHIAMA refreshSlot con id='+slot.id+' slotsNum='+slotsNum+' refreshSlotsTimerStack='+refreshSlotsTimerStack);
	refreshSlot(slot.id,true,slotsNum);

}

//se ci sono ancora contenuti disponibili per questo slot,
//ne scelgo uno a caso e lo assegno come contenuto allo slot
function refreshSlot(id,isFirst,slotsNum) {
	//console.log('chiamato refreshSlot con id='+id+' slotsNum='+slotsNum+' refreshSlotsTimerStack='+refreshSlotsTimerStack);
	//console.log('## R ## id='+id+' refreshSlotsTimerStack='+refreshSlotsTimerStack+'/'+slots.length);
	for ( var x=0; x<slots.length; x++) {
		if ( slots[x].id == id ) {
			var slot = slots[x];
			break;
		}
	}
	//acchiappo il tag del mio slot
	var slotDom = jQuery('#tag'+id);
	//jQuery(slotDom).hide();
	var contentIndex = 0;
	//controllo se ho ancora contenuti disponibili
	if ( slot.contents.length > 0 ) {
		//console.log("cambio contenuto per slot "+id);
		/* la scelta random non funzionava correttamente
		//se ho un solo contenuto, uso quello
		if ( slot.contents.length == 1 ) {
			contentIndex = 0;
		//se ho più di 1 contenuto, ne scelgo uno
		} else {
			if ( postContentsRandomOrd ) {
				//scelta a caso
				contentIndex = Math.round( Math.random()*( slot.contents.length -1 ) );
				console.log("scelto a caso: ");
				console.log(contentIndex);
			} else {
				//scelta in ordine
				contentIndex = 0;
				console.log("scelto il primo: ");
				console.log(contentIndex);
			}
		}
		*/
		
		//una volta scelto il contenuto, lo visualizzo nello slot
		slot.prevWidth = slot.width;
		slot.prevHeight = slot.height;
		
		//aggiundo al dom!
		jQuery(slotDom).html( slot.contents[contentIndex] );
		/* tolgo perchè troppo forte, per esepmio mi butta via i video
		//se il contenuto è testuale, tengo solo i tag di primo livello, degli latri solo il testo
		if ( jQuery(slotDom).find('img').length > 0 ) {
		} else {
			jQuery(slotDom).children().html( jQuery(slotDom).children().text() );
		}
		*/
		
		//e poi lo butto, in modo che non possa essere visualizzato due volte lo stesso contenuto
		slot.contents.splice(contentIndex,1);
		
		//definisco le dimensioni del mio slot. queste dimensioni verranno poi applicate a tutti i contenuti del mio slot
		if ( slotsNum > 1 && slots.length < slotsNum ) {
			var totalSlots = slotsNum;
		} else {
			var totalSlots = slots.length;
		}
		if ( progressivesize == 'on' ) {
			//nel caso di progressivesize devo ulteriormente cambiare le dimensioni in base all'importanza dello slot
			//devo dimensionare gli slot in ordine decrescente di recentezza
			for ( var x=0; x<slots.length; x++) {
				if ( slots[x].id == id ) {
					//se è il mio slot, aggiorno direttamente lui
					var size = 1 - x / totalSlots; //varia da 1 a 0
					var sizePerc = Math.round(size*30);
					var sizeW = Math.round( sizePerc/100 * jQuery('#innerContainer').width() );
					var sizeH = Math.round( sizePerc/100 * jQuery('#innerContainer').height() );
					jQuery(slotDom).css( 'width',String(sizeW)+'px' );
					jQuery(slotDom).css( 'height',String(sizeH)+'px' );
				} else {
					//per tutti gli altri slot che subiscono ridimensionamento, devo ridimensionarne anche il contenuto
					//jQuery('#tag'+slots[x].id).css( 'width',String(sizeW)+'px' );
					//jQuery('#tag'+slots[x].id).css( 'height',String(sizeH)+'px' );
					//resizeSlotChildren( jQuery('#tag'+slots[x].id) );
				}
			}
		} else {
			//correggo la dimensione dello slot in base al numero di slot visualizzati
			//uso una distribuzione sqrt per capire quanti slot ci stanno in orizzontale (o in verticale) nello schermo
			var maxWPerc = 70/Math.ceil(Math.sqrt(totalSlots)); //non arrivo mai al 100%
			var maxHPerc = 60/Math.ceil(Math.sqrt(totalSlots)); //non arrivo mai al 100%
			//applico le nuove dimensioni
			jQuery(slotDom).css( 'max-width',String(maxWPerc)+'%' );
			jQuery(slotDom).css( 'max-height',String(maxHPerc)+'%' );
		}
		
		
		//imposto runtime le dimensioni dei figli
		//nel caso di non cropping, questo metodo potrebbe variare le dimensioni dello slot, e va quindi eseguito prima dei successivi
		resizeSlotChildren(slotDom,totalSlots);
		
		//aggiungo la progressbar che mi dice a che punto sto nei content (solo se ho più di un content)
		drawProgressBar(slot, slotDom,3);
		
		//aggiungo il titolo del post
		jQuery(slotDom).append('<div class="elementTitle"><h5>'+slot.postTitle+'</h5></div>');
		
		//aggiungo il contatore content num
		if ( slot.contentsTotal > 1 ) {
			//questo è OK con numero del content corrente sui content totali: jQuery(slotDom).append('<div class="elementContentNum"><h6>'+String(slot.contentsTotal - slot.contents.length)+'/'+String(slot.contentsTotal)+'</h6></div>');
			//qua invece visualizzo la data
			jQuery(slotDom).append('<div class="elementContentNum"><h6>'+slot.timeCompact+'</h6></div>');
		}
		
		//se il mio slot è nuovo, non faccio niente, altrimenti seleziono lo slot corrente
		if (!isFirst) {
			//metto tutti gli altri post a non selected
			jQuery('.liveElementSelected').removeClass('liveElementSelected');
			
			//imposto il mio a selected
			jQuery(slotDom).addClass('liveElementSelected');
		}
		
	//se non ho contenuti, skippo
	} else {
		//console.log("FINITI CONTENUTI per slot "+id+", cancello lo slot e loadNextPost");
		//elimino il mio slot perchè non ha più contenuti
		delSlot(id);
		//devo triggerare il caricamento di un nuovo post
		loadNextPost(slotsNum,drawSlotsFromQuery);
	}
	
	
	
	
	
	//finalmente visualizzo
	//jQuery(slotDom).show();
	//jQuery(slotDom).fadeIn(200, function() {
	//});
	//reimposto il layout degli slot
	//console.log("chiamo setLayout da refreshSlot");
	setLayout(id,isFirst);
	
	//internal functions
	function resizeSlotChildren(slotDom,totalSlots) {
		
		//se il mio content è un'immagine la considero prima, perchè dal suo ratio depnderà l'altezza calcolata dello slot
		//questo vale non solo per le immagini, ma per una serie di tag
		var found = '';
		for ( var i=0; i<tv.enabledMediaTags.length; i++) {
			if ( jQuery(slotDom).find(tv.enabledMediaTags[i]).length > 0 ) {
				found = tv.enabledMediaTags[i];
			}
		}
		//console.log(jQuery(slotDom).find('img').length);
		if ( found != '' ) {
			//ciclo su tutti i tag per buttarli tutti tranne quello trovato di importanza maggiore
			for ( var i=0; i<tv.enabledMediaTags.length; i++) {
				var tag = tv.enabledMediaTags[i];
				if ( tag != found ) {
					//butto tutti gli altri tag
					jQuery(slotDom).find(tag).remove();
				} else {
					//trovato il mio tag che impone l'altezza:
					zoomContentToContainer(jQuery(slotDom).find(tag), jQuery(slotDom));
				}
			}
		} else {
			//il mio contenuto è testuale
			//lo ridimensiono e ripulisco ulteriormente
			zoomTexts(slotDom,totalSlots);
			
			//nel caso il contenuto non abbia immagini, imposto un'altezza auto, per non troncare i testi
			if ( contentcrop == 'off' ) {
				jQuery(slotDom).css( 'height','auto' );
				jQuery(slotDom).css( 'max-height','50%' ); //comunque sempre con un limite superiore
			}
		}
		
		
		//imposto runtime le dimensioni di tutti gli altri figli
		jQuery(slotDom).children().width( jQuery(slotDom).width() );
		jQuery(slotDom).children().height( jQuery(slotDom).height() );
		
		
	}
	
}

function drawProgressBar(slot, slotDom, canvasH){
	if ( slot.contentsTotal > 1 ) {
		jQuery(slotDom).find('canvas').remove();
		var canvasW = jQuery(slotDom).width() + 12;
		var unitW = canvasW / slot.contentsTotal;
		var margin = 3;
		var bar = jQuery('<canvas id="canvas'+slot.id+'" class="elementProgress" style="width: '+String(canvasW)+'px;"></canvas>');
		jQuery(slotDom).append(bar);
		
		/* funziona ma ora non serve
		//controllo collisioni on mousemove
		jQuery(bar).mousemove(function(e){
			var mouseX = e.offsetX;
			var mouseY = e.offsetY;
			draw(mouseX,mouseY);
		});		
		*/
		
		
		function drawBar(mouseX,mouseY) {
			//var canvasH = jQuery(bar).height();
			var canvas = document.getElementById('canvas'+slot.id);
			canvas.width  = canvasW;			
			canvas.height = canvasH;
			jQuery(bar).css( 'width',String(canvasW)+'px' );
			jQuery(bar).css( 'height',String(canvasH)+'px' );
			jQuery(bar).css('bottom','-'+String(canvasH + 6)+'px');
			if (canvas.getContext){  
				var ctx = canvas.getContext('2d');  
				//resetto la view
				ctx.clearRect ( 0, 0, canvasW, canvasH );
				//disegno
				var elementW;
				for ( var x=0; x < slot.contentsTotal; x++ ) {
					if ( x == ( slot.contentsTotal - 1 ) ) {
						elementW = unitW;
					} else {
						elementW = unitW - margin;
					}
					if ( x == (slot.contentsTotal - slot.contents.length - 1) ) {
						ctx.fillStyle = 'rgba(241,173,2,1)';  
					} else {
						/* funziona ma ora non lo uso
						if (
							mouseX && mouseY &&
							mouseX >= x*unitW &&
							mouseX <= x*unitW+elementW
						) {
							ctx.fillStyle = 'rgba(0,0,0,0.5)';  
						} else {
						*/
							ctx.fillStyle = 'rgba(0,0,0,0.1)';  
						/*
						}
						*/
					}
					ctx.beginPath();
					ctx.moveTo(x*unitW, 0); 
					ctx.lineTo(x*unitW+elementW, 0); 
					ctx.lineTo(x*unitW+elementW, canvasH); 
					ctx.lineTo(x*unitW, canvasH); 
					ctx.lineTo(x*unitW, 0); 
					ctx.closePath();
					ctx.fill();				
				}
			}
		}
		
		drawBar();
	}
}

function delLastSlot()
{
	if ( slots.length > 0 )
	{
		delSlot(slots[slots.length-1].id);
	}
}

function delSlot(id)
{
	//muovo il tag fuori dallo schermo
	//deve essere un'operazione sincrona
	//jQuery('#tag'+id).animate({
		//opacity:0
	//}, fadeDuration, "swing", function(){ 
		jQuery('#tag'+id).remove();
		//dopo averlo fatto sparire, lo tolgo anche dall'array slots
		for ( var x=0; x<slots.length; x++) {
			if ( slots[x].id == id ) {
				slots.splice(x, 1);
				break;
			}
		}
		//console.log("delSlot() PRIMA refreshSlotsTimerStack="+refreshSlotsTimerStack);
		//if ( refreshSlotsTimerStack > -1 && refreshSlotsTimerStack < (slots.length - 1) ) { 
		if ( refreshSlotsTimerStack > -1 ) { 
			refreshSlotsTimerStack--;
		}
		//console.log("delSlot() DOPO refreshSlotsTimerStack="+refreshSlotsTimerStack);
		//update grafica
		setLayout();
		//console.log('## D ## id='+id+' refreshSlotsTimerStack='+refreshSlotsTimerStack+'/'+slots.length);
	////});
}






/* questo è il timer principale, che da il sync a tutto, ovvero che aggiunge gli slot man mano */
function refreshSlotOnTimer()
{
	//console.log('chiamto refresh on timer con refreshSlotsTimerStack='+refreshSlotsTimerStack);
	
	//bypasso se sono in stop, o se non ci sono slots visualizzati
	updatePlayPauseButtons();
	if ( !isStopped && !isTemporaryStopped && !isLoadingStopped && slots.length > 0 ) {
	
		//console.log('refreshSlotOnTimer con PRIMA: refreshSlotsTimerStack='+refreshSlotsTimerStack+' e slots.length='+slots.length);
		//aggiorno lo stack
		refreshSlotsTimerStack++;
		
		//se necessario azzero lo stack
		if ( refreshSlotsTimerStack >= slots.length ) refreshSlotsTimerStack = 0;
		//console.log('refreshSlotOnTimer con DOPO: refreshSlotsTimerStack='+refreshSlotsTimerStack+' e slots.length='+slots.length);
		
		//aggiorno lo slot corrente
		//console.log('refreshSlotOnTimer CHIAMA refreshSlot con id='+slots[refreshSlotsTimerStack].id+' slotsNum='+1+' refreshSlotsTimerStack='+refreshSlotsTimerStack);
		//console.log('## T ## id='+slots[refreshSlotsTimerStack].id+' refreshSlotsTimerStack='+refreshSlotsTimerStack+'/'+slots.length);
		refreshSlot( slots[refreshSlotsTimerStack].id, false, 1 ); //quando è chiamato dal timer, come terzo parametro ritorno sempre 1, ovvero il numero di slot totali della query, perchè ne aggiorno uno solo alla volta
		
		/*
		//animazione al ticker
		jQuery('#ticker').fadeIn(1, function() {
			jQuery('#ticker').fadeOut(fadeDuration);
		});
		*/
		
	}
	
	//riavvio il timer
	refreshSlotsTimer = setTimeout(refreshSlotOnTimer, refreshSlotsTimerDuration);
}

