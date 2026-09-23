//! Public ABI for `alfred-did-registry`.

use soroban_sdk::{
    contract, contractimpl, contractmeta, panic_with_error, Address, BytesN, Env, String,
};

use crate::errors::RegistryError;
use crate::events;
use crate::model::{
    DidKey, DidRecord, DidService, MAX_KEY_COUNT_AGREEMENT, MAX_KEY_COUNT_ASSERT,
    MAX_KEY_COUNT_AUTH, MAX_KEY_MULTIBASE_LEN, MAX_SERVICE_COUNT, MAX_SERVICE_ID_LEN,
    MAX_SERVICE_TYPE_LEN, MAX_URL_LEN, MIN_KEY_COUNT_AUTH,
};
use crate::storage;

contractmeta!(
    key = "Description",
    val = "alfred-did-registry: on-chain DID registry for ALFRED on Stellar"
);

#[contract]
pub struct AlfredDidRegistry;

#[contractimpl]
impl AlfredDidRegistry {
    pub fn __constructor(e: Env, admin: Address) {
        admin.require_auth();
        storage::set_admin(&e, &admin);
        storage::extend_instance(&e);
        events::contract_initialized(&e, &admin);
    }

    pub fn register(e: Env, did_id: BytesN<16>, initial_record: DidRecord) {
        if storage::has_record(&e, &did_id) {
            panic_with_error!(&e, RegistryError::DidAlreadyExists);
        }
        initial_record.controller.require_auth();
        validate_record(&e, &initial_record);

        let ledger = e.ledger().sequence();
        let record = DidRecord {
            controller: initial_record.controller.clone(),
            authentication: initial_record.authentication,
            assertion_method: initial_record.assertion_method,
            key_agreement: initial_record.key_agreement,
            services: initial_record.services,
            metadata_uri: initial_record.metadata_uri,
            metadata_hash: initial_record.metadata_hash,
            version: 1,
            created_ledger: ledger,
            updated_ledger: ledger,
            deactivated: false,
        };
        storage::write_record(&e, &did_id, &record);
        events::did_registered(&e, &did_id, &record.controller, record.version);
    }

    pub fn update(e: Env, did_id: BytesN<16>, expected_version: u32, next_record: DidRecord) {
        let current = require_record(&e, &did_id);
        require_active(&e, &current);
        require_version(&e, expected_version, current.version);
        current.controller.require_auth();
        validate_record(&e, &next_record);

        let new_version = bump_version(&e, current.version);
        let updated = DidRecord {
            controller: current.controller.clone(),
            authentication: next_record.authentication,
            assertion_method: next_record.assertion_method,
            key_agreement: next_record.key_agreement,
            services: next_record.services,
            metadata_uri: next_record.metadata_uri,
            metadata_hash: next_record.metadata_hash,
            version: new_version,
            created_ledger: current.created_ledger,
            updated_ledger: e.ledger().sequence(),
            deactivated: false,
        };
        storage::write_record(&e, &did_id, &updated);
        events::did_updated(&e, &did_id, new_version);
    }

    pub fn transfer_controller(
        e: Env,
        did_id: BytesN<16>,
        expected_version: u32,
        new_controller: Address,
    ) {
        let current = require_record(&e, &did_id);
        require_active(&e, &current);
        require_version(&e, expected_version, current.version);
        current.controller.require_auth();

        let new_version = bump_version(&e, current.version);
        let old = current.controller.clone();
        let updated = DidRecord {
            controller: new_controller.clone(),
            authentication: current.authentication,
            assertion_method: current.assertion_method,
            key_agreement: current.key_agreement,
            services: current.services,
            metadata_uri: current.metadata_uri,
            metadata_hash: current.metadata_hash,
            version: new_version,
            created_ledger: current.created_ledger,
            updated_ledger: e.ledger().sequence(),
            deactivated: false,
        };
        storage::write_record(&e, &did_id, &updated);
        events::did_controller_transferred(&e, &did_id, &old, &new_controller, new_version);
    }

    pub fn deactivate(e: Env, did_id: BytesN<16>, expected_version: u32) {
        let current = require_record(&e, &did_id);
        require_active(&e, &current);
        require_version(&e, expected_version, current.version);
        current.controller.require_auth();

        let new_version = bump_version(&e, current.version);
        let tombstone = DidRecord {
            controller: current.controller,
            authentication: soroban_sdk::Vec::new(&e),
            assertion_method: soroban_sdk::Vec::new(&e),
            key_agreement: soroban_sdk::Vec::new(&e),
            services: soroban_sdk::Vec::new(&e),
            metadata_uri: current.metadata_uri,
            metadata_hash: current.metadata_hash,
            version: new_version,
            created_ledger: current.created_ledger,
            updated_ledger: e.ledger().sequence(),
            deactivated: true,
        };
        storage::write_record(&e, &did_id, &tombstone);
        events::did_deactivated(&e, &did_id, new_version);
    }

    pub fn get(e: Env, did_id: BytesN<16>) -> Option<DidRecord> {
        storage::read_record(&e, &did_id)
    }

    pub fn propose_admin(e: Env, new_admin: Address) {
        let admin = storage::get_admin(&e);
        admin.require_auth();
        storage::set_proposed_admin(&e, &new_admin);
        storage::extend_instance(&e);
    }

