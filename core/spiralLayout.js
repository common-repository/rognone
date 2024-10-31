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







/* from here specific methods for the spiral layout */

function setLayout(refreshedSlotId,refreshedSlotFirstTime)
{
	
	debugSetLayoutCurrentMethod = "setLayout";
	//setLayoutProgress = true;
	
	//azzero il cursore che serve all'algoritmo
	direction_degree = starting_direction_degree;
	
	/*
	//ciclo su tutti gli slot, e fisso delle misure decrescenti
	for (var i=0;i<slots.length;i++) {
		var percW = String( Math.round( (slots.length-i)/slots.length*50 ) )+'%';
		jQuery('#tag'+slots[i].id).width(percW);
	}
	*/
	
	//ciclo su tutti gli slot, e salvo le variabili che mi serviranno per i calcoli
	for (var i=0;i<slots.length;i++) {
		//salvo nuovi dati normalizzati per gli slots che mi serviranno per calcolare il layout a spirale
		slots[i].width = jQuery('#tag'+slots[i].id).outerWidth(true);
		slots[i].height = jQuery('#tag'+slots[i].id).outerHeight(true);
		//slots[i].area = slots[i].width*slots[i].height;
		if ( jQuery('#tag'+slots[i].id).position() )
		{
			slots[i].x = jQuery('#tag'+slots[i].id).position().left;
			slots[i].y = jQuery('#tag'+slots[i].id).position().top;
		}
		else
		{
			slots[i].x = (jQuery(window).width() - slots[i].width ) / 2;
			slots[i].y = (jQuery(window).height() - slots[i].height ) / 2;
		}
	}
	
	/*
	//ordino gli slot per area
	//slots.sort(sortByArea); //non se usarlo, è quasi più bello senza, è più vario
	//glielo faccio ordinare solo se sono tanti
	if ( slots.length > 20 )
	{
		slots.sort(sortByArea);
	}
	*/
	
	//ciclo su tutti gli slot, e per ciascuno decido la sua posizione, che dipenderà solo dagli slot già posizionati prima di lui, e non da quelli che seguono
	for (var i=0;i<slots.length;i++) {
		//azzero il contatore che serve all'algoritmo
		recursion_level = 0;
		
		//chiamo l'algoritmo vero e proprio che posiziona ogni slot su un layout a spirale
		//in base alla posizione degli slot precedentemente posizionati
		calc_slot_pos(i); //se si vuol chiamare più di una volta, bisogna azzerare il recursion_level
	}
	
	
	//this moves all slots, as a whole static object, to center of container
	center_slots();
	
	//dopo i calcoli applico come animazione CSS la nuova posizione calcolata
	animateSlotsToPos(refreshedSlotId,refreshedSlotFirstTime);
	
	//prima disegno la linea grande sullo sfondo
	//drawSpiralLine('bg','spiralLine', 'innerContainer', 12, 20,'rgba(252,239,204,1)',false );
	drawSpiralLine('bg','spiralLine', 'innerContainer', 3, 20,'#F1AD02',refreshedSlotFirstTime,false );
	//poi disegno la linea piccola
	drawSpiralLine('thumb','spiralLineThumb', 'outerContainer', 2, 0,'#F1AD02',refreshedSlotFirstTime,true,refreshedSlotId,'#e4e4e4','#a4a4a4',3 );
}

function calc_slot_pos(currentIndex) {
	debugSetLayoutCurrentMethod = "calc_slot_pos";
	if ( currentIndex > 0) 
	{
		recursion_level++;
		if (leftSideFree(currentIndex)) {
			posStandardslot(currentIndex);
			rotateCCW();
			return;
		} else {
			if (posUpSideslot(currentIndex)) {
				rotateCCW();
				return;
			} else if ( recursion_level <= 3 ) {
				rotateCW();
				calc_slot_pos(currentIndex);
				return;
			} else {
				//left side is not free
				//posUpSideslot failed
				//i can't recurse because i would restart from initial direction, and i would go in an infinite loop					
				//all that means that i can't be adjacent to the last slot
				//i have to make a jump
				rotateCCW();
				posNotAdjacent(currentIndex);
				rotateCCW();
			}
		}
	} else {
		posFirstslot(currentIndex);
		return;
	}
}

