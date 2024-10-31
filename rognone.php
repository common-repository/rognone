<?php
/**
 * @package rognone: the spiral content visualizer
 * @version 0.1
 */
/*
Plugin Name: rognone
Plugin URI: http://obliquid.org/
Description: A TV-like post viewer, plus a spiral content visualizer, to seat in your coach and watch posts floating on the screen. After activation, check Settings -> Rognone on the left sidebar menu for further configurations and helps.
Author: Federico Carrara
Version: 0.6.2
Author URI: http://obliquid.org/
License: GPL3
*/


//imports
require_once(plugin_dir_path( __FILE__ )."uagent_info.php");

//instantiate main class
$myRognone = new rognone();

//define actions
add_action('send_headers', array($myRognone, 'draw'));
add_action('admin_menu', array($myRognone, 'admin_menu'));
add_action('admin_init', array($myRognone, 'admin_init'));

//action for ajax requests
add_action('wp_ajax_get_posts', array($myRognone, 'get_posts'));
add_action('wp_ajax_nopriv_get_posts', array($myRognone, 'get_posts'));
add_action('wp_ajax_get_post', array($myRognone, 'get_post'));
add_action('wp_ajax_nopriv_get_post', array($myRognone, 'get_post'));
 
//filters
$options = get_option('rognone_options');
function rognone_title($title){
	global $id;
	global $cat;
    if ( in_the_loop() && !is_page() ) {
		$title .= "<div onclick='javascript:window.open(\"/?rognone&c=".$cat."&p=".$id."\",\"_self\");return false;' class='playInRognoneButton' title='play this post'></div><style>.playInRognoneButton { vertical-align: middle; display:inline-block; width:34px; height:30px; margin-left:10px; background-image:url(\"/wp-content/plugins/rognone/imgs/icon_arrow_e_50x50.png\"); background-repeat:no-repeat; background-position:center; border-radius: 10px; -moz-border-radius: 10px; -webkit-border-radius: 10px; cursor:pointer; } .playInRognoneButton:hover { background-color:  #F1AD02; }</style>";
	}
    return $title;
}
if ( isset($options['show_inline_buttons']) && $options['show_inline_buttons'] == "on" ) add_filter('the_title', 'rognone_title');


//shortcodes

//il principale shortcode [rog] non fa altro che trasformare se stesso in un tag html,
//che poi verrà parsato ed eseguito dal javascript, non qui
function rog_func( $atts ){
	extract( shortcode_atts( array(
			'duration' => '',
			'solo' => '',
		), $atts ) );
	//inizializzo l'output, aprendo il tag principale <rog />
	$out = "";
	$out .= "<rog ";
	
	//ciclo su tutti gli attributi dello shortocode, e li outputto come attributi del tag
	if ( $atts ) {
		foreach ($atts as $key => $value) {
			if ( $value != "" ) {
				if ( is_numeric($key) ) {
					$out .= " ".$value."='".$value."' ";
				} else if ( $key != "" ) {
					$out .= " ".$key."='".$value."' ";
				}
			}
		}
	}
	
	//chiudo il tag principale <rog />
	$out .= " ></rog>";
	
	//butto fuori
	return $out;
}
add_shortcode( 'rog', 'rog_func' );


