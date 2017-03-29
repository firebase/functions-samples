/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.firebase.linelogindemo.util;

import android.app.Activity;
import android.content.Context;
import android.support.annotation.NonNull;
import android.util.Log;

import com.android.volley.Request;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.google.android.gms.tasks.Continuation;
import com.google.android.gms.tasks.Task;
import com.google.android.gms.tasks.TaskCompletionSource;
import com.google.firebase.auth.AuthResult;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.linelogindemo.R;

import org.json.JSONObject;

import java.util.HashMap;

import jp.line.android.sdk.LineSdkContext;
import jp.line.android.sdk.LineSdkContextManager;
import jp.line.android.sdk.exception.LineSdkLoginException;
import jp.line.android.sdk.login.LineAuthManager;
import jp.line.android.sdk.login.LineLoginFuture;
import jp.line.android.sdk.login.LineLoginFutureListener;

public class LineLoginHelper {

    private String mLineAcessscodeVerificationEndpoint;
    private static final String TAG = LineLoginHelper.class.getSimpleName();

    private Activity mActivity;

    public LineLoginHelper(Activity activity) {
        mActivity = activity;
        mLineAcessscodeVerificationEndpoint =
                activity.getString(R.string.validation_server_domain) + "/verifyToken";
    }

    public Task<AuthResult> startLineLogin() {

        /**
         * Use Tasks API to chain 3 login steps together
         * Refer to this blog post for more details about Tasks API:
         *   https://firebase.googleblog.com/2016/09/become-a-firebase-taskmaster-part-1.html
        **/

        Task<AuthResult> combinedTask =
                // STEP 1: User logins with LINE and get their LINE access token
                getLineAccessCode(mActivity)
                .continueWithTask(new Continuation<String, Task<String>>() {
                    @Override
                    public Task<String> then(@NonNull Task<String> task) throws Exception {
                        // STEP 2: Exchange LINE access token for Firebase Custom Auth token
                        String lineAccessCode = task.getResult();
                        return getFirebaseAuthToken(mActivity, lineAccessCode);
                    }
                })
                .continueWithTask(new Continuation<String, Task<AuthResult>>() {
                    @Override
                    public Task<AuthResult> then(@NonNull Task<String> task) throws Exception {
                        // STEP 3: Use Firebase Custom Auth token to login Firebase
                        String firebaseToken = task.getResult();
                        FirebaseAuth auth = FirebaseAuth.getInstance();
                        return auth.signInWithCustomToken(firebaseToken);
                    }
                });

        return combinedTask;
    }

    private Task<String> getLineAccessCode(final Activity activity) {
        final TaskCompletionSource<String> source = new TaskCompletionSource<>();

        // STEP 1: User logins with LINE and get their LINE access token
        LineSdkContext sdkContext = LineSdkContextManager.getSdkContext();
        LineAuthManager authManager = sdkContext.getAuthManager();
        LineLoginFuture loginFuture = authManager.login(activity);
        loginFuture.addFutureListener(new LineLoginFutureListener() {
            @Override
            public void loginComplete(LineLoginFuture future) {
                switch(future.getProgress()) {
                    case SUCCESS: //Login successfully
                        String lineAccessToken = future.getAccessToken().accessToken;
                        Log.d(TAG, "LINE Access token = " + lineAccessToken);
                        source.setResult(lineAccessToken);
                        break;
                    case CANCELED: // Login canceled by user
                        Exception e = new Exception("User cancelled LINE Login.");
                        source.setException(e);
                        break;
                    default: // Error
                        Throwable cause = future.getCause();
                        if (cause instanceof LineSdkLoginException) {
                            LineSdkLoginException loginException = (LineSdkLoginException) cause;
                            Log.e(TAG, loginException.getMessage());
                            source.setException(loginException);
                        } else {
                            source.setException(new Exception("Unknown error occurred in LINE SDK."));
                        }
                        break;
                }
            }
        });

        return source.getTask();
    }

    private Task<String> getFirebaseAuthToken(Context context, final String lineAccessToken) {
        final TaskCompletionSource<String> source = new TaskCompletionSource<>();

        // STEP 2: Exchange LINE access token for Firebase Custom Auth token
        HashMap<String, String> validationObject = new HashMap<>();
        validationObject.put("token", lineAccessToken);

        // Exchange LINE Access Token for Firebase Auth Token
        Response.Listener<JSONObject> responseListener = new Response.Listener<JSONObject>() {
            @Override
            public void onResponse(JSONObject response) {
                try {
                    String firebaseToken = response.getString("firebase_token");
                    Log.d(TAG, "Firebase Token = " + firebaseToken);
                    source.setResult(firebaseToken);
                } catch (Exception e) {
                    source.setException(e);
                }
            }
        };

        Response.ErrorListener errorListener = new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                Log.e(TAG, error.toString());
                source.setException(error);
            }
        };

        JsonObjectRequest fbTokenRequest = new JsonObjectRequest(
                Request.Method.POST, mLineAcessscodeVerificationEndpoint,
                new JSONObject(validationObject),
                responseListener, errorListener);

        NetworkSingleton.getInstance(context).addToRequestQueue(fbTokenRequest);

        return source.getTask();
    }

    public void signOut() {
        FirebaseAuth.getInstance().signOut();
        LineSdkContextManager.getSdkContext().getAuthManager().logout();
    }

}
