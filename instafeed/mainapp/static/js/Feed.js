//Binds all appropriate buttons with clicks
$(document).on('ready', function() {
    $('#submitPostButton').on('click', submitPost);
    $('#facebookRefreshButton').bind('click', loadFacebookFeed());
    $('#twitterRefreshButton').bind('click', loadTwitterFeed());
    $('#googleRefreshButton').bind('click', loadGoogleFeed());
    var refreshId = setInterval(function(){
      loadFacebookFeed();
      loadTwitterFeed();
      loadGoogleFeed();
    }, 60000);
});

// Submits a post using an ajax request.
function submitPost() {
    var message = $('#postText').val();
    if (message != '') {
        if ($('#postOptionFacebook').is(':checked')) {
            submitPostHelper(message, '/facebook_request/');
        }
        if ($('#postOptionTwitter').is(':checked')) {
            submitPostHelper(message, '/twitter_request/');
        }
    }
}

function submitPostHelper(msg, url) {
    $.ajax({
        type: 'POST',
        url: url,
        data: {
            message: msg,
            type: 'upload'
        },
        datatype: 'json',
        error: function(data) {
            //$(location).attr('href',data);
	    alert(data);
        }
    });
}

//Loads Facebook feeds from server
//Post request used to get list of posts
function loadFacebookFeed() {
    //console.log('facebook');
    $.ajax({
        type: "POST",
        url: "/facebook_request/",
        data: {
            title: "ajax call from facebook",
        type: "feedRequest"
        },
        datatype: "json",
        error: function (data) {
          //  $(location).attr('href',data.responseText);
            $('#facebookFeedPosts').append('Please signin to Facebook again:<br><button id="signinToFacebook" class="btn">Facebook Login</button>');
            $('#signinToFacebook').bind('click', signinToFacebook);
	},
        success: function (data) {
            $('#facebookFeedPosts').empty();
            if (data.success == "false") {
                $('#facebookFeedPosts').append('No Facebook Account Found:<br><button id="signinToFacebook" class="btn">Facebook Login</button>');
                $('#signinToFacebook').bind('click', signinToFacebook);
            } else {
                for(var i = 0; i < data.updates.length; i++) {
                    createPostInFacebookFeed(
                        urlify(data.updates[i][0]),
                        data.updates[i][2],
                        data.updates[i][1],
                        data.updates[i][3],
			data.updates[i][4]
                    );
                }
            }
        }
    });
}

//Creates a pop in the social media feed with the given parameters
function createPostInFacebookFeed(message, time, person, img_src, id){
    var date = new Date(time * 1000);
    var formattedDate = (
          date.toLocaleString().substring(0,3) +
          ' ' +
      date.toLocaleTimeString()
    );

    $('#facebookFeedPosts').append('<div class ="FeedPost">' +
                  '<img src="' + img_src + '" ' + 'class="user_img" alt="User Avatar"/>' +
                  '<img src="/static/img/FacebookLogo.jpg" class="logo" alt="Facebook"/>' +
                  '<div class="nameTime">' + person + ' - ' +
                  formattedDate + '</div><div class="message">' + message + 
		  '<br> <a class="comment" href="javascript:facebookLike(' + id +  ')">Like   </a>' +
                  '<a class="comment" href="javascript:facebookComment(' + id + ',' + person +  ')">Comment</a></div></div>');
}

function loadTwitterFeed() {
    $.ajax({
        type: "POST",
        url: "/twitter_request/",
        data: {
            type: "feedRequest"
        },
        datatype: "json",
        error: function (data) {
	    $('#twitterFeedPosts')
                .append('No Twitter Account Found:<br><button id="signinToTwitter" class="btn">Twitter Login</button>');
            $('#signinToTwitter').bind('click', signinToTwitter);
            console.log('Error:', data);
        },
        success: function (data) {
            $('#twitterFeedPosts').empty();
            if(data.success == "false") {
                $('#twitterFeedPosts')
                    .append('No Twitter Account Found:<br><button id="signinToTwitter" class="btn">Twitter Login</button>');
            $('#signinToTwitter').bind('click', signinToTwitter);
            } else {
                var posts = JSON.parse(data);
                for (var i = 0, length = posts.tweets.length; i < length; i++) {
                    var post = posts.tweets[i];
                    createPostInTwitterFeed(
                        urlify(post.text),
                        post.created_at ,
                        post.user.name,
                        post.user.profile_image_url,
			i
                    );
                }
            }
        }
    });
}