//other
function rognone_categories($wp_list_categories) {
	$styles = "<style>.playInRognoneButtonMini { vertical-align: middle; display:inline-block; width:19px; height:17px; margin-right:5px; background-image:url(\"/wp-content/plugins/rognone/imgs/icon_arrow_e_15x15.png\"); background-repeat:no-repeat; background-position:center; border-radius: 7px; -moz-border-radius: 7px; -webkit-border-radius: 7px; cursor:pointer; } .playInRognoneButtonMini:hover { background-color:  #F1AD02; }</style>";
	$catsDomSource = $wp_list_categories;
	$catsDomSource = "<cats>".strstr($catsDomSource, '<')."</cats>";
	//echo "<pre>".$catsDomSource."</pre>";
	$catsDom = new SimpleXMLElement($catsDomSource);
	$output = $wp_list_categories;
	foreach ($catsDom->li as $catDom) {
		//per ogni link di categoria, devo tirar fuori l'id relativo alla categoria
		//prendo link della mia categoria
		$catHref = $catDom->a['href'];
		//lo esplodo per analizzarne le parti
		$parts = explode("/",$catHref);
		//tengo l'ultima parte non vuota
		$catSlug = array_pop($parts);
		if ( $catSlug == "" ) {
			//butto la prima parte se è vuota (se l'href finisce con /)
			//e tengo la successiva
			$catSlug = array_pop($parts);
		}
		$pos = strpos ( $catSlug, "?cat=" );
		if ( is_numeric($catSlug) ) {
			//caso http://calepiopress.it/.../123
			//è già numeric, lo tengo così
			$idCat = $catSlug;
		} else if ( $pos !== false ) {
			//caso http://calepiopress.it/?cat=123
			$chunks = explode("=",$catSlug);
			$idCat = $chunks[1];
		} else {
			//caso http://calepiopress.it/.../sample-cat/
			//quindi devo tradurre lo slug in id
			$idCatObj = get_category_by_slug($catSlug); 
			$idCat = $idCatObj->term_id;
		}
		//echo "<pre>".$idCat."</pre>";
		$catHrefClean = str_replace ( "/", "\/", $catHref );
		$catHrefClean = str_replace ( "?", "\?", $catHrefClean );
		$pattern = '/<a href="'.$catHrefClean.'"/';
		$replacement = "<div onclick='javascript:window.open(\"/?rognone&c=".$idCat."\",\"_self\");return false;' class='playInRognoneButtonMini' title='play all posts'></div><a href='".$catHref."'";
		$output = preg_replace($pattern, $replacement, $output);
	}
	return $styles.$output;
}
if ( isset($options['show_inline_buttons']) && $options['show_inline_buttons'] == "on" ) add_filter('wp_list_categories','rognone_categories');


/* MAIN CLASS */
class rognone {

	/* vars */
	private $slotsNum = 7;
	private $refreshSlotsTimerDuration = 2000;
	private $refreshSlotsTimerMin = 500;
	private $refreshSlotsTimerMax = 20000;
	

	/* constructor */
	function rognone() {
	}




	/* 
	################################################
	FRONTEND METHODS 
	################################################
	*/

	/* the main method, to draw the visualizer */
	function draw()  {
		//if option 'is_splash' is checked, show Rognone plugin as a splash screen
		//but only if user is calling the homepage, otherwise do nothing here
		$options = get_option('rognone_options');
		$rognoneUrlWithoutParams = get_option('siteurl')."/?".$options['is_page'];
		$rognoneUrlWithoutParamsDefault = get_option('siteurl')."/?rognone";
		if 
		(
			( 
				isset($options['is_splash']) 
				&& 
				$options['is_splash'] == "on" 
				&& 
				get_option('home')."/" == $this->curPageURL() 
			) 
			||
			(
				isset($options['is_page']) 
				&& 
				strlen($options['is_page']) > 0 
				&& 
				(
					substr( $this->curPageURL(), 0, strlen($rognoneUrlWithoutParams) ) == $rognoneUrlWithoutParams
					||
					substr( $this->curPageURL(), 0, strlen($rognoneUrlWithoutParamsDefault) ) == $rognoneUrlWithoutParamsDefault
				)
			)
		)
		{
			wp_enqueue_script('jquery');
			require_once(plugin_dir_path( __FILE__ )."header.php");
			//after visualizing rognone, exits, preventing to show homepage
			die();
		}
	}




	/* 
	################################################
	ADMIN METHODS 
	################################################
	*/