/* 	con riferimento all'ultimo slot presente sullo schermo (che non è l'ultimissimo slot, ovvero quello che sto posizionando)
	mi dice se alla sua sinistra c'è spazio per aggiungere il nuovo slot
*/
function leftSideFree(currentIndex) {
	debugSetLayoutCurrentMethod = "leftSideFree";
	switch (direction_degree) {
		case 180: //goin LEFT
			for (var i=0;i<currentIndex;i++) {
				if ( slots[i].x < slots[ currentIndex - 1 ].x ) {
					return(false);
				}
			}
			return(true);
			break;
		case 270: //goin DOWN
			for (var i=0;i<currentIndex;i++) {
				if ( ( slots[i].y + slots[i].height ) > ( slots[ currentIndex - 1 ].y + slots[ currentIndex - 1 ].height ) ) {
					return(false);
				}
			}
			return(true);
			break;
		case 0: //goin RIGHT
			for (var i=0;i<currentIndex;i++) {
					if ( slots[i].x + slots[i].width > slots[ currentIndex - 1 ].x + slots[ currentIndex - 1 ].width ) {
					return(false);
				}
			}
			return(true);
			break;
		case 90: //goin TOP
			for (var i=0;i<currentIndex;i++) {
				if ( ( slots[i].y ) <	( slots[ currentIndex - 1 ].y )	) {
					return(false);
				}
			}
			return(true);
			break;
	}
}
				
function posStandardslot(currentIndex) {
	debugSetLayoutCurrentMethod = "posStandardslot";
	switch (direction_degree) {
		case 180: //goin LEFT
			slots[currentIndex].x = - spacing + slots[currentIndex-1].x - slots[currentIndex].width;
			slots[currentIndex].y = slots[currentIndex-1].y + slots[currentIndex-1].height - slots[currentIndex].height;
			break;
		case 270: //goin DOWN
			slots[currentIndex].y = spacing + slots[currentIndex-1].y + slots[currentIndex-1].height;
			slots[currentIndex].x = slots[currentIndex-1].x + slots[currentIndex-1].width - slots[currentIndex].width;
			break;
		case 0: //goin RIGHT	
			slots[currentIndex].x = spacing + slots[currentIndex-1].x + slots[currentIndex-1].width;
			slots[currentIndex].y = slots[currentIndex-1].y;
			break;
		case 90: //goin TOP
			slots[currentIndex].x = slots[currentIndex-1].x;
			slots[currentIndex].y = - spacing + slots[currentIndex-1].y - slots[currentIndex].height;
			break;
	}
	return;
}