/*
 <div class ="FeedPost">
     <img src='...' class="user_img" alt="User Avatar"/>
     <img src="/static/img/TwitterLogo.jpg" class="logo" alt="Facebook"/>
     <div class="nameTime"> person - time </div>
     <div class="message"> message </div>
 </div>

 TODO: could be rendered more efficiently with http://api.jquery.com/jQuery.template/
       But first modify the returned data,
       it doesn't make sense to return data we don't need since network transaction is expensive.

 */

function createPostInTwitterFeed(message, time, person, profilePicture, id) {
    $('#twitterFeedPosts').append('<div class ="FeedPost">' +
                 '<img src=\'' + profilePicture + '\' class="user_img" alt="User Avatar"/>' +
                 '<img src="/static/img/TwitterLogo.jpg" class="logo" alt="Facebook"/>' +
                 '<div class="nameTime">' + person + ' - ' + time +
                 '</div><div class="message">' + message +
                 '<br> <a class="comment" href="javascript:twitterRetweet(' + id +  ')">Retweet   </a>' +
                 ' <a class="comment" href="javascript:twitterReply(' + person +  ')">Reply </a></div></div>'
		);
}

function loadGoogleFeed() {
   // console.log('load google feed');
    $.ajax({
        type: "POST",
        url: "/google_get_posts/",
        data: {
            title: "ajax call from google",
        type: "feedRequest"
        },
        datatype: "json",
        error: function (data) {
            $('#googleFeedPosts').append('No Google+ Account Found:<br><button id="signinToGoogle" class="btn">Google Login</button>');
            $('#signinToGoogle').bind('click', signinToGooglePlus);
        },
        success: function (data) {
          $('#googleFeedPosts').empty();
          if(data.success == "false") {
            $('#googleFeedPosts').append('No Google Account Found:<br><button id="signinToGoogle" class="btn">Google Login</button>');
            $('#signinToGoogle').bind('click', signinToGooglePlus);
          } else {
            var posts = JSON.parse(data).posts;
            for(var i = 0; i < posts.length; i++) {
              createPostInGoogleFeed(
                urlify(posts[i].content),
                posts[i].published,
                posts[i].author_display_name,
                posts[i].author_image_url
              );
            }
          }
        }
    });
}

function createPostInGoogleFeed(message, time, person, profilePicture) {
    $('#googleFeedPosts').append('<div class ="FeedPost">' +
                 '<img src=\'' + profilePicture + '\' class="user_img" alt="User Avatar"/>' +
                 '<img src="/static/img/GoogleLogo.jpg" class="logo" alt="Google"/>' +
                 '<div class="nameTime">' + person + ' - ' + time +
                             '</div><div class="message">' +
                             message + '</div></div>'
    );
}

function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        return '<a href="' + url + '">' + url + '</a>';
    });
}

function facebookComment(id, message){
    //TODO
    //change post ui to say comment
    //check facebook button and diable the twitter check
    //call normal post with users comment typed in

    //change post ui back to normal
}

function facebookLike(id){
    //call hampton's function taking an id of a post to like
    alert(id);
    $.ajax({
        type: 'POST',
        url:"/facebook_like/" ,
        data: {
            postId: id,
            type: 'like'
        },
        datatype: 'json',
        error: function(data) {
            alert(data);
        }
    });
}

function twitterRetweet(id){
    //call kevins function passing it an id to retweet for the user
    alert(id);
    $.ajax({
        type: 'POST',
        url:"/twitter_retweet/" ,
        data: {
            postId: id,
            type: 'retweet'
        },
        datatype: 'json',
        error: function(data) {
            alert(data);
        }
    });
}

function twitterReply(person){
    //TODO
    //change header of post ui to say reply and only check twitter button
    //and disable facebook button
    //start message with @person

    //send up reply
    //change post ui back to normal 
   

    //alert($("#myModalLabel").text());
    //$("#myModalLabel").text("Comment");
    //alert($("#myModalLabel").text());
}