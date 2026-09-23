//! Instance + vault registry storage.

use crate::model::FeeConfig;
use soroban_sdk::{contracttype, Address, BytesN, Env, Symbol};

const DAY: u32 = 17_280;
const THRESHOLD_INSTANCE: u32 = DAY * 30;
const BUMP_INSTANCE: u32 = DAY * 90;
const THRESHOLD_VAULT: u32 = DAY * 30;
const BUMP_VAULT: u32 = DAY * 180;
const PROPOSED_ADMIN_TTL: u32 = DAY * 10;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Vault(Address),
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

pub fn get_wasm_hash(e: &Env) -> BytesN<32> {
    e.storage()
        .instance()
        .get::<Symbol, BytesN<32>>(&Symbol::new(e, "Wasm"))
        .unwrap()
}

pub fn set_wasm_hash(e: &Env, hash: &BytesN<32>) {
    e.storage()
        .instance()
        .set::<Symbol, BytesN<32>>(&Symbol::new(e, "Wasm"), hash);
}

pub fn get_fee(e: &Env) -> FeeConfig {
    e.storage()
        .instance()
        .get::<Symbol, FeeConfig>(&Symbol::new(e, "Fee"))
        .unwrap_or(FeeConfig {
            token: None,
            amount: 0,
            recipient: None,
        })
}

pub fn set_fee(e: &Env, fee: &FeeConfig) {
    e.storage()
        .instance()
        .set::<Symbol, FeeConfig>(&Symbol::new(e, "Fee"), fee);
}

pub fn mark_vault(e: &Env, vault: &Address) {
    let key = DataKey::Vault(vault.clone());
    e.storage().persistent().set(&key, &true);
    e.storage()
        .persistent()
        .extend_ttl(&key, THRESHOLD_VAULT, BUMP_VAULT);
}

pub fn is_vault(e: &Env, vault: &Address) -> bool {
    let key = DataKey::Vault(vault.clone());
    if e.storage().persistent().has(&key) {
        e.storage()
            .persistent()
            .extend_ttl(&key, THRESHOLD_VAULT, BUMP_VAULT);
        true
    } else {
        false
    }
}
