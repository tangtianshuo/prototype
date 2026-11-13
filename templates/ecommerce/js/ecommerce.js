
function setCookie(c_name,value,exhours) {
    var exdate=new Date();
    exdate.setHours(exdate.getHours()+exhours);
    //exdate.setDate(exdate.getDate() + exdays);
    var c_value=escape(value) + 
    ((exhours==null) ? "" : ("; expires="+exdate.toUTCString()));
    document.cookie=c_name + "=" + c_value;
}

function getCookie(c_name) {
    var i,x,y,ARRcookies=document.cookie.split(";");
    for (i=0;i<ARRcookies.length;i++) {
        x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
        y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
        x=x.replace(/^\s+|\s+$/g,"");
        if (x==c_name) {
            return unescape(y);
        }
    }
}
/* function getSessionId() {
    // Send AJAX
    $.ajax({
        type: "POST",
        url: "/ajax/ecommerce/frontend/getCartId",
        dataType: "text"
    }).done(function (ret) {
        setCookie("_ec_session", ret, 1488);
    });
} */

/* AJAX CALLS */
function getCartItems(shippingMethodId, country){
    
    if(shippingMethodId == undefined)
        shippingMethodId = ecommerceDefaultShippingMethod;
    if(country == undefined)
        country = ecommerceDefaultCountry;
        
    var cart_data = null;
	
    $.ajax({
        type: "POST",
        url: "/ajax/ecommerce/frontend/getCart",
        async: false,
        dataType: "text",
        data:'shippingMethodId='+shippingMethodId+'&country='+country+'&lang='+ec_language,
    }).done(function (ret) {
        cart_data = ret;
    });
	
    return cart_data;
}

/* function countCart() {
    // Send AJAX
    var count = 0;
    $.ajax({
        type: "POST",
        url: "/ajax/ecommerce/frontend/countCart",
        async: false,
        dataType: "text"
    }).done(function (ret) {
        count = ret;
    });
					
    return count;
} */
function getCartAmount(data){
    // Send AJAX
    var amount = 0;
    $.ajax({
        type: "POST",
        url: "/ajax/ecommerce/frontend/getCartAmount",
        data: data,
        async: false,
        dataType: "text"
    }).done(function (ret) {
        amount = ret;
    });
	
    return amount;
} 
function deleteItemFromCart(data){
    // Send AJAX
    $.ajax({
        type: "POST",
        url: "/ajax/ecommerce/frontend/deleteCart",
        async: false,
        data: data,
        dataType: "text"
    
    }).done(function (ret) {
        updateCart();
    });		
}
/* function getShippingAmount(data){
    // Send AJAX
    var amount = 0;
    $.ajax({
        type: "POST",
        url: "/ajax/ecommerce/frontend/getShippingAmount",
        data: data,
        async: false,
        dataType: "text"
    }).done(function (ret) {
        amount = ret;
    });
	
    return amount;
} */
function getShippingAmount(data){
    var method = ecommerceDefaultShippingMethod;

    switch(method){
        case 2: //DHL
        case 3: //Mailboxes
            data += '&method_id=' + method + '&formatted=false';
            url_call = 'getShippingOptions';
        break;
        default:
            url_call = 'getShippingAmount';
            break;
    }

    // Send AJAX
    $.ajax({
        url: '/ajax/ecommerce/frontend/' + url_call,
        type: 'POST',
        data: data
    }).done(function (res){
        showShippingOptions(method, res);
        $('.loader-button').removeClass("loader-button--loading");
    });
}
function editCartQty(data, successFunc, noStockFunc){
    // Send AJAX
    $.ajax({
        type: "POST",
        url: "/ajax/ecommerce/frontend/editCartQty",
        async: true,
        data: data,
        dataType: "text"
    }).done(function (ret) {
        try
        {
			response = JSON.parse(ret);
			if(!response)
                throw false;
            
            if(!response.updated)
			{
				if(noStockFunc)
					noStockFunc.call(null, response);
				return;
			}
            if(successFunc)
				successFunc.call(null, response);
			updateCart(false);
		}
        catch(err){}
    });
	
    return true;
}
function add2Cart(data, successFunc, noStockFunc) {
    // Send AJAX
    $.ajax({
        type: "POST",
        url: "/ajax/ecommerce/frontend/addCart",
        async: true,
        data: data,
        dataType: "text"
    }).done(function(ret){

        try
        {
            response = JSON.parse(ret);
            if(!response)
                throw false;
			
			if(response.error && response.message=='no_stock')
			{
				if(noStockFunc)
					noStockFunc.call(null, response);
				return;
			}
			
            //ecommerceCartData.count = response.cartCount;
            
            if(successFunc)
				successFunc.call(null, response);
            updateCart();
            toggleBlock($('#cart'));
            
        }
        catch(err){}

    });		
}

/* FUNCTIONS */
function number_format(num, symbol){

    if(num == ''){
        return '';
    }

    // If string
    if(isNaN(num)){
        num = num.replace('.', '').replace(',', '.');
    }else{
        num = num.toFixed(2).toString();
    }

    num_exploded = num.split('.');
    
    num_exploded_length = num_exploded[0].length;
    new_num = '';
    count = 0;
    for(i = num_exploded_length - 1; i >= 0; i--){
        count++;
        new_num = num_exploded[0][i] + new_num;
        if(count%3 == 0 && count != num_exploded_length){
            new_num = ' ' + new_num;
        }
    }

    if(num_exploded[1] > 0){
        num = new_num + '.' + num_exploded[1];
    }else{
        num = new_num;
    }

    //num = parseFloat(num).toFixed(2);

    if(symbol === undefined || symbol === null){
        symbol = '';
    }

    switch(ec_language)
    {
        case 'en':
            num = symbol + ' ' + num.replace(' ', ',');
            break;
        default: 
            num = num.replace('.', ',').replace(' ', '.') + ' ' + symbol;
    }

    return num;
}

