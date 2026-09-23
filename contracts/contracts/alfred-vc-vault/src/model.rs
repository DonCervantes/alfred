//! Data model for ALFRED VC vault.

use soroban_sdk::{contracttype, Address, BytesN, String};

pub const MAX_URI_LEN: u32 = 255;
pub const MAX_BATCH: u32 = 10;
pub const MAX_VC_COUNT: u32 = 256;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum VcStatus {
    Active = 1,
    Revoked = 2,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum IssuanceMode {
    /// Any issuer except denylist may issue.
    Open = 0,
    /// Only allowlisted issuers may issue.
    Allowlist = 1,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VcRecord {
    pub vc_id: BytesN<32>,
    pub issuer: Address,
    pub content_hash: BytesN<32>,
    pub uri: Option<String>,
    pub issued_ledger: u32,
    pub updated_ledger: u32,
    pub status: VcStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct IssueArgs {
    pub vc_id: BytesN<32>,
    pub content_hash: BytesN<32>,
    pub uri: Option<String>,
}
