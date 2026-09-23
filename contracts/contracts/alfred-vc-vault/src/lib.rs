//! alfred-vc-vault — per-holder verifiable credential vault (ALFRED).
#![no_std]

pub mod contract;
pub mod errors;
mod events;
pub mod model;
mod storage;

#[cfg(test)]
mod test;

pub use contract::AlfredVcVault;
pub use errors::VaultError;
pub use model::{IssuanceMode, VcRecord, VcStatus};
