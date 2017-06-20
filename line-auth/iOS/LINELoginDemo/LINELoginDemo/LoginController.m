//
//  ViewController.m
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

#import "LoginController.h"
#import "LineAuthManager.h"
#import <GTMHTTPFetcher.h>
#import "HUDView.h"
@import Firebase;

@interface LoginController ()

@property (weak, nonatomic) IBOutlet UIButton *loginButton;
@property (weak, nonatomic) IBOutlet UIView *userView;
@property (weak, nonatomic) IBOutlet UILabel *displayNameLabel;
@property (weak, nonatomic) IBOutlet UIImageView *profilePictureView;
@property (weak, nonatomic) HUDView *hudView;

@property (nonatomic) FIRAuthStateDidChangeListenerHandle authStateChangeHandle;
@property (nonatomic) GTMHTTPFetcher *imageFetcher;
@property (nonatomic) BOOL isLoggingIn;

@end

@implementation LoginController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view, typically from a nib.
    
    self.isLoggingIn = NO;
    [self updateUIWithUser:[[FIRAuth auth] currentUser]];
}

- (IBAction)tappedLogin:(id)sender {
    // Prevent simultaneous call to LINE SDK
    if (self.isLoggingIn) return;
    
    // Start LINE Login...
    self.isLoggingIn = YES;
    self.hudView = [HUDView addHUDViewToView:self.view];
    
    __weak typeof(self) wSelf = self;
    [[LineAuthManager sharedInstance]
     startLINELoginWithTopViewController:self
     completionHandler:^(FIRUser * _Nullable user, NSError * _Nullable error) {
         if (error) {
             UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"Unable to login using LINE"
                                                                            message:nil
                                                                     preferredStyle:UIAlertControllerStyleAlert];
             [alert addAction:[UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleCancel handler:nil]];
             [wSelf presentViewController:alert animated:YES completion:nil];
             [wSelf updateUIWithUser:nil];
             
             NSLog(@"[LINE Login] Error: %@", error);
         } else {
             [wSelf updateUIWithUser:user];
         }
         wSelf.isLoggingIn = NO;
         [wSelf.hudView dismiss];
     }];
}


- (IBAction)tappedLogout:(id)sender {
    [[LineAuthManager sharedInstance] signOut];
    [self updateUIWithUser:nil];
}

#pragma mark - UIs
- (void)updateUIWithUser:(FIRUser *)user {
    if (user) {
        // Update views visibility
        self.loginButton.hidden = YES;
        self.userView.hidden = NO;
        
        // Update user profile
        self.displayNameLabel.text = user.displayName;
        if (user.photoURL) {
            [self.imageFetcher stopFetching];
            
            NSURLRequest *profilePhotoRequest = [NSURLRequest requestWithURL:user.photoURL];
            self.imageFetcher = [GTMHTTPFetcher fetcherWithRequest:profilePhotoRequest];
            self.imageFetcher.allowedInsecureSchemes = @[@"http"]; // As LINE deliver its profile image using http
            [self.imageFetcher beginFetchWithCompletionHandler:^(NSData *data, NSError *error) {
                if (!error) {
                    UIImage *image = [UIImage imageWithData:data];
                    self.profilePictureView.image = image;
                }
            }];
        }
    } else {
        self.loginButton.hidden = NO;
        self.userView.hidden = YES;
    }
}

@end
