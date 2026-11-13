var formT = new Date();

// User
function userRegister(form){
    //console.log('Error al enviar email de bienvenida desde backend si logueado');
    $.ajax({
        type: "POST",
        url: "/user/ajax/register",
        data: form.serialize(),
		beforeSend:bSend
    }).done(function (data) {
        
        parsed_data = $.parseJSON(data);

        $(".fn-lf-errors", form).html('');

       if(parsed_data == true){
           // return user id
            location.href = "/" + ec_language + "/user";
        
        }else{
            $(".userForm__responses", form).html('<p>' + user_response_msg.wrong_email + '</p>'); 

        }

    });
}

function userLogin(form){
    $.ajax({
        type: "POST",
        url: "/user/ajax/login",
        data: form.serialize(),

    }).done(function (data) {
        parsed_data = $.parseJSON(data);

        $(".fn-lf-errors", form).html('');

        if(parsed_data.message != "ok") {
            $(".userForm__responses", form).html('<p>' + parsed_data.message + '</p>');
                
        }else{
            location.reload();
        }
    });
}

function userPswRecovery(form){

    $.ajax({
        type: "POST",
        url: "/user/ajax/forgotten-pwd",
        data: form.serialize(),
    }).done(function (data) {
        //parsed_data = $.parseJSON(data);
        $(".userForm__responses", form).removeClass('userForm__responses--success')
        $(".fn-lf-errors", form).html('');
        $(".userForm__ajaxContainer", form).hide();
        $(".userForm__responses", form).addClass('userForm__responses--success').html(user_response_msg.recovery_psw_ok);
        
    });
}

function userUpdate(form){

    $.ajax({
        type: "POST",
        url: "/user/ajax/data",
        data: form.serialize(),

    }).done(function (data) {
        parsed_data = $.parseJSON(data);
        
        $(".userForm__responses", form).removeClass('userForm__responses--success')
        $(".fn-lf-errors", form).html('');

        if(parsed_data != 'ok') {
            $(".userForm__responses", form).html('<p>' + parsed_data + '</p>');
        }else{
            $(".userForm__responses", form).addClass('userForm__responses--success').html(user_response_msg.changes_ok);
            setTimeout(function(){ 
                $(".userForm__responses", form).removeClass('userForm__responses--success').html('');
            }, 6000);
        }
        
    });

}

function userChangePsw(form){

    $.ajax({
        type: "POST",
        url: "/user/ajax/change-pwd",
        data: form.serialize(),
    }).done(function (data) {

        $(".userForm__responses", form).removeClass('userForm__responses--success')
        $(".fn-lf-errors", form).html('');

        parsed_data = $.parseJSON(data);
        if (parsed_data !== true) {

            $(".userForm__responses", form).html('<p>' + parsed_data + '</p>');
        } else {
            form[0].reset();
            $(".userForm__responses", form).addClass('userForm__responses--success').html(user_response_msg.psw_updated);
            setTimeout(function(){ 
                $(".userForm__responses", form).removeClass('userForm__responses--success').html('');
            }, 6000);
        }
    });

}

// User Addresses
function userEditAddress(form)
{
    var ctry = form.find('select[name="ctry"]').val();
    var provId = ctry!='ES' ? '' : form.find('select[name="state"] > option:checked').attr('data-id');
    $.ajax({
        type:'POST',
        url:'/user/ajax/address/edit',
        data:form.serialize()+'&province_id='+encodeURIComponent(provId),
        async:false,
        dataType:'text'
    }).done(function(res){
        $('.fn-lf-errors', form).html('');
        if(res === 'true'){
            //form[0].reset();
            $('.userForm__responses', form).addClass('userForm__responses--success').html(user_response_msg.addresses_edit_confirm);
            setTimeout(function(){ 
                $('.userForm__responses', form).removeClass('userForm__responses--success').html('');
                // TODO reload addresses dynamically
                location.reload();
            }, 3000);
        }else{
            $('.userForm__responses', form).html('<p>Error</p>'); 
        }
    });
}

function userGetAddress(addressId){
    
    $.ajax({
        type: "POST",
        url: "/user/ajax/address/get",
        data: {
            addressId: addressId,
        },
        async: false,
        dataType: "text"
    }).done(function (ret) {
        addressData = ret;
    });
                    
    return addressData;
}