	/* init admin */
	function admin_init() {
		register_setting( 'rognone_options', 'rognone_options', array($this, 'rognone_options_validate') );
		
		add_settings_section('rognone_main', 'Main Settings', array($this, 'rognone_main_text'), 'rognone');
		add_settings_field('rognone_is_splash', 'Show as splash screen', array($this, 'rognone_is_splash_form'), 'rognone', 'rognone_main');
		add_settings_field('rognone_is_page', 'Show as custom page', array($this, 'rognone_is_page_form'), 'rognone', 'rognone_main');
		add_settings_field('rognone_start_as_tv', 'Start in TV mode', array($this, 'rognone_start_as_tv_form'), 'rognone', 'rognone_main');
		add_settings_field('rognone_show_inline_buttons', 'Show inline buttons', array($this, 'rognone_show_inline_buttons_form'), 'rognone', 'rognone_main');
		
		add_settings_section('rognone_spyral', 'Spyral View Settings', array($this, 'rognone_spyral_text'), 'rognone');
		add_settings_field('rognone_start_posts_num', 'Initial number of posts', array($this, 'rognone_start_posts_num_form'), 'rognone', 'rognone_spyral');
		add_settings_field('rognone_refresh_time', 'Refresh time (milliseconds)', array($this, 'rognone_refresh_time_form'), 'rognone', 'rognone_spyral');
		add_settings_field('rognone_draw_spiral_line', 'Draw spiral line', array($this, 'rognone_draw_spiral_line_form'), 'rognone', 'rognone_spyral');
		add_settings_field('rognone_progressivesize', 'Progressive size', array($this, 'rognone_progressivesize_form'), 'rognone', 'rognone_spyral');
		add_settings_field('rognone_contentcrop', 'Content cropping', array($this, 'rognone_contentcrop_form'), 'rognone', 'rognone_spyral');
		
		add_settings_section('rognone_tv', 'Tv View Settings', array($this, 'rognone_tv_text'), 'rognone');
		add_settings_field('rognone_yt_apikey', 'YouTube application API Key (to enable videos on smartphones too)', array($this, 'rognone_yt_apikey_form'), 'rognone', 'rognone_tv');
		
		add_settings_section('rognone_iframe_embed', 'IFrame embed', array($this, 'rognone_iframe_embed_text'), 'rognone');
		
		add_settings_section('rognone_shortcodes', 'Shortcodes', array($this, 'rognone_shortcodes_text'), 'rognone');
	}


	/* add items to admin menu */
	function admin_menu() {
		add_options_page( 'Rognone Settings', 'Rognone', 'manage_options', 'rognone',  array($this, 'admin_page') );
	}

	/* admin page */
	function admin_page() {
		if ( !current_user_can( 'manage_options' ) )  {
			wp_die( __( 'You do not have sufficient permissions to access this page.' ) );
		}
		?>
		<div class="wrap">
			<div id="icon-options-general" class="icon32"><br></div>
			<h2>Rognone Settings</h2>
			<form method="post" action="options.php"> 
				<?php settings_fields('rognone_options'); ?>
				<?php do_settings_sections('rognone'); ?>
				<p class="submit">
					<input type="submit" name="submit" id="submit" class="button-primary" value="Save Changes">
				</p>
			</form>
		</div>
		<?php
	}
	
	function rognone_main_text() {
		echo '<p>Rognone has two main views (or modes): the <b>Spyral</b> view and the <b>Tv</b> view (settings are below). Here you have common settings for both the views: specify if you want rognone to replace your blog homepage, or if you want it to be visible from a specific page url (then you can add this page url to yuor blog menus). Last, you can show inline buttons inside your blog posts and categories to open up rognone.</p>';
	}
	
	function rognone_spyral_text() {
		echo '<p><li>In the <b>Spyral view</b> rognone loads your latest posts, and draws them in a floating spiral layout: last post in the center, and previous posts going around counter-clockwise. Each post is shown a chunck at a time (paragraph, image, etc.), until all post contents have been visualized. After that, a new post (older) is loaded. Rognone has a control panel on the bottom left side, which is visible on mouse move. In the panel we have three buttons: a play/stop button, an add button (which increments number of visualized posts), and a remove button (to decrease number of posts). When you click on a post, you go to the relative wordpress detail page.</li>In this section there are Spyral specific settings:</p>';
	}
	
	function rognone_tv_text() {
		echo '<p><li>In <b>Tv view</b> rognone displays all contents from a post in a slideshow like manner: texts, images and videos (now only youtube iframes) are displayed fullscreen, one at a time. On bottom of the screen there are the graphic timeline of the post contents, and the control panel (auto hide) to play/pause/skip contents. Timeline also is interactive. Otherwise use keyboards: left/right keys (prev./next content in current post), up/down keys (prev./next post)</li></p>';
	}
	