/* function printConfirmCart(cart_items){
    
    var cart_list = $(".fn-confirm-cart");
	
    if(cart_items.cart_count > 0){
        for (var i = 0; i < cart_items["items"].length; i++){
            var item = cart_items["items"][i],
            product_stock_qty = 1000;

            if(typeof ec_sell_without_stock === undefined){
                product_stock_qty = item["product"]["ecommerce_product_stock_qty"];
            }

            cart_list.html( 
                '<li class="confirm__cart_item fn-cart-item">' +
                    '<div class="confirm__cart_item_qty">' +
                        item["qty"] + 'x' +
                    '</div>' +
                    '<div class="confirm__cart_item_image _imgTagBg _imgTagBg--contain">' +
                        '<img src="/thumb?src=' + item["product"]["page_image"] + '&w=100&h=75&zc=2&cc=ffffff">' +
                    '</div>' +
                    '<div class="confirm__cart_item_name">' +
                        item["product"]["page_shortname"] +
                    '</div>' +
                    '<div class="confirm__cart_item_price">' +
                        item["product"]["prices"]["price"]["total_price"] + '&euro;' +
                    '</div>' +
                '</li>'
            );
        }
    }

} */

function printCheckoutCart(cart_items){
    
    var cart_list = $(".fn-checkout-cart");
	
    if(cart_items.cart_count > 0){
        html = '';
        for (var i = 0; i < cart_items["items"].length; i++){
            var item = cart_items["items"][i],
            product_stock_qty = 1000;

            if(typeof ec_sell_without_stock === undefined){
                product_stock_qty = item["product"]["ecommerce_product_stock_qty"];
            }

            var composition_details = '',
                composition_image = item["product"]["page_image"];

            if(item["product"]["option"] !== undefined && item["product"]["option"] !== null){
                if(item["product"]["option"]["option"].length){
                    if(item["product"]["option"]["default_image"] != null){
                        composition_image = item["product"]["option"]["default_image"];
                    }
                    $.each(item["product"]["option"]["option"], function(i, option_data){
                        composition_details += option_data["option_name"] + ' ' + option_data["option_value_name"];
                        if(i != item["product"]["option"]["option"].length - 1){
                            composition_details += ' / ';
                        }
                        
                    });            
                }
            }

            html += '<li class="checkout__cart_item fn-cart-item" data-product-id="' + item["product_id"] + '" data-option-id="' + item["option_id"] + '">' +
                '<div class="checkout__cart_item_image _imgTagBg _imgTagBg--contain">' +
                    '<img src="/thumb?src=' + composition_image + '&w=320&h=240&zc=2&cc=ffffff">' +
                '</div>' +
                '<div class="checkout__cart_item_name">' +
                    '<div>' +
                        item["product"]["page_shortname"] +
                        '<br>' +
                        composition_details +
                    '</div>' +
                    '<div class="checkout__cart_item_price">' +
                        number_format(item["product"]["prices"]["price"]["total_price"], '&euro;') +
                    '</div>' +
                '</div>' +
                '<div class="checkout__cart_item_qty checkout__cart_item_qty--atRight fn-cart-item-qty">' +
                    '<input class="fn-increment" min="1" max="' + product_stock_qty + '" value="' + item["qty"] + '">' +
                '</div>' +
                '<div class="checkout__cart_item_remove">' +
                    '<button class="fn-cart-item-remove">' +
                        ec_icon_delete +
                    '</button>' +
                '</div>' +
            '</li>';

            cart_list.html(html);
        }
    }else{
        cart_list.html(
            '<li>' + 
                '<div class="checkout__cart_empty">' + ec_msg.empty_cart + '</div>' + 
            '</li>'
        );
    }
	
    
}

function printCart(cart_items){
    
    var cart_list = $(".fn-cart");
    
    if(cart_items.cart_count > 0){
        html = '<ul class="cart__products_list">';
        
        for (var i = 0; i < cart_items["items"].length; i++){
            var item = cart_items["items"][i],
                previous_price = "",
                product_stock_qty = 1000;

            if(item["product"]["prices"]['previous_price'] !== undefined){
                previous_price = '<span>' + item["product"]["prices"]['previous_price']["total_price"] + '&euro;</span>';
            }

            if(typeof ec_sell_without_stock === undefined){
                product_stock_qty = item["product"]["ecommerce_product_stock_qty"];
            }

            var composition_details = '',
                composition_image = item["product"]["page_image"];

            if(item["product"]["option"] !== undefined && item["product"]["option"] !== null){
                if(item["product"]["option"]["option"].length){
                    if(item["product"]["option"]["default_image"] != null){
                        composition_image = item["product"]["option"]["default_image"];
                    }
                    $.each(item["product"]["option"]["option"], function(i, option_data){
                        composition_details += option_data["option_name"] + ' ' + option_data["option_value_name"];
                        if(i != item["product"]["option"]["option"].length - 1){
                            composition_details += ' / ';
                        }
                    });
                }
            }

            html +=
                '<li class="cart__products_product _flex _flex--aic fn-cart-item" data-product-id="' + item["product_id"] + '" data-option-id="' + item["option_id"] + '">' +
                    '<div class="cart__products_product_image">' +
                        '<img src="/thumb?src=' + composition_image + '&h=220">' +
                    '</div>' +
                    '<div class="cart__products_product_description">' +
                        '<div class="cart__products_product_title">' + item["product"]["page_shortname"] + '</div>' +
                        '<div class="cart__products_product_option">' +
                            composition_details +
                        '</div>' +
                        '<div class="cart__products_product_price">' +
                            number_format(previous_price, '&euro;') +
                            '<span>' + number_format(item["product"]["prices"]["price"]["total_price"], '&euro;') +'</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="cart__products_product_handlers cart__products_product_handlers--atRight fn-cart-item-qty">' +
                        '<input type="text" min="1" max="' + product_stock_qty + '" class="cart__products_product_qty fn-increment" value="' + item["qty"] + '">' +
                        '<button class="fn-cart-item-remove">' + 
                            ec_icon_delete +
                        '</button>' +
                    '</div>' +
                '</li>';
        }

        html += '</ul>';

        cart_list.html(html);

    }else{
        cart_list.html(
            '<div class="cart__products_empty">' + 
                '<div>' + ec_msg.empty_cart + '</div>' +
                '<div class="_mrgTop">' +
                    '<a href="/' + ec_link_begin_buy + '" class="fn-toggleBlock" data-toggleblock="cart">' + ec_msg.start_shopping + '</a>' +
                '</div>' +
            '</div>'
        );
    }
}

