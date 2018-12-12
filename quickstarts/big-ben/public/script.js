/**
 * Copyright 2018 Google Inc. All Rights Reserved.
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
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function refresh(_this) {
  // Disable the button and remove current BONGS text.
  _this.disabled = true;
  document.getElementById('bongs').innerHTML = '...';

  // Prepare an ajax request to use the API to get the current BONGS from the API.
  var request = new XMLHttpRequest();
  request.onreadystatechange = function() {
    if (request.readyState === 4) {
      // Re-enable the button.
      _this.disabled = false;
      var bongsContainer = document.getElementById('bongs');
      if (request.status === 200) {
        // Replace the BONG text with the response from the API.
        bongsContainer.innerHTML = JSON.parse(request.responseText).bongs;
      } else {
        bongsContainer.innerHTML = 'An error occurred during your request: ' +  request.status + ' ' + request.statusText;
      }
    }
  }
  request.open('Get', '/api');

  // Start the ajax request.
  request.send();
}