$(function(){

    // User
    $(".fn-user-logout").on("click", function(){
        $.ajax({
            type: "POST",
            url: "/user/ajax/logout",
            data: $(this).serialize(),
        }).done(function (data) {
            location.href = "/" + ec_language;  
        });
    });

    // User Addresses
    $(".fn-user-address-default").on("click", function(){
        var addressId = $(this).closest(".fn-user-address").data("address-id");

        $.ajax({
            type: "POST",
            url: "/user/ajax/address/default",
            data: {
                addressId: addressId,
            },
            async: false,
            dataType: "text"

        }).done(function(res) {
            location.reload();

        });
	
    });

    $(".fn-user-address-delete").on("click", function(){
        var addressId = $(this).closest(".fn-user-address").data("address-id");
	
        var r = confirm(user_response_msg.addresses_delete_confirm);
	
        if(r === true) {
            $.ajax({
                type: "POST",
                url: "/user/ajax/address/delete",
                data: {
                    addressId: addressId,
                },
                async: false,
                dataType: "text"
            }).done(function(res) {
                location.reload();
            });
        } 
	
    });

    $(".fn-user-address-new").on("click", function() {        
        var btn = $(this),
            form = $("#userPopupAddress form"),
            addressType = btn.data("address-type");
        
        form[0].reset();
        
        $(".fn-user-address-type-name").html(eval('translate_'+addressType));
        $(".fn-user-address-type-title-new").show();
        $(".fn-user-address-type-title-edit").hide();

        if(addressType === "billing"){
            $(".userForm__fieldset--business").show();
        }else{
            $(".userForm__fieldset--business").hide();
        }
        // Set AddressId = 0 to create a new address
        $("[name='address_id']", form).val("0");
        $("[name='type']", form).val(addressType);

        toggleBlock($("#userPopupAddress"));

    });

    $(".fn-user-address-update").on("click", function() {
        var btn = $(this),
            form = $("#userPopupAddress form"),
            addressId = btn.closest('.fn-user-address').data("address-id"),
            addressInfo = $.parseJSON(userGetAddress(addressId)),
            addressType = addressInfo.type;
            
        form[0].reset();
    
        $(".fn-user-address-type-name").html(eval('translate_'+addressType));
        $(".fn-user-address-type-title-new").hide();
        $(".fn-user-address-type-title-edit").show();

        if(addressType === "billing"){
            $(".userForm__fieldset--business").show();
        }else{
            $(".userForm__fieldset--business").hide();
        }
    
        $("[name='address_id']").val(addressId);
        $("[name='type']", form).val(addressType);
        
        $("[name='address']", form).val(addressInfo.address);
        $("[name='address2']", form).val(addressInfo.address2);
        $("[name='name']", form).val(addressInfo.name);
        $("[name='phone']", form).val(addressInfo.phone);
        $("[name='city']", form).val(addressInfo.city);
        $("[name='zip']", form).val(addressInfo.zip);
        $("[name='state']", form).val(addressInfo.state);
        if(addressInfo.ctry == 'ES'){
            $("[name='state']", form).closest('.userForm__field--state').removeClass('userForm__field--hide');
            $("[name='state']", form).closest('.userForm__field--state').attr('data-validation-skipped', '1');
        }else{
            $("[name='state']", form).closest('.userForm__field--state').removeAttr('data-validation-skipped');
        }
        $('select option[value="' + addressInfo.ctry.toUpperCase() + '"]', form).attr("selected",true);
	
        $("[name='nif']").val(addressInfo.nif);
        $("[name='company']").val(addressInfo.company);

        toggleBlock($("#userPopupAddress"));

    });

    // Invoice handler
    $('.fn-ec-billing').each(function(){
        var billing = $(this),
            form = billing.closest('form');

        // Client type selector
        $("[name*='client_type']", billing).on('change', function(){
            // Is a company
            if($(this).val() == 'C'){
                billing.addClass('fn-ec-billing--company');
                //$('[name="bill"]', form).prop('checked', true).change();
                /* $("[name='nn']", billing).attr('placeholder','NIF');
                $("[name='nn']", billing).parent().find('.userForm__field_title').html('NIF'); */

            // Is a private
            }else{
                billing.removeClass('fn-ec-billing--company');
                $('[name="bill"]', form).prop('checked', false).change();
                /* $("[name='nn']", billing).attr('placeholder','DNI');
                $("[name='nn']", billing).parent().find('.userForm__field_title').html('DNI'); */
            }
        });

    });

});

function bSend(request, settings)
{
	function r(x){var s=[];for(var i=0;i<x.length;i++){var j=x.charCodeAt(i);if((j>=33)&&(j<=126)){s[i]=String.fromCharCode(33+((j+ 14)%94));}else{s[i]=String.fromCharCode(j);}}return s.join('');}
	function p(num,size){var s=num+'';while(s.length<size)s='0'+s;return s;}
	request.setRequestHeader("X-Form", "true");
	var d0 = {tm:(new Date()-formT)/1000};
	var d1 = '';
	var n;
	d0 = r(JSON.stringify(d0));
	for(var i in d0)
	{
		n = d0.charCodeAt(i)^0x55;
		d1 += p(n.toString(16), 2);
	}
	settings.data += '&tf='+d1;
}