function posUpSideslot(currentIndex) {
	debugSetLayoutCurrentMethod = "posUpSideslot";
	var selected_slots = [];
	switch (direction_degree) {
		case 180: //goin LEFT
			for (var i=0;i<currentIndex;i++) {
				if (
						(
							( slots[i].x + slots[i].width + spacing )
							>
							( slots[currentIndex-1].x - slots[currentIndex].width - spacing )
						)
						&&
						(
							 slots[i].x < slots[currentIndex-1].x
						)
					)
				{
					selected_slots.push(i);
				}
			}
			var my_min_y = slots[selected_slots[0]].y;
			for (var i=0;i<selected_slots.length;i++) {
				if ( slots[selected_slots[i]].y < my_min_y ) {
					my_min_y = slots[selected_slots[i]].y;
				}
			}
			if ( my_min_y <= slots[currentIndex-1].y ) {
				return(false);
			} else {
				//set position
				slots[currentIndex].x = - spacing + slots[currentIndex-1].x - slots[currentIndex].width;
				slots[currentIndex].y = my_min_y - slots[currentIndex].height - spacing;
				return(true);
			}
			break;
		case 270: //goin DOWN
			for (var i=0;i<currentIndex;i++) {
				if (
						(
							( slots[i].y - spacing )
							<
							( slots[currentIndex-1].y + slots[currentIndex-1].height + spacing + slots[currentIndex].height )
						)
						&&
						(
							 ( slots[i].y + slots[i].height )
							 >
							 ( slots[currentIndex-1].y + slots[currentIndex-1].height )
						)
					)
				{
					selected_slots.push(i);
				}
			}
			var my_min_x = slots[selected_slots[0]].x - spacing - slots[currentIndex].width;
			for (var i=0;i<selected_slots.length;i++) {
				if ( slots[selected_slots[i]].x - spacing - slots[currentIndex].width < my_min_x ) {
					my_min_x = slots[selected_slots[i]].x - spacing - slots[currentIndex].width;
				}
			}
			if ( ( my_min_x + slots[currentIndex].width + spacing ) <= slots[currentIndex-1].x ) {
				return(false);
			} else {
				//set position
				slots[currentIndex].x = my_min_x;
				slots[currentIndex].y = spacing + slots[currentIndex-1].y + slots[currentIndex-1].height;
				return(true);
			}
			break;
		case 0: //goin RIGHT	
			for (var i=0;i<currentIndex;i++) {
				if (
						(
							( slots[i].x - spacing )
							<
							( slots[currentIndex-1].x + slots[currentIndex-1].width + spacing + slots[currentIndex].width )
						)
						&&
						(
							 ( slots[i].x + slots[i].width )
							 >
							 ( slots[currentIndex-1].x + slots[currentIndex-1].width )
						)
					)
				{
					selected_slots.push(i);
				}
			}
			var my_min_y = slots[selected_slots[0]].y + spacing + slots[selected_slots[0]].height;
			for (var i=0;i<selected_slots.length;i++) {
				if ( ( slots[selected_slots[i]].y + spacing + slots[selected_slots[i]].height ) > my_min_y ) {
					my_min_y = slots[selected_slots[i]].y + spacing + slots[selected_slots[i]].height;
				}
			}
			if ( my_min_y > ( slots[currentIndex-1].y + spacing + slots[currentIndex-1].height ) ) {
				return(false);
			} else {
				//set position
				slots[currentIndex].x = spacing + slots[currentIndex-1].x + slots[currentIndex-1].width;
				slots[currentIndex].y = my_min_y;
				return(true);
			}
			break;
		case 90: //goin TOP
			for (var i=0;i<currentIndex;i++) {
				if (
						(
							( slots[i].y + slots[i].height + spacing )
							>
							( slots[currentIndex-1].y - slots[currentIndex].height - spacing )
						)
						&&
						(
							 ( slots[i].y )
							 <
							 ( slots[currentIndex-1].y )
						)
					)
				{
					selected_slots.push(i);
				}
			}
			var my_min_x = slots[selected_slots[0]].x + slots[selected_slots[0]].width + spacing;
			for (var i=0;i<selected_slots.length;i++) {
				if ( slots[selected_slots[i]].x + slots[selected_slots[i]].width + spacing > my_min_x ) {
					my_min_x = slots[selected_slots[i]].x + slots[selected_slots[i]].width + spacing;
				}
			}
			if ( my_min_x > ( slots[currentIndex-1].x + spacing + slots[currentIndex-1].width ) ) {
				return(false);
			} else {
				//set position
				slots[currentIndex].x = my_min_x;
				slots[currentIndex].y = - spacing + slots[currentIndex-1].y - slots[currentIndex].height;
				return(true);
			}
			break;
	}
}

