//! Persistent storage for DID records + instance admin.

use crate::model::DidRecord;
use soroban_sdk::{contracttype, Address, BytesN, Env, Symbol};

const DAY: u32 = 17_280;
const THRESHOLD_DID: u32 = DAY * 30;
const BUMP_DID: u32 = DAY * 180;
const THRESHOLD_INSTANCE: u32 = DAY * 30;
const BUMP_INSTANCE: u32 = DAY * 90;
const PROPOSED_ADMIN_TTL: u32 = DAY * 10;

#[derive(Clone)]
#[contracttype]
pub enum DidDataKey {
    Record(BytesN<16>),
}

pub fn has_record(e: &Env, did_id: &BytesN<16>) -> bool {
    e.storage()
        .persistent()
        .has(&DidDataKey::Record(did_id.clone()))
}

pub fn read_record(e: &Env, did_id: &BytesN<16>) -> Option<DidRecord> {
    let key = DidDataKey::Record(did_id.clone());
    if let Some(record) = e.storage().persistent().get::<DidDataKey, DidRecord>(&key) {
        e.storage()
            .persistent()
            .extend_ttl(&key, THRESHOLD_DID, BUMP_DID);
        Some(record)
    } else {
        None
    }
}

pub fn write_record(e: &Env, did_id: &BytesN<16>, record: &DidRecord) {
    let key = DidDataKey::Record(did_id.clone());
    e.storage().persistent().set(&key, record);
    e.storage()
        .persistent()
        .extend_ttl(&key, THRESHOLD_DID, BUMP_DID);
}

pub fn extend_instance(e: &Env) {
    e.storage()
        .instance()
        .extend_ttl(THRESHOLD_INSTANCE, BUMP_INSTANCE);
}

pub fn get_admin(e: &Env) -> Address {
    e.storage()
        .instance()
        .get::<Symbol, Address>(&Symbol::new(e, "Admin"))
        .unwrap()
}

pub fn set_admin(e: &Env, admin: &Address) {
    e.storage()
        .instance()
        .set::<Symbol, Address>(&Symbol::new(e, "Admin"), admin);
}

pub fn get_proposed_admin(e: &Env) -> Option<Address> {
    e.storage()
        .temporary()
        .get::<Symbol, Address>(&Symbol::new(e, "PropAdmin"))
}

pub fn set_proposed_admin(e: &Env, proposed: &Address) {
    let key = Symbol::new(e, "PropAdmin");
    e.storage()
        .temporary()
        .set::<Symbol, Address>(&key, proposed);
    e.storage()
        .temporary()
        .extend_ttl(&key, PROPOSED_ADMIN_TTL, PROPOSED_ADMIN_TTL);
}

pub fn remove_proposed_admin(e: &Env) {
    e.storage()
        .temporary()
        .remove(&Symbol::new(e, "PropAdmin"));
}
