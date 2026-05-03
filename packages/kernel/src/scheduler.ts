import type { Task } from '@open-os/types'

const DEFAULT_PRIORITY = 5

function taskPriority(task: Task): number {
  return task.priority ?? DEFAULT_PRIORITY
}

/**
 * @description Min-heap priority queue: lower priority number dequeues first; ties broken by earlier createdAt.
 */
export class TaskScheduler {
  private readonly heap: Task[] = []

  size(): number {
    return this.heap.length
  }

  peek(): Task | undefined {
    return this.heap[0]
  }

  enqueue(task: Task): void {
    this.heap.push(task)
    this.siftUp(this.heap.length - 1)
  }

  dequeue(): Task | undefined {
    if (this.heap.length === 0) return undefined
    const root = this.heap[0]!
    const last = this.heap.pop()!
    if (this.heap.length > 0) {
      this.heap[0] = last
      this.siftDown(0)
    }
    return root
  }

  private better(a: Task, b: Task): boolean {
    const pa = taskPriority(a)
    const pb = taskPriority(b)
    if (pa !== pb) return pa < pb
    return a.createdAt.getTime() < b.createdAt.getTime()
  }

  private siftUp(i: number): void {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2)
      if (!this.better(this.heap[i]!, this.heap[p]!)) break
      this.swap(i, p)
      i = p
    }
  }

  private siftDown(i: number): void {
    const n = this.heap.length
    while (true) {
      const l = i * 2 + 1
      const r = i * 2 + 2
      let smallest = i
      if (l < n && this.better(this.heap[l]!, this.heap[smallest]!)) smallest = l
      if (r < n && this.better(this.heap[r]!, this.heap[smallest]!)) smallest = r
      if (smallest === i) break
      this.swap(i, smallest)
      i = smallest
    }
  }

  private swap(i: number, j: number): void {
    const t = this.heap[i]!
    this.heap[i] = this.heap[j]!
    this.heap[j] = t
  }
}

export { DEFAULT_PRIORITY }