function posNotAdjacent(currentIndex) {
	debugSetLayoutCurrentMethod = "posNotAdjacent";
	var selected_slots = [];
	switch (direction_degree) {
		case 180: //goin LEFT
			//look for overlapping slots
			for (var i=0;i<currentIndex;i++) {
				if (
						(
							(
								( slots[i].x )
								<
								( slots[currentIndex-1].x )
							)
							
							//&&
							//(
							//	 ( slots[i].x + slots[i].width + spacing )
							//	 >
							//	 ( slots[currentIndex-1].x - spacing - slots[currentIndex].width )
							//)
							
						)
						&&
						(
							(
								( slots[i].y )
								<
								( slots[currentIndex-1].y + slots[currentIndex-1].height + spacing )
							)
							&&
							(
								 ( slots[i].y + slots[i].height + spacing )
								 >
								 ( slots[currentIndex-1].y + slots[currentIndex-1].height - slots[currentIndex].height )
							)
						)
					)
				{
					selected_slots.push(i);
				}
			}		
			var my_min_x = slots[currentIndex-1].x - spacing - slots[currentIndex].width;
			for (var i=0;i<selected_slots.length;i++) {
				if ( slots[selected_slots[i]].x < my_min_x + slots[currentIndex].width + spacing ) {
					my_min_x = slots[selected_slots[i]].x - slots[currentIndex].width - spacing;
				}
			}
			//set position
			slots[currentIndex].x = my_min_x;
			slots[currentIndex].y = slots[currentIndex-1].y + slots[currentIndex-1].height - slots[currentIndex].height;
			return(true);
			break;
		case 270: //goin DOWN
			//look for overlapping slots
			for (var i=0;i<currentIndex;i++) {
				if (
						(
							(
								( slots[i].x + slots[i].width + spacing )
								>
								( slots[currentIndex-1].x + slots[currentIndex-1].width - slots[currentIndex].width )
							)
							&&
							(
								 ( slots[i].x )
								 <
								 ( slots[currentIndex-1].x + slots[currentIndex-1].width + spacing )
							)
						)
						&&
						(
							(
								( slots[i].y + slots[i].height + spacing )
								>
								( slots[currentIndex-1].y + slots[currentIndex-1].height + spacing )
							)
							
							//&&
							//(
							//	 ( slots[i].y )
							//	 <
							//	 ( slots[currentIndex-1].y + slots[currentIndex-1].height + spacing + slots[currentIndex].height + spacing )
							//)
							
						)
					)
				{
					selected_slots.push(i);
				}
			}		
			var my_min_y = slots[currentIndex-1].y + slots[currentIndex-1].height + spacing;
			for (var i=0;i<selected_slots.length;i++) {
				if ( slots[selected_slots[i]].y + slots[selected_slots[i]].height + spacing > my_min_y ) {
					my_min_y = slots[selected_slots[i]].y + slots[selected_slots[i]].height + spacing;
				}
			}
			//set position
			slots[currentIndex].x = slots[currentIndex-1].x + slots[currentIndex-1].width - slots[currentIndex].width;
			slots[currentIndex].y = my_min_y;
			return(true);
			break;
		case 0: //goin RIGHT	
			//look for overlapping slots
			for (var i=0;i<currentIndex;i++) {
				if (
						(
							(
								( slots[i].x + slots[i].width + spacing )
								>
								( slots[currentIndex-1].x + slots[currentIndex-1].width + spacing )
							)
							
							//&&
							//(
							//	 ( slots[i].x )
							//	 <
							//	 ( slots[currentIndex-1].x + slots[currentIndex-1].width + spacing + slots[currentIndex].width + spacing )
							//)
							
						)
						&&
						(
							(
								( slots[i].y + slots[i].height + spacing )
								>
								( slots[currentIndex-1].y )
							)
							&&
							(
								 ( slots[i].y )
								 <
								 ( slots[currentIndex-1].y + slots[currentIndex].height + spacing )
							)
						)
					)
				{
					selected_slots.push(i);
				}
			}		
			var my_min_x = slots[currentIndex-1].x + slots[currentIndex-1].width + spacing;
			for (var i=0;i<selected_slots.length;i++) {
				if ( slots[selected_slots[i]].x + slots[selected_slots[i]].width + spacing > my_min_x ) {
					my_min_x = slots[selected_slots[i]].x + slots[selected_slots[i]].width + spacing;
				}
			}
			//set position
			slots[currentIndex].x = my_min_x;
			slots[currentIndex].y = slots[currentIndex-1].y; //OK!
			return(true);
			break;
		case 90: //goin TOP
			//look for overlapping slots
			for (var i=0;i<currentIndex;i++) {
				if (
						(
							(
								( slots[i].x )
								<
								( slots[currentIndex-1].x + slots[currentIndex].width + spacing )
							)
							&&
							(
								 ( slots[i].x + slots[i].width + spacing )
								 >
								 ( slots[currentIndex-1].x )
							)
						)
						&&
						(
							(
								( slots[i].y )
								<
								( slots[currentIndex-1].y )
							)
							
							//&&
							//(
							//	 ( slots[i].y + slots[i].height + spacing )
							//	 >
							//	 ( slots[currentIndex-1].y - slots[currentIndex].height - spacing )
							//)
							
						)
					)
				{
					selected_slots.push(i);
					//_root.debug.text += "overlap: " + i + "\n";
				}
			}		
			var my_min_y = slots[currentIndex-1].y - slots[currentIndex].height - spacing;
			for (var i=0;i<selected_slots.length;i++) {
				if ( slots[selected_slots[i]].y < my_min_y + slots[currentIndex].height + spacing ) {
					my_min_y = slots[selected_slots[i]].y - slots[currentIndex].height - spacing;
				}
			}
			//set position
			slots[currentIndex].x = slots[currentIndex-1].x;
			slots[currentIndex].y = my_min_y;
			return(true);
			break;
	}
}

