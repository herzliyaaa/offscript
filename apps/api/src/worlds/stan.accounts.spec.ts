import { buildStanAccounts } from './stan.accounts.js';

describe('buildStanAccounts', () => {
  it('creates six unique handles and registers them', () => {
    const used = new Set<string>();
    const accounts = buildStanAccounts('Mina Park', used);

    expect(accounts).toHaveLength(6);
    expect(new Set(accounts.map((account) => account.handle)).size).toBe(6);
    expect(accounts.every((account) => used.has(account.handle))).toBe(true);
    expect(
      accounts.some((account) => account.handle === '@minapark_squad'),
    ).toBe(true);
  });

  it('avoids colliding with existing handles', () => {
    const used = new Set(['@minapark_squad']);
    const accounts = buildStanAccounts('Mina Park', used);
    const squad = accounts.find((account) =>
      account.name.includes('Protection'),
    );

    expect(squad?.handle).not.toBe('@minapark_squad');
  });
});
