/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for t`he specific language governing permissions and
 * limitations under the License.
 */
'use strict';

import Link from 'next/link';

export default ({ pathname }) =>
  <header>
    <Link href="/">
      <a className={pathname === '/' && 'is-active'}>Home</a>
    </Link>{' '}
    <Link href="/about">
      <a className={pathname === '/about' && 'is-active'}>About</a>
    </Link>
  </header>;
