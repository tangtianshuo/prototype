/*
=======================
_getStringDate
NOTE: date must be in valid Javascript Date
https://www.w3schools.com/js/js_date_formats.asp

@param date - inclusive - new Date()
@param separator - date format separator e.g. '/'
@param leadingZero - if days and months have leading zero e.g. 01
@param shortYear - e.g. true = 17, false = 2017
@return date as string
=======================
*/
function _getStringDate(date, separator, leadingZero, shortYear){
	if(leadingZero == undefined) leadingZero = true;
	if(shortYear == undefined) shortYear = true;

	var leadingNum = "0";
	if(!leadingZero) leadingNum = "";

	var	day = (leadingNum + (date.getDate())).slice(-2),
		month = (leadingNum + (date.getMonth() + 1)).slice(-2),
		year = (shortYear) ? (date.getFullYear() + "").slice(-2) : date.getFullYear();

	return day + separator + month + separator + year;
}



/*
=======================
_getNextOpenDate
If today is in closed dates, return 1st day after endCloseDate, or return today.
NOTE: dates must be in valid Javascript Dates
https://www.w3schools.com/js/js_date_formats.asp

@param startCloseDate - inclusive - new Date()
@param endCloseDate - inclusive - new Date()
@param separator - date format separator e.g. '/'
@param leadingZero - if days and months have leading zero e.g. 01
@return string date [d]d/[m]m/yy
=======================
*/
function _getNextOpenDate(startCloseDate, endCloseDate, leadingZero){
	if(leadingZero == undefined) leadingZero = true;

	var dateToday = new Date();
	var dateResult = new Date(dateToday);

	if(dateToday >= startCloseDate && dateToday <= endCloseDate){
		dateResult = new Date(endCloseDate.setDate(endCloseDate.getDate() + 1));
	}

	return dateResult;
}



/*
=======================
_getDateRange
NOTE: dates must be in valid Javascript Dates
https://www.w3schools.com/js/js_date_formats.asp

@param startDate - inclusive - new Date()
@param endDate - inclusive - new Date()
@param separator - date format separator e.g. '/'
@param leadingZero - if days and months have leading zero e.g. 01
@return array with dates as formatted strings
=======================
*/
function _getDateRange(startDate, endDate, separator, leadingZero){
	if(startDate == undefined) startDate = new Date();
	if(leadingZero == undefined) leadingZero = true;

	var copy_startDate = new Date(startDate),
		copy_endDate = new Date(endDate),
		tmpDate = copy_startDate,
		dateRange = [];

	if(copy_startDate > copy_endDate){
		console.log("ERROR: startDate > endDate");
		return;
	}

	while(tmpDate < copy_endDate){
		dateRange.push(_getStringDate(tmpDate, separator));
		tmpDate.setDate(tmpDate.getDate() + 1);
	}

	return dateRange;
}


/*
=======================
_scrollToSection
Scroll view window to element.

@param elId - element id - e.g. ".test"
@param velocity - scroll speed (milliseconds)
@param container - first parent that matches the selector given usied as a relative element (Has overflow: auto)
=======================
*/
function _scrollToSection(elId, speed, container){
    var header_h = 80, // height of fixed header
        el = '#' + elId;

    if(speed == null) speed = 1500;
    if(container == null) {
        container = 'html, body';
    }else{
        container = $(el).closest(container);
    }

    $(container).animate({
        scrollTop: $(el).offset().top - header_h
    }, speed);
}



/*
=======================
_printElement
Allows for printing of specific element.

@param id - id of element
=======================
*/
function _printElement(id){
    var elementToPrint = document.getElementById(id),
        newWin = window.open('','Print-Window');

    newWin.document.open();

    newWin.document.write('<html><body onload="window.print()">' + elementToPrint.innerHTML + '</body></html>');

    newWin.document.close();

    setTimeout(function(){newWin.close();},10);
}



