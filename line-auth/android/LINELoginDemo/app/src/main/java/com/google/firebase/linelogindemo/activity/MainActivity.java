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

package com.google.firebase.linelogindemo.activity;

import android.app.ProgressDialog;
import android.support.annotation.NonNull;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.android.volley.toolbox.ImageLoader;
import com.android.volley.toolbox.NetworkImageView;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.AuthResult;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.linelogindemo.R;
import com.google.firebase.linelogindemo.util.LineLoginHelper;
import com.google.firebase.linelogindemo.util.NetworkSingleton;

public class MainActivity extends AppCompatActivity {

    // Views
    private Button mLineLoginButton;
    private View mLoggedInView;
    private TextView mDisplayNameText;
    private NetworkImageView mProfileImageView;

    // Helpers
    private ImageLoader mImageLoader;
    private LineLoginHelper mLineLoginHelper;
    private ProgressDialog mLoadingDialog;

    private static final String TAG = MainActivity.class.getSimpleName();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        bindUIElements();

        mImageLoader = NetworkSingleton.getInstance(this).getImageLoader();
        mLineLoginHelper = new LineLoginHelper(this);
        updateUI();
    }

    private void bindUIElements() {
        // Bind views
        mLineLoginButton = (Button) findViewById(R.id.line_login_button);
        mLoggedInView = (View) findViewById(R.id.logged_in_view);
        mDisplayNameText = (TextView) findViewById(R.id.display_name_text);
        mProfileImageView = (NetworkImageView) findViewById(R.id.profile_image_view);

        // Bind buttons' OnClickListener
        mLineLoginButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                onTapLineLogin();
            }
        });
        Button logoutButton = (Button) findViewById(R.id.logout_button);
        logoutButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                onTapLogout();
            }
        });
    }

    void onTapLineLogin() {
        // Show loading dialog
        mLoadingDialog = new ProgressDialog(this);
        mLoadingDialog.setMessage(getString(R.string.logging_in_using_line));
        mLoadingDialog.setCancelable(false);
        mLoadingDialog.show();

        // Kick start login progress
        mLineLoginHelper
                .startLineLogin()
                .addOnCompleteListener(new OnCompleteListener<AuthResult>() {
                    @Override
                    public void onComplete(@NonNull Task<AuthResult> task) {
                        updateUI();
                        mLoadingDialog.dismiss();
                        mLoadingDialog = null;

                        if (task.isSuccessful()) {
                            Log.d(TAG, "LINE Login was successful.");
                        } else {
                            Log.e(TAG, "LINE Login failed. Error = " + task.getException().getLocalizedMessage());
                            new AlertDialog.Builder(MainActivity.this)
                                    .setMessage(R.string.login_failed)
                                    .setNegativeButton(android.R.string.no, null)
                                    .setIcon(android.R.drawable.ic_dialog_alert)
                                    .show();
                        }
                    }
                });
    }

    void onTapLogout() {
        mLineLoginHelper.signOut();
        updateUI();
    }

    private void updateUI() {
        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();

        if (user == null) {
            mLineLoginButton.setVisibility(View.VISIBLE);
            mLoggedInView.setVisibility(View.INVISIBLE);
        } else {
            Log.d(TAG, "UID = " + user.getUid());
            Log.d(TAG, "Provider ID = " + user.getProviderId());

            mLineLoginButton.setVisibility(View.INVISIBLE);
            mLoggedInView.setVisibility(View.VISIBLE);

            mDisplayNameText.setText(user.getDisplayName());
            if (user.getPhotoUrl() != null) {
                mProfileImageView.setImageUrl(user.getPhotoUrl().toString(), mImageLoader);
            }

        }
    }

    @Override
    protected void onStop() {
        super.onStop();

        // Dismiss loading dialog to avoid
        if (mLoadingDialog != null) {
            mLoadingDialog.dismiss();
        }
    }
}
