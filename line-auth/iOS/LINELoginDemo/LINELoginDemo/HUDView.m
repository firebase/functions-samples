//
//  HUDView.m
//  LINELoginDemo
//
//  Created by Khanh LeViet on 10/7/16.
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

#import "HUDView.h"


static const CGFloat kLoadingViewSize = 80;
static const CGFloat kLoadingViewCornerRadius = 6.0;

@implementation HUDView

+ (instancetype)addHUDViewToView:(UIView *)view {
    HUDView *hud = [[HUDView alloc] init];
    
    UIView *loadingView = [self loadingView];
    [hud addSubview:loadingView];
    hud.frame = view.bounds;
    loadingView.center = hud.center;
    [view addSubview:hud];
    [view bringSubviewToFront:hud];
    
    return hud;
}

- (void)dismiss {
    [self removeFromSuperview];
}

+ (UIView *)loadingView {
    // Create gray square in the centre
    CGRect fullFrame = CGRectMake(0, 0, kLoadingViewSize, kLoadingViewSize);
    UIView *view = [[UIView alloc] initWithFrame:fullFrame];
    view.layer.cornerRadius = kLoadingViewCornerRadius;
    view.backgroundColor = [UIColor grayColor];
    
    // Create a spinner
    UIActivityIndicatorView *spinner = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
    [view addSubview:spinner];
    [spinner startAnimating];
    spinner.center = CGPointMake(kLoadingViewSize * 0.5, kLoadingViewSize * 0.5);
    
    return view;
}

@end
