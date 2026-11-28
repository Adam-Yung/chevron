import { describe, it, expect } from 'vitest'
import { replaceAt, patchAt, removeAt, swapAt } from './listOps'

describe('listOps', () => {
  const list = [{ a: 1 }, { a: 2 }]

  it('edits one position and leaves the input alone', () => {
    expect(replaceAt([1, 2], 1, 9)).toEqual([1, 9])
    expect(patchAt(list, 0, { b: 3 })).toEqual([{ a: 1, b: 3 }, { a: 2 }])
    expect(removeAt(list, 0)).toEqual([{ a: 2 }])
    expect(swapAt(list, 0, 1)).toEqual([{ a: 2 }, { a: 1 }])
    expect(list).toEqual([{ a: 1 }, { a: 2 }])
  })
})
