<!DOCTYPE html>
<!--[if IE 6]>
<html id="ie6" <?php language_attributes(); ?>>
<![endif]-->
<!--[if IE 7]>
<html id="ie7" <?php language_attributes(); ?>>
<![endif]-->
<!--[if IE 8]>
<html id="ie8" <?php language_attributes(); ?>>
<![endif]-->
<!--[if !(IE 6) | !(IE 7) | !(IE 8)  ]><!-->
<html>
<!--<![endif]-->
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>" />
<meta name="viewport" content="width=device-width" />
<title><?php
	/*
	 * Print the <title> tag based on what is being viewed.
	 */
	global $page, $paged;
	
	wp_title( '|', true, 'right' );

	// Add the blog name.
	bloginfo( 'name' );

	// Add the blog description for the home/front page.
	$site_description = get_bloginfo( 'description', 'display' );
	if ( $site_description && ( is_home() || is_front_page() ) )
		echo " | $site_description";


	echo " | tv";

	//add svn revision number
	//$revisionNum = `svnversion`;
	//echo " (rev.".$revisionNum.")";


	?></title>
<!--[if lt IE 9]>
<script src="<?php echo get_template_directory_uri(); ?>/js/html5.js" type="text/javascript"></script>
<![endif]-->
<?php
	wp_head();
?>
	
	<script type="text/javascript" src="<?php  echo plugins_url( 'jquery.centerxy.1.0.js', __FILE__ ); ?>"></script>
	<script type="text/javascript" src="<?php  echo plugins_url( 'pixastic/pixastic.custom.js', __FILE__ ); ?>"></script>
	<script type="text/javascript" src="<?php  echo plugins_url( 'socialite/socialite.min.js', __FILE__ ); ?>"></script>
	<script type="text/javascript" src="<?php  echo plugins_url( 'core/spiralLayout.js', __FILE__ ); ?>"></script>
	<script type="text/javascript" src="<?php  echo plugins_url( 'core/ui.js', __FILE__ ); ?>"></script>
	<script type="text/javascript" src="<?php  echo plugins_url( 'core/post.js', __FILE__ ); ?>"></script>
	<script type="text/javascript" src="<?php  echo plugins_url( 'core/slot.js', __FILE__ ); ?>"></script>
	<script type="text/javascript" src="<?php  echo plugins_url( 'core/tv.js', __FILE__ ); ?>"></script>
	<script type="text/javascript" src="<?php  echo plugins_url( 'rognone.js', __FILE__ ); ?>"></script>
	<script type="text/javascript" >
		//global vars
		var plugins_url = '<?php  echo plugins_url('', __FILE__); ?>/';
		var site_title = '<?php  echo bloginfo( 'name' ); ?>';
		var slotsNum = <?php  echo $options['start_posts_num']; ?>;
		var refreshSlotsTimerDuration = <?php  echo $options['refresh_time']; ?>;
		var progressivesize = '<?php  echo $options['progressivesize']; ?>';
		var contentcrop = '<?php  echo $options['contentcrop']; ?>';
		var draw_spiral_line = '<?php  echo $options['draw_spiral_line']; ?>';
		var start_as_tv = '<?php  echo $options['start_as_tv']; ?>';
		var yt_apikey = '<?php  echo $options['yt_apikey']; ?>';
		var show_inline_buttons = '<?php  echo $options['show_inline_buttons']; ?>';
		//url encodable vars
		var player_mode = '<?php  echo $_GET["mode"]; ?>';
		var preselected_post_id = <?php  echo (int) $_GET["p"]; ?>;
		var preselected_category_id = <?php  echo (int) $_GET["c"]; ?>;
		var preselected_archive_id = '<?php  echo $_GET["a"]; ?>';
		
		
	</script>
	<link href="<?php  echo plugins_url( 'style.css', __FILE__ ); ?>" rel="stylesheet" type="text/css" />
	<!--<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="stylesheet" href="<?php  echo plugins_url( 'jquery.mobile-1.1.0.min.css', __FILE__ ); ?>" />
	<script src="<?php  echo plugins_url( 'jquery.mobile-1.1.0.min.js', __FILE__ ); ?>"></script>	 -->
	
	<link type="text/css" href="<?php  echo plugins_url( 'jqui/css/ui-lightness/jquery-ui-1.10.0.custom.css', __FILE__ ); ?>" rel="stylesheet" />
	<script type="text/javascript" src="<?php  echo plugins_url( 'jqui/js/jquery-ui-1.10.0.custom.min.js', __FILE__ ); ?>"></script>
	
<?php	
	//check for user agent
	$uagent = new uagent_info();
	if ( $uagent->DetectSmartphone() )
	{
?>
	<!--<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=2.0, user-scalable=yes" />-->
	<meta name="viewport" content="width=1020px" />
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
	<meta name="HandheldFriendly" content="true">
	<link href="<?php  echo plugins_url( 'style_smartphone.css', __FILE__ ); ?>" rel="stylesheet" type="text/css" />
	<script type="text/javascript" >
		var isSmartphone = true;
	</script>
	
<?php
	} else {
?>
	<script type="text/javascript" >
		var isSmartphone = false;
	</script>
<?php
	}
?>
	
</head>

<body>
<div id='liveBusyIconContainer'><div id='liveBusyIcon'></div></div>
<!--
<div id='contentForRobots' style='width:0px;height:0px;'>

<?php
	//$myRognone = new rognone();
	//echo $myRognone->get_posts(true);
?>

</div>
-->
</body>
</html>
