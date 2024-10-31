/* carico ultimo post disponibile, e lo smembro in singoli contenuti */
function loadNextPost(slotsNum,closure) {
	//console.log('loadNextPost con slotsNum='+slotsNum);
	if ( !slotsNum ) slotsNum = 1;
	jQuery('#liveBusyIconContainer').show();
	if ( pageNum[slotsNum] ) {
		pageNum[slotsNum]++;
		if ( slotsNum > 1 ) {
			pageNum[1] += slotsNum;
		}
	} else {
		pageNum[slotsNum] = 1;
		if ( slotsNum > 1 ) {
			pageNum[1] = slotsNum;
		}		
	}
	isLoadingStopped = true;
	options = {
			'action':'get_posts',
			'paged':pageNum[slotsNum],
			'posts_per_page':slotsNum
		};
	if ( preselected_category_id > 0 ) options.preselectedCategoryId = preselected_category_id;
	jQuery.post(
		'wp-admin/admin-ajax.php', 
		options, 
		function(res){
			//console.log('loadNextPost con res:');
			//console.log(res);
			jQuery('#liveBusyIconContainer').hide();
			isLoadingStopped = false;
			if ( res && jQuery(res).children('post').length > 0 ) {
				//normalizzo
				var slotsFromQuery = normalizePosts(res);
				if ( !slotsFromQuery || slotsFromQuery.length == 0 ) {
					console.log("dopo la normalizzazione il mio post è vuoto, devo caricarne un altro");
					loadNextPost(slotsNum,closure);
				} else {
					if ( closure ) {
						return closure(slotsFromQuery);
					}
				}
			} else {
				//console.log('no posts available!');
				//se ho finito i post, riparto dall'inizio
				pageNum = new Array;
				loadNextPost(slotsNum,closure);
			}
		}
	);
}

function loadPostTv(wpId, closure) {
	var myPost = {};
	pausePlayback(true);
	jQuery('#liveBusyIconContainer').show();
	options = {
			'action':'get_post',
			'postId':wpId
		};
	if ( preselected_category_id > 0 ) options.preselectedCategoryId = preselected_category_id;
	jQuery.post(
		'wp-admin/admin-ajax.php', 
		options, 
		function(res){
			//jQuery('#liveBusyIconContainer').hide();
			//console.log("query_posts mi ritorna res = ");
			//console.log(res);
			if ( res && jQuery(res).children('post').length > 0 ) {
				//normalizzo i post
				//console.log('loadPostTv: mi arriva dalla query res:');
				//console.log(res);
				var posts = normalizePosts(res);
				//console.log('posts normalized');
				//console.log(posts);
				if ( !posts || posts.length == 0 ) {
					console.log("dopo la normalizzazione non ho post per la tv, devo caricarne un altro");
					var prevPostId = jQuery(res).children('post')[0].prevLinkId;
					//console.log(prevPostId);
					loadPostTv(prevPostId, closure);
				} else {
					myPost = posts[0]; //me ne aspetto uno solo, ma la query php torna sempre un array
					//console.log('loadPostTv: da res ho estratto myPost:');
					//console.log(myPost);
					//da curPostPrevLink e curPostNextLink estrapolo i wpid di prev e next, e i relativi titoli, e li salvo nello slot
					myPost.prevLink = jQuery(myPost.prevLink).find('a').attr('href');
					myPost.nextLink = jQuery(myPost.nextLink).find('a').attr('href');
					
					//se in iframe, aggiorno il link sul logo
					if ( player_mode == 'iframe' ) {
						jQuery('.liveLogoIframe').attr('href', '?rognone&p='+wpId+'&c='+preselected_category_id );
					}
					
					/*
					console.log("loadPostTv");
					console.log(myPost.prevLink);
					console.log(myPost.nextLink);
					console.log(myPost.prevTitle);
					console.log(myPost.nextTitle);
					//console.log(myPost.prevId);
					//console.log(myPost.nextId);
					console.log("myPost.contents:");
					console.log(myPost.contents);
					console.log("myPost.contentsOrig:");
					console.log(myPost.contentsOrig);
					*/
					
					//alla fine ritorno la closure
					return closure(myPost);
					
					
				}				
				
			} else {
				console.log('no post available or empty post with id: '+wpId);
				//se non c'è dovrei caricare il suo next
				loadPostTv(0, closure);
			}
		}
	);		
}

