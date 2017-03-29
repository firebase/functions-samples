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

package com.google.firebase.linelogindemo;

import android.app.Application;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;

import jp.line.android.sdk.LineSdkContextManager;

public class LineLoginDemoApp extends Application {

    @Override
    public void onCreate() {
        super.onCreate();

        verifyConfiguration();
        LineSdkContextManager.initialize(this);
    }

    private void verifyConfiguration() {
        // Verify if LINE SDK has been setup
        try {
            ApplicationInfo applicationInfo = getPackageManager().getApplicationInfo(getPackageName(), PackageManager.GET_META_DATA);
            Bundle bundle = applicationInfo.metaData;
            Integer lineChannelIdInt = bundle.getInt("jp.line.sdk.ChannelId");
            String lineChannelIdStr = bundle.getString("jp.line.sdk.ChannelId");
            String lineAuthScheme = bundle.getString("jp.line.sdk.AuthScheme");

            if (lineChannelIdInt.intValue() == 0)
                if (lineAuthScheme.contains("<your_channel_id>") ||
                        lineChannelIdStr.contains("<your_channel_id>")) {
                    throw new IllegalStateException();
                }
        } catch (Exception e) {
            throw new IllegalStateException("Please update <your_channel_id> in app/build.gradle with your LINE Channel ID");
        }

        // Verify if validation server URL has been setup
        if (getString(R.string.validation_server_domain).contentEquals("your_line_token_verification_server")) {
            throw new IllegalStateException("Please set your validation server domain in res/configs.xml");
        }
    }
}
