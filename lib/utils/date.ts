// created_at from the API is UTC but has no timezone suffix, so new Date() would
// parse it as local time and inflate the timestamp by the UTC offset. Append "Z" to
// force UTC parsing; activity-map values already carry "Z".
export const toUtcMs = (ts: string | number): number =>
  typeof ts === "string" && !ts.endsWith("Z")
    ? new Date(ts + "Z").getTime()
    : new Date(ts).getTime();
