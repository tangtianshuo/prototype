$(document).ready(function(){

    /* Open thanks message on POST */
    if($("#jobsPopup .popupCustomOuter").hasClass("popupCustomOuter--leadformPOST")){
        var o = $(this);

        // If there is POST show thanks popup message
        $(".popupCustomOverlay, .popupCustom",o).fadeIn();

        // If there is POST add some events on close click -to review
        $('.popupCustom__close').click(function() {//reload page without post
            $('.leadformThanks').fadeOut(function(){
                $('.popupCustomOuter--leadform').removeClass('popupCustomOuter--leadformPOST');
                $('.leadform--jobs').fadeIn();
            });
        });
    }

    $(".fn-jobs-popup").on("click",function(e){
        e.stopPropagation();
        var job_id = $(this).data("job-id");

        // If has the job id it is opening the popup. Else, closing it
        if(job_id !== undefined) {
            $("input[name=job_id]").val(job_id);
            $('body').addClass('noScroll');
            $('#jobsPopup .popupCustomOverlay').fadeIn();
            $('#jobsPopup .popupCustom').fadeIn();
        }else{
            // Reset form on close popup
            $("#jobsPopup form").get(0).reset();
            $('body').removeClass('noScroll');
            $('#jobsPopup .popupCustomOverlay').fadeOut();
            $('#jobsPopup .popupCustom').fadeOut();
        }
    });


    /* Leadform */

    /* Upload file */
    var inputs = document.querySelectorAll( '.inputfile' );
    Array.prototype.forEach.call( inputs, function( input ){
        var label	 = input.nextElementSibling,
            labelVal = label.innerHTML;

        input.addEventListener( 'change', function( e )
        {
            var fileName = '';
            if( this.files && this.files.length > 1 )
                fileName = ( this.getAttribute( 'data-multiple-caption' ) || '' ).replace( '{count}', this.files.length );
            else
                fileName = this.value.split( '\\' ).pop();

            if( fileName ) {
                label.innerHTML = fileName;
            } else {
                label.innerHTML = labelVal;
            }
        });

        // Firefox bug fix
        input.addEventListener( 'focus', function(){ input.classList.add( 'has-focus' ); });
        input.addEventListener( 'blur', function(){ input.classList.remove( 'has-focus' ); });
    });

});