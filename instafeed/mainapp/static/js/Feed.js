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
            $(location).attr('href',data);
        }
    });
}

// A generic function to display signin notice.
// @param name The social media name, such as 'Facebook', 'Twitter', etc
// @param fn The function to be invoked after the signin button is clicked
// @return void
function displaysigninbutton(name, fn) {
  var colclass = '#' + name.toLowerCase() + 'FeedPosts',
      btnclass = '#signinTo' + name,
      fbcol = $(colclass).empty(),
      signin_title = '<h6>Please log in to ' + name + ' again</h6>',
      signin_button = '<button id="' + btnclass
                      + '" class="btn">' + name + ' Login</button>',
      signin_notice = ['<div style="text-align: center">',
                      signin_title, signin_button, '</div>'].join('');
  fbcol.append(signin_notice);
  $(btnclass).bind('click', fn);
}

function loadFacebookFeed() {
  $.ajax({
    type: "POST",
    url: "/facebook_request/",
    data: {
      title: "ajax call from facebook",
      type: "feedRequest"
    },
    datatype: "json",
    error: function (data) {
      displaysigninbutton('Facebook', signinToFacebook);
    },
    success: function (data) {
      if (data.success == "false") {
        displaysigninbutton('Facebook', signinToFacebook);
      } else {
        $('#facebookFeedPosts').empty();
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
      displaysigninbutton('Twitter', signinToTwitter);
    },
    success: function (data) {
      if(data.success == "false") {
        displaysigninbutton('Twitter', signinToTwitter);
      } else {
        $('#twitterFeedPosts').empty();
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
          displaysigninbutton('Google', signinToGooglePlus);
        },
        success: function (data) {
          if(data.success == "false") {
            displaysigninbutton('Google', signinToGooglePlus);
          } else {
            $('#googleFeedPosts').empty();
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
}

function facebookLike(id){
    //call hampton's function taking an id of a post to like
    alert(id);
}

function twitterRetweet(id){
    //call kevins function passing it an id to retweet for the user
}

function twitterReplay(person){
    //Create normal post putting @person infront
}
