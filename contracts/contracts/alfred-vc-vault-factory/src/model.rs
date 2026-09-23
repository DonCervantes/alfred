//! Fee configuration for vault issuance.

use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FeeConfig {
    /// SAC / token contract (e.g. testnet USDC). `None` = fees disabled.
    pub token: Option<Address>,
    /// Amount in token base units. `0` = free.
    pub amount: i128,
    pub recipient: Option<Address>,
}
