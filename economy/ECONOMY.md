# FREE Economy — FREE-013 Testnet Policy

FREE-013 changes the testnet monetary baseline to a 500,000,000 FREE Genesis supply. The Founder Genesis Economic Identity owns 15% at Genesis (75,000,000 FREE). The remaining 425,000,000 FREE is held in a locked, unallocated Genesis Reserve pending simulation; it is not Founder property. This is distinct from the ongoing Founder/Development share of future issuance.

## Monetary invariant
- No maximum supply is defined.
- Gross annual issuance has a protocol hard ceiling of **4%**.
- Testnet target issuance defaults to **2.5% annualized**, not 4%.
- Future issuance is allocated 10% Founder/Development, 65% Node Pool, 15% Ecosystem and 10% Treasury.
- Burn accounting exists in chain state. Fee charging and actual burn transactions are **not implemented yet**; the configured fee-burn share is therefore a target policy, not a current economic claim.

## Node lifecycle target
Useful-service rewards must accrue only for verified service. A voluntary exit keeps already-earned rewards, stops future accrual and triggers re-replication/repair before capacity is released. Short outages receive a grace period. Fraud proven cryptographically may eventually be subject to bond slashing/burn. These mechanisms are specification/roadmap work in FREE-013, not production Proof of Useful Service.

## Founder boundary
Founder economic upside must not become authority over user secrets or balances. The intended governance model permits economic changes only within constitutional protocol bounds; ordinary economic policy must never raise gross issuance above 4%, arbitrarily mint balances, seize user funds, or expose user keys.

FREE testnet units have no monetary value.
