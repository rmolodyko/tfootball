$(document).ready(function() {

    var createGameForm = $('.create-game-form');

    var notifyContainer = $('#notify-container');
    var notify = $('#notify');
    var notifyClose = $('#notify .close');

    // Hide notify window
    notifyClose.click(function(){
        notify.removeClass('show');
        setTimeout(function(){
            notifyContainer.removeClass('active');
        }, 1000);
    });

    // Player select in creating game
    $('#game_create_firstTeam').select2();
    $('#game_create_secondTeam').select2();

    $('#createGameClear').click(function(){
        clearCreateGameForm();
    });

    // Create game form
    createGameForm.submit(function(event) {

        var submitBtn = $('#createGame');
        var errorField = $('.form-error');

        var firstTeam = [];
        $('#game_create_firstTeam :selected').each(function(i, selected){
            firstTeam[i] = $(selected).val();
        });
        var secondTeam = [];
        $('#game_create_secondTeam :selected').each(function(i, selected){
            secondTeam[i] = $(selected).val();
        });

        var values = {};
        $.each( createGameForm.serializeArray(), function(i, field) {
            if (field.name == 'game_create[firstTeam][]') {
                values[field.name] = firstTeam;
            } else if (field.name == 'game_create[secondTeam][]') {
                values[field.name] = secondTeam;
            } else {
                values[field.name] = field.value;
            }
        });

        errorField.html('');
        submitBtn.button('loading');

        $.ajax({
            type        : 'POST',
            url         : createGameForm.attr('action'),
            data        : values,
            dataType    : 'json'
        }).success(function(data){
            if (data.status == 0) {
                errorField.html(data.error);
            } else {
                $('.create-game-popup').modal('hide');
                $('#game_create_firstScore').val('');
                $('#game_create_secondScore').val('');
                errorField.html('');
                notifyContainer.addClass('active');
                notify.addClass('show');
                setTimeout(function(){
                    notify.removeClass('show');
                    setTimeout(function(){
                        notifyContainer.removeClass('active');
                    }, 1000);
                }, 4000);
            }
        }).always(function () {
            submitBtn.button('reset');
        });

        event.preventDefault();
    });

    // Dropdown menu
    $('.dropdown-menu').click(function(e) {
        e.stopPropagation();
    });

    // Notify btn in popup
    $('.notify-btn').click(function(){

        var notifies = $('.notify-item').length;
        var btn = $(this);
        btn.button('loading');

        $.ajax({
            type        : 'POST',
            url         : $(this).data('href'),
            dataType    : 'json'
        }).success(function(data){
            if (data.status == 1) {
                btn.closest('.notify-item').remove();
                notifies--;
                if (notifies == 0) {
                    $('.dropdown-menu').append('<li class="notify-item">' +
                    '<div class="no-confirms">No matches for confirmation</div>' +
                    '</li>');
                    $('.game-notify').removeClass('notify-active');
                }
            } else {
                console.log(data);
            }
        }).always(function(){
            btn.button('reset');
        });
    });

});