	function rognone_iframe_embed_text() {
		echo '<p><li>Rognone can be embedded everywhere using iframes. You can embed it in your posts, in your templates, even in an external site. Just copy/paste this code (with your preferred width and height):<br/><br/><code>&lt;iframe src="<b>'.get_option('siteurl').'/?rognone&amp;mode=iframe</b>" width="100%" height="300"&gt;&lt;/iframe&gt;</code></li><li>You can also specify a post id to start Rognone with:<br/><br/><code>&lt;iframe src="'.get_option('siteurl').'/?rognone&amp;mode=iframe<b>&amp;p=770</b>" width="100%" height="300"&gt;&lt;/iframe&gt;</code></li><li>Or you can supply a category id, and Rognone will only play posts from that category:<br/><br/><code>&lt;iframe src="'.get_option('siteurl').'/?rognone&amp;mode=iframe<b>&amp;c=13</b>" width="100%" height="300"&gt;&lt;/iframe&gt;</code></li><li>Or use them both:<br/><br/><code>&lt;iframe src="'.get_option('siteurl').'/?rognone&amp;mode=iframe<b>&amp;p=770&amp;c=13</b>" width="100%" height="300"&gt;&lt;/iframe&gt;</code></li></p>';
	}
	
	function rognone_shortcodes_text() {
		echo '<p><li>Rognone supports some custom shortcodes. If you don\'t know what shortcodes are, read the relative <a href="http://codex.wordpress.org/Shortcode" target="_blank">wordpress documentation</a>.</li><li>Rognone shortcodes always start with the <b>[rog ...]</b> tag, and support some parameters to tell Rognone what to do with the chunk of content immediately following the shortcode.</li><li>When editing your posts, remember that shortcodes must be written using the <i>Text</i> mode, not in the <i>Visual</i> mode.</li><li>Supported shortcodes:<table><tr><td><b>[rog&nbsp;dur="seconds"]</b></td><td>Force duration of the following content to a number of seconds.</td></tr><!--<tr><td><b>[rog&nbsp;solo]</b></td><td>Force following content to be visualized alone. That is: if following content is an image, it will not have texts above it, if following content is a text, it will not have images behind it.</td></tr>--><tr><td><b>[rog&nbsp;vin="hh:mm:ss"]</b></td><td>If following content is a video, it will start playing at the specified position. Be aware to respect the time format "hh:mm:ss", and do not omit hours even if hh=00 and Youtube player do not display them.</td></tr><tr><td><b>[rog&nbsp;vout="hh:mm:ss"]</b></td><td>If following content is a video, it will stop playing at the specified position, that is: specified position will be treated as the end of the video. Be aware to respect the time format "hh:mm:ss", and do not omit hours even if hh=00 and Youtube player do not display them.</td></tr></table></li><li><b>Note:</b><br/>different parameters can be used simultaneously inside the same shortcode.<br/>For videos, you can mix dur, vin and vout params: <b>[rog&nbsp;vin="00:01:12"&nbsp;dur="60"]</b>, <b>[rog&nbsp;vin="00:01:12"&nbsp;vout="00:02:12"]</b> are all valid shortcodes.</li></p>';
	}
	
	function rognone_is_splash_form() {
		$options = get_option('rognone_options');
		echo "<input id='rognone_is_splash' name='rognone_options[is_splash]' type='checkbox'";
		if ( isset($options['is_splash']) && $options['is_splash'] == "on" ) {
			echo " checked ";
		}
		echo "/><p>If checked, Rognone will replace the standard home page (entry page) of your site. Just like a splash screen. A direct link to standard wp homepage will be present also.</p><hr/>";
	}
	
	function rognone_draw_spiral_line_form() {
		$options = get_option('rognone_options');
		echo "<input id='rognone_draw_spiral_line' name='rognone_options[draw_spiral_line]' type='checkbox'";
		if ( isset($options['draw_spiral_line']) && $options['draw_spiral_line'] == "on" ) {
			echo " checked ";
		}
		echo "/><p>Draw a curved line (a spiral!) behind posts, showing order of refresh.</p><hr/>";
	}
	