/*
=======================
_addParallax
NOTE: This function is called from the footer if it is necessary

@param parallax_class - class item to apply the effect
@return true and applies the parallax effect
=======================
*/
function addParallax(parallax_class){

    checkScroll();

    $(window).scroll(function(){
        checkScroll();
    });

    function checkScroll(){
        var scroll = $(window).scrollTop();

        $(parallax_class).each(function(){

            var o = $(this);

            // Check if the parent is main; We need to calculate based on block container (often <section>) height
            if(o.parent('main').length){
                var el = o;
            }else if(o.parent('footer').length){
                var el = o;
            }else if(o.parent('header').length){
                var el = o;
            }else{
                var el = o.parent();
            }

            var positionOfElement = el.offset().top,
                windowHeight = $(window).height();
                heightElement = el.outerHeight();

            var startParallax = positionOfElement - windowHeight;


            if(scroll > startParallax) {

                var backgroundCenter = (heightElement);
                var parallaxScroll = (scroll - startParallax);
                var scrolRecenter = ((backgroundCenter - parallaxScroll) /3);

                //if(windowHeight >= heightElement){
                    o.css("background-position", "50% " + Math.floor(scrolRecenter) + "px");
                //}
            }

        });
    }
}



/*
=======================
toggleBlock()
toggle "active" class in an object.

@param obj - jquery object to be toggled
=======================
*/
function toggleBlock(obj){
    if(obj.hasClass('fn-toggleBlock--disabled')) return;

    // get the block id to toggle "active class"
    block = obj.data("toggleblock");

    // To emulate radiobutton
    group = obj.data("toggleblock-group");
    if(group !== undefined){
        $('[data-toggleblock-group="' + group + '"]').not(obj).removeClass('active');
        obj.addClass("active");
    }else{
        obj.toggleClass("active");
    }

    if(block != null){
        // if data-toggleblock identifier is set
        if(group !== undefined){
            $('[data-toggleblock-group="' + group + '"]').each(function(){
                $('#' + $(this).data('toggleblock')).removeClass('active');
            });
            $("#" + block).addClass("active");
        }else{
            $("#" + block).toggleClass("active");
        }

        // All cases
        if($("#" + block).hasClass("active") && $("#" + block).css('position').toLowerCase() == 'fixed') {
            // If the object is a position fixed element, avoid the scrollbar (i.e.: _modal)
            $("body").addClass("noScroll");
        }else{
            if($("._modal.active").length <= 0 && $(".popupCustom--open").length <= 0 ){
                $("body").removeClass("noScroll");
                // reset / close inner acive elements
                $("._modal .active").removeClass("active");
            }
        }
    }
}


// Dependence of  $('.fn-atTop') event
// atTopCallback and notAtTopCallback functions are ready to be switched depending on the class element is given
function atTopCallback(o){
    // We can create cases with the class of the desired element that is being checked
    switch(true){
        case o.hasClass('header'):
            if(!$('body').hasClass('isMobile')){
                o.addClass('animGuillotine');
                setTimeout(function(){
                    $('.header__logo').appendTo('.header__scope--1');
                    $('.header__logo img').attr('src','/templates/images/logo-color.png');
                    $('.header__phone').prependTo('.header__scope--3');
                    o.addClass('header--fixed');
                    /* $('.header .bookingDefaultButton').css('display', 'inline-block');
                    $('.languages, .header__phone').hide(); */
                }, 500);
                setTimeout(function(){
                    o.removeClass('animGuillotine');
                }, 1000);
            }
            break;
        default:
            break;
    }
}

