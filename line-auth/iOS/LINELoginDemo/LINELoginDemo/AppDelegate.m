//
//  AppDelegate.m
//  LINELoginDemo
//
//  Created by Khanh LeViet on 10/5/16.
//  Copyright (c) Google Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

#import "AppDelegate.h"
#import <LineAdapter/LineAdapter.h>
#import "Configs.h"
@import Firebase;

@interface AppDelegate ()

@end

@implementation AppDelegate


- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    // Validate if all customized configs has been properly done
    [self validateConfigs];
    
    // Initialize SDKs
    [LineAdapter handleLaunchOptions:launchOptions];
    [FIRApp configure];
    
    return YES;
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation {
    return [LineAdapter handleOpenURL:url];
}

- (BOOL)application:(UIApplication *)application handleOpenURL:(NSURL *)url {
    return [LineAdapter handleOpenURL:url];
}

- (void)validateConfigs {
    // Check if LINE SDK has been setup
    NSString *linePlistPath = [[NSBundle mainBundle] pathForResource:@"LineAdapter" ofType:@"plist"];
    NSDictionary *linePlist = [[NSDictionary alloc] initWithContentsOfFile:linePlistPath];
    BOOL isLineSetupFinished = ![linePlist[@"ChannelId"] isEqualToString:@"<your_channel_id>"];
    NSAssert(isLineSetupFinished, @"Please update your LINE Channel ID in LineAdapter.plist");
        
    // Check if LINE access token validation server has been setup
    BOOL isServerSetupFinished = ![kValidationServerDomain isEqualToString:@"<your_line_token_verification_server>"];
    NSAssert(isServerSetupFinished, @"Please set your validation server domain in Configs.h");
}

@end
