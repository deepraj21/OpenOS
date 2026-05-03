import { describe, expect, it } from 'vitest'
import type { Task } from '@open-os/types'
import { TaskScheduler } from './scheduler.js'

function task(id: string, priority: number, t = 0): Task {
  return {
    id,
    agentId: 'a',
    input: 'x',
    priority,
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, t)),
  }
}

describe('TaskScheduler', () => {
  it('dequeues lower priority number first', () => {
    const s = new TaskScheduler()
    s.enqueue(task('low', 10, 0))
    s.enqueue(task('high', 1, 1))
    s.enqueue(task('mid', 5, 2))
    expect(s.dequeue()?.id).toBe('high')
    expect(s.dequeue()?.id).toBe('mid')
    expect(s.dequeue()?.id).toBe('low')
    expect(s.dequeue()).toBeUndefined()
  })

  it('ties break on earlier createdAt', () => {
    const s = new TaskScheduler()
    s.enqueue(task('second', 3, 2))
    s.enqueue(task('first', 3, 1))
    expect(s.dequeue()?.id).toBe('first')
    expect(s.dequeue()?.id).toBe('second')
  })

  it('peek returns next without removing', () => {
    const s = new TaskScheduler()
    s.enqueue(task('a', 2))
    expect(s.peek()?.id).toBe('a')
    expect(s.size()).toBe(1)
  })
})
