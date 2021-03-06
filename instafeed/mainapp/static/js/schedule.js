$(document).on('ready', function() {
    $('#updateContent').bind('keyup keypress', countNewPostChars);
    //bind submit button
    $('#sumbitScheduledPost').on('click', submit_scheduled_post);
    $('#scheduledPosts .delete-post').click(delete_scheduled_post);
    $('#datepicker').datepicker();
    $('#timepicker').timepicker({
      minutes: {
        starts: 0,                // First displayed minute
        ends: 55,                 // Last displayed minute
        interval: 10               // Interval of displayed minutes
      }
     });
});

function delete_scheduled_post() {
  var $post_row = $(this).parents('tr');
  var post_id = $post_row.attr('post-id');
  $.ajax({
      type: 'POST',
      url: '/delete_scheduled_update/',
      data: {
        post_id: post_id
      },
      datatype: 'json',
      success: function(data) {
        $post_row.hide('slow', function() { $post_row.remove() });
      }
  });
}
function schedule_post(year_, month_, day_, hour_, minute_, message_, post_site_) {
    $.ajax({
        type: 'POST',
        url: '/scheduled_update/',
        data: {
            year: year_,
            month: month_,
            day: day_,
            hour: hour_,
            minute: minute_,
            second: '0',
            microsecond: '0',
            message: message_,
            post_site: post_site_,
            timezone: jstz.determine().name(),
            type: 'scheduled_post'
        },
        datatype: 'json',
        error: function(data) {
          $('#invalid-date').show();
        },
        success: function(data) {
          $('#invalid-date').hide();
          var preceding_id = data.preceding_id;
          var $rendered_update = $(data.rendered_update);
          $rendered_update.find('.delete-post').click(delete_scheduled_post);
          $rendered_update.hide();
          if (preceding_id == 0) {
            $rendered_update.insertAfter($('.table tbody .header'));
            $rendered_update.show('slow');
          } else {
            $rendered_update.insertAfter($('tr[post-id$="' + preceding_id + '"]'));
            $rendered_update.show('slow');
          }
        }
    });
}

function submit_scheduled_post(){
    var $date = $('#datepicker').datepicker('getDate');
    var $timepicker = $('#timepicker');
    var year = $date.getFullYear();
    var month = $date.getMonth() + 1;
    var day = $date.getUTCDate();
    var hour = $timepicker.timepicker('getHour');
    var minute = $timepicker.timepicker('getMinute');
    var message = $('#updateContent').val();
    var post_site = 0;
    if ($('#postOptionFacebook').is(':checked') &&
        $('#postOptionTwitter').is(':checked')) {
        post_site = 3;
    } else if ($('#postOptionFacebook').is(':checked')) {
        post_site = 1;
    } else if ($('#postOptionTwitter').is(':checked')) {
        post_site = 2;
    } else {
        return;
    }
    
    if (year == 'Year' || month == 'Month' || 
		day == 'Day' || hour == 'Hour' || 
		message == '') {
		alert("Fill in all fields");
		return;
    }
    schedule_post(year, month, day, hour, minute, message, post_site);
}

function countNewPostChars() {
  if ($('#postOptionTwitter').is(':checked')) {
    var count = $(this).val().length,
        count_elem = $('#textCount');
    count_elem.text(count);
    if (count > 140) {
      count_elem.addClass('text-error');
    } else {
      count_elem.removeClass('text-error');
    }
  } else {
    $('#textCount').text('');
  }
}

