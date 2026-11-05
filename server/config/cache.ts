import { redisClient } from "./redis";

export function tasksCacheKey(userId: string): string {
  return `tasks:user:${encodeURIComponent(userId)}`;
}

export async function getCachedTasks(userId: string): Promise<unknown | null> {
  if (!redisClient.isReady) return null;
  const value = await redisClient.get(tasksCacheKey(userId));
  if (value === null) return null;

  return JSON.parse(value) as unknown;
}

export async function setCachedTasks(
  userId: string,
  tasks: unknown,
  ttlSeconds: number
): Promise<void> {
  if (!redisClient.isReady) return;
  await redisClient.set(tasksCacheKey(userId), JSON.stringify(tasks), {
    EX: ttlSeconds,
  });
}

export async function invalidateTasksCache(userId: string): Promise<void> {
  if (!redisClient.isReady) return;
  await redisClient.del(tasksCacheKey(userId));
}
