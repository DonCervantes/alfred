//! Contract error codes.

use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum FactoryError {
    NotAuthorized = 1,
    NoProposedAdmin = 2,
    FeeNotConfigured = 3,
    FeeAmountInvalid = 4,
    WasmHashMissing = 5,
    AlreadyVault = 6,
}
