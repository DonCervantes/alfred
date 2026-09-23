//! Contract events.

use soroban_sdk::{Address, BytesN, Env, Symbol};

pub fn vault_initialized(e: &Env, owner: &Address) {
    e.events()
        .publish((Symbol::new(e, "init"),), owner.clone());
}

pub fn vc_issued(e: &Env, vc_id: &BytesN<32>, issuer: &Address) {
    e.events().publish(
        (Symbol::new(e, "issued"), vc_id.clone()),
        issuer.clone(),
    );
}

pub fn vc_revoked(e: &Env, vc_id: &BytesN<32>, by: &Address) {
    e.events()
        .publish((Symbol::new(e, "revoked"), vc_id.clone()), by.clone());
}

pub fn mode_changed(e: &Env, mode: u32) {
    e.events()
        .publish((Symbol::new(e, "mode"),), mode);
}
