/**
 * Worker entrypoint. Job processors are added only with their owning domain,
 * preventing request handlers from performing expensive AI work synchronously.
 */
console.info('Placement Mentor worker is ready for registered queues.');