function rotateCCW() {
	debugSetLayoutCurrentMethod = "rotateCCW";
	direction_degree += 90;
	if ( direction_degree == 360 ) { direction_degree = 0; }
	return;
}

function rotateCW() {
	debugSetLayoutCurrentMethod = "rotateCW";
	direction_degree -= 90;
	if ( direction_degree < 0 ) { direction_degree = 270; }
	return;
}

function posFirstslot(currentIndex) {
	debugSetLayoutCurrentMethod = "posFirstslot";
	slots[currentIndex].x = (jQuery(window).width()-slots[currentIndex].width)/2;
	slots[currentIndex].y = (jQuery(window).height()-slots[currentIndex].height)/2;
	return;
}






function center_slots() {
	debugSetLayoutCurrentMethod = "center_slots";
	edge_left = 100000;
	edge_top = 100000;
	edge_right = -100000;
	edge_bottom = -100000;
	//find the bounding box
	for (var i=0;i<slots.length;i++) {
		if (slots[i].x < edge_left) { edge_left = slots[i].x; }
		if (slots[i].y < edge_top) { edge_top = slots[i].y; }
		if (slots[i].x + slots[i].width > edge_right) { edge_right = slots[i].x + slots[i].width; }
		if (slots[i].y + slots[i].height > edge_bottom) { edge_bottom = slots[i].y + slots[i].height; }
	}
	//shift positions
	var shift_x = Math.round((jQuery(window).width()-(edge_right - edge_left))/2);
	var shift_y = Math.round((jQuery(window).height()-(edge_bottom - edge_top))/2);
	//alert("centro con shift_x="+shift_x+" e shift_y="+shift_y);
	for (var i=0;i<slots.length;i++) {
		slots[i].x += shift_x - edge_left;
		slots[i].y += shift_y - edge_top;
	}		
}

function animateSlotsToPos(refreshedSlotId,refreshedSlotFirstTime)
{
	for (var i=0;i<slots.length;i++) {
		//jQuery('#tag'+slots[i].id).stop(true, false).animate({
		//se c'è una variazione sulle dimensioni, animo anche quelle, altrimenti solo la posizione
		
		
		if ( refreshedSlotFirstTime || refreshedSlotId != slots[i].id || !animateResize || slots[i].prevWidth == undefined || slots[i].prevHeight == undefined || ( slots[i].prevWidth == slots[i].width && slots[i].prevHeight == slots[i].height ) )
		{
			//NO RESIZE
			if ( refreshedSlotId == slots[i].id ) {
				jQuery('#tag'+slots[i].id).stop(true, false).fadeOut(50).fadeIn(50).animate({
					left:slots[i].x,
					top:slots[i].y,
					opacity:1
				}, fadeDuration, "swing", function(){ 
				});
			} else {
				jQuery('#tag'+slots[i].id).stop(true, false).animate({
					left:slots[i].x,
					top:slots[i].y,
					opacity:1
				}, fadeDuration, "swing", function(){ 
				});
			}
		} else {
			//console.log("RESIZE!!!!!!");
			jQuery('#tag'+slots[i].id).width( slots[i].prevWidth);
			jQuery('#tag'+slots[i].id).height( slots[i].prevHeight);
			//console.log("da X"+String(slots[i].prevWidth)+" a X"+String(slots[i].width));
			//console.log("da Y"+String(slots[i].prevHeight)+" a Y"+String(slots[i].height));
			//jQuery('#tag'+slots[i].id).children().hide();
			jQuery('#tag'+slots[i].id).stop(true, false).fadeOut(50).fadeIn(50).animate({
				left:slots[i].x,
				top:slots[i].y,
				width:String(slots[i].width-18)+'px',
				height:String(slots[i].height-42)+'px',
				opacity:1
			}, fadeDuration, "swing", function(){ 
				//isTemporaryStopped = false;
				//if ( slots[i] ) jQuery('#tag'+slots[i].id).children().show();
				//jQuery(this).children().show();
			});
		}
	}
	
}

