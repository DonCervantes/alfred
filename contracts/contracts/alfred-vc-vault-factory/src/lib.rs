//! alfred-vc-vault-factory — deploys per-holder vaults + USDC issue fee config.
#![no_std]

pub mod contract;
pub mod errors;
mod events;
pub mod model;
mod storage;

#[cfg(test)]
mod test;

pub use contract::AlfredVcVaultFactory;
pub use errors::FactoryError;
pub use model::FeeConfig;