	function rognone_progressivesize_form() {
		$options = get_option('rognone_options');
		echo "<input id='rognone_progressivesize' name='rognone_options[progressivesize]' type='checkbox'";
		if ( isset($options['progressivesize']) && $options['progressivesize'] == "on" ) {
			echo " checked ";
		}
		echo "/><p>With progressive sizing the newer the post the bigger it is displayed. So at the center of the spiral there are bigger and most recent posts, and around there are previous posts that get smaller and smaller. By default (without progressive sizing) each post has a max-width and max-height, equal for all posts, that depends on number of posts on the screen.</p><hr/>";
	}
	
	function rognone_contentcrop_form() {
		$options = get_option('rognone_options');
		echo "<input id='rognone_contentcrop' name='rognone_options[contentcrop]' type='checkbox'";
		if ( isset($options['contentcrop']) && $options['contentcrop'] == "on" ) {
			echo " checked ";
		}
		echo "/><p>Use this to keep layout compact, permitting rognone to crop images or truncate long texts to best fit the layout and reduce vertical scrolling. If content integrity is mandatory, disable this for no text truncation and images resized but never cropped.</p>";
	}
	
	function rognone_start_as_tv_form() {
		$options = get_option('rognone_options');
		echo "<input id='rognone_start_as_tv' name='rognone_options[start_as_tv]' type='checkbox'";
		if ( isset($options['start_as_tv']) && $options['start_as_tv'] == "on" ) {
			echo " checked ";
		}
		echo "/><p>If this is checked, rognone will openup in TV-like mode, starting immediately to play contents from the chronologicaly last available post (and going backwards). If this is not checked, the Spyral view will be used instead.</p><hr/>";
	}
	
	function rognone_show_inline_buttons_form() {
		$options = get_option('rognone_options');
		echo "<input id='rognone_show_inline_buttons' name='rognone_options[show_inline_buttons]' type='checkbox'";
		if ( isset($options['show_inline_buttons']) && $options['show_inline_buttons'] == "on" ) {
			echo " checked ";
		}
		echo "/><p>Activate this to display a <i>play</i> button aside of your posts titles and categories names in your main blog pages. When user clicks on these buttons, rognone openup the <i>Tv view</i> and plays clicked post/category contents.</p>";
	}
	
	function rognone_is_page_form() {
		$options = get_option('rognone_options');
		if ( !isset($options['is_page']) ) {
			$options['is_page'] = '';
		}
		echo "<input id='rognone_is_page' name='rognone_options[is_page]' size='40' type='text' value='{$options['is_page']}' />";
		if ( isset($options['is_page']) && strlen($options['is_page'])>0 ) {
			echo "<br/>your page is active at the url: <strong><a href='".get_option('siteurl')."/?".$options['is_page']."' target='_blank'>".get_option('siteurl')."/?".$options['is_page']."</a></strong><br/><br/>";
		}
		echo "<p>If you want Rognone to be visible as a custom page, insert here the name you want to use for the page. For example, if insert here the name <strong>my_rognone_page</strong> than Rognone will be visible at the url: <strong>".get_option('siteurl')."/?my_rognone_page</strong><br/>Note 1: please keep attention at the question mark that only appears in the full url!<br/>Note 2: you do not need to create a wordpress page for this to work, just set here the page name and save settings.<br/>Note 3: only alphanumeric characters and the underscore are allowed here.</p><hr/>";
	}
	
	function rognone_yt_apikey_form() {
		$options = get_option('rognone_options');
		if ( !isset($options['yt_apikey']) ) {
			$options['yt_apikey'] = '';
		}
		echo "<input id='rognone_yt_apikey' name='rognone_options[yt_apikey]' size='50' type='text' value='{$options['yt_apikey']}' />";
		echo "<p>Rognone Tv view supports videos from posts out of the box on desktop computers, thanks to the YouTube iframe API. Unfortunately on smartphones (tested on Android) Youtube iframe API doesn't work correctly, so if you want to have video enabled on smartphones too, you must register your application (your wordpress blog) in order to obtain a valid YouTube API Key. With this Key Rognone can use YouTube Data API (which are compatible with smartphones, and more efficient) instead of YouTube iframe API.<br/><br/>To register an application follow this official YouTube tutorial: <a href='https://developers.google.com/youtube/registering_an_application' target='_blank'>Registering your application</a>.<br/><br/>After application is registered, copy/paste here the application API Key (it's the code you find under API Access -&gt; Simple API Access in your <a href='https://code.google.com/apis/console' target='_blank'>application api page</a> ).</p>";
	}
	
