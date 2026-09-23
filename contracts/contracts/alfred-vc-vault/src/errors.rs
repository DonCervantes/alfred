//! Contract error codes.

use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VaultError {
    VcAlreadyExists = 1,
    VcNotFound = 2,
    VcRevoked = 3,
    NotAuthorized = 4,
    IssuerDenied = 5,
    IssuerNotAllowed = 6,
    UriTooLong = 7,
    UriInvalid = 8,
    BatchTooLarge = 9,
    VaultFull = 10,
    HashMismatch = 11,
    EmptyBatch = 12,
}
