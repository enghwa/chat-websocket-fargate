$(document).ready(function() {
    //Registration form submission
    $('.join').on('submit', function(e) {
        e.preventDefault();
        $('.submit').prop('disabled', true);

        //Register user
        $.post('/user', { user: $('.username').val() }).done(function(res) {
            if (res.status === 200) {
                window.location = 'chat/' + $('.username').val();
            } else {
                $('.submit').prop('disabled', false);

                $('.join').prepend(
                    '<p class="alert">The username is already taken!</p>',
                );
                setTimeout(function() {
                    $('.alert').fadeOut(500, function() {
                        $(this).remove();
                    });
                }, 5000);
            }
        });
    });
});