function updateCart(load_cart){

    // Sometimes value given is not "true"
    /* if(load_cart === undefined || load_cart !== undefined && load_cart != false){
        load_cart = true;
    } */
    if(load_cart !== false){
        load_cart = true;
    }

    /* $('.loader-bg').addClass("loader-bg--loading"); */

    var cart_items = JSON.parse(getCartItems());
    
    if(cart_items != false){

        var count_items = cart_items.cart_count;

        if(count_items > 0){
            $('.ecCartButton').show();
            $('.fn-cart-icon').addClass('filled');
            $(".fn-cart-icon span:last-child").attr('data-units', count_items);
            $(".fn-checkout-prodcount").html(count_items);
            $("#cart .cart__summary_button").addClass("cart__summary_button--abled");
        }else{
            $('.ecCartButton').hide();
            $('.fn-cart-icon').removeClass('filled');
            $("#cart .cart__summary_button").removeClass("cart__summary_button--abled");
        }
    
        // Parse html in cart if is needed
        if(load_cart){
            if($('.fn-cart').length){
                printCart(cart_items);
            }
        }

        // Checkout cart must be always loaded
        if($('.fn-checkout-cart').length){
            printCheckoutCart(cart_items);
        }

        fnIncrement();
        
        calcSummaryPrices(cart_items.cart_amount, cart_items.shipping_amount, cart_items.cart_amount_no_coupon);
        
        toggleShippingBanner(cart_items);
        
        /* $(".fn-cart-item-qty input").on("change", function(){
            var qty = $(this).val(),
                product_id = $(this).closest('.fn-cart-item').data('product-id'),
                option_id = $(this).closest('.fn-cart-item').data('option-id');

            $('[data-product-id="' + product_id + '"][data-option-id="' + option_id + '"] .fn-increment').val(qty);

            editCartQty({
                "product_id": product_id,
                "option_id": option_id,
                "qty": qty
            });
        }); */

        stopLoaderButtons();
    }

}

function getBannerInfo(cart_data){
    
    var shipping_amount = cart_data.shipping_amount,
        //cart_amount_coupon = getCartAmount({'with_coupon': true}),
        cart_amount = cart_data.cart_amount_no_coupon,
        show = true;
    
    if(shipping_amount == null){
        shipping_amount = '0';
    }
    
    if(typeof shipping_free_value == 'undefined'){
        shipping_free_value = '0';    
    }

    if(typeof shipping_flat_rate == 'undefined'){
        shipping_flat_rate = '0';    
    }

    if(parseFloat(shipping_amount) == 0){
        show = false;
    }
    
    var still = parseFloat(shipping_free_value - (parseFloat(cart_amount) - parseFloat(shipping_amount))).toLocaleString("es");

    if(parseFloat(still) < 0){
        still = 0;
    }

    if(still == 0){
        var show = false;
    }
	
    return { show: show, save: shipping_flat_rate, still: still }
}

function toggleShippingBanner(cart_data){
    if($('.shippingBanner').length){
        var banner_info = getBannerInfo(cart_data);
        
        if (banner_info.show){
            $(".shippingBanner").addClass('.shippingBanner--active');
        } else {
            $(".shippingBanner").removeClass('.shippingBanner--active');
        }
        
        $(".shipping-banner-still").html(banner_info.still);
        $(".shipping-banner-save").html(banner_info.save);

        if(!$(".shipping-banner-still").html() || !$(".shipping-banner-save").html()){
            $(".shippingBanner").hide();
        }
    }
	
}

function stopLoaderButtons(){
    setTimeout(function(){
        $('.loader-button--loading').removeClass("loader-button--loading");    
        $('.loader-bg--loading').removeClass("loader-bg--loading");    
    }, 1000);
}

