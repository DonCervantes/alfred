//! Contract events.

use soroban_sdk::{Address, BytesN, Env, Symbol};

pub fn contract_initialized(e: &Env, admin: &Address) {
    e.events()
        .publish((Symbol::new(e, "init"),), admin.clone());
}

pub fn did_registered(e: &Env, did_id: &BytesN<16>, controller: &Address, version: u32) {
    e.events().publish(
        (Symbol::new(e, "registered"), did_id.clone()),
        (controller.clone(), version),
    );
}

pub fn did_updated(e: &Env, did_id: &BytesN<16>, version: u32) {
    e.events()
        .publish((Symbol::new(e, "updated"), did_id.clone()), version);
}

pub fn did_controller_transferred(
    e: &Env,
    did_id: &BytesN<16>,
    from: &Address,
    to: &Address,
    version: u32,
) {
    e.events().publish(
        (Symbol::new(e, "xfer"), did_id.clone()),
        (from.clone(), to.clone(), version),
    );
}

pub fn did_deactivated(e: &Env, did_id: &BytesN<16>, version: u32) {
    e.events()
        .publish((Symbol::new(e, "deact"), did_id.clone()), version);
}

pub fn admin_transferred(e: &Env, from: &Address, to: &Address) {
    e.events()
        .publish((Symbol::new(e, "admin"),), (from.clone(), to.clone()));
}
