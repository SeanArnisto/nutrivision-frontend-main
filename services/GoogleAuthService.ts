import * as WebBrowser from 'expo-web-browser';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../stores/authStore';

WebBrowser.maybeCompleteAuthSession();

export class GoogleAuthService {
  private static getRedirectUri() {
    // COMPLETELY bypass makeRedirectUri - use exact scheme from app.json
    const EXACT_REDIRECT_URI = 'com.jamescarillo.nutrivision://login-callback';
    
    let redirectTo;
    
    if (Platform.OS === 'web') {
      // On web, use current origin + callback path
      redirectTo = `${window.location.origin}/login-callback`;
      console.log('🌐 Web redirect URI:', redirectTo);
    } else {
      // On native, FORCE our exact URI - no dynamic generation
      redirectTo = EXACT_REDIRECT_URI;
      console.log('📱 Native redirect URI (hardcoded):', redirectTo);
    }
    
    console.log('🔗 Final redirect URI being sent to Supabase:', redirectTo);
    console.log('🔧 Platform:', Platform.OS);
    console.log('🏗️ Environment:', __DEV__ ? 'development' : 'production');
    
    // Double-check: if somehow "myapp" appears, log error
    if (redirectTo.includes('myapp')) {
      console.error('❌ ERROR: myapp scheme detected! Expected: com.jamescarillo.nutrivision');
      console.error('❌ Actual URI:', redirectTo);
      // Force correct scheme
      redirectTo = EXACT_REDIRECT_URI;
      console.log('✅ Forced correct URI:', redirectTo);
    }
    
    return redirectTo;
  }

  private static async handleUrlForSession(url: string) {
    console.log('🔄 Processing OAuth callback URL:', url);
    
    const { params, errorCode } = QueryParams.getQueryParams(url);
    if (errorCode) {
      console.error('❌ OAuth Error:', errorCode);
      throw new Error(`OAuth Error: ${errorCode}`);
    }
    
    const { access_token, refresh_token } = params;
    if (!access_token) {
      console.error('❌ No access token returned!');
      throw new Error('No access token returned from OAuth provider');
    }
    
    console.log('✅ Tokens received, setting session...');
    
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    
    if (error) {
      console.error('❌ Session error:', error);
      throw error;
    }
    
    console.log('✅ Google OAuth session established!', data.session?.user?.email);
    
    // Update the auth store with the new session
    if (data.session) {
      useAuthStore.getState().setSession(data.session);
      
      // For Google OAuth users, immediately check profile completion
      console.log('🔄 Checking profile completion for Google user...');
      await useAuthStore.getState().checkProfileComplete();
      
      const profileComplete = useAuthStore.getState().profileComplete;
      console.log('📋 Profile complete status:', profileComplete);
      
      if (profileComplete === false) {
        console.log('👤 New Google user detected - will redirect to onboarding');
      } else {
        console.log('👤 Existing Google user detected - will redirect to main app');
      }
    }
    
    return data;
  }

  static async signInWithGoogle() {
    try {
      const redirectUri = this.getRedirectUri();
      
      console.log('🚀 Starting Google OAuth with redirect:', redirectUri);
      console.log('🔍 DEBUG: Redirect URI type:', typeof redirectUri);
      console.log('🔍 DEBUG: Redirect URI length:', redirectUri.length);
      
      // Double-check the URI being sent to Supabase
      if (redirectUri.includes('myapp')) {
        console.error('🚨 CRITICAL ERROR: myapp detected in redirect URI!');
        console.error('🚨 This should never happen with our hardcoded scheme');
        throw new Error('Invalid redirect URI detected');
      }
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });
      
      if (error) {
        console.error('❌ Start OAuth error:', error);
        throw error;
      }
      
      const authUrl = data.url;
      if (!authUrl) {
        throw new Error('No auth URL returned from Supabase');
      }
      
      console.log('🌐 Opening OAuth URL:', authUrl);
      console.log('🔍 DEBUG: Auth URL contains redirect_uri:', authUrl.includes('redirect_uri'));
      
      // Log the actual redirect URI in the auth URL
      const urlParams = new URLSearchParams(authUrl.split('?')[1]);
      const extractedRedirectUri = urlParams.get('redirect_uri');
      console.log('🔍 DEBUG: Extracted redirect_uri from auth URL:', extractedRedirectUri);
      
      if (extractedRedirectUri && extractedRedirectUri.includes('myapp')) {
        console.error('🚨 PROBLEM FOUND: Supabase is using myapp scheme!');
        console.error('🚨 Expected:', redirectUri);
        console.error('🚨 Actual:', extractedRedirectUri);
      }
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      
      console.log('📱 OAuth result:', result.type);
      console.log('🔍 DEBUG: Result URL if success:', result.type === 'success' ? result.url : 'N/A');
      
      if (result.type === 'success' && result.url) {
        console.log('✅ OAuth success, processing callback...');
        const sessionData = await this.handleUrlForSession(result.url);
        return { data: sessionData, error: null };
      } else if (result.type === 'cancel') {
        console.log('🚫 User cancelled Google sign-in');
        return { data: null, error: { message: 'User cancelled Google sign-in' } };
      } else {
        console.log('❓ OAuth not completed:', result);
        return { data: null, error: { message: 'Google sign-in was not completed' } };
      }
    } catch (error: any) {
      console.error('💥 Google OAuth error:', error);
      return { data: null, error: { message: error.message || 'Google sign-in failed' } };
    }
  }

  static async signUpWithGoogle() {
    // For OAuth, sign up and sign in are essentially the same process
    // Supabase will create a new user if they don't exist, or sign in if they do
    return this.signInWithGoogle();
  }
}