/* questa normalizza i contenuti di un array di post che arrivano da una query, 
pulisce l'html, ma non fa ancora nessuna cernita dei contenuti in base ai tag, 
e non li divide in array */
function normalizePosts(res) {
	//ciclo su ogni post che mi arriva
	//parso e/o normalizzo i suoi contenuti
	//e li assegno all'array slots[]
	var slots = [];
	//console.log('trovati slot '+String(jQuery(res).children('post').length));
	for ( var i=0; i<jQuery(res).children('post').length; i++ ) {
		
		var post = jQuery(res).children('post')[i];
		//id di wordpress del post
		var curPostWpid = jQuery(post).children('wpid').html();
		//tolgo dal titolo l'eventuale link a rognone
		jQuery(post).children('postTitle').find('style').remove();
		jQuery(post).children('postTitle').find('.playInRognoneButton').remove();
		//parso il titolo
		var curPostTitle = jQuery(post).children('postTitle').html();
		//parso la data del post
		var curPostTime = jQuery(post).children('time').html();
		var curPostTimeCompact = jQuery(post).children('timeCompact').html();
		//author
		var curPostAuthor = jQuery(post).children('author').html();
		//prev/next post
		if ( jQuery(post).children('prevLink').text() != '' ) {
			var curPostPrevLink = jQuery(post).children('prevLink');
			var curPostPrevTitle = jQuery(post).children('prevLink').text();
			//var curPostPrevId = getUrlVars( jQuery(post).children('prevLink').find('a').attr('href') )["p"];
			var curPostPrevId = jQuery(post).children('prevLinkId').text();
		} else {
			var curPostPrevLink = '';
			var curPostPrevTitle = '';
			var curPostPrevId = 0;
		}
		if ( jQuery(post).children('nextLink').text() != '' ) {
			var curPostNextLink = jQuery(post).children('nextLink');
			var curPostNextTitle = jQuery(post).children('nextLink').text();
			//var curPostNextId = getUrlVars( jQuery(post).children('nextLink').find('a').attr('href') )["p"];
			var curPostNextId = jQuery(post).children('nextLinkId').text();
		} else {
			var curPostNextLink = '';
			var curPostNextTitle = '';
			var curPostNextId = 0;
		}
		if ( jQuery(post).children('thumbnail').text() != '' ) {
			var curPostThumbnail = jQuery(post).children('thumbnail');
			jQuery(curPostThumbnail).contents().filter(function() {
				return this.nodeType == 3; //Node.TEXT_NODE
			}).remove();
			//console.log("VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV");
			//console.log(curPostThumbnail);
		} else {
			var curPostThumbnail = '';
		}
		
		//le sue categorie
		var curPostCategories = [];
		curPostCategories = jQuery(post).children('categories').children().children().children();
		//poi tutte le categorie concatenate in stringa unica
		var curPostCategoriesNames = '';
		for ( var x=0; x<curPostCategories.length; x++ ) {
			if ( x>0 ) curPostCategoriesNames += ', ';
			curPostCategoriesNames += jQuery(curPostCategories[x]).html();
		}
		//poi tutti i suoi contents in un array:
		//questi possono essere dei paragraphs, ma anche immagini, o qualunque altra cosa nel post
		var curPostContents = [];
		//purtroppo un contenuto potrebbe essere solo uno spazio, o un br, o insomma
		//un tag senza niente di visibile, quindi quelli li devo eliminare
		var bodyContents = jQuery(post).children('content').children();
		var shortcodes = {};
		for ( var x = 0; x<bodyContents.length; x++ ) {
			//prima tolgo gli nbsp
			jQuery(bodyContents[x]).html().replace(/&nbsp;/g, '');
			if ( bodyContents[x] != '' ) {
				//poi anche i br
				jQuery(bodyContents[x]).find('br').remove();
				//poi controllo gli spazi normali
				var cleaned = jQuery(bodyContents[x]).text().trim();
				//console.log("considero contenuto:");
				//console.log(bodyContents[x]);
				
				//se il mio contenuto è uno shortcode, devo memorizzare i suoi attributi
				//(per assegnarli al primo contenuto valido che seguirà), e poi butto il tag shortcode
				if ( contentIsShortcodeTag(bodyContents[x]) ) {
					//console.log("LO E'!");
					jQuery(bodyContents[x]).each(function() {
						jQuery.each(this.attributes, function(i, attrib){
							shortcodes[attrib.name] = attrib.value;
						});
					});					
				//infine, se il mio contenuto effettivamente non risulta vuoto (oppure se è vuoto ma è riconosciuto come mediatag), lo tengo e vado a vanti
				} else if ( 
					cleaned != '' 
					||
					( 
						jQuery(bodyContents[x]).children().length > 0 
						&& 
						contentIsMediaTag(bodyContents[x])
					) 
				) {
					//prima di salvarlo, altro giro di pulizia:
					//se ci sono link, li elimino portando fuori il loro contenuto
					//no, li lascio: jQuery(bodyContents[x]).find('a').contents().unwrap();
					
					
					//elimino eventuali classi e stili inline
					jQuery(bodyContents[x]).attr('class', '' );
					jQuery(bodyContents[x]).find('*').attr('class', '' );
					jQuery(bodyContents[x]).attr('style', '' );
					jQuery(bodyContents[x]).find('*').attr('style', '' );
					//pulisco alcuni css rognosi
					jQuery(bodyContents[x]).find('*').css( 'padding','0px' );
					jQuery(bodyContents[x]).find('*').css( 'margin','0px' );
					/*
					jQuery(bodyContents[x]).find('img').css( 'padding','0px' );
					jQuery(bodyContents[x]).find('img').css( 'margin','0px' );
					jQuery(bodyContents[x]).children().css( 'padding','0px' );
					jQuery(bodyContents[x]).children().css( 'margin','0px' );
					*/
					
					//se poi ci sono degli shortcodes, li applico come attributi al mio content
					for (var property in shortcodes) {
						if ( shortcodes.hasOwnProperty(property) && typeof shortcodes[property] !== 'function') {
							jQuery(bodyContents[x]).attr(property,shortcodes[property]);
						}
					}
					//dopo aver applicato gli shortcodes li resetto perchè valgono solo per il primo content che li segue
					shortcodes = {};

					//solo per la tv, se ci sono link, forzo il target a _blank
					if ( jQuery('#tvContainer').is(":visible") || start_as_tv == 'on' ) {
						jQuery(bodyContents[x]).find('a').attr('target','_blank');
						jQuery(bodyContents[x]).find('a').attr('onclick','pausePlayback()');
						//e assegno classe apposita per i link (dopo aver resettato tutte le classi preesistenti)
						jQuery(bodyContents[x]).find('a').addClass('genericLink');
					} else {
						//altrimenti li neutralizzo tenendone il contenuto
						jQuery(bodyContents[x]).find('a').contents().unwrap();
					}
						
						
					//infine salvo
					curPostContents.push( bodyContents[x] );
				}
			}
		}
		//se, alla fine del parsing e della normalizzazione, i contents del post sono 
		//vuoti, scarto il mio post, altrimenti procedo e lo salvo
		if ( curPostContents.length > 0 ) {
			//faccio una copia
			var curPostClonedContents = [];
			for ( var x=0; x<curPostContents.length; x++ ) {
				var content = curPostContents[x];
				var contentClone = jQuery(content).clone();
				curPostClonedContents.push(contentClone);
			}
			/*
			console.log("contents:");
			console.log(curPostContents);
			console.log("contents cloned:");
			console.log(curPostClonedContents);
			*/
			
			//var curPostClonedContents = jQuery.evalJSON(jQuery.toJSON(curPostContents));;
			//var curPostClonedContents = clone(curPostContents);
			
			//finito di normalizzare i contenuti, li assegno all'oggeto slot
			var slot = {
				'wpid' : curPostWpid,
				'postTitle' : curPostTitle,
				'time' : curPostTime,
				'timeCompact' : curPostTimeCompact,
				'categories' : curPostCategories,
				'categoriesNames' : curPostCategoriesNames,
				'contents' : curPostContents,
				'contentsOrig' : curPostClonedContents,
				'contentsTotal' : curPostContents.length,
				'author' : curPostAuthor,
				'prevLink' : curPostPrevLink,
				'nextLink' : curPostNextLink,
				'prevTitle' : curPostPrevTitle,
				'nextTitle' : curPostNextTitle,
				'prevId' : curPostPrevId,
				'nextId' : curPostNextId,
				'thumbnail' : curPostThumbnail
			};
			//console.log('creo slot '+curPostTitle);
			slots.push(slot);
		} else {
			console.log('caso di post vuoto! '+curPostTitle);
		}
	}
	//console.log("alla fine della normalizzazione:");
	//console.log(slots);
	return slots;
	
}



function getUrlVars(url) {
    var vars = {};
    //var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    var parts = url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}
