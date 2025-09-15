import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../stores/authStore';

WebBrowser.maybeCompleteAuthSession();

export class GoogleAuthService {
  private static getRedirectUri() {
    // Always use the exact scheme from app.json to avoid mismatches
    const CUSTOM_SCHEME = 'com.jamescarillo.nutrivision://login-callback';
    
    let redirectTo;
    
    if (Platform.OS === 'web') {
      // On web, use current origin + callback path
      redirectTo = `${window.location.origin}/login-callback`;
    } else {
      // On native platforms, ALWAYS use our exact custom scheme
      // This prevents any makeRedirectUri issues that could generate "myapp://"
      redirectTo = CUSTOM_SCHEME;
    }
    
    console.log('🔗 Using redirect URI:', redirectTo);
    console.log('🔧 Platform:', Platform.OS);
    console.log('🏗️ Environment:', __DEV__ ? 'development' : 'production');
    console.log('📱 Expected scheme should match app.json:', 'com.jamescarillo.nutrivision');
    
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
    }
    
    return data;
  }

  static async signInWithGoogle() {
    try {
      const redirectUri = this.getRedirectUri();
      
      console.log('🚀 Starting Google OAuth with redirect:', redirectUri);
      
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
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      
      console.log('📱 OAuth result:', result.type);
      
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