	function rognone_start_posts_num_form() {
		$options = get_option('rognone_options');
		if ( !isset($options['start_posts_num']) || !is_int((int)$options['start_posts_num']) ) {
			$options['start_posts_num'] = $this->slotsNum;
		}
		echo "<input id='rognone_start_posts_num' name='rognone_options[start_posts_num]' size='4' type='text' value='{$options['start_posts_num']}' ";
		echo "/><p>How many posts are loaded when Rognone starts. When Rognone is running the number of posts can be increased or decreased via the + and - buttons in the Rognone bottom left panel.</p><hr/>";
	}
	
	function rognone_refresh_time_form() {
		$options = get_option('rognone_options');
		if ( !isset($options['refresh_time']) || !is_int((int)$options['refresh_time']) ) {
			$options['refresh_time'] = $this->refreshSlotsTimerDuration;
		}
		echo "<input id='rognone_refresh_time' name='rognone_options[refresh_time]' size='4' type='text' value='{$options['refresh_time']}' ";
		echo "/><p>This is the time Rognone waits between each update of the layout. A minimum value of ".$this->refreshSlotsTimerMin." and a maximum of ".$this->refreshSlotsTimerMax." is required.</p><hr/>";
	}
	
	function rognone_options_validate($input) {
		
		if ( isset($input['is_splash']) ) {
			$newinput['is_splash'] = $input['is_splash'];
		} else {
			$newinput['is_splash'] = "off";
		}
		
		if ( isset($input['draw_spiral_line']) ) {
			$newinput['draw_spiral_line'] = $input['draw_spiral_line'];
		} else {
			$newinput['draw_spiral_line'] = "off";
		}
		
		if ( isset($input['progressivesize']) ) {
			$newinput['progressivesize'] = $input['progressivesize'];
		} else {
			$newinput['progressivesize'] = "off";
		}
		
		if ( isset($input['contentcrop']) ) {
			$newinput['contentcrop'] = $input['contentcrop'];
		} else {
			$newinput['contentcrop'] = "off";
		}
		
		if ( isset($input['start_as_tv']) ) {
			$newinput['start_as_tv'] = $input['start_as_tv'];
		} else {
			$newinput['start_as_tv'] = "off";
		}
		
		if ( isset($input['show_inline_buttons']) ) {
			$newinput['show_inline_buttons'] = $input['show_inline_buttons'];
		} else {
			$newinput['show_inline_buttons'] = "off";
		}
		
		$newinput['is_page'] = trim($input['is_page']);
		if(!preg_match('/^[A-Za-z0-9_]+$/', $newinput['is_page'])) {
			$newinput['is_page'] = '';
		}
		
		$newinput['yt_apikey'] = trim($input['yt_apikey']);
		//if( $newinput['yt_apikey'].length != 40 ) {
			//$newinput['yt_apikey'] = '';
		//}
		
		if ( isset($input['start_posts_num']) && is_int((int)$input['start_posts_num']) ) {
			$newinput['start_posts_num'] = (int)$input['start_posts_num'];
		} else {
			$newinput['start_posts_num'] = $this->slotsNum;
		}
		
		if ( isset($input['refresh_time']) && is_int((int)$input['refresh_time']) && (int)$input['refresh_time'] >= $this->refreshSlotsTimerMin && (int)$input['refresh_time'] <= $this->refreshSlotsTimerMax ) {
			$newinput['refresh_time'] = (int)$input['refresh_time'];
		} else {
			$newinput['refresh_time'] = $this->refreshSlotsTimerDuration;
		}
		
		return $newinput;
	}
	
	
	
	
	/* 
	################################################
	AJAX METHODS 
	################################################
	*/
	
