# Email Job Scheduler

A production-style Email Job Scheduler built with Node.js, Express, Prisma, PostgreSQL, and BullMQ.

## Rate Limiting Design (Phase 4)

This application uses Redis-backed distributed coordination to enforce rate limits across multiple worker processes or instances safely. It does not use in-memory counters, ensuring behavior remains identical regardless of how many Node.js clusters or containers are running.

### 1. Minimum Email Delay (`MIN_EMAIL_DELAY_MS`)
**Strategy**: Distributed Lock (`SET NX PX`)

To ensure we wait at least X milliseconds between sending any two emails for a given sender, we use a short-lived Redis lock.
- **Key**: `rate:delay:{senderId}`
- **Operation**: The worker attempts to acquire the lock using `SET rate:delay:{senderId} 1 PX 2000 NX`.
- **Result**: If the lock is acquired, it means no email was sent in the last 2000ms. The worker proceeds. If it is NOT acquired, the worker reads the remaining TTL of the lock, throws a BullMQ `DelayedError`, and puts the job back in the queue, delayed by the remaining TTL.

### 2. Hourly Rate Limit (`MAX_EMAILS_PER_HOUR_PER_SENDER`)
**Strategy**: Atomic Increment Counters (`INCR`)

To cap the total number of emails a sender can dispatch in an hour, we track the count using an hour-bucketed key.
- **Key**: `rate:hourly:{senderId}:{YYYY-MM-DDTHH}` (e.g., `rate:hourly:default-sender:2023-10-10T14`)
- **Operation**: The worker calls `INCR` on this key. If the result is 1, it also sets an `EXPIRE` of 3600 seconds.
- **Result**: If the incremented value exceeds `MAX_EMAILS_PER_HOUR_PER_SENDER`, the worker calculates the time remaining until the next hour begins. It throws a `DelayedError` to push the job to the start of the next hour. To preserve ordering and prevent a thundering herd at the start of the next hour, we add a slight stagger to the delay based on how far over the limit we went.

### Handling Race Conditions

In a distributed environment with `WORKER_CONCURRENCY=5`, multiple workers can pick up jobs for the same sender simultaneously.

**Race Condition 1: The Hourly Counter**
If two workers read the current counter at `2` (when max is 3), and then both increment it, they would reach `4`, violating the limit.
- **How we handle it**: We *never read before writing*. We use the atomic Redis `INCR` command. `INCR` returns the new value after incrementing. One worker will strictly receive `3` (and proceed), and the other will receive `4` (and get rescheduled).

**Race Condition 2: Simultaneous Rescheduling**
If 10 emails are scheduled simultaneously and the limit is 3, 7 workers will hit the hourly limit essentially at the same time. If they all reschedule strictly to `Date.now() + timeUntilNextHour`, they will all wake up at the exact same millisecond next hour, fight for the minimum delay lock, and thrash Redis.
- **How we handle it**: We use the `overage` count returned by `INCR` to stagger the delay. The 4th email gets rescheduled to `NextHour + 0ms`, the 5th to `NextHour + MIN_EMAIL_DELAY_MS`, the 6th to `NextHour + (2 * MIN_EMAIL_DELAY_MS)`, etc. This beautifully preserves chronological ordering *and* spreads out the CPU/Redis load for the next hour.
# Full-stack-Email-Job-Scheduler
