/// Firestore constants for the `users` collection.
///
/// Hierarchy: `users` (collection) -> {userId} (document) -> `count` (field)
const usersCollection = 'users';
const countField = 'count';

/// Firestore constants for the `global` collection.
///
/// Hierarchy: `global` (collection) -> `vars` (document) ->
/// `totalCount`, `totalUsers` (fields)
const globalCollection = 'global';
const varsDocument = 'vars';
const totalCountField = 'totalCount';
const totalUsersField = 'totalUsers';

/// HTTPS Callable function names.
const incrementCallable = 'increment';
