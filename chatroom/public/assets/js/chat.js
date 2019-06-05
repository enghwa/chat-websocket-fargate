$(document).ready(function () {

    const socket = io();

    //Get the chat history
    $.get('/messages')
        .done(function (res) {
            $.each(res, function (index, value) {
                value = JSON.parse(value);
                console.log(value);
                if (value.user === 'system') {
                    $('.chat').append('<p class="item"><span class="system">' + value.user + ': </span><span class="msg">' + value.message + '</span></p>');
                } else {
                    $('.chat').append('<p class="item"><span class="user">' + value.user + ': </span><span class="msg">' + value.message + '</span></p>');
                }
            });

            $('.chat').animate({'scrollTop': 999999}, 200);
        });

    //Get the list of all active users
    $.get('/users')
        .done(function (res) {
            $.each(res, function (index, value) {
                $('.users').append('<p class="item">' + value + '</span>');
            });
        });

    //Message box submission using the 'Enter' key
    $('.room .message').on("keydown", function (e) {

        if (e.keyCode === 13) {
            e.preventDefault();

            let user = $('.name').val();
            let msg = $('.message').val();

            $.post('/message', {user: user, msg: msg})
                .done(function () {
                    $('.message').val('');
                    $('.submit').prop('disabled', false);
                });
        }

    });

    //Message box submission
    $('.room').on("submit", function (e) {
        e.preventDefault();

        let user = $('.name').val();
        let msg = $('.message').val();

        $.post('/message', {user: user, msg: msg})
            .done(function () {
                $('.message').val('');
                $('.submit').prop('disabled', false);
            });
    });

    //Remove user from active user list just before closing the window
    window.onbeforeunload = function () {
        $.ajax({
            method: 'DELETE',
            url: '/user',
            data: {user: $('.name').val()}
        })
            .done(function (msg) {
                alert(msg.message);
            });

        return null;
    };

    //Listens to when a chat message is broadcasted and displays it
    socket.on('message', function (data) {
        console.log(data);
        let username = data.user;
        let message = data.message;
        if (username === 'system') {
            $('.chat').append('<p class="item"><span class="system">' + username + ': </span><span class="msg">' + message + '</span></p>');
        } else {
            $('.chat').append('<p class="item"><span class="user">' + username + ': </span><span class="msg">' + message + '</span></p>');
        }

        $('.chat').animate({'scrollTop': 999999}, 200);
    });

    //Listens to when the active user list is updated and broadcasted
    socket.on('users', function (data) {
        $('.users .item').remove();

        $.each(data, function (index, value) {
            $('.users').append('<p class="item">' + value + '</span>');
        });
    });
});