function notAtTopCallback(o){
    switch(true){
        case o.hasClass('header'):
            if(!$('body').hasClass('isMobile')){
                o.addClass('animGuillotine');
                setTimeout(function(){
                    $('.header__logo').prependTo('.header__scope--2');
                    $('.header__logo img').attr('src','/templates/images/logo-white.png');
                    $('.header__phone').appendTo('.header__scope--1');
                    o.removeClass('header--fixed');
                    /* $('.header .bookingDefaultButton').hide();
                    $('.languages').css('display', 'inline-table');
                    $('.header__phone').show(); */
                }, 500);
                setTimeout(function(){
                    o.removeClass('animGuillotine');
                }, 1000);
            }
            break;
        default:
            break;
    }
}

/*
    @class fn-increment
    @result allows buttons -/+ for an input
    */
/*
=======================
fnIncrement()
set incrementable inputs with class .fn-increment as a clickable -/+ buttons
=======================
*/
function fnIncrement(){
    $(".fn-increment:not(.fn-increment--ready)").each(function(){

        var input = $(this),
            minVal = parseFloat(input.attr('min')),
            maxVal = parseFloat(input.attr('max'));

        input.addClass('fn-increment--ready');

        input.prop('readonly', true);
        input_val = input.val();
        // Generate a parent container
        input.wrap( "<div class='fn-increment__container'></div>" );
        container = input.parent();

        // Add buttons - & +
        input.before("<span class='fn-increment__button fn-increment__button--less'></span>");
        input.after("<span class='fn-increment__button fn-increment__button--more'></span>");

        if(input_val == maxVal){
            $('.fn-increment__button--more', container).addClass('fn-increment__button--disabled');
        }
        if(input_val == minVal){
            $('.fn-increment__button--less', container).addClass('fn-increment__button--disabled');
        }

        $(".fn-increment__button", container).on('click', function(e) {
            if($(this).hasClass('fn-increment__button--disabled')){
                e.preventDefault();
            }
            var button = $(this)
                oldValue = parseFloat(input.val());

            if(minVal === undefined){
                minVal = 0;
            }

            button.siblings(".fn-increment__button").removeClass('fn-increment__button--disabled');

            if (button.hasClass('fn-increment__button--more')){

                if (oldValue < maxVal) {
                    var newVal = parseFloat(oldValue) + 1;
                } else {
                    newVal = maxVal;
                }

                if(newVal == maxVal){
                    button.addClass('fn-increment__button--disabled');
                }

            } else {
                // Don't allow decrementing below zero
                if (oldValue > minVal) {
                    var newVal = parseFloat(oldValue) - 1;
                } else {
                    newVal = minVal;
                }
                if(newVal == minVal){
                    button.addClass('fn-increment__button--disabled');
                }
            }

            //input.val(newVal); // Managed by editCartQty()
            input.attr('data-request-qty', newVal);
            input.change();
        });

    });
}


