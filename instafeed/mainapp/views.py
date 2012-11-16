from django.http import HttpResponse
from django.shortcuts import render, redirect
from emailusernames.forms import EmailUserCreationForm, EmailAuthenticationForm
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from django.contrib.sessions.models import Session
import twitter_api, facebook_api, json
from facebook_views import facebook_request, facebook_upload, facebook_feed_request, facebook_signin
from models import TwitterAccount, FacebookAccount, Account


def feed(request):
  return render(request, 'Feed.html')

def index(request):
  # Just trying... if cookies are set, then we can just redirect them to feed page
  sid = request.COOKIES.get('sessionid', None)
  uid = request.COOKIES.get('uid', None)
  # TODO also check expiration date/time
  if sid is None or uid is None:
    return signin(request)
  else:
    return feed(request)

def signup(request):
  if request.method == 'POST':
    form = EmailUserCreationForm(request.POST)
    if form.is_valid():
      message = None

      email = form.clean_email()
      password = form.clean_password2()
      form.save()

      user = authenticate(email=email, password=password)
      if (user is not None) and (user.is_active):
        login(request, user)
        message = "Registration successful"
      else:
        message = "There was an error automatically logging you in. Try <a href=\"/index/\">logging in</a> manually."

      # Since user does not have any accounts by the time they signe in,
      # we should redirect them to accounts page instead of feed page.
      return redirect('/accounts/')

  else:
    form = EmailUserCreationForm()

  return render(request, 'signup.html', {'form': form})

def signin(request):
  if request.method == 'POST':
    email = request.POST['email']
    password = request.POST['password']
    user = authenticate(email=email, password=password)

    if (user is not None) and (user.is_active):
      login(request, user)
      facebook_account = FacebookAccount.get_account(request_id=request.user.id)
      twitter_account = TwitterAccount.get_account(request_id=request.user.id)
      if facebook_account is None and twitter_account is None:
        return redirect('/accounts/')
      else:
        return redirect('/feed/', {'username': email})
    else:
      form = EmailAuthenticationForm()
      form.non_field_errors = 'Your email and password were incorrect.'
      return render(request, 'index.html', {'form': form})
  else:
    form = EmailAuthenticationForm()

  return render(request, 'index.html', {'form': form})

def faq_request(request):
  return render(request, 'FAQ.html')

def accounts(request):
  return render(request, 'Accounts.html')

#Tag needed for ajax call. May need to take this out later to protect from attacks(?)
@csrf_exempt
def twitter_request(request):
  one_user = TwitterAccount.get_account(request_id=request.user.id)
  if one_user is None:
    return_dict = {'success': 'false'}
    return_json = json.dumps(return_dict)
    return HttpResponse(return_json)
  request_json = request.POST
  if request_json.get('type') == 'upload':
    twitter_api.twitter_post(one_user.access_token, one_user.access_secret, request_json.get('message'))
    return_dict = {'success': 'true'}
    return_post_json = json.dumps(return_dict)
    return HttpResponse(return_post_json)
  elif request_json.get('type') == 'feedRequest':
    #get stuff from twitter
    twitter_post = twitter_api.twitter_home_timeline(one_user.access_token, one_user.access_secret, 10)
    return_dict = {'tweets': twitter_post}
    return_tweets_json = json.dumps(return_dict)
    return HttpResponse(return_tweets_json)
  else:
    return HttpResponse("failure")


@csrf_exempt
def twitter_signin(request):
  t = twitter_api.twitter_authentication_url()
  request.session['request_token'] = t[1]
  request.session['request_secret'] = t[2]
  return HttpResponse(t[0])

#need to test this
def twitter_callback(request):
  verifier = request.GET.get('oauth_verifier')
  token_info = twitter_api.twitter_authenticate(verifier, request.session['request_token'], request.session['request_secret'])
  user = request.user
  if user:
    twitter_account = TwitterAccount(user_id=user, access_token=token_info[0], access_secret=token_info[1])
    twitter_account.save()
  return accounts(request)