// checkout step 2
function showGuestRegisterBlock(form){
    $('[name="address[company]"]', form).val('');
    $('[name="address[nif]"]', form).val('');
    if($('[name="bill"]:checked', form).val() == 1 && $('[name="company_name"]', form).val() != '' && $('[name="nif"]', form).val() != ''){
        $('[name="address[company]"]', form).val($('[name="company_name"]', form).val());
        $('[name="address[nif]"]', form).val($('[name="nif"]', form).val());
    }

    var form2 = $('#user-form-guest-register');
    toggleBlock(form2);
}
function guestRegisterSetPass(form){
    var form_checkout = $('#checkoutForm');
    $('[name="customer[password]"]', form_checkout).val($('[name="register-password"]', form).val());
    form_checkout.addClass('fn-leadform--avoidCallback');
    form_checkout.submit();
    
}
function showShippingOptions(method, shippingResponse){

    if(method == 2 || method == 3){ // 2.DHL / 3.Mailboxes
        var o = $('.fn-shipping-options'),
            btn = $('button', o),
            list_container = $('.fn-shipping-options-list', o),
            list = $('ul', list_container),
            error = $('.fn-shipping-options-errors', o);

        if(shippingResponse.error != true){
            var html = '';
            
            $.each(shippingResponse, function(i, shipOption){
             
                if(method == 2){
                    date_delivery = new Date(shipOption.deliveryTime * 1000).toISOString().slice(0, 19).replace('T', ' ');
                }

                html += '<li>' + 
                            '<div class="checkbox">' +
                                '<label class="checkbox__label">' +
                                    '<input class="checkbox__hidden" type="radio" name="shipping_hash" data-ref="' + shipOption.type + '" data-name="' + shipOption.serviceName + '" data-amount="' + shipOption.amount + '" data-delivery="' + shipOption.deliveryTime + '" value="' + shipOption.hash + '">' +
                                    '<span>' +
                                        '<span class="checkbox__checkmark">' +
                                            '<svg viewBox="0 0 24 24"><path d="M9 21.035l-9-8.638 2.791-2.87 6.156 5.874 12.21-12.436 2.843 2.817z"></path></svg>' +
                                        '</span>' +
                                    '</span>' +
                                    '<span>' + shipOption.serviceName + ' <strong>'+ number_format(shipOption.amount, '&euro;') +'</strong></span>' +
                                '</label>' +
                            '</div>' +
                        '</li>';
            });

            list.html(html);
            list_container.show();
            btn.hide();
                    
        }else{
            switch(shippingResponse.code){
                case 2:
                case 5:
                    error2show = shipoptions_error;
                    error.removeClass('shippingOptions__errors--fullwidth');
                break;
            default:
                    error2show = shipoptions_error_generic;
                    error.addClass('shippingOptions__errors--fullwidth');
                break;
            }

            error.html(error2show);
        }
        
    }
}

/* PRODUCT */    
if(typeof product_compositions_json !== 'undefined'){
    // set an object var to own all the posible options lists shuffled by type (Color list / Size list / Weight list / ...)
    var product_options_lists = {};
    // Set product_options_lists variable with option types lists
    // Iterate throught all available compositions
    $.each(product_compositions_json, function(i, composition){

        // Iterate throught all options in all product compositions
        $.each(composition.option, function(i, option_data){
            // Use each composition to get all the posible options, so only take first match
            // Set the group type (Color, Size, weight...) from options if is not already set
            if(product_options_lists[option_data.option_id] === undefined){
                // Create the group type and give values to it (empty options list, name and default image)
                product_options_lists[option_data.option_id] = {};
                product_options_lists[option_data.option_id].options = {};
                product_options_lists[option_data.option_id].name = option_data.option_name;
                product_options_lists[option_data.option_id].default_image = composition.default_image;
            }
                
            // Add current option to the options list if is not already in it (Red, Green, Blue, XL, L, Heavy, ...)
            if(product_options_lists[option_data.option_id].options[option_data.option_value_id] === undefined){
                product_options_lists[option_data.option_id].options[option_data.option_value_id] = {"name": option_data.option_value_name, "image" : composition.default_image};
            }

        });
            
    });
}

function printProductOptions(){
    
    // set product options variable
    var product_options = '';

    // Set the options var with each option list block in html
    $.each(product_options_lists, function(option_list_type_id, option_list){
        // Open the single option container
        product_options += '<div class="product__option _padH fn-option-selector" data-option_type_id="' + option_list_type_id + '">' +
            '<div class="product__option_title">' +
                option_list.name + ' (' + ec_options_select_default + ')' +
            '</div>';

            // if has images, create a 'ul li'
            if(option_list.default_image !== null){
                product_options += '<ul class="_flex _flex--wrap _rowSmall">';
                // each list option ("<option>")
                $.each(option_list.options, function(option_list_item_id, option_list_item){
                    product_options += '<li class="product__option_item _pad">' +
                        '<label>' +
                            '<input type="radio" name="sub_option_' + option_list_type_id + '_id" value="' + option_list_item_id + '">' +
                            '<img class="product__option_itemImg" src="/thumb?src=' + option_list_item.image + '&w=320&h=240&q=100&zc=2">' +
                            '<span class="product__option_itemName">' + option_list_item.name + '</span>' +
                        '</label>' +
                    '</li>';
                });
                product_options += '</ul>';

            // If hasn't images, create a select
            }else{
                product_options += '<select class="select--redArrow select--border" name="sub_option_' + option_list_type_id + '_id">';
                product_options += '<option value="0" disabled readonly selected>' + ec_options_select_default + '</option>';
                // each list option ("<option>")
                $.each(option_list.options, function(option_list_item_id, option_list_item){
                    product_options += '<option value="' + option_list_item_id + '">' + option_list_item.name + '</option>';
            });
            product_options += '</select>';
        }

        // Close the single option container
        product_options += '</div>';
    });

    // print options html blocks in the options container
    $('.fn-product-options').html(product_options);
}

