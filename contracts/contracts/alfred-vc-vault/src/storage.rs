//! Persistent storage for VC records + instance config.

use crate::model::{IssuanceMode, VcRecord};
use soroban_sdk::{contracttype, Address, BytesN, Env, Symbol, Vec};

const DAY: u32 = 17_280;
const THRESHOLD_VC: u32 = DAY * 30;
const BUMP_VC: u32 = DAY * 180;
const THRESHOLD_INSTANCE: u32 = DAY * 30;
const BUMP_INSTANCE: u32 = DAY * 90;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Record(BytesN<32>),
    Denied(Address),
    Allowed(Address),
}

pub fn extend_instance(e: &Env) {
    e.storage()
        .instance()
        .extend_ttl(THRESHOLD_INSTANCE, BUMP_INSTANCE);
}

pub fn get_owner(e: &Env) -> Address {
    e.storage()
        .instance()
        .get::<Symbol, Address>(&Symbol::new(e, "Owner"))
        .unwrap()
}

pub fn set_owner(e: &Env, owner: &Address) {
    e.storage()
        .instance()
        .set::<Symbol, Address>(&Symbol::new(e, "Owner"), owner);
}

pub fn get_factory(e: &Env) -> Option<Address> {
    e.storage()
        .instance()
        .get::<Symbol, Address>(&Symbol::new(e, "Factory"))
}

pub fn set_factory(e: &Env, factory: &Address) {
    e.storage()
        .instance()
        .set::<Symbol, Address>(&Symbol::new(e, "Factory"), factory);
}

pub fn get_mode(e: &Env) -> IssuanceMode {
    e.storage()
        .instance()
        .get::<Symbol, IssuanceMode>(&Symbol::new(e, "Mode"))
        .unwrap_or(IssuanceMode::Open)
}

pub fn set_mode(e: &Env, mode: &IssuanceMode) {
    e.storage()
        .instance()
        .set::<Symbol, IssuanceMode>(&Symbol::new(e, "Mode"), mode);
}

pub fn get_vc_ids(e: &Env) -> Vec<BytesN<32>> {
    e.storage()
        .instance()
        .get::<Symbol, Vec<BytesN<32>>>(&Symbol::new(e, "Ids"))
        .unwrap_or_else(|| Vec::new(e))
}

pub fn set_vc_ids(e: &Env, ids: &Vec<BytesN<32>>) {
    e.storage()
        .instance()
        .set::<Symbol, Vec<BytesN<32>>>(&Symbol::new(e, "Ids"), ids);
}

pub fn has_record(e: &Env, vc_id: &BytesN<32>) -> bool {
    e.storage()
        .persistent()
        .has(&DataKey::Record(vc_id.clone()))
}

pub fn read_record(e: &Env, vc_id: &BytesN<32>) -> Option<VcRecord> {
    let key = DataKey::Record(vc_id.clone());
    if let Some(record) = e.storage().persistent().get::<DataKey, VcRecord>(&key) {
        e.storage()
            .persistent()
            .extend_ttl(&key, THRESHOLD_VC, BUMP_VC);
        Some(record)
    } else {
        None
    }
}

pub fn write_record(e: &Env, record: &VcRecord) {
    let key = DataKey::Record(record.vc_id.clone());
    e.storage().persistent().set(&key, record);
    e.storage()
        .persistent()
        .extend_ttl(&key, THRESHOLD_VC, BUMP_VC);
}

pub fn is_denied(e: &Env, issuer: &Address) -> bool {
    e.storage()
        .persistent()
        .has(&DataKey::Denied(issuer.clone()))
}

pub fn set_denied(e: &Env, issuer: &Address, denied: bool) {
    let key = DataKey::Denied(issuer.clone());
    if denied {
        e.storage().persistent().set(&key, &true);
        e.storage()
            .persistent()
            .extend_ttl(&key, THRESHOLD_VC, BUMP_VC);
    } else {
        e.storage().persistent().remove(&key);
    }
}

pub fn is_allowed(e: &Env, issuer: &Address) -> bool {
    e.storage()
        .persistent()
        .has(&DataKey::Allowed(issuer.clone()))
}

pub fn set_allowed(e: &Env, issuer: &Address, allowed: bool) {
    let key = DataKey::Allowed(issuer.clone());
    if allowed {
        e.storage().persistent().set(&key, &true);
        e.storage()
            .persistent()
            .extend_ttl(&key, THRESHOLD_VC, BUMP_VC);
    } else {
        e.storage().persistent().remove(&key);
    }
}
