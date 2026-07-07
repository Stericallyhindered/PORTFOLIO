# Bass Clown Co API Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the Bass Clown Co platform.

## Authentication

Most API endpoints require authentication. Include the session cookie or authorization token in your requests.

### Admin Endpoints

All admin endpoints require admin role. Use `requireAdmin()` check.

## API Endpoints

### Admin APIs

#### `/api/admin/analytics`
- **GET**: Get platform-wide analytics
- Returns: Analytics data including users, contests, giveaways, revenue

#### `/api/admin/audit-logs`
- **GET**: Get audit logs with filtering
- Query params: `userId`, `action`, `resourceType`, `resourceId`, `startDate`, `endDate`, `limit`, `offset`

#### `/api/admin/backups`
- **GET**: List all backups
- **POST**: Create a new backup
- Body: `{ type: 'full' | 'incremental', description?: string, compressionEnabled?: boolean }`

#### `/api/admin/backups/[backupId]/restore`
- **POST**: Restore from backup
- Body: `{ restoreType: 'full' | 'schema_only' | 'data_only', validateBeforeRestore: boolean, createBackupBeforeRestore: boolean }`

#### `/api/admin/migrations`
- **GET**: Get migration status
- **POST**: Run pending migrations

#### `/api/admin/migrations/[version]/rollback`
- **POST**: Rollback a specific migration

#### `/api/admin/refunds`
- **GET**: List all refunds
- **POST**: Create a refund
- Body: `{ paymentIntentId?: string, chargeId?: string, amount?: number, reason?: string, reasonDescription?: string, userId?: string }`

#### `/api/admin/refunds/[refundId]`
- **GET**: Get specific refund details
- **POST**: Cancel a pending refund

### User APIs

#### `/api/users/data-export`
- **GET**: Export all user data (GDPR compliance)
- Returns: JSON export of all user data

#### `/api/users/data-deletion`
- **POST**: Request account data deletion (GDPR compliance)
- Body: `{ reason?: string, confirm: true }`

### Brand APIs

#### `/api/brand/analytics`
- **GET**: Get brand-specific analytics
- Query params: `period` (7, 30, 90, 365)

#### `/api/brand/collaborations`
- **GET**: Get brand collaborations
- **POST**: Create a new collaboration proposal
- Body: Collaboration proposal data

#### `/api/brand/collaborations/proposals`
- **GET**: Get collaboration proposals
- Query params: `status`, `role` ('brand' | 'creator')

#### `/api/brand/collaborations/proposals/[id]`
- **GET**: Get specific proposal
- **POST**: Send proposal to creator
- **PATCH**: Respond to proposal (accept/reject/negotiate)

### Contest APIs

#### `/api/contests`
- **GET**: List contests with pagination and filtering
- **POST**: Create contest (admin only)
- Query params: `page`, `limit`, `status`, `category`, `sort`

#### `/api/contests/[id]`
- **GET**: Get contest details

#### `/api/contests/[id]/apply`
- **POST**: Apply to contest

#### `/api/contests/[id]/submit`
- **POST**: Submit entry to contest

#### `/api/contests/[id]/judge/collaborative`
- **GET**: Get collaborative judging sessions
- **POST**: Create collaborative judging session

### Giveaway APIs

#### `/api/giveaways`
- **GET**: List giveaways
- **POST**: Create giveaway (admin only)

#### `/api/giveaways/[id]/enter`
- **GET**: Get user entry status
- **POST**: Enter giveaway

### Media Kit APIs

#### `/api/media-kits`
- **GET**: Get user's media kits
- **POST**: Create new media kit

#### `/api/media-kits/[id]/generate-pdf`
- **POST**: Generate PDF of media kit

### Dropbox Sync APIs

#### `/api/dropbox/sync`
- **GET**: Get sync status
- **POST**: Start Dropbox sync
- Body: `{ accessToken, clientId, clientSecret, refreshToken?, syncPaths?, excludePatterns?, maxFileSize?, allowedFileTypes? }`

### W9 Form APIs

#### `/api/w9-forms`
- **GET**: Get user's W9 forms
- **POST**: Submit W9 form

#### `/api/w9-forms/[id]/submit`
- **POST**: Submit W9 form data

## Error Responses

All API endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Success Responses

All API endpoints return standardized success responses:

```json
{
  "success": true,
  "message": "Success message",
  "data": { /* response data */ }
}
```

## Rate Limiting

API endpoints are rate-limited to 100 requests per minute per IP address.

## Security

- All API routes require authentication (except public endpoints)
- Admin routes require admin role
- Input validation using Zod schemas
- SQL injection protection via Drizzle ORM
- XSS protection via Content Security Policy

