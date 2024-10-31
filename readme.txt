=== Plugin Name ===
Contributors: federico.carrara
Donate link: http://obliquid.org/
Tags: spiral, player, dynamic, content, ajax, slider, viewer, visualizer, animation, effects, tv, television, carousel, visual, gallery
Tested up to: 3.4.2
License: GPLv3 or later
License URI: http://www.gnu.org/licenses/gpl-3.0.html

Rognone is an ajax content visualizer, which uses a TV-like viewer or a floating spiral layout to show pictures, texts and videos from your posts.


== Description ==

Rognone is an automated and animated posts visualizer, to view blogs on the tv. It uses ajax to fetch latest contents from your blog, and then visualize all paragraphs, images and videos from your posts just like they were on television, or draws them on the page according to a floating spiral layout, continuously animated and updated. Main goal of Rognone is to let you sit on your coach and watch your blog contents on your tv (if your tv is internet connected, of course). See changelog for newest features. It's an ongoing project, we need feedback from desktop and smartphone users: please write us in Support section. See it in action on this site (the slideshow on top of page is Rognone, clic on top right lens to view full features): http://calepiopress.it/?rognone
To see Rognone handling a post with lot of videos, see this demo: http://calepiopress.it/?rognone&c=13&p=770


== Installation ==

1. Upload `rognone` directory to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to Settings -> Rognone for configuration and documentation
4. And dont forget to replace wp-content/plugins/rognone/imgs/logo_horiz.png with your own logo! (PNG, background transparent, readable on full black or full white backgrounds, max height 50px, free width)




== Screenshots ==

1. A spiral view with many many posts...
2. A spiral view with many texts posts
3. A less crowded view
4. Interface of the TV-like post visualizer

== Changelog ==

= 0.6.2 =
* Implemented iframe embedding capability. It's now possible to embed Rognone player everywere, specifying optional post and category ids to start with. See settings for help.
* Timeline generation algorithm rewritten: now timeline follows the content flux in the post, except that last image is used as background for subsequent texts.
* Bugfixes on smartphone interface and css/html.

= 0.6.1 =
* Brand new keyboard support: you can navigate through posts and post contents using arrow keys, plus return key opens post page, and space key start/pause playing. see "info" button for keyboard hotkeys
* Brand new shortcodes for rognone. With shortcodes you can specify duration, beginning, ending, and "solo" features for each single content. See rognone admin settings page for help on how to use shortcodes
* Optimized gui in tv mode
* Completely revisited smartphone support: now user interface and youtube video support is smartphone friendly
* New "info" button that shows informations about current post, current video, and keyboard hotkeys, plus tv mode specific social share buttons
* Texts and backgrounds colors management rewritten
* Texts sizing management rewritten to grant full visibility for very long and very short texts
* Bugfixes

= 0.6.0 =
* Video support completely rewritten: now you can embed video in your posts (as iframe embed code provided by youtube, or simply pasting the youtube page url in the "test" editor of your post), and it will be displayed in the tv in sync with the timeline. you can skeep video by clicking on the timeline.
* Settings page revisited
* New "Show inline buttons" feature (activable in the settings page): when activated, a "play" button is shown inside your posts (next to the title) and aside of the categories list (play all posts of the category). when user clicks these play buttons, starts rognone in Tv view, showing off contents of clicked posts (or categories).
* New available url parameters to filter posts: for example if you create a link to this url: "http://myblogsite.com/?myrognonepage&p=1329&c=345", it will open up rognone in Tv view, playing content from post with id=1329, and navigation limited on posts from category with id=345. it's possible to specify only the post id: "http://myblogsite.com/?myrognonepage&p=1329" 
* Lots of Tv improvements, and minor Spyral improvements
* Optimized pixastic effects now apply also to images alone (without texts over them), but only if original image size is lower than screen size, and only to eliminate scaling distortion and bad antialiasing of little images zoomed out.
* Added support to all permalynks type you can choose in admin Permalinks Settings (a part from "Custom Structure", all others are now supported by rognone: "Default","Day and name","Month and name","Numeric" adn "Post name").

= 0.5.4 =
* Lots of tv improvements
* Brand new keyboard support: "arrow keys" to navigate posts (up, down) and posts contents (left, right), "space" to play/pause, and "enter" to open post page
* Automatic sizing for texts: has been optimized to avoid "out of screen" texts, and support better line-height setting
* More natural "next" and "prev" post buttons
* Optimized pixastic effects to improve readability of texts over images

= 0.5.3 =
* Updated jquery ui library to be compatible with latest jquery

= 0.5.2 =
* Some SEO features: now search engines spiders can reach rognone contents, despite frontend interface is full javascipt

= 0.5.1 =
* Bugfix: eliminated 2 bugs related to piwik and shell_exec (not used)

= 0.5.0 =
* New feature to start rognone directly in TV mode, streaming contents from your last post
* Added a special blur plus noise effect on images when they have text in foreground, to improve readability
* General gui optimizations
* Some smartphone optimizations

= 0.4.2 =
* Minor of bugfixes.

= 0.4.1 =
* Minor of bugfixes.

= 0.4.0 =
* New TV-like viewer for posts added on top of Spiral layout.
* Lot of bugfixes.

= 0.3.3 =
* Optimized sizing for "Progressive size" option.

= 0.3.2 =
* Visual improvements and lot of bugfixes.
* Now last resfreshed slot is graphically emphasized.
* Video work correctly, just drop video url inside the post and wordpress do the rest.

= 0.3.1 =
* Added new "Draw spiral line" setting, to draw a line that bounds all slots in their native chronological order. Also draw a thumbnail version of the spiral layout.
* Auto sizing for all text contets. Now font-size is assigned based on characters length of content. 
* Some visual improvements and minor bugfixes.

= 0.3 =
* Some optimizations for smartphones
* Added a slider control to let users adjust refresh velocity
* Added new "Progressive size" setting, to have first posts bigger, last posts smaller
* Added new "Content cropping" setting, to disable auto image/texts cropping
* Now the progress of each slot (the orange line indicating contents progress) is a quantized cursor indicator, more clear. It's runtime drawn in a canvas.
* Popup positioning revisited and optimized. Now mouseover popup never falls outside the screen.

= 0.2 =
* A lot of bugs and optimizations with jquery animation stack.
* Now spiral algorithm works at its best, it's rock solid (both in drawing and in ajax async stack), and is capable to manage hundreds of posts at a refresh rate of 100ms.
* Added post title, and a progress bar that works like a video progress bar: it is your position in the contents array of each post.
* Lot of css improvements

= 0.1 =
* This is the first public release. Every feedback is appreciated.

