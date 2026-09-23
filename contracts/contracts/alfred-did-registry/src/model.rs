//! Data model for ALFRED DID registry.

use soroban_sdk::{contracttype, Address, BytesN, String, Vec};

pub const MAX_KEY_MULTIBASE_LEN: u32 = 128;
pub const MIN_KEY_COUNT_AUTH: u32 = 1;
pub const MAX_KEY_COUNT_AUTH: u32 = 3;
pub const MAX_KEY_COUNT_ASSERT: u32 = 3;
pub const MAX_KEY_COUNT_AGREEMENT: u32 = 1;
pub const MAX_SERVICE_COUNT: u32 = 3;
pub const MAX_SERVICE_ID_LEN: u32 = 32;
pub const MAX_SERVICE_TYPE_LEN: u32 = 64;
pub const MAX_URL_LEN: u32 = 255;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DidKey {
    pub public_key_multibase: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DidService {
    pub id_suffix: String,
    pub service_type: String,
    pub service_endpoint: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DidRecord {
    pub controller: Address,
    pub authentication: Vec<DidKey>,
    pub assertion_method: Vec<DidKey>,
    pub key_agreement: Vec<DidKey>,
    pub services: Vec<DidService>,
    pub metadata_uri: Option<String>,
    pub metadata_hash: Option<BytesN<32>>,
    pub version: u32,
    pub created_ledger: u32,
    pub updated_ledger: u32,
    pub deactivated: bool,
}