	function get_posts($andReturn=false) {
		// The Query
		//orderby=date&order=DESC&posts_per_page=1&
		
		if ( $_POST['preselectedCategoryId'] &&  $_POST['preselectedCategoryId'] > 0 ) {
			$args = array(
			   'cat' => $_POST['preselectedCategoryId'],
			   'posts_per_page' => $_POST['posts_per_page'],
			   'paged' => $_POST['paged'],
			   'post_status' => 'publish'
			   );
		} else {
			$args = array(
			   //'cat' => '5',
			   //'post_type' => 'post',
			   //'order' => 'DESC', dovrebbe esserlo di default
			   'posts_per_page' => $_POST['posts_per_page'],
			   'paged' => $_POST['paged'],
			   'post_status' => 'publish'
			   );
		}
		
		query_posts($args);		
		$this->wp_loop($andReturn,$_POST['preselectedCategoryId']);
	}
	
	function get_post($andReturn=false) {
		if ( is_numeric($_POST['postId']) && $_POST['postId'] > 0 ) { 
			$args = array(
			   'p' => $_POST['postId'],
			   'post_status' => 'publish'
			);
		} else {
			//se non è specificato un id, prendo il primo disponibile
			$args = array(
			   'posts_per_page' => '1',
			   'paged' => '1',
			   'post_status' => 'publish'
			);
		}
		query_posts($args);
		$this->wp_loop($andReturn,$_POST['preselectedCategoryId']);
	}
	
	function wp_loop($andReturn=false,$catId=0) {
		// The Loop
		echo "<all>";
		while ( have_posts() ) : the_post();
			//$postid = the_ID();
			if ( $catId > 0 ) {
				$prev_post = get_adjacent_post(true,'',true);
				$next_post = get_adjacent_post(true,'',false);
			} else {
				$prev_post = get_adjacent_post(false,'',true);
				$next_post = get_adjacent_post(false,'',false);
			}
			echo "<post>";
				echo "<wpid>";
				the_ID();
				echo "</wpid>";
				echo "<postTitle>";
				the_title();
				echo "</postTitle>";
				echo "<time>";
				the_time('l jS \of F Y h:i:s A');
				echo "</time>";
				echo "<timeCompact>";
				the_time('j/n/Y');
				echo "</timeCompact>";
				echo "<categories>";
				the_category();
				echo "</categories>";
				echo "<author>";
				the_author();
				echo "</author>";
				echo "<prevLink>";
				if ( $catId > 0 ) {
					previous_post_link('&laquo; %link', '', TRUE);
				} else {
					previous_post_link();
				}
				echo "</prevLink>";
				echo "<nextLink>";
				if ( $catId > 0 ) {
					next_post_link('&laquo; %link', '', TRUE);
				} else {
					next_post_link();
				}
				echo "</nextLink>";
				echo "<prevLinkId>";
				echo $prev_post->ID;
				echo "</prevLinkId>";
				echo "<nextLinkId>";
				echo $next_post->ID;
				echo "</nextLinkId>";
				echo "<thumbnail>";
				echo get_the_post_thumbnail( the_ID(), 'thumbnail');
				echo "</thumbnail>";
				//nota: il content va per ultimo, altrimenti a volte si stroia (per colpa di contenuti html che conflittano con questo xml, credo...) e finisce per inglobare anche gli altri element che lo seguono
				echo "<content>";
				the_content();
				echo "</content>";
			echo "</post>";
		endwhile;
		echo "</all>";
		
		// Reset Query
		wp_reset_query();

		//and exits
		if ( $andReturn ) {
			return;
		} else {
			die();
		}
	}
	
	
	/* 
	################################################
	UTILS 
	################################################
	*/
	
	function curPageURL() {
		$pageURL = 'http';
		if (isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] == "on") {$pageURL .= "s";}
		$pageURL .= "://";
		if (isset($_SERVER["SERVER_PORT"]) && $_SERVER["SERVER_PORT"] != "80") {
			$pageURL .= $_SERVER["SERVER_NAME"].":".$_SERVER["SERVER_PORT"].$_SERVER["REQUEST_URI"];
		} else {
			$pageURL .= $_SERVER["SERVER_NAME"].$_SERVER["REQUEST_URI"];
		}
		return $pageURL;
	}	
	
}



?>