function printProductAttributes(){
					
    // set product attributes variable
    var product_attributes_html = '';

    // Set the options var with each option list block in html
    $.each(product_attributes_json, function(attribute_list_type_id, attribute){
        //attribute_data = JSON.parse(attribute);
        if(attribute.value != '') {
        product_attributes_html += '<li>';
        product_attributes_html += attribute.name + ": " + attribute.value;
        product_attributes_html += '</li>';
        }
    });

    // print options html blocks in the options container
    $('.fn-product-attributes').html(product_attributes_html);
}

// Calculate and print the prices in summary box
function calcSummaryPrices(total_amount, shipping_amount, cart_amount_no_coupon){
    
    if(cart_amount_no_coupon == null){
        cart_amount_no_coupon = ecommerceCart.cart_amount_no_coupon;
    }
    
    if(shipping_amount == null){
        if(ecommerceCart.shipping_amount != null){
            shipping_amount = ecommerceCart.shipping_amount;
        }else{
            shipping_amount = '0';
        }
    }

    if(!isNaN(shipping_amount)){
        shipping_amount = shipping_amount.toString().replace('.',',');
    }

    // Subtotal
    $(".fn-checkout-subtotal").html(number_format(total_amount, '&euro;'));

    // Shipping price 
    if(parseFloat(shipping_amount) > 0){
        $('.fn-checkout-shippingprice').html(number_format(shipping_amount, '&euro;'));
    }else if(ecommerceDefaultShippingMethod != 2 && parseFloat(shipping_amount) == 0){
        //$('.fn-checkout-shippingprice').html("<span class='fn-cart-pricefree'>" + ec_msg.free + "</span>");
    }else{
        // <span class='fn-cart-pricefree fn-cart-pricefree--pending'>" + ec_msg.pending + "</span>
        $('.fn-checkout-shippingprice').html("");
    }

    // price without Promocode
    if(total_amount != cart_amount_no_coupon && $('.discount-value').length){
        $(".fn-checkout-total-nocupon").html(number_format(cart_amount_no_coupon, '&euro;'));
        $(".fn-checkout-total-nocupon").show();
        $(".fn-promocode-saving").html(number_format(parseFloat(cart_amount_no_coupon.replace('.','').replace(',','.')).toFixed(2)*1 - parseFloat(total_amount.replace('.','').replace(',','.')).toFixed(2)*1, '&euro;'));
        
    }else{
        $(".fn-checkout-total-nocupon").html('');
        $(".fn-checkout-total-nocupon").hide();
        $(".fn-promocode-saving").html('').parent().hide();
    }
    
    // Calculate the total amount (Cart + selected shipping option amount)
    // *1 to convert string into number
    $('.fn-checkout-total').html(number_format(parseFloat(total_amount.replace('.','').replace(',','.')).toFixed(2)*1 + parseFloat(shipping_amount.replace('.','').replace(',','.')).toFixed(2)*1, '&euro;'));
}

/* CHECKOUT - PAYMENT */
function changePaymentMethod(){
    if($(".payment-method-form").length > 1){
        var currentPaymentMethod = $(".fn-payment-method-option-selector:checked").val();
        $(".payment-method-form").hide();
        $("#payment-method-form-" + currentPaymentMethod).show();
    }else{
        $(".payment-method-form").show();
    }
    var currentPaymentMethodSelector = $(".fn-payment-method-option-selector:checked"),
        startTotalPrize = $('.fn-checkout-total[data-totalprize]').data('totalprize');
            
    $('.fn-checkout-total').html(number_format(startTotalPrize, '&euro;'));

    if(currentPaymentMethodSelector.data('fixedvalue')){
        currentPaymentMethodFixedValue = currentPaymentMethodSelector.data('fixedvalue');
        $('.fn-checkout-total').html(number_format(currentPaymentMethodFixedValue + startTotalPrize, '&euro;'));
    }
    if(currentPaymentMethodSelector.data('percentvalue')){
        currentPaymentMethodPercentValue = currentPaymentMethodSelector.data('percentvalue');
        $('.fn-checkout-total').html(number_format(startTotalPrize + startTotalPrize*(currentPaymentMethodPercentValue/100), '&euro;'));
    }
}