    pub fn accept_admin(e: Env) {
        match storage::get_proposed_admin(&e) {
            Some(proposed) => {
                proposed.require_auth();
                let old = storage::get_admin(&e);
                storage::set_admin(&e, &proposed);
                storage::remove_proposed_admin(&e);
                storage::extend_instance(&e);
                events::admin_transferred(&e, &old, &proposed);
            }
            None => panic_with_error!(&e, RegistryError::NoProposedAdmin),
        }
    }

    pub fn get_admin(e: Env) -> Address {
        storage::get_admin(&e)
    }
}

fn require_record(e: &Env, did_id: &BytesN<16>) -> DidRecord {
    match storage::read_record(e, did_id) {
        Some(r) => r,
        None => panic_with_error!(e, RegistryError::DidNotFound),
    }
}

fn require_active(e: &Env, record: &DidRecord) {
    if record.deactivated {
        panic_with_error!(e, RegistryError::DidDeactivated);
    }
}

fn require_version(e: &Env, expected: u32, current: u32) {
    if expected != current {
        panic_with_error!(e, RegistryError::VersionMismatch);
    }
}

fn bump_version(e: &Env, current: u32) -> u32 {
    if current == u32::MAX {
        panic_with_error!(e, RegistryError::VersionOverflow);
    }
    current + 1
}

fn validate_record(e: &Env, record: &DidRecord) {
    let auth_len = record.authentication.len();
    if !(MIN_KEY_COUNT_AUTH..=MAX_KEY_COUNT_AUTH).contains(&auth_len) {
        panic_with_error!(e, RegistryError::InvalidAuthKeyCount);
    }
    if record.assertion_method.len() > MAX_KEY_COUNT_ASSERT {
        panic_with_error!(e, RegistryError::InvalidAssertionKeyCount);
    }
    if record.key_agreement.len() > MAX_KEY_COUNT_AGREEMENT {
        panic_with_error!(e, RegistryError::InvalidKeyAgreementCount);
    }
    if record.services.len() > MAX_SERVICE_COUNT {
        panic_with_error!(e, RegistryError::InvalidServiceCount);
    }

    validate_keys(e, &record.authentication);
    validate_keys(e, &record.assertion_method);
    validate_keys(e, &record.key_agreement);

    for i in 0..record.services.len() {
        let s: DidService = record.services.get_unchecked(i);
        validate_service(e, &s);
        for j in (i + 1)..record.services.len() {
            let other: DidService = record.services.get_unchecked(j);
            if s.id_suffix == other.id_suffix {
                panic_with_error!(e, RegistryError::DuplicateServiceId);
            }
        }
    }

    if let Some(uri) = &record.metadata_uri {
        if !is_https_url(uri) {
            panic_with_error!(e, RegistryError::MetadataUriInvalid);
        }
    }
    if record.metadata_hash.is_some() && record.metadata_uri.is_none() {
        panic_with_error!(e, RegistryError::MetadataInconsistent);
    }
}

fn validate_keys(e: &Env, keys: &soroban_sdk::Vec<DidKey>) {
    let n = keys.len();
    for i in 0..n {
        let k: DidKey = keys.get_unchecked(i);
        let len = k.public_key_multibase.len();
        if len == 0 {
            panic_with_error!(e, RegistryError::KeyEmpty);
        }
        if len > MAX_KEY_MULTIBASE_LEN {
            panic_with_error!(e, RegistryError::KeyTooLong);
        }
        for j in (i + 1)..n {
            let other: DidKey = keys.get_unchecked(j);
            if k.public_key_multibase == other.public_key_multibase {
                panic_with_error!(e, RegistryError::DuplicateKey);
            }
        }
    }
}

fn validate_service(e: &Env, s: &DidService) {
    if s.id_suffix.is_empty() || s.id_suffix.len() > MAX_SERVICE_ID_LEN || !is_slug(&s.id_suffix)
    {
        panic_with_error!(e, RegistryError::ServiceIdInvalidFormat);
    }
    if s.service_type.is_empty() {
        panic_with_error!(e, RegistryError::ServiceTypeEmpty);
    }
    if s.service_type.len() > MAX_SERVICE_TYPE_LEN {
        panic_with_error!(e, RegistryError::ServiceTypeTooLong);
    }
    if !is_https_url(&s.service_endpoint) {
        panic_with_error!(e, RegistryError::ServiceEndpointInvalid);
    }
}

fn is_slug(s: &String) -> bool {
    let bytes = s.to_bytes();
    let n = bytes.len();
    if n == 0 {
        return false;
    }
    if bytes.get_unchecked(0) == b'-' || bytes.get_unchecked(n - 1) == b'-' {
        return false;
    }
    for i in 0..n {
        let b = bytes.get_unchecked(i);
        if !(b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-') {
            return false;
        }
    }
    true
}

fn is_https_url(s: &String) -> bool {
    let len = s.len();
    if len <= 8 || len > MAX_URL_LEN {
        return false;
    }
    let bytes = s.to_bytes();
    let prefix = b"https://";
    for i in 0..8u32 {
        if bytes.get_unchecked(i) != prefix[i as usize] {
            return false;
        }
    }
    true
}
