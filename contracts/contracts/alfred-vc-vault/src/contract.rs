//! Public ABI for `alfred-vc-vault`.

use soroban_sdk::{
    contract, contractimpl, contractmeta, panic_with_error, Address, BytesN, Env, String, Vec,
};

use crate::errors::VaultError;
use crate::events;
use crate::model::{
    IssueArgs, IssuanceMode, VcRecord, VcStatus, MAX_BATCH, MAX_URI_LEN, MAX_VC_COUNT,
};
use crate::storage;

contractmeta!(
    key = "Description",
    val = "alfred-vc-vault: per-holder verifiable credential vault for ALFRED"
);

#[contract]
pub struct AlfredVcVault;

#[contractimpl]
impl AlfredVcVault {
    /// Deploy a vault for `owner`. Optional `factory` links fee collection later.
    pub fn __constructor(e: Env, owner: Address, factory: Option<Address>) {
        owner.require_auth();
        storage::set_owner(&e, &owner);
        if let Some(f) = factory {
            storage::set_factory(&e, &f);
        }
        storage::set_mode(&e, &IssuanceMode::Open);
        storage::set_vc_ids(&e, &Vec::new(&e));
        storage::extend_instance(&e);
        events::vault_initialized(&e, &owner);
    }

    pub fn issue(
        e: Env,
        issuer: Address,
        vc_id: BytesN<32>,
        content_hash: BytesN<32>,
        uri: Option<String>,
    ) {
        issuer.require_auth();
        assert_issuer_permitted(&e, &issuer);
        issue_one(&e, &issuer, &vc_id, &content_hash, &uri);
        storage::extend_instance(&e);
    }

    pub fn batch_issue(e: Env, issuer: Address, items: Vec<IssueArgs>) {
        issuer.require_auth();
        assert_issuer_permitted(&e, &issuer);
        let n = items.len();
        if n == 0 {
            panic_with_error!(&e, VaultError::EmptyBatch);
        }
        if n > MAX_BATCH {
            panic_with_error!(&e, VaultError::BatchTooLarge);
        }
        for i in 0..n {
            let item = items.get_unchecked(i);
            issue_one(&e, &issuer, &item.vc_id, &item.content_hash, &item.uri);
        }
        storage::extend_instance(&e);
    }

    pub fn revoke(e: Env, caller: Address, vc_id: BytesN<32>) {
        caller.require_auth();
        let mut record = match storage::read_record(&e, &vc_id) {
            Some(r) => r,
            None => panic_with_error!(&e, VaultError::VcNotFound),
        };
        if matches!(record.status, VcStatus::Revoked) {
            panic_with_error!(&e, VaultError::VcRevoked);
        }
        let owner = storage::get_owner(&e);
        if caller != record.issuer && caller != owner {
            panic_with_error!(&e, VaultError::NotAuthorized);
        }
        record.status = VcStatus::Revoked;
        record.updated_ledger = e.ledger().sequence();
        storage::write_record(&e, &record);
        storage::extend_instance(&e);
        events::vc_revoked(&e, &vc_id, &caller);
    }

    pub fn get_vc(e: Env, vc_id: BytesN<32>) -> Option<VcRecord> {
        storage::read_record(&e, &vc_id)
    }

    pub fn list_vc_ids(e: Env) -> Vec<BytesN<32>> {
        storage::get_vc_ids(&e)
    }

    pub fn vc_count(e: Env) -> u32 {
        storage::get_vc_ids(&e).len()
    }

    /// Returns true iff VC exists, is Active, and `content_hash` matches.
    pub fn verify_vc(e: Env, vc_id: BytesN<32>, content_hash: BytesN<32>) -> bool {
        match storage::read_record(&e, &vc_id) {
            Some(r) => {
                matches!(r.status, VcStatus::Active) && r.content_hash == content_hash
            }
            None => false,
        }
    }

    pub fn get_owner(e: Env) -> Address {
        storage::get_owner(&e)
    }

    pub fn get_factory(e: Env) -> Option<Address> {
        storage::get_factory(&e)
    }

    pub fn get_issuance_mode(e: Env) -> IssuanceMode {
        storage::get_mode(&e)
    }

    pub fn set_issuance_mode(e: Env, mode: IssuanceMode) {
        let owner = storage::get_owner(&e);
        owner.require_auth();
        storage::set_mode(&e, &mode);
        storage::extend_instance(&e);
        let tag = match mode {
            IssuanceMode::Open => 0u32,
            IssuanceMode::Allowlist => 1u32,
        };
        events::mode_changed(&e, tag);
    }

    pub fn deny_issuer(e: Env, issuer: Address) {
        let owner = storage::get_owner(&e);
        owner.require_auth();
        storage::set_denied(&e, &issuer, true);
        storage::extend_instance(&e);
    }

    pub fn undeny_issuer(e: Env, issuer: Address) {
        let owner = storage::get_owner(&e);
        owner.require_auth();
        storage::set_denied(&e, &issuer, false);
        storage::extend_instance(&e);
    }

    pub fn allow_issuer(e: Env, issuer: Address) {
        let owner = storage::get_owner(&e);
        owner.require_auth();
        storage::set_allowed(&e, &issuer, true);
        storage::extend_instance(&e);
    }

    pub fn disallow_issuer(e: Env, issuer: Address) {
        let owner = storage::get_owner(&e);
        owner.require_auth();
        storage::set_allowed(&e, &issuer, false);
        storage::extend_instance(&e);
    }
}

fn assert_issuer_permitted(e: &Env, issuer: &Address) {
    if storage::is_denied(e, issuer) {
        panic_with_error!(e, VaultError::IssuerDenied);
    }
    match storage::get_mode(e) {
        IssuanceMode::Open => {}
        IssuanceMode::Allowlist => {
            if !storage::is_allowed(e, issuer) {
                panic_with_error!(e, VaultError::IssuerNotAllowed);
            }
        }
    }
}

fn issue_one(
    e: &Env,
    issuer: &Address,
    vc_id: &BytesN<32>,
    content_hash: &BytesN<32>,
    uri: &Option<String>,
) {
    if storage::has_record(e, vc_id) {
        panic_with_error!(e, VaultError::VcAlreadyExists);
    }
    let mut ids = storage::get_vc_ids(e);
    if ids.len() >= MAX_VC_COUNT {
        panic_with_error!(e, VaultError::VaultFull);
    }
    if let Some(u) = uri {
        validate_uri(e, u);
    }
    let ledger = e.ledger().sequence();
    let record = VcRecord {
        vc_id: vc_id.clone(),
        issuer: issuer.clone(),
        content_hash: content_hash.clone(),
        uri: uri.clone(),
        issued_ledger: ledger,
        updated_ledger: ledger,
        status: VcStatus::Active,
    };
    storage::write_record(e, &record);
    ids.push_back(vc_id.clone());
    storage::set_vc_ids(e, &ids);
    events::vc_issued(e, vc_id, issuer);
}

fn validate_uri(e: &Env, uri: &String) {
    let len = uri.len();
    if len == 0 || len > MAX_URI_LEN {
        panic_with_error!(e, VaultError::UriTooLong);
    }
    if len <= 8 {
        panic_with_error!(e, VaultError::UriInvalid);
    }
    let bytes = uri.to_bytes();
    let prefix = b"https://";
    for i in 0..8u32 {
        if bytes.get_unchecked(i) != prefix[i as usize] {
            panic_with_error!(e, VaultError::UriInvalid);
        }
    }
}
