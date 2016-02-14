$(document).ready(function() {

    var createGameForm = $('.create-game-form');

    var notify = $('#notify');
    var notifyClose = $('#notify .close');

    // Hide notify window
    notifyClose.click(function(){
        notify.removeClass('show');
    });

    // Date filter
    var dateFilter = $('#date-filter');
    dateFilter.daterangepicker({
        locale: {
            format: 'DD.MM.YYYY',
            cancelLabel: 'Clear'
        }
    });
    dateFilter.on('cancel.daterangepicker', function(ev, picker) {
        $(this).val('');
    });
    dateFilter.data('daterangepicker').setStartDate($('input[name="startDate"]').val());
    dateFilter.data('daterangepicker').setEndDate($('input[name="endDate"]').val());

    // Player select in creating game
    $('#game_create_firstTeam').select2();
    $('#game_create_secondTeam').select2();

    // Player select in game filter
    $('#game_filter_firstTeam').select2();
    $('#game_filter_secondTeam').select2();

    // Game filters
    $('#game-filters h4').click(function(){
        $(this).parent().toggleClass('open');
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
            console.log(field.name);
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
                createGameForm.trigger("reset");
                errorField.html('');
                notify.addClass('show');
                setTimeout(function(){
                    notify.removeClass('show');
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
                    '<div>No matches for confirmation</div>' +
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