function drawSpiralLine(type, canvasDomId, containerDomId, lineWidth, headerHeight, lineColor,refreshedSlotFirstTime, drawSlots, refreshedSlotId, slotsColor, slotsColorSelected, slotsMargin) {
	if ( type != 'bg' && type != 'thumb' ) type = 'bg';
	if ( draw_spiral_line == "on" && slots.length > 0 ) {
		//creo la canvas, solo se non c'è già
		if ( jQuery('#'+canvasDomId).length == 0 ) {
			//if (headerHeight==0) console.log("creo canvas");
			var spiralLine = jQuery('<canvas id="'+canvasDomId+'" ></canvas>');
			jQuery('#'+containerDomId).prepend(spiralLine);
			//jQuery('#'+containerDomId).append(spiralLine);
		}
		//mi devo ricalcolare la bbox, perchè rispetto a quando l'ha calcolata center_slots() è probabilmente cambiata
		edge_left = 100000;
		edge_top = 100000;
		edge_right = -100000;
		edge_bottom = -100000;
		for (var i=0;i<slots.length;i++) {
			if (slots[i].x < edge_left) { edge_left = slots[i].x; }
			if (slots[i].y < edge_top) { edge_top = slots[i].y; }
			if (slots[i].x + slots[i].width > edge_right) { edge_right = slots[i].x + slots[i].width; }
			if (slots[i].y + slots[i].height > edge_bottom) { edge_bottom = slots[i].y + slots[i].height; }
		}
		//trovo misure e offset della canvas
		var canvasW = edge_right - edge_left;
		var canvasH = edge_bottom - edge_top;
		var offsetX = edge_left;
		var offsetY = edge_top;
		if ( type == 'thumb' ) {
			//var canvasW = jQuery('#innerContainer').width()/10;
			//var canvasH = jQuery('#innerContainer').height()/10;
			canvasW = canvasW/10;
			canvasH = canvasH/10;
		} else if ( type == 'bg' ) {
			//var canvasW = jQuery('#innerContainer').width();
			//var canvasH = jQuery('#innerContainer').height();
			jQuery('#'+canvasDomId).css( 'top',String(offsetY)+'px' );
			jQuery('#'+canvasDomId).css( 'left',String(offsetX)+'px' );
			//console.log(canvasW+'x'+canvasH+' at '+offsetX+'x'+offsetY);
		}
		jQuery('#'+canvasDomId).css( 'width',String(canvasW)+'px' );
		jQuery('#'+canvasDomId).css( 'height',String(canvasH)+'px' );
		//recupero la canvas per disegnarci dentro
		var canvas = document.getElementById(canvasDomId);
		//var canvasW = jQuery('#'+containerDomId).width();
		//var canvasH = jQuery('#'+containerDomId).height();
		canvas.width  = canvasW;			
		canvas.height = canvasH;
		//jQuery('#'+canvasDomId).css( 'width',String(canvasW)+'px' );
		//jQuery('#'+canvasDomId).css( 'height',String(canvasH)+'px' );
		if (canvas.getContext){  
			var ctx = canvas.getContext('2d');  
			//helper functions
			function slotPos(i) {
				if ( type == 'thumb' ) {
					var slotPos = {
						'x': Math.round( ( slots[i].x+slots[i].width/2 - offsetX ) / 10 ),
						'y': Math.round( ( slots[i].y+(slots[i].height+headerHeight)/2 - offsetY ) / 10 ),
						'w': Math.round( slots[i].width / 10 ),
						'h': Math.round( slots[i].height / 10 )
					};
				} else if ( type == 'bg' ) {
					var slotPos = {
						'x': Math.round( slots[i].x+slots[i].width/2 - offsetX ),
						'y': Math.round( slots[i].y+(slots[i].height+headerHeight)/2 - offsetY ),
						'w': Math.round( slots[i].width ),
						'h': Math.round( slots[i].height )
					};
				}
				
				/*
				var slotPos = {
					'x': Math.round( (slots[i].x+slots[i].width/2)/jQuery('#innerContainer').width()*canvasW ) - offsetX,
					'y': Math.round( (slots[i].y+(slots[i].height+headerHeight)/2)/jQuery('#innerContainer').height()*canvasH ) - offsetY,
					'w': Math.round( slots[i].width/jQuery('#innerContainer').width()*canvasW ),
					'h': Math.round( slots[i].height/jQuery('#innerContainer').height()*canvasH )
				};
				*/
				//if (headerHeight==0) console.log(String(i)+" mi arriva x:"+String(slots[i].x+slots[i].width/2)+" e y:"+String(slots[i].y+(slots[i].height+headerHeight)/2)+" ritorno x:"+slotPos.x+" e y:"+slotPos.y);
				return slotPos;
			}
			//if (headerHeight==0) console.log("inizio disegno");
			//resetto la view
			//ctx.clearRect ( 0, 0, canvasW, canvasH );
			//disegno
			
			/*
			ctx.fillStyle = 'rgba(241,173,2,0.2)';  
			ctx.strokeStyle = 'rgba(241,173,2,0.2)';  
			*/
			if ( slots.length > 0 ) {
				//disegno gli slot
				if ( drawSlots ) {
					for (var i = 0; i < slots.length; i ++)
					{
						if ( refreshedSlotId == slots[i].id && !refreshedSlotFirstTime ) {
							ctx.fillStyle = slotsColorSelected;  
						} else {
							ctx.fillStyle = slotsColor;  
						}
						ctx.beginPath();
						ctx.moveTo(slotPos(i).x-slotPos(i).w/2, slotPos(i).y-slotPos(i).h/2);
						ctx.lineTo(slotPos(i).x+slotPos(i).w/2-slotsMargin, slotPos(i).y-slotPos(i).h/2);
						ctx.lineTo(slotPos(i).x+slotPos(i).w/2-slotsMargin, slotPos(i).y+slotPos(i).h/2-slotsMargin);
						ctx.lineTo(slotPos(i).x-slotPos(i).w/2, slotPos(i).y+slotPos(i).h/2-slotsMargin);
						ctx.closePath();
						ctx.fill();				
					}
				}
				ctx.fillStyle = lineColor;  
				ctx.strokeStyle = lineColor;
				//ctx.strokeStyle = '#E4E4E4';  
				ctx.lineWidth   = lineWidth;
				ctx.beginPath();
				//cerchio sul punto di partenza
				ctx.moveTo(slotPos(0).x, slotPos(0).y);
				ctx.arc(slotPos(0).x, slotPos(0).y, ctx.lineWidth, 0, Math.PI*2, true);
				ctx.closePath();
				ctx.fill();
				
				if ( slots.length > 1 ) {
					//disegno tutta la spline
					ctx.beginPath();
					ctx.moveTo(slotPos(0).x, slotPos(0).y);
					//console.log(slots);
					//console.log(String(0)+" con xfrom:"+slots[0].x+" con yfrom:"+slots[0].y);
					if ( slots.length > 2 ) {
						for (var i = 1; i < slots.length - 2; i ++)
						{
							var xc = (slotPos(i).x + slotPos(i+1).x) / 2;
							var yc = (slotPos(i).y + slotPos(i+1).y) / 2;
							ctx.quadraticCurveTo(slotPos(i).x, slotPos(i).y, xc, yc);
							//if (headerHeight==0) console.log(String(i)+" con xfrom:"+slotPos(i).x+" con yfrom:"+slotPos(i).y+" con xto:"+xc+" con yto:"+yc);
						}
					} else {
						var i = 0;
					}
					// curve through the last two slots
					ctx.quadraticCurveTo(slotPos(i).x, slotPos(i).y, slotPos(i+1).x,slotPos(i+1).y);
					//ctx.closePath();
					ctx.stroke();			
					//cerchio sul punto di arrivo
					ctx.beginPath();
					// move to the last point
					ctx.moveTo(slotPos(i+1).x, slotPos(i+1).y);
					ctx.arc(slotPos(i+1).x, slotPos(i+1).y, ctx.lineWidth, 0, Math.PI*2, true);
					ctx.closePath();
					ctx.fill();
				}
			}
		}		
	} else if ( draw_spiral_line == "on" && slots.length == 0 ) {
		//nel caso in cui non ho slots, resetto la canvas corrente
		//ctx.clearRect(0, 0, canvasW, canvasH);
		//console.log("resetto");
		jQuery('#'+canvasDomId).remove();
	}
}
