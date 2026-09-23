//! alfred-did-registry — on-chain registry for `did:stellar`-style DIDs (ALFRED).
#![no_std]

pub mod contract;
pub mod errors;
mod events;
pub mod model;
mod storage;

#[cfg(test)]
mod test;

pub use contract::AlfredDidRegistry;
pub use errors::RegistryError;
pub use model::{DidKey, DidRecord, DidService};
