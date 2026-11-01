import { test } from '@japa/runner'

import { User } from './user.entity.ts'

const NOW = new Date('2026-10-29T12:00:00Z')
const LATER = new Date('2026-10-30T12:00:00Z')
const PROVED = { currentConfirmed: true, sameAsCurrent: false }

function operator(): User {
  return User.create({
    id: 'id',
    name: 'Ana',
    email: 'ana@mail.com',
    password: 'Senha@123',
    role: 'OPERATOR',
    now: NOW,
  })
}

test.group('User', () => {
  test('is born active and without avatar', ({ assert }) => {
    assert.deepInclude(operator().snapshot(), { status: 'ACTIVE', avatarId: null, createdAt: NOW })
  })

  test('only an active account gets in', ({ assert }) => {
    const active = operator()
    const inactive = operator()
    inactive.update({ status: 'INACTIVE' }, NOW)

    assert.isTrue(active.canSignIn())
    assert.isFalse(inactive.canSignIn())
  })

  test('changing e-mail, password, role or deactivating drops the sessions; name does not', ({
    assert,
  }) => {
    assert.isTrue(operator().update({ email: 'outra@mail.com' }, LATER).revokesSessions)
    assert.isTrue(operator().update({ password: 'Nova@1234' }, LATER).revokesSessions)
    assert.isTrue(operator().update({ role: 'ADMINISTRATOR' }, LATER).revokesSessions)
    assert.isTrue(operator().update({ status: 'INACTIVE' }, LATER).revokesSessions)
    assert.isFalse(operator().update({ name: 'Ana Maria' }, LATER).revokesSessions)
    assert.isFalse(
      operator().update({ email: 'ana@mail.com', role: 'OPERATOR' }, LATER).revokesSessions,
    )
  })

  test('an absent field leaves alone and avatarId null removes the photo', ({ assert }) => {
    const user = operator()
    user.update({ avatarId: 'foto' }, NOW)

    user.update({ name: 'Ana Maria' }, LATER)
    assert.deepInclude(user.snapshot(), { name: 'Ana Maria', avatarId: 'foto', updatedAt: LATER })

    user.update({ avatarId: null }, LATER)
    assert.isNull(user.snapshot().avatarId)
  })

  test('the account itself changes the password only with the current one confirmed and a different one', ({
    assert,
  }) => {
    const wrong = operator().updateOwn(
      { password: 'Nova@1234' },
      { currentConfirmed: false, sameAsCurrent: false },
      LATER,
    )
    const same = operator().updateOwn(
      { password: 'Senha@123' },
      { currentConfirmed: true, sameAsCurrent: true },
      LATER,
    )
    const ok = operator().updateOwn({ password: 'Nova@1234' }, PROVED, LATER)

    assert.deepEqual(wrong.value, { code: 'CURRENT_PASSWORD_INVALID' })
    assert.deepEqual(same.value, { code: 'PASSWORD_SAME_AS_CURRENT' })
    assert.isTrue(ok.isRight())
    assert.deepEqual(ok.value, { revokesSessions: true })
  })

  test('the account itself without changing the password skips the proof', ({ assert }) => {
    const result = operator().updateOwn(
      { name: 'Ana Maria' },
      { currentConfirmed: false, sameAsCurrent: false },
      LATER,
    )

    assert.isTrue(result.isRight())
  })
})
