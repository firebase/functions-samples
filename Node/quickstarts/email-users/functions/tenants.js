/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

// [START multitenancy]
// [START multitenancyImports]
const { onUserCreated, IS_NOT_TENANT } = require("firebase-functions/identity");
// [END multitenancyImports]
const { defineSecret } = require("firebase-functions/params");
const { sendWelcomeEmail } = require("./utils/myEmailService");

const emailApiKey = defineSecret("EMAIL_API_KEY");

// [START sendWelcomeEmailToTenant]
/**
 * Sends a welcome email scoped to a specific tenant in Identity Platform.
 */
// [START sendWelcomeEmailToTenantTrigger]
exports.sendWelcomeEmailToTenant = onUserCreated(
  {
    secrets: [emailApiKey],
    // Only trigger when a user is a member of this tenant
    tenantId: "my-tenant-id",
  },
  async (event) => {
    // [END sendWelcomeEmailToTenantTrigger]
    const { uid, email, displayName } = event.data;
    // Customize the email for this tenant
    await sendWelcomeEmail(email, displayName, event.tenantId);
  },
);
// [END sendWelcomeEmailToTenant]

// [START sendWelcomeEmailNoTenant]
/**
 * Sends a welcome email only to users not associated with any tenant.
 */
// [START sendWelcomeEmailNoTenantTrigger]
exports.sendWelcomeEmailNoTenant = onUserCreated(
  {
    secrets: [emailApiKey],
    // Only trigger when a user is NOT a member of a tenant
    tenantId: IS_NOT_TENANT,
  },
  async (event) => {
    // [END sendWelcomeEmailNoTenantTrigger]
    const { email, displayName } = event.data;

    // Send a generic welcome email
    await sendWelcomeEmail(email, displayName);
  },
);
// [END sendWelcomeEmailNoTenant]
// [END multitenancy]
