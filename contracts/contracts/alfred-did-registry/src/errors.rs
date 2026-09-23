//! Contract error codes.

use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RegistryError {
    DidAlreadyExists = 1,
    DidNotFound = 2,
    VersionMismatch = 3,
    DidDeactivated = 4,
    InvalidAuthKeyCount = 5,
    InvalidAssertionKeyCount = 6,
    InvalidKeyAgreementCount = 7,
    InvalidServiceCount = 8,
    DuplicateKey = 9,
    KeyTooLong = 10,
    KeyEmpty = 11,
    ServiceTypeTooLong = 12,
    ServiceIdTooLong = 13,
    ServiceIdInvalidFormat = 14,
    ServiceEndpointInvalid = 15,
    MetadataUriInvalid = 16,
    NoProposedAdmin = 17,
    ServiceTypeEmpty = 18,
    VersionOverflow = 19,
    MetadataInconsistent = 20,
    DuplicateServiceId = 21,
}