$(function(){

    // Save Cookie on load page

    // Initialize cart
    
    //updateCart(false);

    // print number of items in icon cart
    if(ecommerceCartData > 0){
        $('.ecCartButton').show();
        $('.fn-cart-icon').addClass('filled');
        $(".fn-cart-icon span:last-child").attr('data-units', ecommerceCartData);
        $(".fn-checkout-prodcount").html(ecommerceCartData);
        $("#cart .cart__summary_button").addClass("cart__summary_button--abled");
    }

    // If there is the checkout cart (Checkout page), load by static json
    if($('.fn-checkout-cart').length){
        printCheckoutCart(ecommerceCart);
        calcSummaryPrices(ecommerceCart.cart_amount, ecommerceCart.shipping_amount, ecommerceCart.cart_amount_no_coupon);
        toggleShippingBanner(ecommerceCart);
    }

    // Qty cart handler
    if($('.fn-checkout-cart, .fn-cart').length){
        $('.fn-checkout-cart, .fn-cart').on('change', '.fn-cart-item-qty input', function(){
            var qty = $(this).attr('data-request-qty'),
                product_id = $(this).closest('.fn-cart-item').data('product-id'),
                option_id = $(this).closest('.fn-cart-item').data('option-id');

            //$('[data-product-id="' + product_id + '"][data-option-id="' + option_id + '"] .fn-increment').val(qty);

            editCartQty({
					"product_id": product_id,
					"option_id": option_id,
					"qty": qty
				}, 
				function(data){
					// Success:
					$('[data-product-id="' + product_id + '"][data-option-id="' + option_id + '"] .fn-increment').val(data.quantity);
				},
				function(data){
					// Without stock.
				}
			);
        });
    }
    
    $('.fn-cart-icon').each(function(){

        // Load cart by cliking cart icon anywhere
        $(this).click(function(){
            updateCart();
        });

        $(this).addClass('ready');

    });

    if($('.fn-ec-cartScroll').length){
        $('.fn-ec-cartScroll').each(function(){
            $(this).on('click', function(){
                $('.cart__container').animate({
                    scrollTop: window.innerHeight
                }, 1000);
            });
        });

        $('[data-toggleblock="cart"]').on('click', function(){
            $('.cart__container').animate({
                scrollTop: 0
            }, 0);
        });
    }

    $(".loader-button").on("click", function(e){
        $(this).addClass("loader-button--loading");
    });

    $(".fn-promocode").each(function() {
        var promo = $(this),
            promo_btn = $("button", promo);
            
        $("input", promo).keypress(function(e){
            if(e.which === 13){
                e.preventDefault();
                promo_btn.click();
                return false;
            }
        });
        
        promo_btn.click(function(e){
            e.preventDefault();

            var promo = $(this).closest('.fn-promocode'),
                promo_value = $("input", promo).val(),
                promo_errors = $(".fn-promocode-errors", promo);

            promo_errors.hide();

            $.ajax({
                type: "POST",
                url: "/ecommerce/ajax/promotions/check",
                async: false,
                dataType: "json",
                data: {
                    coupon: promo_value,
                }

            }).done(function(ret){
            
                if(ret == false && promo_value != 'remove'){
                    promo_errors.html(ec_msg.promocode_invalid);
                    promo_errors.show("");
                    return false;

                }else{

                    $.ajax({
                        type: "POST",
                        url: "/ecommerce/ajax/promotions/coupon",
                        async: true,
                        dataType: "json",
                        data: {
                            coupon: promo_value,
                        }

                    }).done(function (ret) {
                        
                        location.reload(true);
                        updateCart();
                    });
                }
            });
        });

    });

    $(".fn-cart, .fn-checkout-cart").on("click", ".fn-cart-item-remove", function(){
        var productId = $(this).closest(".fn-cart-item").data("product-id"),
            optionId = $(this).closest(".fn-cart-item").data("option-id"),
            productData = {
            "data" : {
                "product_id" : productId,
                "option_id" : optionId,
            }
        };

        deleteItemFromCart(productData);
    });

    $("#cart .cart__summary_button").click(function(e){
        if(!$(this).hasClass("cart__summary_button--abled")){
            e.preventDefault();
        }
    });

    $('[data-toggleblock="cart"]').each(function(){
        if($('body[id*="ecommerce/"]').length){
            $(this).addClass('fn-toggleBlock--disabled');
        }
    });

    

    // CHECKOUT - STEP2

    $('[name="address_id"]').click(function(e){
        $('[name="address_id"]').not(this).prop('checked', false);
        
        /* if($(this).is(':checked')){
            $(this).prop('checked', false);
        }else{
            $(this).prop('checked', true);
        } */
    });
    
    // State - provinces handler depending on the selected country
    $('.fn-update-state').each(function(){
        var o = $(this),
            ctry = o.val(),
            state_field = o.closest('fieldset').find('.' + o.data('state-field'));

        if(ctry != 'ES'){
            state_field.addClass('userForm__field--hide');
        }

        o.change(function(){    
                var ctry = o.val();

            if(ctry == 'ES'){
                $('select', state_field).attr('data-validation', 'required');
                state_field.removeClass('userForm__field--hide');
            }else{
                state_field.addClass('userForm__field--hide');
                $('select', state_field).attr('data-validation', '');
                $('select', state_field).val('');
            }

        });
    });

    // Shipping options handler
    $('.fn-shipping-options').each(function(){
        var o = $(this),
            btn = $('button', o),
            list_container = $('.fn-shipping-options-list', o),
            list = $('ul', list_container),
            errors = $('.fn-shipping-options-errors', o),
            form = $('#' + o.data('shippingoptions-form'));       

            //$('.fn-checkout-summary-box-totals').hide();
            // Hide the shipping options list
            list_container.hide();
            list.html('');
            errors.html('');
            calcSummaryPrices(ecommerceCart.total_price);

            if(isLoggedIn){
                // If user is logged in, show the button since any shipping address is selected when arrives this page
                if($('[name="shipping_address_id"]:checked').length && ecommerceCart.items.length > 0){
                    $('.shippingOptions').show();
                    btn.show();
                }

                // Each time loged user change the shipping address, reset the shipping options
                $('[name="shipping_address_id"]').on('click', function(){
                    
                    $('.fn-checkout-submit').removeClass('checkout__paybtn--on');
                    list_container.hide();
                    list.html('');
                    errors.html('');
                    btn.show();
                    // reSet summary prices
                    calcSummaryPrices(ecommerceCart.total_price);
                });

            }else{
                // If user is not logged in, check if COUNTRY, ADDRESS and ZIP fields are filled to show the button to get shipping options list
                $('[name="shipping_address[postcode]"], [name="shipping_address[address_1]"], [name="shipping_address[country_id]"]', form).on('field-validated', function() {
                    if($('[name="shipping_address[postcode]"].valid, [name="shipping_address[address_1]"].valid, [name="shipping_address[country_id]"].valid', form).length == 3){
                        list_container.hide();
                        list.html('');
                        errors.html('');
                        o.show();
                    }else{
                        o.hide();
                        calcSummaryPrices(ecommerceCart.total_price);
                    }
                });

                // To avoid problems if user is editing a relevant field to calculate shipping options, hide the button
                $('[name="shipping_address[postcode]"], [name="shipping_address[address_1]"], [name="shipping_address[country_id]"]', form).change(function(){
                    list_container.hide();
                    list.html('');
                    errors.html('');
                    btn.show();
                    calcSummaryPrices(ecommerceCart.total_price);
                });
            }

        // By clicking the button ajax call will return some data
        btn.click(function(){

            if(isLoggedIn){
                var data = 'address_id=' + $('[name="shipping_address_id"]:checked', form).val();

            }else{
				var provinceId = $('[name="shipping_address[state]"] > option:selected', form).attr('data-id');
                var data = 'address_id=0';

                data += '&firstname=' + $('[name="customer[firstname]"]', form).val();
                data += '&lastname=' + $('[name="customer[lastname]"]', form).val();
                data += '&phone=' + $('[name="customer[phone]"]', form).val();
                data += '&email=' + $('[name="customer[email]"]', form).val();
                data += '&company=' + $('[name="address[company]"]', form).val(); // optional
                data += '&address=' + $('[name="shipping_address[address_1]"]', form).val();
                //data += '&address2=' + $('[name="shipping_address[address_2]"]', form).val(); // optional
                data += '&city=' + $('[name="shipping_address[city]"]', form).val();
                data += '&state=' + $('[name="shipping_address[state]"]', form).val(); // optional
                if(typeof(provinceId)=='string' && provinceId!='')
					data += '&province_id='+encodeURIComponent(provinceId);
                data += '&zip=' + $('[name="shipping_address[postcode]"]', form).val();
                data += '&ctry=' + $('[name="shipping_address[country_id]"]', form).val();

            }

            getShippingAmount(data);

        });

        // When a shipping option is clicked by the user, set all the fields with response data and set values in checkout
        o.on('click', '[name="shipping_hash"]', function(){
            var option = $(this),
                option_name = option.data('name'),
                option_amount = option.data('amount'),
                option_ref = option.data('ref'),
                option_delivery = option.data('delivery');

            option.change();

            // hidden fields values
            $('[name="shipping_ref"]').val(option_ref);
            $('[name="shipping_name"]').val(option_name);
            $('[name="shipping_delivery_time"]').val(option_delivery);
            $('[name="shipping_amount"]').val(option_amount);

            // Set summary prices
            calcSummaryPrices(ecommerceCart.total_price, option_amount);
            
            // If user is logged in, activate the confirm and pay button
            if(isLoggedIn){
                $('.fn-checkout-submit').addClass('checkout__paybtn--on');
                $('.fn-checkout-summary-box-totals').show();
            }

        });


    });

    $('#ecCheckoutGuestFormBtn').on('click', function(){
        $('#guestFormHeader button').hide();
    });

    $('.fn-guestFormToggle').click(function(){
        $('#ecCheckoutGuestFormBtn').click();
    });
    $('.userFormGuest').each(function(){
        var form = $(this);
        $('[name="bill"]', form).change(function(){
            if($(this).is(':checked')){
                $(".userFormGuest__billing", form).slideDown();
            }else{
                $(".userFormGuest__billing", form).slideUp();
            }	
        });
    });

    $('.fn-checkout-submit').click(function(e){
        $('#warnLogIn').removeClass('active');

        // If user is logged In, payment button disabled wont't do nothing
        if(isLoggedIn){
            if($(this).hasClass('checkout__paybtn--on')){
                $('#checkoutForm').submit();
            }else{
                e.preventDefault();
            }

        // If user is not logged In, show warning if button is disabled
        }else{
            // If is not the guest form button, show warning
            if(!$(this).parents('.userFormGuest').length){
                
                // If is not the guest popup asking for register
                if(!$(this).parents('#user-form-guest-register-password').length){
                    e.preventDefault();
                }
                if(!$('.userFormGuest').hasClass('active')){
                    $('#warnLogIn').addClass('active');
                }

            // If is the guest user form, check if a shipping option is selected
            }else if(!$('[name="shipping_hash"]:checked').length){
                e.preventDefault();
            }
        }
        $(this).removeClass("loader-button--loading");
    });

    $('.userFormGuest input, .userFormGuest select').blur(function(e){
        o = $(this);

        // Needed to handle toggle checkboxes like billing_is_shipping
        setTimeout(function(){ 
            o.trigger('field-validated');
        }, 500);
    });

    $('.userFormGuest').on('change', 'input, select', function(e){
        var form = $('.userFormGuest'),
            o = $(this),
            btn_submit = $('.fn-checkout-submit', form);

        setTimeout(function(){ 
            if(!$('input[data-validation*=""]:not(.valid):visible, select[name*="data-validation"]:not(.valid):visible', form).length && $('[name="shipping_hash"]:checked').length){
                btn_submit.addClass('checkout__paybtn--on');
            }else{
                btn_submit.removeClass('checkout__paybtn--on');                
            }
        }, 500);
         

    });

    $(".fn-guestRegister-no").on("click", function(){
        var form_checkout = $('#checkoutForm');
        form_checkout.addClass('fn-leadform--avoidCallback');
        form_checkout.submit();
    });

    /* PRODUCT */
    $(".fn-product").each(function(){
        var product = $(this);

        $(".fn-product-add2cart", product).on("click", function(e){
            var btn = $(this),
                product_id = product.data("product-id"),
                option_id = product.data("product-option-id"),
                qty = $("[name='qty']", product).val();
    
            if(btn.hasClass('fn-product-add2cart--on')){
                btn.removeClass('fn-product-add2cart--advice');
            }else{
                $('.loader-button').removeClass("loader-button--loading");
                btn.addClass('fn-product-add2cart--advice');
                return;
            }

            if(option_id === undefined || option_id === ""){
                option_id = false;
            }
            if(qty === undefined || qty === ""){
                qty = 1;
            }

            product_data = {
                "data" : {
                    "product_id" : product_id,
                    "option_id" : option_id, // Si tenemos options id (combinaciones de productos) se tiene que pasar en el data.				
                    "qty": qty
                }
            };

            add2Cart(product_data, 
				function(data){
					// Success:
					if($('#noStockMessage').length>0)
						$('#noStockMessage').remove();
				}, 
				function(data){
					// Without stock:
					$('.loader-button').removeClass("loader-button--loading");
					if($('#noStockMessage').length<1)
						$('<div id="noStockMessage" class="product__advise product__advise--warning _mrgTop">No hay más stock</div>').insertAfter('div.product__buttons');
				}
			);

        });
    });

    // If product has options, show them
    if(product_options_lists !== undefined && product_options_lists !== null && Object.keys(product_options_lists).length > 0){
        printProductOptions();

    // If not, active the button
    }else{
        $(".fn-product-add2cart").addClass('fn-product-add2cart--on');
    }

    // If product has options, show them
    if(typeof product_attributes_json !== 'undefined'){
        if(product_attributes_json !== undefined && product_attributes_json !== null){
           printProductAttributes();
        }
    }

    // When a option is selected, check witch is the composition id and set the 'data' in '.fn-product' element
    $('.fn-option-selector [name*="sub_option_"]').on('change', function(){
        var changed_selector = $(this),
            changed_suboption_id = changed_selector.val(),
            selected_options = [],
            option_id = false;

		$('option[value="0"]', changed_selector).remove();
		
        // Get all the options id selected in each list and add it to the selected_options array and look for the composition that matches all the options
        $('.fn-option-selector').each(function(){
            var selector = $('input[name*="sub_option_"]:checked, select[name*="sub_option_"]', $(this)),
                suboption_id = selector.val();

            // TODO [IF MORE THAN ONE OPTION IS POSIBLE] take in account if the selected combinations selected are available and show or hide some options 

            selected_options.push(suboption_id);

            // Look for the match throught each of product compositions
            $.each(product_compositions_json, function(composition_id, composition_data){
                $.each(composition_data.option, function(option_index, option_data){
                    var option_match = false;
                    $.each(selected_options, function(i, selected_option_id){
                        // Iterate all selected_options to find a full match of composition and all the options in the selected_options array
                        if(option_data.option_value_id == selected_option_id){
                            option_match = true;
                        }else{
                            option_match = false;
                        }
                    });
                    if(option_match == true)
                    {
                        selected_composition = composition_data;
						if(!ecommerce_sell_products_without_stock && ecommerce_inventary && parseInt(selected_composition.stock_qty)<1)
						{
							$(".fn-product-add2cart").removeClass('fn-product-add2cart--on');
							if($('#noStockMessage').length<1)
								$('<div id="noStockMessage" class="product__advise product__advise--warning _mrgTop">'+msg_ecommerce_product_out_of_stock+'</div>').insertAfter('div.product__buttons');
							$('button.fn-product-add2cart').addClass('no-after');
							return false;
						}
						if($('#noStockMessage').length>0)
							$('#noStockMessage').remove();
                        $(".fn-product-add2cart").addClass('fn-product-add2cart--on');
                        $('button.fn-product-add2cart').removeClass('no-after');
                        return false;
                    }
                });				
            });

        });

        // reSet the price        
        $.each(product_option_prices_json.options, function(i, option){
            if(option.id == selected_composition.id){
                selected_composition_prices = option.prices;
                return false;
            }
            return null;
        });

        if(selected_composition_prices != null && selected_composition_prices.total_price > 0){
            $('.fn-product-price-no-tax span').html(number_format(selected_composition_prices.price_without_tax));
            $('.fn-product-price span').html(number_format(selected_composition_prices.total_price));
        }

        // Set the 'data-product-option-id' value in '.fn-product' element as the full match composition id
        $('.fn-product').data('product-option-id', selected_composition.id);
			
    });

    /* CHECKOUT - PAYMENT */
    if($(".fn-payment-method-option-selector").length){

        // call function on load page containing some payment method selector
        changePaymentMethod();

        $(".fn-payment-method-option-selector").on("click", function(){
            changePaymentMethod();
        });
    }

    /* PENDING ORDER MESSAGE */
    $('.fn-deletePendingOrder').click(function(){
        setCookie("_ec_oid", 0, 0);
    });    

});




    
/* $.validate({
    scrollToTopOnError: false,
    form : "#order-form",
    lang : '<?php echo $ec_language; ?>',
    modules: 'logic',
    onValidate: function(form) {
    },
    onSuccess: function(form) {
        $("#form-messages").hide();
        
            // If the user is logged in, check if addresses had been selected
            
                
                if ($("input[name='shipping_address_id']:checked").length == 0){
                    // No addresses
                    $("#form-messages").html("<div class='error'>Por favor, especifica una dirección de envío.</div>");
                    $("#form-messages").show();
					
                    return false;
                }
				
                if ($("input[name='address_id']:checked").length == 0){
                    // No addresses
                    $("#form-messages").html("<div class='error'>Por favor, especifica una dirección de facturación.</div>");
                    $("#form-messages").show();
					
                    return false;
                }
                
            
        
        return true;
}
}); */
