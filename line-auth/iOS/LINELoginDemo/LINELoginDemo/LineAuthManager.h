//
//  LineAuthManager.h
//  LINELoginDemo
//
//  Created by Khanh LeViet on 10/6/16.
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

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
@import FirebaseAuth;

@interface LineAuthManager : NSObject

+ (nonnull instancetype)sharedInstance;

- (void)startLINELoginWithTopViewController:(UIViewController *_Nonnull)viewController
                          completionHandler:(nullable FIRAuthResultCallback) callback;

- (void)signOut;

@end