$(document).ready(function(){

    $(window).scroll(function () {
        var w_ypos = $(window).scrollTop();

        // If user is not on top of the document, body has ".scrolled" class
        if(w_ypos>1){
            $('body').addClass('scrolled');
        }else{
            $('body').removeClass('scrolled');
        }

        /*
        @class fn-atTop
        @data postop (optional) - Indicates an alternative position instead top of the window
        @result if the element is upper than current scroll position (Or postop data value), fn-attop--true class will be add. If not, fn-attop--false will be added.
        */
        $('.fn-atTop').each(function(){
            var o = $(this);

            $(window).scroll(function () {
                o_ypos = (o.data('position') !== undefined) ? o.data('position') : 0;

                if(o_ypos == "middle"){
                    o_ypos = o.offset().top + (o.outerHeight()/2);
                }else if(o_ypos == "bottom"){
                    o_ypos = o.offset().top + o.outerHeight();
                }else{
                    o_ypos = o.offset().top + o_ypos;
                }

                if(w_ypos >= o_ypos){
                    if(!o.hasClass('fn-attop--true')){
                        o.addClass('fn-attop--true');
                        o.removeClass('fn-attop--false');
                        atTopCallback(o);
                    }
                }else{
                    if(!o.hasClass('fn-attop--false')){
                        o.removeClass('fn-attop--true');
                        o.addClass('fn-attop--false');
                        notAtTopCallback(o);
                    }
                }
            });

        });

    });

    /*
    @class fx-anim
    @result This class is needed in all elements we want to animate with the custom_animate.css animations
    */
    $('.fx-anim').each(function(){
        var o = $(this),
            window_h = $(window).height(),
            o_ypos = o.offset().top,
            start_anim = 150; //px from bottom of window to start animation
        if($(window).scrollTop() + window_h - start_anim >= o_ypos){
            o.addClass('fx-anim--animated');
        }
        $(window).scroll(function () {
            window_h = $(window).height(),
            w_ypos = $(window).scrollTop(),
            o_ypos = o.offset().top;
            if(w_ypos + window_h - start_anim >= o_ypos){
                o.addClass('fx-anim--animated');

            }
        });
    });

    var all_modals = $("._modal");
    all_modals.each(function(){
        var o = $(this);

        // Create _modal__popup to enable overflow-y in popups
        o.append("<div class='_modal__popup'></div>");

        // Create modal__container
        $("._modal__popup", o).append("<div class='_modal__container'></div>");

        // Move written code in _modal to modal__container
        $("._modal__container", o).append($('> *:not(._modal__popup)', o));

        //Add close button to _modal first child
        $("._modal__container", o).prepend('<button class="_modal__close fn-toggleBlock" data-toggleblock="' + o.attr('id') + '"><svg viewBox="0 0 371.23 371.23"><polygon points="371.23,21.213 350.018,0 185.615,164.402 21.213,0 0,21.213 164.402,185.615 0,350.018 21.213,371.23 185.615,206.828 350.018,371.23 371.23,350.018 206.828,185.615 "></polygon></svg></button>');

        //add overlay to _modal
        o.after('<div class="_modal__overlay fn-toggleBlock" data-toggleblock="' + o.attr('id') + '"></div>');
    });

    /*
    @class fn-toggleBlock
    @data toggleblock (mandatory) - id element to toggle
    @result Toggle the class 'active' in the toggleblock id given
    */
    $(".fn-toggleBlock").on('click',function(e){
        e.stopPropagation();
        var obj = $(this);
        // Not an overlay _modal in Mobile
        if(!(obj.hasClass('_modal__overlay') && $('body').hasClass('isMobile'))){
            toggleBlock(obj);
        }
    });

	/*
	@class fn-changeForms
	@result Shows/hides on changing select
	Select option should have data-form (id of form) to change to.
	Forms must have id and .formChange
	*/
	$('.fn-changeForms').change(function(){
		var o = $(this),
			form_id = $(':selected', o).data('form'),
			form = $('#' + form_id);

		$('.formChange').removeClass('-blocked-');
		$('.fn-changeForms').parent().removeClass('-error-');
		$('.formChangeError').removeClass('-active-');

		if(!form.hasClass('-active-')){
			$('.formChange').removeClass('-active-');
			form.addClass('-active-');
		}
	});

	$('.fn-sales-type').change(function(){

        var o = $(this),
            selected = $(':selected', o),
            form_id = selected.data('form'),
            category_id = selected.data('category'),
            form = $('#' + form_id);

        // actualizar category_id
        $('#category_id').val(category_id);

        // lógica existente
        if(form_id == 'form_2'){
            $('#salesType').val(o.val());
        }

    });

	$('.formChange.-blocked-').on('click', function(){
		if($(this).hasClass('-blocked-')){//double check
			$('.fn-changeForms').parent().addClass('-error-');
			$('.formChangeError').addClass('-active-');
		}
    });
    
    if($('.fn-changeForms').data('preset') != ''){
        $('.fn-changeForms option').eq($('.fn-changeForms').data('preset')).prop('selected', true).change();
    }

    /*
    @class fn-scrollTo
    @result Scroll to block specified in data
    */
    $('.fn-scrollTo').on('click', function(){
        var self = $(this),
            scroll_to = self.data('scroll-to');
        if(!scroll_to) return;

        var scroll_speed = (self.data('scroll-speed')) ? self.data('scroll-speed') : "";
        var scroll_container = (self.data('scroll-container')) ? self.data('scroll-container') : "";

        _scrollToSection(scroll_to, scroll_speed, scroll_container);
    });


    /*
    @class fn-ajax-popup
    @result When the element with this class is clicked (must be an anchor), it creates and shows (Or only show if it is already created) a dynamic popup based on the page content given in the href attribute
    */
    if($('.fn-ajax-popup').length){

        // Generate the array to know the position of each popup generated to not recall the same content
        var popup_array = [];

        // action for each .fn-popup
        $('.fn-ajax-popup').each(function(){
            var o = $(this);

            o.click(function(e){
                e.preventDefault();
                $('body').toggleClass("noScroll");//prevent scroll on body

                // We need to know the page from where we want to get the content
                if(o.attr('href') !== undefined){
                    var page = o.attr('href'),
                        isPage = true;
                }else{
                    // If it is a custom popup, get the data-popup-object to be the name
                    var page = o.data('popup-object'),
                        isPage = false,
                        o_dataPopupInfo = window[page]; // Get the object
                }

                // If the main popup container is not already created, we need to parse it and its events
                if(!$('#ajax-popup').length){
                    var popup = "<div id='ajax-popup' class='ajax-popup'><div class='popupCustomOverlay fn-ajax-popup-close'></div><div class='popupCustom'><div class='popupCustom__close fn-ajax-popup-close'><svg viewBox='0 0 371.23 371.23'><polygon points='371.23,21.213 350.018,0 185.615,164.402 21.213,0 0,21.213 164.402,185.615 0,350.018 21.213,371.23 185.615,206.828 350.018,371.23 371.23,350.018 206.828,185.615 '/></svg></div></div></div>";
                    $('body').append(popup);
                    $('#ajax-popup').each(function(){
                        var o = $(this),
                            o_overlay = $('.popupCustomOverlay',o),
                            o_popup = $('.popupCustom',o);

                        $('.fn-ajax-popup-close',o).on('click',function(){
                            o_overlay.fadeOut();
                            o_popup.fadeOut(function(){
                                $('body').toggleClass("noScroll");
                                $('.ajax-popup-container').hide();
                                $('#ajax-popup .popupCustom').removeClass('popupCustom--open');
                            });
                        });
                    });
                }
                // If the specific popup is not already created, we need to parse it
                if(!popup_array[page]){

                    // Take the position/id for the popup
                    var num_id = $('.ajax-popup-container').length + 1,
                        inner_popup_id = 'ajax-popup-container-'+num_id;

                    // Add the popup in the array
                    popup_array[page] = num_id;

                    // Append the specific popup in main one
                    container = "<div id='"+inner_popup_id+"' class='popupCustom__container ajax-popup-container'><div class='popupCustom__title ajax-popup-title'></div><div class='popupCustom__content ajax-popup-content contentStyle'></div></div>";
                    $('.ajax-popup .popupCustom').append(container);

                    if(isPage == true){
                        // Call the needed code. To standarize, we can take #fullpage_title, #fullpage_subtitle and #fullpage_content of the resource.
                        $('#'+inner_popup_id+' .ajax-popup-title').load(page+' #ajax-popup-title',function(){
                            // Renmove all the html tags
                            $(this).html($(this).text());
                            $('#'+inner_popup_id+' .ajax-popup-content').load(page+' #ajax-popup-content',function(){
                                // Remove all the html tags
                                //$(this).html($(this).text());
                                $('#ajax-popup .popupCustomOverlay, #ajax-popup .popupCustom').fadeIn();
								$('#ajax-popup .popupCustom').addClass('popupCustom--open');
                            });
                        });
                    }else{
                        $.each( o_dataPopupInfo, function( popupField, popupString ) {
                            $('#'+inner_popup_id+' .ajax-popup-'+popupField).html(popupString);
                        });
                        $('#ajax-popup .popupCustomOverlay, #ajax-popup .popupCustom').fadeIn();
                    }

                }else{
                    // If specific popup already exists, show the needed one
                    $('#ajax-popup-container-'+popup_array[page]).show();
                    $('#ajax-popup .popupCustomOverlay, #ajax-popup .popupCustom').fadeIn();
					$('#ajax-popup .popupCustom').addClass('popupCustom--open');
                }

            });
        });

    }

    /* SPECIFIC WEBSITE SCRIPTS HERE */

    $('.fn-tabs').each(function(){
        var tabs,
            tabs_all = $('.fn-tabs__tab', tabs),
            tabs_content_all = $('.fn-tabs__content', tabs);

        tabs_all.on('click', function(){
            var tab_clicked = $(this),
                tab_clicked_content = $('.' + tab_clicked.data('tab'), tabs);

            if(tab_clicked_content){
                tabs_all.removeClass('-active-');//remove active from all
                tabs_content_all.removeClass('-active-');//remove active from all
                tab_clicked.addClass('-active-');//add active to tab
                tab_clicked_content.addClass('-active-');//add active to tab        
            };
        });

    });

    $('.imagesBlocks__content table').each(function(){
        $(this).wrap("<div style='overflow: auto;'></div>");
    });

    $('.fn-select2input').on('change', function(){
        var select = $(this),
            input_default_value = select.data('select2input-default'),
            input_name = select.attr('name'),
            input_type = 'number';

        if(select.val() == input_default_value){
            select.after('<input name="'+ input_name +'" value="'+ input_default_value +'" type="'+ input_type +'" min="1">');
            select.remove();
        }

    });

    $('.fn-setProductLeadform').on('click', function(){
        var btn = $(this),
            btn_data = btn.data();
            $("#productLeadform [name='category_id']").val(btn_data['setproductleadformCategory']);
    });


    $('.headerSearch__icon').on('click',function(){
        $('#search-bar').focus();
    });

    $('.top__languages').on('mouseleave',function(){
        if($('#languages-selector').hasClass('active')){
            toggleBlock($('#languages-selector'));
        }
    })
   

    $('.fn-shuffle').on('change',function(){
        var o = $(this),
        o_val = o.val(),
        block = $('#' + o.data('shuffleblock'));

        if(o_val == 'all'){
            $('> *', block).show();
        }else{
            $('> *', block).hide();
            $('> .shuffle_' + o_val, block).show();
        }
        
        if(o_val == 'ES' && $('.filterBoxes__selector--prov')) {
            $('.filterBoxes__selector--prov').addClass('isShown');
            o_val = o.val();
        } else {
            $('.filterBoxes__selector--prov').removeClass('isShown');
        }
    })



    $('.fn-selectRedir').on('change',function(){
        var o = $(this),
        o_val = o.val();

        window.location.href = o_val;

    });

    /* File button with modal */
    /* $(".fn-leadRequest").on("click", function(){
        var o = $(this),
            request_leadform = $("#" + o.data("toggleblock"));

        if(request_leadform.length){//request_leadform exists
            var request_title = "request";
            if(o.data("request_title")) request_title = o.data("request_title");

            if($('input[name ="request"]', request_leadform).length){//if input exists, change value
                $('input[name ="request"]', request_leadform).val(request_title);
            }else{//create input if doesn't exist
                var request_input = '<input type="hidden" name="request" value="' + request_title + '">';
                $("form", request_leadform).prepend(request_input);
            }
        }
    }); */

    fnIncrement();

    if ("ontouchstart" in document.documentElement) {
        $("body").addClass("isTouchDevice");
       }
});

